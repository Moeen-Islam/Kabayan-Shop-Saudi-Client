import React, { useState, useEffect } from "react";
import { X, MapPin, Send, MessageSquare, Sparkles, ShoppingBag, CheckCircle, Ticket, Compass, ArrowLeft, RefreshCw, Navigation } from "lucide-react";
import { useCart } from "../lib/cartStore";
import { DeliveryArea, Coupon, Order, ShopSettings } from "../types";
import L from "leaflet";
import { useLanguage } from "../lib/translationStore";
import { trackPixelEvent } from "../lib/metaPixel";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";

// Fix default marker icon issue in Leaflet + Vite
let customMarkerIconCache: L.DivIcon | null = null;
const getCustomMarkerIcon = () => {
  if (!customMarkerIconCache) {
    customMarkerIconCache = L.divIcon({
      html: `<div class="w-8 h-8 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center relative"><div class="absolute w-4 h-4 bg-amber-500/50 border-2 border-white rounded-full shadow-md animate-ping"></div><div class="relative w-4 h-4 bg-amber-600 border border-white rounded-full shadow-md flex items-center justify-center"><div class="w-1.5 h-1.5 bg-white rounded-full"></div></div></div>`,
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }
  return customMarkerIconCache;
};

interface OSMMapProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  center: { lat: number; lng: number };
}

function OSMMap({ lat, lng, onChange, center }: OSMMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<L.Map | null>(null);
  const markerRef = React.useRef<L.Marker | null>(null);

  // Initialize Map
  React.useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Leaflet Map centered at the specified center
    const map = L.map(mapContainerRef.current, {
      center: [center.lat, center.lng],
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
    });

    // Add OpenStreetMap Tile Layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

    mapInstanceRef.current = map;

    // Add click handler to place/move the marker
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      onChange(clickLat, clickLng);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []); // Only run once on mount

  // Watch for external center changes (e.g., GPS retrieved or reset to Riyadh)
  React.useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([center.lat, center.lng], mapInstanceRef.current.getZoom());
    }
  }, [center.lat, center.lng]);

  // Update marker position when latitude or longitude changes
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (lat !== null && lng !== null) {
      if (markerRef.current) {
        // Marker exists, update position
        markerRef.current.setLatLng([lat, lng]);
      } else {
        // Create custom amber marker
        const marker = L.marker([lat, lng], {
          icon: getCustomMarkerIcon(),
          draggable: true,
        }).addTo(map);

        // Handle marker dragend
        marker.on("dragend", () => {
          const position = marker.getLatLng();
          onChange(position.lat, position.lng);
        });

        markerRef.current = marker;
      }
    } else {
      // Remove marker if coords are cleared
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    }
  }, [lat, lng, onChange]);

  return <div ref={mapContainerRef} className="w-full h-full relative z-10" />;
}

interface CheckoutModalProps {
  areas: DeliveryArea[];
  settings: ShopSettings;
  onClose: () => void;
  onOrderSuccess: () => void;
  onSelectProductById?: (id: string) => void;
  onBackToCart?: () => void;
}

