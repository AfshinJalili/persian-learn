import type { Page } from '@playwright/test';

export type LayoutIssue = { kind: string; detail: string };

/**
 * Runs in the page. Reports layout breakage that large system fonts cause:
 * - horizontal overflow of the page or any element past the viewport
 * - an in-flow element sticking out of its parent box
 * - text clipped by an overflow:hidden/clip box (vertical scroll containers
 *   are fine: scrolling is allowed)
 * - in-flow siblings overlapping each other
 * - interactive siblings overlapping (absolutely positioned ones included)
 * - tap targets (buttons, links, role=button) smaller than 48 CSS px
 */
export async function auditLayout(page: Page, { zoom = 1 }: { zoom?: number } = {}): Promise<LayoutIssue[]> {
  void zoom;
  return page.evaluate(() => {
    const issues: { kind: string; detail: string }[] = [];
    const TOL = 3;
    const vw = document.documentElement.clientWidth;
    const describe = (el: Element) => {
      const cls = typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/).slice(0, 3).join('.')}` : '';
      const label = el.getAttribute('aria-label') || (el.textContent || '').trim().slice(0, 24);
      return `${el.tagName.toLowerCase()}${cls}${label ? ` "${label}"` : ''}`;
    };
    const visible = (el: Element) => {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const outOfFlow = (el: Element) => {
      const p = getComputedStyle(el).position;
      return p === 'absolute' || p === 'fixed';
    };
    const skip = (el: Element) =>
      el.closest('svg') !== null && el.tagName.toLowerCase() !== 'svg' ||
      el.closest('[aria-hidden="true"]') !== null && !el.matches('[aria-hidden="true"]') ||
      el.closest('[data-layout-audit="skip"]') !== null ||
      ['script', 'style', 'link', 'meta', 'next-route-announcer', 'nextjs-portal', 'canvas'].includes(el.tagName.toLowerCase());

    const se = document.scrollingElement!;
    if (se.scrollWidth > se.clientWidth + 1) {
      issues.push({ kind: 'h-overflow', detail: `page scrollWidth ${se.scrollWidth} > ${se.clientWidth}` });
    }

    const all = [...document.body.querySelectorAll('*')].filter((el) => !skip(el) && visible(el));
    // Elements inside a vertical scroller are judged against the scroller's
    // content box, not its visible part.
    const clippedBy = (el: Element) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const s = getComputedStyle(p);
        if (s.overflowX !== 'visible' || s.overflowY !== 'visible') return p;
      }
      return null;
    };

    for (const el of all) {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      // Off-screen sideways (sheet animations excluded via out-of-flow).
      if ((r.right > vw + TOL || r.left < -TOL) && !el.closest('.path-hit, .tooltip, [data-ink-fit], .ink-fit')) {
        const clip = clippedBy(el);
        const cr = clip?.getBoundingClientRect();
        const hiddenByClip = cr && (r.left >= cr.right || r.right <= cr.left);
        if (!hiddenByClip) issues.push({ kind: 'h-overflow', detail: `${describe(el)} spans ${Math.round(r.left)}..${Math.round(r.right)} (vw ${vw})` });
      }
      // Text clipped by its own hidden overflow.
      const clips = (v: string) => v === 'hidden' || v === 'clip';
      const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent || '').trim());
      const textual = hasText || el.querySelector(':scope > span, :scope > div, :scope > p') !== null;
      if (textual && el.tagName.toLowerCase() !== 'svg' && !el.matches('[data-ink-fit]')) {
        if (clips(s.overflowX) && el.scrollWidth > el.clientWidth + TOL) {
          issues.push({ kind: 'clipped', detail: `${describe(el)} clips text sideways (${el.scrollWidth} > ${el.clientWidth})` });
        }
        // A lone numeral glyph's line box (1.1em) is shorter than the font's
        // content area (~1.33em, accents included); a digit's ink is ~0.75em,
        // so that slack is not clipped text.
        const fontPx = parseFloat(s.fontSize) || 16;
        const numeralSlack =
          /^[\s۰-۹0-9؟?]+$/.test(el.textContent || '') && el.scrollHeight <= fontPx * 1.4 + TOL;
        if (clips(s.overflowY) && el.scrollHeight > el.clientHeight + TOL && !numeralSlack) {
          issues.push({ kind: 'clipped', detail: `${describe(el)} clips text vertically (${el.scrollHeight} > ${el.clientHeight})` });
        }
        if (s.webkitLineClamp && s.webkitLineClamp !== 'none' && el.scrollHeight > el.clientHeight + TOL) {
          issues.push({ kind: 'clipped', detail: `${describe(el)} is line-clamped` });
        }
      }
      // Text running past its own box (even when nothing clips it).
      const scrollsX = s.overflowX === 'auto' || s.overflowX === 'scroll';
      if (
        !s.display.startsWith('inline') && !scrollsX && !clips(s.overflowX) &&
        (el.textContent || '').trim() && el.scrollWidth > el.clientWidth + TOL &&
        el.tagName.toLowerCase() !== 'svg' &&
        // The home path's tooltip hangs beside its node on purpose.
        !el.matches('.path-hit') &&
        // Ink-fitted glyphs: the ink fills the box; only empty side bearing
        // sticks out (the pixel art check verifies the ink).
        !el.matches('[data-ink-fit], .object-cluster:has([data-ink-fit]), .object-cluster:has(svg)')
      ) {
        issues.push({ kind: 'text-overflow', detail: `${describe(el)} content is wider than its box (${el.scrollWidth} > ${el.clientWidth})` });
      }
      // Sticks out of its parent.
      const parent = el.parentElement;
      if (parent && parent !== document.body && !outOfFlow(el) && visible(parent)) {
        const ps = getComputedStyle(parent);
        const scroller = ps.overflowY === 'auto' || ps.overflowY === 'scroll';
        const pr = parent.getBoundingClientRect();
        const top = scroller ? pr.top - parent.scrollTop : pr.top;
        const bottom = scroller ? top + parent.scrollHeight : pr.bottom;
        const left = ps.overflowX === 'auto' || ps.overflowX === 'scroll' ? pr.left - parent.scrollWidth : pr.left;
        if (
          r.left < left - TOL || r.right > pr.right + TOL ||
          r.top < top - TOL - Math.max(0, -parseFloat(s.marginTop) || 0) || r.bottom > bottom + TOL
        ) {
          // Negative margins are deliberate overlaps (mascot under a bubble).
          const negative = ['marginTop', 'marginBottom', 'marginLeft', 'marginRight'].some(
            (k) => parseFloat((s as unknown as Record<string, string>)[k]) < 0
          );
          if (!negative && s.transform === 'none' && !el.matches('.ink-fit, [data-ink-fit]') && !el.closest('[data-ink-fit]')) {
            issues.push({
              kind: 'overflow',
              detail: `${describe(el)} [${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}] outside ${describe(parent)} [${Math.round(pr.left)},${Math.round(top)},${Math.round(pr.right)},${Math.round(bottom)}]`,
            });
          }
        }
      }
    }

    // Overlapping in-flow siblings.
    const parents = new Set(all.map((el) => el.parentElement).filter(Boolean) as Element[]);
    for (const parent of parents) {
      const kids = [...parent.children].filter(
        (el) => !skip(el) && visible(el) && !outOfFlow(el) && getComputedStyle(el).position !== 'sticky' && getComputedStyle(el).transform === 'none'
      );
      for (let i = 0; i < kids.length; i += 1) {
        for (let j = i + 1; j < kids.length; j += 1) {
          const a = kids[i].getBoundingClientRect();
          const b = kids[j].getBoundingClientRect();
          const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (w > TOL && h > TOL) {
            const sa = getComputedStyle(kids[i]);
            const sb = getComputedStyle(kids[j]);
            const negative = [sa, sb].some((st) => ['marginTop', 'marginBottom', 'marginLeft', 'marginRight'].some(
              (k) => parseFloat((st as unknown as Record<string, string>)[k]) < 0
            ));
            if (!negative) {
              issues.push({ kind: 'overlap', detail: `${describe(kids[i])} overlaps ${describe(kids[j])} by ${Math.round(w)}x${Math.round(h)}` });
            }
          }
        }
      }
    }

    // Interactive siblings must not overlap either, even when they are
    // absolutely positioned (the home roadmap's node hit areas).
    const interactive = all.filter((e) => e.matches('button, a[href], [role="button"]'));
    const byParent = new Map<Element, Element[]>();
    for (const el of interactive) {
      if (!outOfFlow(el) || !el.parentElement) continue;
      const list = byParent.get(el.parentElement) ?? [];
      list.push(el);
      byParent.set(el.parentElement, list);
    }
    for (const [parent, abs] of byParent) {
      const kids = [...parent.children].filter((k) => interactive.includes(k));
      for (const a of abs) {
        for (const b of kids) {
          if (a === b || (outOfFlow(b) && kids.indexOf(b) < kids.indexOf(a))) continue;
          const ra = a.getBoundingClientRect();
          const rb = b.getBoundingClientRect();
          const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
          const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          if (w > 0.5 && h > 0.5) {
            issues.push({ kind: 'overlap', detail: `${describe(a)} overlaps ${describe(b)} by ${Math.round(w)}x${Math.round(h)}` });
          }
        }
      }
    }

    // Tap targets: at least 48 CSS px in every mode (font and zoom), the
    // same unit QA measures in.
    for (const el of interactive) {
      const r = el.getBoundingClientRect();
      const min = 48 - 0.5;
      if (r.height < min || r.width < min) {
        issues.push({ kind: 'tap', detail: `${describe(el)} is ${Math.round(r.width * 10) / 10}x${Math.round(r.height * 10) / 10}` });
      }
    }
    return issues;
  });
}

/**
 * Nothing may sit under the lesson's Check bar (or the home nav): every tap
 * target in the scrolling body, once scrolled into view, must be hit-testable
 * at its centre and end above the bar. With `fit`, the body must not need to
 * scroll at all (normal font at 360x640 and larger).
 */
export async function auditUnderBar(page: Page, { fit = false }: { fit?: boolean } = {}): Promise<LayoutIssue[]> {
  const issues: LayoutIssue[] = [];
  const info = await page.evaluate(() => {
    // Greeting / onboarding covers the page; home nodes underneath are not
    // meant to be tapped through it.
    if (document.querySelector('[aria-label="شروع"][role="button"], .onboarding, [data-greeting]')) {
      return { skip: true as const };
    }
    if (location.pathname.startsWith('/lesson-complete')) {
      return { skip: true as const };
    }
    const content = document.querySelector('.app-phone > .content') as HTMLElement | null;
    if (!content) return null;
    const bar = document.querySelector('.app-phone > .bottom, .app-phone > .nav') as HTMLElement | null;
    return { over: content.scrollHeight - content.clientHeight, bar: !!bar, skip: false as const };
  });
  if (!info || ('skip' in info && info.skip)) return issues;
  if (fit && info.over > 12) issues.push({ kind: 'inner-scroll', detail: `lesson body needs ${info.over}px of scrolling` });
  if (!info.bar) return issues;
  const count = await page.locator('.app-phone > .content :is(button, [role="button"], a[href])').count();
  for (let i = 0; i < count; i += 1) {
    const res = await page.evaluate((i) => {
      const el = document.querySelectorAll('.app-phone > .content :is(button, [role="button"], a[href])')[i] as HTMLElement | undefined;
      if (!el) return null;
      const s = getComputedStyle(el);
      const r0 = el.getBoundingClientRect();
      if (s.visibility === 'hidden' || s.display === 'none' || r0.width === 0 || r0.height === 0) return null;
      if (el.closest('[aria-hidden="true"], [data-layout-audit="skip"]')) return null;
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      const r = el.getBoundingClientRect();
      const bar = document.querySelector('.app-phone > .bottom, .app-phone > .nav') as HTMLElement;
      const b = bar.getBoundingClientRect();
      const y = r.top + Math.min(r.height / 2, 24);
      const hit = document.elementFromPoint(r.left + r.width / 2, Math.min(y, innerHeight - 1));
      const ok = !!hit && (hit === el || el.contains(hit) || hit.contains(el));
      const label = el.getAttribute('aria-label') || (el.textContent || '').trim().slice(0, 16);
      // A box taller than the space above the bar can't end above it; then
      // only its top part (where the hit test is) has to be clear.
      const sc = el.closest('.content') as HTMLElement;
      const scrolls = sc.scrollHeight > sc.clientHeight + 1 && getComputedStyle(sc).overflowY !== 'visible';
      const room = b.top - (scrolls ? Math.max(0, sc.getBoundingClientRect().top) : 0);
      const under = r.height <= room && r.bottom > b.top + 1 && r.top < b.bottom;
      return { ok, under, label, r: [Math.round(r.top), Math.round(r.bottom)], bar: Math.round(b.top) };
    }, i);
    if (!res) continue;
    if (!res.ok || res.under) {
      issues.push({ kind: 'under-bar', detail: `"${res.label}" [${res.r}] ${res.ok ? 'ends under' : 'is covered by'} the bar at ${res.bar}` });
    }
  }
  await page.evaluate(() => document.querySelector('.app-phone > .content')?.scrollTo(0, 0));
  return issues;
}

/** Cards that show exactly one picture (SVG, emoji glyph or clock). */
// Only cards we deliberately mark as single-picture art (count cards and
// choice cards with one object). Match-row singles are not in scope.
const SINGLE_ART_CARDS = '[data-single-art]:has(.illus)';

/**
 * Visible art of every single-picture card must span >= `min` of the card's
 * width. Measured on pixels: the card is screenshotted with and without its
 * art and the changed pixels' bounding box is the ink, so emoji side bearing
 * and SVG padding don't count.
 */
export async function auditSingleArt(page: Page, { min = 0.7 }: { min?: number } = {}): Promise<(LayoutIssue & { ratio?: number })[]> {
  const out: (LayoutIssue & { ratio?: number })[] = [];
  const cards = page.locator(SINGLE_ART_CARDS);
  const n = await cards.count();
  for (let i = 0; i < n; i += 1) {
    const ratio = await singleArtRatio(page, cards.nth(i));
    if (ratio === null) continue;
    const name = await cards.nth(i).evaluate((el) => (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 12) || el.className.split(' ').slice(0, 2).join('.'));
    out.push({ kind: ratio + 0.0005 < min ? 'single-art' : 'single-art-ok', detail: `"${name}" art ${ratio.toFixed(3)} of card width`, ratio });
  }
  return out;
}

export async function singleArtRatio(page: Page, card: ReturnType<Page['locator']>): Promise<number | null> {
  const ok = await card.evaluate((el) => {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') return false;
    el.scrollIntoView({ block: 'center' });
    return el.querySelectorAll('.illus').length === 1;
  });
  if (!ok) return null;
  await page.waitForTimeout(60);
  const box = await card.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, width: r.width, height: r.height, vw: innerWidth, vh: innerHeight };
  });
  const clip = {
    x: Math.max(0, box.x),
    y: Math.max(0, box.y),
    width: Math.min(box.vw, box.x + box.width) - Math.max(0, box.x),
    height: Math.min(box.vh, box.y + box.height) - Math.max(0, box.y),
  };
  if (clip.width < 8 || clip.height < 8) return null;
  const withArt = (await page.screenshot({ clip, animations: 'disabled', scale: 'css' })).toString('base64');
  await card.evaluate((el) => (el.querySelector('.illus') as HTMLElement).style.setProperty('visibility', 'hidden', 'important'));
  const without = (await page.screenshot({ clip, animations: 'disabled', scale: 'css' })).toString('base64');
  await card.evaluate((el) => (el.querySelector('.illus') as HTMLElement).style.removeProperty('visibility'));
  const inkWidth = await page.evaluate(async ({ a, b }) => {
    const load = async (src: string) => {
      const img = new Image();
      img.src = `data:image/png;base64,${src}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      return ctx.getImageData(0, 0, c.width, c.height);
    };
    const [da, db] = await Promise.all([load(a), load(b)]);
    let minX = Infinity;
    let maxX = -Infinity;
    for (let y = 0; y < da.height; y += 1) {
      for (let x = 0; x < da.width; x += 1) {
        const k = (y * da.width + x) * 4;
        const d = Math.abs(da.data[k] - db.data[k]) + Math.abs(da.data[k + 1] - db.data[k + 1]) + Math.abs(da.data[k + 2] - db.data[k + 2]);
        if (d > 30) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }
    return maxX >= minX ? maxX - minX + 1 : 0;
  }, { a: withArt, b: without });
  return inkWidth / box.width;
}
