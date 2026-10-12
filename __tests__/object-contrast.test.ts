import { describe, expect, it } from '@jest/globals';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  AppleSvg,
  BreadSvg,
  ClockSvg,
  CypressSvg,
  DotSvg,
  EggSvg,
  HouseSvg,
  KeySvg,
  MoonSvg,
  OnionSvg,
  OrangeSvg,
  PencilSvg,
  PhoneSvg,
  PomegranateSvg,
  RedDotSvg,
  SunSvg,
  TeaSvg,
  TomatoSvg,
  TulipSvg,
  WaterSvg,
} from '../components/art/objects';

function srgb(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const value = hex.replace('#', '');
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return 0.2126 * srgb(red) + 0.7152 * srgb(green) + 0.0722 * srgb(blue);
}

function contrast(hex: string, background: string): number {
  const high = Math.max(luminance(hex), luminance(background));
  const low = Math.min(luminance(hex), luminance(background));
  return (high + 0.05) / (low + 0.05);
}

function firstBodyColor(markup: string): string {
  const fills = [...markup.matchAll(/fill="(#[A-Fa-f0-9]{6})"/g)].map((match) => match[1]);
  const strokes = [...markup.matchAll(/stroke="(#[A-Fa-f0-9]{6})"/g)].map((match) => match[1]);
  const color = fills[0] ?? strokes[0];
  if (!color) {
    throw new Error(`no body color in ${markup}`);
  }
  return color;
}

const CARD_BACKGROUNDS = ['#ffffff', '#fff8ec'] as const;

const COUNTING_ART = [
  ['apple', AppleSvg],
  ['bread', BreadSvg],
  ['tea', TeaSvg],
  ['pomegranate', PomegranateSvg],
  ['tulip', TulipSvg],
  ['cypress', CypressSvg],
  ['sun', SunSvg],
  ['moon', MoonSvg],
  ['key', KeySvg],
  ['phone', PhoneSvg],
  ['egg', EggSvg],
  ['orange', OrangeSvg],
  ['house', HouseSvg],
  ['water', WaterSvg],
  ['dot', DotSvg],
  ['clock', ClockSvg],
  ['tomato', TomatoSvg],
  ['onion', OnionSvg],
  ['pencil', PencilSvg],
  ['red-dot', RedDotSvg],
] as const;

describe('counting art contrast', () => {
  it.each(COUNTING_ART)('%s body is at least 3:1 on white and cream cards', (name, Art) => {
    const markup = renderToStaticMarkup(createElement(Art));
    const body = firstBodyColor(markup);
    for (const background of CARD_BACKGROUNDS) {
      expect(contrast(body, background)).toBeGreaterThanOrEqual(3);
    }
  });
});
