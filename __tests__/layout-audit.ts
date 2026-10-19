import type { Page } from '@playwright/test';

export type LayoutIssue = { kind: string; detail: string };

/**
 * Runs in the page. Reports layout breakage that large system fonts cause:
 * - horizontal overflow of the page or any element past the viewport
 * - an in-flow element sticking out of its parent box
 * - text clipped by an overflow:hidden/clip box (vertical scroll containers
 *   are fine: scrolling is allowed)
 * - in-flow siblings overlapping each other
 * - tap targets (buttons, links, role=button) smaller than 48px on screen
 */
export async function auditLayout(page: Page, { zoom = 1 }: { zoom?: number } = {}): Promise<LayoutIssue[]> {
  return page.evaluate((zoom) => {
    const issues: { kind: string; detail: string }[] = [];
    const TOL = 2;
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
      if ((r.right > vw + TOL || r.left < -TOL) && !el.closest('.path-hit, .tooltip')) {
        const clip = clippedBy(el);
        const cr = clip?.getBoundingClientRect();
        const hiddenByClip = cr && (r.left >= cr.right || r.right <= cr.left);
        if (!hiddenByClip) issues.push({ kind: 'h-overflow', detail: `${describe(el)} spans ${Math.round(r.left)}..${Math.round(r.right)} (vw ${vw})` });
      }
      // Text clipped by its own hidden overflow.
      const clips = (v: string) => v === 'hidden' || v === 'clip';
      const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent || '').trim());
      const textual = hasText || el.querySelector(':scope > span, :scope > div, :scope > p') !== null;
      if (textual && el.tagName.toLowerCase() !== 'svg') {
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
        !el.matches('.path-hit')
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
          if (!negative && s.transform === 'none') {
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

    // Tap targets.
    for (const el of all.filter((e) => e.matches('button, a[href], [role="button"], input[type="range"]'))) {
      if (el.closest('.sheet') && !el.closest('.sheet')!.contains(el)) continue;
      const r = el.getBoundingClientRect();
      // Number-line hit strips: contiguous full-height columns over the line
      // (no gaps between neighbours), so a narrow column is still easy to hit.
      // Under page zoom a CSS px is drawn `zoom` times larger, so the 48px
      // floor is measured in on-screen size.
      const min = 48 / zoom - 0.5;
      if (el.hasAttribute('data-tap-strip') && r.height >= 120 / zoom && r.width >= 24 / zoom) continue;
      if (r.height < min || r.width < min) {
        issues.push({ kind: 'tap', detail: `${describe(el)} is ${Math.round(r.width)}x${Math.round(r.height)}` });
      }
    }
    return issues;
  }, zoom);
}
