
'use client';

import { useEffect } from 'react';

export function PwaInstaller() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.workbox !== undefined) {
      const wb = window.workbox;
      // TheaddEventListener() event listener is fired when a new service worker has been installed and is waiting to be activated.
      wb.addEventListener('waiting', () => {
        // `event.wasWaitingBeforeRegister` will be false if this is the first time the updated service worker is waiting.
        // When `event.wasWaitingBeforeRegister` is true, a previously updated service worker is still waiting.
        // You may want to customize the UI prompt accordingly.
        // https://developer.chrome.com/docs/workbox/handling-service-worker-updates/#the-waiting-event
        // wb.messageSkipWaiting();
      });

      //`event.isUpdate` will be true if another version of the service worker is already active.
      // `event.isUpdate` will be false if there's no existing service worker active.
      // You may want to customize the UI prompt accordingly.
      // https://developer.chrome.com/docs/workbox/handling-service-worker-updates/#the-activated-event
      wb.addEventListener('activated', (event) => {
        if (!event.isUpdate) {
            console.log('Service worker activated for the first time!');
        }
      });
      
      wb.register();
    } else if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('Service Worker registered with scope:', registration.scope);
            }).catch(function(error) {
                console.log('Service Worker registration failed:', error);
            });
    }
  }, []);

  return null;
}
