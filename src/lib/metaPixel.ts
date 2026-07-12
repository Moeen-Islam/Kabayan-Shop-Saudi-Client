declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

let isInitialized = false;
let currentPixelId = "";

const getApiUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl.endsWith("/api") ? envUrl : envUrl + "/api";
  }
  const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
    if (isIp) {
      return `http://${hostname}:5000/api`;
    }
    return "/api";
  }
  const base = envUrl || "http://localhost:5000";
  return base.endsWith("/api") ? base : base + "/api";
};

export const getOrCreateExternalId = (): string => {
  if (typeof window === "undefined") return "";
  let extId = localStorage.getItem("kabayan_external_id");
  if (!extId) {
    extId = "ext-" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("kabayan_external_id", extId);
  }
  return extId;
};

export const initMetaPixel = (pixelId: string) => {
  if (!pixelId || typeof window === "undefined") return;
  if (isInitialized && currentPixelId === pixelId) return;

  try {
    // If already loaded globally (from layout.tsx head), just register the state
    if (window.fbq) {
      isInitialized = true;
      currentPixelId = pixelId;
      console.log(`[Meta Pixel] Globally loaded Pixel ID recognized: ${pixelId}`);
      return;
    }

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

    let extId = "";
    let phone = "";
    let name = "";
    try {
      extId = getOrCreateExternalId();
      phone = localStorage.getItem("kabayan_customer_phone") || "";
      name = localStorage.getItem("kabayan_customer_name") || "";
    } catch (e) {}

    const initData: any = {};
    if (extId) initData.external_id = extId;
    if (phone) initData.ph = phone.replace(/\D/g, "");
    if (name) initData.fn = name.trim().split(/\s+/)[0] || "";

    window.fbq("init", pixelId, initData);
    window.fbq("track", "PageView");
    isInitialized = true;
    currentPixelId = pixelId;
    console.log(`[Meta Pixel] Dynamic initialized for ID: ${pixelId}`);
  } catch (err) {
    console.error("[Meta Pixel] Failed to initialize:", err);
  }
};

export const trackPixelEvent = async (eventName: string, data?: any, options?: { eventID?: string }) => {
  if (typeof window === "undefined") return;

  // Ensure an eventID exists for exact client/server deduplication mapping
  const eventID = options?.eventID || `${eventName.toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // 1. Send client-side browser event
  if (window.fbq) {
    // If not marked initialized, check if fbq has been loaded globally in header
    if (!isInitialized) {
      isInitialized = true;
    }
    try {
      window.fbq("track", eventName, data || {}, { eventID });
      console.log(`[Meta Pixel] Browser event tracked: ${eventName} (Event ID: ${eventID})`, data);
    } catch (err) {
      console.error(`[Meta Pixel] Failed to track browser event ${eventName}:`, err);
    }
  } else {
    console.log(`[Meta Pixel] Browser fbq not found. Event ${eventName} skipped on client.`);
  }

  // 2. Send server-side Conversions API event
  // Skip Purchase here because Purchase has its own explicit backend flow in orders API
  if (eventName === "Purchase") {
    return;
  }

  try {
    let extId = "";
    let phone = "";
    let name = "";
    try {
      extId = getOrCreateExternalId();
      phone = localStorage.getItem("kabayan_customer_phone") || "";
      name = localStorage.getItem("kabayan_customer_name") || "";
    } catch (e) {}

    const userData = {
      whatsapp: phone,
      customerName: name,
      externalId: extId
    };

    const res = await fetch(`${getApiUrl()}/track/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-external-id": extId
      },
      body: JSON.stringify({
        eventName,
        eventId: eventID,
        userData,
        customData: data
      })
    });

    if (res.ok) {
      console.log(`[Meta CAPI] Server event tracking dispatched: ${eventName} (Event ID: ${eventID})`);
    } else {
      console.warn(`[Meta CAPI] Server event tracking returned status: ${res.status}`);
    }
  } catch (err) {
    console.error(`[Meta CAPI] Failed to dispatch server event ${eventName}:`, err);
  }
};
