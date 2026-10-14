'use client';

import { useEffect } from 'react';

const RELOAD_KEY = 'sw-reloaded-for';
// Long-open tabs (e.g. a phone left on the app) look for a new deploy this often.
const UPDATE_CHECK_MS = 30 * 60 * 1000;

function inLesson(): boolean {
  return window.location.pathname.startsWith('/lesson/');
}

function controllerVersion(): Promise<string | null> {
  const controller = navigator.serviceWorker.controller;
  if (!controller) return Promise.resolve(null);
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timer = window.setTimeout(() => resolve(null), 2000);
    channel.port1.onmessage = (event) => {
      window.clearTimeout(timer);
      resolve((event.data && event.data.version) || null);
    };
    controller.postMessage({ type: 'GET_VERSION' }, [channel.port2]);
  });
}

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }
    if (!('serviceWorker' in navigator)) {
      return;
    }
    const sw = navigator.serviceWorker;
    // Whether a worker controlled this page before the latest controllerchange.
    // The very first claim of an uncontrolled page needs no reload; every later
    // change (each new deploy) does.
    let controlled = Boolean(sw.controller);
    let pending = false;
    let applying = false;
    let registration: ServiceWorkerRegistration | undefined;

    // Reload once per worker version. The guard is keyed by the new worker's
    // version, so a second deploy in the same tab reloads again, while a
    // repeated event for the same version can't loop.
    const applyUpdate = async () => {
      if (!pending || applying || inLesson()) return;
      applying = true;
      try {
        const version = (await controllerVersion()) ?? `unknown-${Date.now()}`;
        let already = false;
        try {
          already = sessionStorage.getItem(RELOAD_KEY) === version;
          if (!already) sessionStorage.setItem(RELOAD_KEY, version);
        } catch {
          // no sessionStorage: reload anyway
        }
        pending = false;
        if (!already) window.location.reload();
      } finally {
        applying = false;
      }
    };

    const onControllerChange = () => {
      if (!controlled) {
        controlled = true;
        return;
      }
      pending = true;
      void applyUpdate();
    };

    // Safe points to apply a deferred update: leaving a lesson (client-side
    // navigation or back), lesson end, or coming back to the app.
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      registration?.update().catch(() => {});
      void applyUpdate();
    };
    const onRoute = () => void applyUpdate();
    const routeTimer = window.setInterval(() => {
      if (pending) void applyUpdate();
    }, 1000);
    const updateTimer = window.setInterval(() => {
      registration?.update().catch(() => {});
    }, UPDATE_CHECK_MS);

    sw.addEventListener('controllerchange', onControllerChange);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('popstate', onRoute);
    sw.register('/sw.js')
      .then((reg) => {
        registration = reg;
        return reg.update();
      })
      .catch(() => {});

    return () => {
      sw.removeEventListener('controllerchange', onControllerChange);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('popstate', onRoute);
      window.clearInterval(routeTimer);
      window.clearInterval(updateTimer);
    };
  }, []);

  return null;
}