export default function CheckoutModal({ areas, settings, onClose, onOrderSuccess, onSelectProductById, onBackToCart }: CheckoutModalProps) {
  const { items, subtotal, clearCart, updateQuantity, removeItem } = useCart();
  const { t, lang } = useLanguage();

  // Track InitiateCheckout on mount
  useEffect(() => {
    trackPixelEvent("InitiateCheckout", {
      content_ids: items.map(item => item.productId),
      content_type: "product",
      value: subtotal,
      currency: "SAR",
      num_items: items.reduce((acc, item) => acc + item.quantity, 0)
    });
  }, []);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState("+966");
  const [customCode, setCustomCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [houseNo, setHouseNo] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [notes, setNotes] = useState("");

  // Geolocation states
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locatingState, setLocatingState] = useState<"idle" | "locating" | "success" | "error">("idle");
  const [locatingError, setLocatingError] = useState("");

  // Google Map center and zoom (Riyadh defaults)
  const [mapCenter, setMapCenter] = useState({ lat: 24.7136, lng: 46.6753 });
  const [mapZoom, setMapZoom] = useState(11);

  // Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Order submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Set default area when areas load
  useEffect(() => {
    if (areas.length > 0 && !selectedAreaId) {
      setSelectedAreaId(areas[0].id);
    }
  }, [areas]);

  // Find active area shipping fee
  const activeArea = areas.find(a => a.id === selectedAreaId);
  const isMinOrderViolation = activeArea && activeArea.minOrderValue !== undefined && activeArea.minOrderValue !== null && subtotal < activeArea.minOrderValue;

  const getMinOrderWarning = () => {
    if (!activeArea || !activeArea.minOrderValue) return "";
    const minVal = activeArea.minOrderValue;
    if (lang === "ar") {
      return `الحد الأدنى للطلب لمنطقة ${activeArea.name} هو ${minVal} ريال سعودي. يرجى إضافة المزيد من المنتجات إلى السلة للمتابعة.`;
    } else if (lang === "fil") {
      return `Ang minimum na order para sa ${activeArea.name} ay ${minVal} SAR. Mangyaring magdagdag ng higit pang mga item sa iyong cart para magpatuloy.`;
    } else {
      return `The minimum order value for ${activeArea.name} is ${minVal} SAR. Please add more items to your cart to proceed.`;
    }
  };

  let deliveryCharge = activeArea ? activeArea.charge : 0;
  if (activeArea && activeArea.freeDeliveryAbove !== undefined && activeArea.freeDeliveryAbove !== null) {
    if (subtotal >= activeArea.freeDeliveryAbove) {
      deliveryCharge = 0;
    }
  }

  // Calculate Coupon discount
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === "percentage") {
      discountAmount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
    } else {
      discountAmount = Math.min(appliedCoupon.discountValue, subtotal);
    }
  }

  const grandTotal = Math.max(0, subtotal - discountAmount) + deliveryCharge;

  // 1. Share My Location / Pin Live Location Trigger
  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setLocatingState("error");
      setLocatingError("Geolocation is not supported by your browser.");
      return;
    }

    setLocatingState("locating");
    setLocatingError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setMapCenter({ lat, lng });
        setMapZoom(16); // zoom in on live location
        setLocatingState("success");
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocatingState("error");
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocatingError("Location permission denied. Please allow GPS access or click on the map to pin manually.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocatingError("Location information is unavailable. Try pinning manually on the map.");
            break;
          case error.TIMEOUT:
            setLocatingError("Request timed out. Please try again or pin manually.");
            break;
          default:
            setLocatingError("An unknown error occurred. Please click on the map to pin your location.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Helper to manual pin Riyadh coordinates
  const handlePinRiyadh = () => {
    const lat = 24.7136;
    const lng = 46.6753;
    setLatitude(lat);
    setLongitude(lng);
    setMapCenter({ lat, lng });
    setMapZoom(12);
    setLocatingState("success");
  };


  // 2. Coupon Validation API
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError("");
    setCouponSuccess("");

    try {
      const response = await fetch(`${API_URL}/coupons/validate/${couponCode.trim().toUpperCase()}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Invalid coupon");
      }
      const data: Coupon = await response.json();
      setAppliedCoupon(data);
      setCouponSuccess(`Coupon '${data.code}' applied! Saved ${data.discountType === "percentage" ? data.discountValue + "%" : data.discountValue + " SAR"}.`);
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err.message || "Failed to apply coupon");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // 3. Place Order Submission
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCountryCode = countryCode === "custom" ? customCode.trim() : countryCode;
    const finalWhatsapp = `${selectedCountryCode}${phoneNumber.trim()}`;

    if (!fullName.trim() || !phoneNumber.trim() || !selectedAreaId || !fullAddress.trim()) {
      alert("Please fill in all required fields marked with *");
      return;
    }

    if (!latitude || !longitude) {
      alert("⚠️ EXACT HOUSE LOCATION IS REQUIRED!\n\nPlease click the 'Share My Location' button to confirm your live coordinates location.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerName: fullName,
        whatsapp: finalWhatsapp,
        areaId: selectedAreaId,
        houseNo,
        fullAddress,
        notes,
        lat: latitude,
        lng: longitude,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        items: items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
          selectedPackageType: item.selectedPackageType
        }))
      };

      const response = await fetch(API_URL + "/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to submit order");
      }

      const data = await response.json();
      
      // Track Purchase in Meta Pixel
      trackPixelEvent("Purchase", {
        content_ids: items.map(item => item.productId),
        content_type: "product",
        value: data.finalBill || subtotal,
        currency: "SAR",
        num_items: items.reduce((acc, item) => acc + item.quantity, 0)
      });

      clearCart(); // Wipe client cart

      // Notify the customer with a beautiful non-blocking toast
      alert(t("order_success"));

      // Direct to the storefront home page
      onOrderSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || "Something went wrong while placing your order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to format and trigger WhatsApp for an order
  const triggerWhatsApp = (order: Order) => {
    const contactNumber = order.whatsapp.replace(/\D/g, "");

    // Format text beautifully and cleanly
    let msg = `*🛍️ KABAYAN SHOP SAUDI - NEW ORDER CONFIRMED*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `*Order Number:* #${order.orderNumber}\n`;
    msg += `*Date/Time:* ${new Date(order.createdAt).toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}\n\n`;

    msg += `👤 *CUSTOMER INFO:*\n`;
    msg += `• *Name:* ${order.customerName}\n`;
    msg += `• *WhatsApp:* +${contactNumber}\n`;
    msg += `• *City/Area:* ${order.areaName}\n`;
    msg += `• *House No:* ${order.houseNo || "N/A"}\n`;
    msg += `• *Full Address:* ${order.fullAddress}\n`;
    if (order.notes) {
      msg += `• *Note:* ${order.notes}\n`;
    }
    if (order.mapLink) {
      msg += `• *Google Maps Location:* ${order.mapLink}\n`;
    }
    msg += `\n`;

    msg += `📦 *ORDERED ITEMS:*\n`;
    order.items.forEach((item, idx) => {
      msg += `• *${item.quantity}x* ${item.productName}\n`;
      msg += `  Size: ${item.selectedSize} | Color: ${item.selectedColor}\n`;
      msg += `  Package: ${item.selectedPackageType}\n`;
      msg += `  Price: ${item.price} SAR each (Total: ${item.price * item.quantity} SAR)\n\n`;
    });

    msg += `💳 *BILLING SUMMARY:*\n`;
    msg += `• Items Subtotal: ${order.productTotal} SAR\n`;
    if (order.discountAmount) {
      msg += `• Coupon Discount: -${order.discountAmount} SAR\n`;
    }
    msg += `• Delivery Fee: ${order.deliveryCharge} SAR\n`;
    msg += `⭐ *Grand Total:* *${order.grandTotal} SAR* (Cash on Delivery)\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `Thank you for shopping with Kabayan Shop! We will message you shortly to coordinate the delivery. Please reply to this message to confirm. ❤️`;

    const encodedText = encodeURIComponent(msg);
    const waUrl = `https://api.whatsapp.com/send?phone=${contactNumber}&text=${encodedText}`;
    try {
      const newWin = window.open(waUrl, "_blank");
      if (!newWin || newWin.closed || typeof newWin.closed === "undefined") {
        // Popup was blocked by browser/iframe, fallback to redirecting the window directly
        window.location.href = waUrl;
      }
    } catch (err) {
      console.error("Popup window.open was blocked by sandbox/browser:", err);
      window.location.href = waUrl;
    }
  };

  // 4. Construct and Send to WhatsApp Chat link (manual click fallback)
  const handleSendToWhatsApp = () => {
    if (!placedOrder) return;
    triggerWhatsApp(placedOrder);
  };

  // Success view block
  if (placedOrder) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col text-center">
          <div className="mx-auto bg-green-50 text-green-600 p-4 rounded-full mb-5 flex items-center justify-center">
            <CheckCircle className="w-12 h-12" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight leading-none mb-2">
            ORDER PLACED SUCCESSFULLY!
          </h2>
          <p className="text-sm text-neutral-500 mb-6 max-w-md mx-auto">
            Your order has been recorded in our system. Please complete the final step by sending your receipt to our WhatsApp system below.
          </p>

          {/* Order Summary Receipt */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 text-left mb-6 font-sans">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-200 mb-4 text-xs font-mono text-neutral-500">
              <span>ORDER NO: <strong className="text-black">{placedOrder.orderNumber}</strong></span>
              <span>DATE: <strong>{new Date(placedOrder.createdAt).toLocaleDateString()}</strong></span>
            </div>

            <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-widest mb-2.5">
              Customer Details:
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-neutral-600 mb-4 pb-4 border-b border-neutral-200/50">
              <div>Name: <strong className="text-neutral-900">{placedOrder.customerName}</strong></div>
              <div>WhatsApp: <strong className="text-neutral-900">{placedOrder.whatsapp}</strong></div>
              <div>City/Area: <strong className="text-neutral-900">{placedOrder.areaName}</strong></div>
              <div className="col-span-2">Address: <strong className="text-neutral-900">{placedOrder.fullAddress}</strong></div>
              {placedOrder.mapLink && (
                <div className="col-span-2 text-amber-600">
                  📍 Live Location coordinates saved.
                </div>
              )}
            </div>

            <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-widest mb-2.5">
              Ordered Products:
            </h4>
            <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
              {placedOrder.items.map((item, idx) => (
                <div key={idx} className="flex gap-3 justify-between items-start text-xs border-b border-neutral-100 pb-2">
                  <div className="flex-1">
                    <span className="font-semibold text-neutral-900">{item.productName}</span>
                    <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                      Size: {item.selectedSize} | Color: {item.selectedColor} | Pkg: {item.selectedPackageType}
                    </div>
                  </div>
                  <div className="text-right font-semibold text-neutral-800 shrink-0 font-mono">
                    {item.quantity} x {item.price} SAR
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-xs pt-2">
              <div className="flex justify-between text-neutral-500">
                <span>Items Subtotal:</span>
                <span className="font-semibold">{placedOrder.productTotal} SAR</span>
              </div>
              {placedOrder.discountAmount && (
                <div className="flex justify-between text-amber-600 font-medium">
                  <span>Discount Applied:</span>
                  <span>-{placedOrder.discountAmount} SAR</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-500">
                <span>Delivery Charge ({placedOrder.areaName}):</span>
                <span className="font-semibold">{placedOrder.deliveryCharge} SAR</span>
              </div>
              <div className="flex justify-between text-base font-bold text-neutral-900 pt-2 border-t border-neutral-200 font-sans">
                <span>Total Amount:</span>
                <span className="text-amber-600">{placedOrder.grandTotal} SAR</span>
              </div>
            </div>
          </div>

          {/* Golden WhatsApp Action Button */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleSendToWhatsApp}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-extrabold text-sm uppercase py-4 rounded-full flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-green-500/20 text-center tracking-wider scale-102 hover:scale-105"
            >
              <MessageSquare className="w-5 h-5 fill-current" />
              <span>ORDER CONFIRMED</span>
            </button>
            <button
              onClick={() => {
                onOrderSuccess();
                onClose();
              }}
              className="text-xs text-neutral-400 hover:text-neutral-600 font-bold uppercase tracking-widest py-2"
            >
              Back To Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Normal Checkout Form View
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-scale-in">

        {/* Header bar */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            {onBackToCart && (
              <button
                type="button"
                onClick={onBackToCart}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-black rounded-lg text-xs font-bold uppercase transition duration-150"
                title="Go back to shopping cart"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Cart</span>
              </button>
            )}
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">

              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 transition text-neutral-500 hover:text-black"
          >
            <X className="w-5.5 h-5.5" />
          </button>
        </div>

        {/* Content body split into left form and right summary */}
        <form onSubmit={handleSubmitOrder} className="flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-neutral-100">

          {/* Left Column: Input Form (3/5ths) */}
          <div className="md:col-span-3 p-6 sm:p-8 space-y-5">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2">
              {t("contact_info")} (Fast Cash on Delivery)
            </h4>

            {/* Full Name */}
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                {t("your_full_name")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("your_full_name")}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-950 placeholder-neutral-400 focus:outline-none focus:border-amber-500 transition bg-neutral-50 focus:bg-white"
              />
            </div>

            {/* WhatsApp Number with Country Code selection */}
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                {t("whatsapp_number")} <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="flex gap-1.5 shrink-0">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="px-2 py-2.5 border border-neutral-300 rounded-lg text-xs font-bold text-neutral-950 bg-neutral-50 focus:bg-white focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="+966">🇸🇦 +966 (KSA)</option>
                    <option value="+63">🇵🇭 +63 (Phil)</option>
                    <option value="+880">🇧🇩 +880 (BD)</option>
                    <option value="+62">🇮🇩 +62 (Indonesia)</option>
                    <option value="+254">🇰🇪 +254 (Kenya)</option>
                    <option value="custom">Other</option>
                  </select>

                  {countryCode === "custom" && (
                    <input
                      type="text"
                      required
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value)}
                      placeholder="+1"
                      className="w-16 px-2 py-2.5 border border-neutral-300 rounded-lg text-xs font-bold text-neutral-950 placeholder-neutral-400 focus:outline-none focus:border-amber-500 bg-neutral-50 focus:bg-white text-center font-mono"
                    />
                  )}
                </div>

                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="501234567"
                  className="flex-grow px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-950 placeholder-neutral-400 focus:outline-none focus:border-amber-500 transition bg-neutral-50 focus:bg-white font-mono font-semibold"
                />
              </div>
              <span className="text-[10px] text-neutral-400 mt-1 block">
                Provide an active WhatsApp contact with valid country code. Your order update receipt will be generated automatically.
              </span>
            </div>

            {/* Area Selection with Auto Charge */}
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                {t("select_city_district")} <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-950 focus:outline-none focus:border-amber-500 transition bg-neutral-50 focus:bg-white font-semibold"
              >
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name} — Shipping: {area.charge} SAR {area.freeDeliveryAbove ? `(Free Above ${area.freeDeliveryAbove} SAR)` : ""}{area.minOrderValue ? ` [Min Order: ${area.minOrderValue} SAR]` : ""}
                  </option>
                ))}
              </select>
              {activeArea && activeArea.minOrderValue && (
                <div className={`mt-1.5 text-[11px] font-bold ${isMinOrderViolation ? "text-red-600 animate-pulse" : "text-neutral-500"}`}>
                  📌 {lang === "ar" ? "الحد الأدنى للطلب:" : lang === "fil" ? "Minimum Order:" : "Minimum Order:"} {activeArea.minOrderValue} SAR
                  {isMinOrderViolation && (
                    <span className="ml-1 text-[10px] font-semibold text-red-500 block">
                      ({lang === "ar" ? "سلتك الحالية:" : lang === "fil" ? "Kasalukuyang cart:" : "Your current cart:"} {subtotal} SAR)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* House No. / Villa */}
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                House / Flat / Villa No.
              </label>
              <input
                type="text"
                value={houseNo}
                onChange={(e) => setHouseNo(e.target.value)}
                placeholder="e.g. Villa 12, Flat 3B"
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-950 placeholder-neutral-400 focus:outline-none focus:border-amber-500 transition bg-neutral-50 focus:bg-white"
              />
            </div>

            {/* Full Address */}
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                {t("custom_address_landmark")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                placeholder="e.g. King Fahd Road, Near Olaya Mall"
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-950 placeholder-neutral-400 focus:outline-none focus:border-amber-500 transition bg-neutral-50 focus:bg-white"
              />
            </div>

            {/* Additional Delivery Notes */}
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                {t("order_notes_optional")}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Deliver only after 4:00 PM, Call before arriving"
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-950 placeholder-neutral-400 focus:outline-none focus:border-amber-500 transition bg-neutral-50 focus:bg-white resize-none"
              />
            </div>

            {/* Live Location Sharing & Interactive OpenStreetMap Section */}
            <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-amber-100 p-2 text-amber-600 rounded-lg shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-grow">
                  <h5 className="text-xs font-extrabold text-neutral-900 uppercase tracking-wide flex items-center gap-1.5">
                    {t("select_delivery_pin")} <span className="text-red-500">*</span>
                  </h5>
                  <p className="text-[10px] text-neutral-500 mt-0.5 leading-relaxed">
                    {t("map_instruction_text")}
                  </p>
                </div>
              </div>

              {/* Map Container */}
              <div className="w-full relative bg-neutral-100 border border-neutral-200 rounded-xl overflow-hidden h-[280px] shadow-inner flex flex-col items-center justify-center">
                <OSMMap
                  lat={latitude}
                  lng={longitude}
                  center={mapCenter}
                  onChange={(newLat, newLng) => {
                    setLatitude(newLat);
                    setLongitude(newLng);
                  }}
                />

                {/* Floating Helper Overlay */}
                {latitude === null && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-neutral-900/90 text-amber-400 font-bold px-3 py-1.5 rounded-full text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1 animate-pulse pointer-events-none z-[1000]">
                    <span>{t("tap_map_helper")}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons & Status */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleShareLocation}
                    disabled={locatingState === "locating"}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition disabled:opacity-50"
                  >
                    <Compass className={`w-3.5 h-3.5 ${locatingState === "locating" ? "animate-spin" : ""}`} />
                    <span>
                      {locatingState === "locating" ? t("locating") : t("pin_live_location")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePinRiyadh}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-lg text-[10px] font-bold uppercase tracking-wider transition"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{t("reset_to_riyadh")}</span>
                  </button>
                </div>

                {/* Status bar */}
                <div className="flex items-center justify-between text-[11px] p-2 bg-white rounded-lg border border-neutral-200 font-medium">
                  <span className="text-neutral-500">{t("coordinate_status")}</span>
                  {latitude !== null && longitude !== null ? (
                    <span className="text-green-600 font-bold font-mono">
                      {t("location_pin_saved", { lat: latitude.toFixed(5), lng: longitude.toFixed(5) })}
                    </span>
                  ) : (
                    <span className="text-red-500 font-bold flex items-center gap-1 animate-pulse">
                      {t("location_pin_required")}
                    </span>
                  )}
                </div>

                {locatingError && (
                  <p className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-100 p-2 rounded-lg">
                    ⚠️ {locatingError}
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary (2/5ths) */}
          <div className="md:col-span-2 p-6 sm:p-8 bg-neutral-50 flex flex-col justify-between">
            <div className="space-y-5">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2">
                {t("order_summary")} ({items.length} {t("items")})
              </h4>

              {/* Items List */}
              <div className="divide-y divide-neutral-200/60 max-h-48 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex gap-3 text-xs items-center">
                    <div
                      onClick={() => onSelectProductById?.(item.productId)}
                      className="w-10 h-13 rounded border border-neutral-200/80 overflow-hidden shrink-0 cursor-pointer hover:border-amber-400 hover:opacity-90 transition duration-150 flex items-center justify-center relative bg-white"
                      title="Click to edit options"
                    >
                      <img
                        src={item.productImage}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover blur-sm opacity-40 scale-110 pointer-events-none"
                      />
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        referrerPolicy="no-referrer"
                        className="relative z-10 max-w-full max-h-full w-auto h-auto object-contain pointer-events-none"
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h5
                        onClick={() => onSelectProductById?.(item.productId)}
                        className="font-semibold text-neutral-900 truncate cursor-pointer hover:text-amber-600 hover:underline transition duration-150"
                        title="Click to edit options"
                      >
                        {item.productName}
                      </h5>
                      <span className="text-[10px] text-neutral-400 block font-mono">
                        {item.selectedSize} / {item.selectedColor}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-amber-600 font-bold block truncate">
                          {item.selectedPackageType}
                        </span>
                        <button
                          type="button"
                          onClick={() => onSelectProductById?.(item.productId)}
                          className="text-[10px] text-neutral-500 font-bold hover:text-amber-600 hover:underline transition"
                        >
                          (Edit)
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="font-bold text-neutral-900 block font-mono">{item.price * item.quantity} SAR</span>
                      <div className="flex items-center gap-1 border border-neutral-200 rounded bg-white p-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateQuantity(item.productId, item.selectedColor, item.selectedSize, item.selectedPackageType, item.quantity - 1);
                            } else {
                              removeItem(item.productId, item.selectedColor, item.selectedSize, item.selectedPackageType);
                            }
                          }}
                          className="w-5 h-5 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-600 transition font-bold"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-bold text-neutral-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            updateQuantity(item.productId, item.selectedColor, item.selectedSize, item.selectedPackageType, item.quantity + 1);
                          }}
                          className="w-5 h-5 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-600 transition font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon input code */}
              <div className="border-t border-b border-neutral-200 py-4 my-4">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1.5">
                  {t("apply_coupon")}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="e.g. KABAYAN10"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs uppercase font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isValidatingCoupon || !couponCode.trim()}
                    className="bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase px-4 rounded-lg transition disabled:opacity-40"
                  >
                    {lang === "ar" ? "تطبيق" : lang === "fil" ? "Ilapat" : "Apply"}
                  </button>
                </div>

                {couponSuccess && (
                  <p className="text-[10px] font-bold text-green-600 mt-2">
                    ✓ {couponSuccess}
                  </p>
                )}
                {couponError && (
                  <p className="text-[10px] font-bold text-red-600 mt-2">
                    ⚠️ {couponError}
                  </p>
                )}
              </div>

              {/* Cost breakdown */}
              <div className="space-y-2 border-b border-neutral-200 pb-4 text-xs">
                <div className="flex justify-between text-neutral-500">
                  <span>{t("subtotal")}:</span>
                  <span className="font-bold">{subtotal} SAR</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>{t("discount")} ({appliedCoupon.code}):</span>
                    <span>-{discountAmount} SAR</span>
                  </div>
                )}

                <div className="flex justify-between text-neutral-500">
                  <span>{t("delivery")} ({activeArea ? activeArea.name : "Select city"}):</span>
                  <span className="font-bold">{deliveryCharge === 0 ? t("free") : `${deliveryCharge} SAR`}</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-sm font-bold text-neutral-800">{t("total")}:</span>
                <span className="text-2xl font-black text-black font-sans">
                  {grandTotal} <span className="text-xs font-extrabold text-amber-600">SAR</span>
                </span>
              </div>
            </div>

            {/* Checkout Form CTA button */}
            <div className="pt-6 space-y-4">
              {isMinOrderViolation && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs font-bold shadow-sm">
                  <span className="text-sm shrink-0">⚠️</span>
                  <span>{getMinOrderWarning()}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || items.length === 0 || isMinOrderViolation}
                className="w-full bg-black hover:bg-neutral-900 text-amber-400 font-extrabold text-sm uppercase tracking-widest py-4 rounded-full flex items-center justify-center gap-2.5 transition shadow-xl shadow-black/15 disabled:opacity-50 disabled:cursor-not-allowed scale-100 hover:scale-102"
              >
                <Send className="w-4 h-4 fill-current" />
                <span>
                  {isSubmitting ? (lang === "ar" ? "جاري المعالجة..." : lang === "fil" ? "PROSESO..." : "PROCESSING ORDER...") : t("send_order_whatsapp")}
                </span>
              </button>
              <span className="text-[9px] text-center text-neutral-400 mt-2 block font-medium leading-snug">
                {lang === "ar"
                  ? "من خلال تقديم هذا الطلب، فإنك توافق على الدفع عند الاستلام (COD) عند استلام الطرد."
                  : lang === "fil"
                    ? "Sa pag-order nito, sumasang-ayon ka na magbayad sa pamamagitan ng Cash on Delivery (COD) kapag natanggap ang package."
                    : "By placing this order, you agree to pay via Cash on Delivery (COD) on package receipt."}
              </span>
            </div>

          </div>

        </form>
      </div>
    </div>
  );
}
