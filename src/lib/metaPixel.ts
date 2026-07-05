declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

let isInitialized = false;
let currentPixelId = "";

export const initMetaPixel = (pixelId: string) => {
  if (!pixelId || typeof window === "undefined") return;
  if (isInitialized && currentPixelId === pixelId) return;

  try {
    if (!window.fbq) {
      /* eslint-disable */
      // @ts-ignore
      !(function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod
            ? n.callMethod.apply(n, arguments)
            : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = "2.0";
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s?.parentNode?.insertBefore(t, s);
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      /* eslint-enable */
    }

    window.fbq("init", pixelId);
    window.fbq("track", "PageView");
    isInitialized = true;
    currentPixelId = pixelId;
    console.log(`[Meta Pixel] Initialized successfully for ID: ${pixelId}`);
  } catch (err) {
    console.error("[Meta Pixel] Failed to initialize:", err);
  }
};

export const trackPixelEvent = (eventName: string, data?: any, options?: { eventID?: string }) => {
  if (typeof window === "undefined" || !window.fbq || !isInitialized) {
    return;
  }

  try {
    if (options && options.eventID) {
      window.fbq("track", eventName, data, { eventID: options.eventID });
      console.log(`[Meta Pixel] Event tracked: ${eventName} (Event ID: ${options.eventID})`, data);
    } else {
      window.fbq("track", eventName, data);
      console.log(`[Meta Pixel] Event tracked: ${eventName}`, data);
    }
  } catch (err) {
    console.error(`[Meta Pixel] Failed to track event ${eventName}:`, err);
  }
};
