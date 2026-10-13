'use client';

import { useEffect } from 'react';

const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || 'dev';
const RELOAD_KEY = 'sw-reloaded-for';

function inLesson(): boolean {
  return window.location.pathname.startsWith('/lesson/');
}

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const hadController = Boolean(navigator.serviceWorker.controller);
    let timer: number | undefined;

    const reloadOnce = () => {
      try {
        if (sessionStorage.getItem(RELOAD_KEY) === BUILD_ID) {
          return;
        }
        sessionStorage.setItem(RELOAD_KEY, BUILD_ID);
      } catch {
        // sessionStorage unavailable: still reload, controllerchange fires once.
      }
      window.location.reload();
    };

    const onControllerChange = () => {
      // First install (no previous worker) needs no reload.
      if (!hadController) {
        return;
      }
      if (!inLesson()) {
        reloadOnce();
        return;
      }
      // Don't interrupt an exercise; reload once she leaves the lesson.
      timer = window.setInterval(() => {
        if (!inLesson()) {
          window.clearInterval(timer);
          reloadOnce();
        }
      }, 1000);
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    navigator.serviceWorker
      .register(`/sw.js?v=${encodeURIComponent(BUILD_ID)}`)
      .then((registration) => registration.update())
      .catch(() => {});

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      if (timer) {
        window.clearInterval(timer);
      }
    };
  }, []);

  return null;
}
