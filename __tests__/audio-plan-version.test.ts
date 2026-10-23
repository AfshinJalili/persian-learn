/** @jest-environment node */
import { GET as planRoute } from '../app/audio-plan.json/route';
import { GET as versionRoute } from '../app/audio-plan-version.json/route';

describe('audio plan version file', () => {
  it('carries the full plan version and nothing else, so each page load stays tiny', async () => {
    const plan = await planRoute().json();
    const res = versionRoute();
    const body = await res.text();
    expect(JSON.parse(body)).toEqual({ version: plan.version });
    expect(Buffer.byteLength(body)).toBeLessThan(200);
    expect(res.headers.get('cache-control')).toBe('no-cache');
  });
});
