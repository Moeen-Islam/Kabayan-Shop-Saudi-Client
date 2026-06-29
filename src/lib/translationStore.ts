import { useState, useEffect } from "react";
import { safeStorage } from "./safeStorage";

export type Language = "en" | "ar" | "fil";

export const translations = {
  en: {
    // Header
    free_delivery_banner: "FREE DELIVERY ON BULK ORDERS ACROSS SAUDI ARABIA!",
    riyadh_ksa: "Riyadh, KSA",
    whatsapp_support: "WhatsApp Order Support",
    home: "Home",
    product: "Product",
    collections: "Collections",
    all_arrivals: "All Arrivals",
    my_cart: "My Cart",
    admin: "Admin",
    storefront: "Storefront",
    luxury_sub: "SAUDI ARABIA • LUXURY MODEST FASHION",

    // Hero Section
    eid_sale: "EID & SUMMER MEGA SALE • UP TO 50% OFF",
    embrace_elegance: "EMBRACE THE ELEGANCE",
    hero_description: "Explore our premium collections of modesty abayas, linen terno sets, denim coats, and footwear tailored for modern lifestyle in Saudi Arabia.",
    shop_abayas: "Shop Abayas",
    view_terno_sets: "View Terno Sets",
    flash_sales_active: "FLASH SALES ARE ACTIVE!",
    flash_sales_sub: "Order with Cash on Delivery (COD) anywhere in KSA. Select items have extra 12pcs combo pricing. Click any product below to view options!",
    instant_wa_forwarding: "⚡ INSTANT WHATSAPP FORWARDING",

    // Explorer Section
    filter_by_collection: "Filter by Collection:",
    explore_all_designs: "EXPLORE ALL DESIGNS",
    items: "Items",
    explore_sub: "Modest fashion, terno combos, night wear and luxury shoes",
    sort_by: "Sort By:",
    new_arrivals: "New Arrivals",
    price_low_high: "Price: Low to High",
    price_high_low: "Price: High to Low",
    no_match_found: "No Match Found",
    no_match_sub: "We couldn't find any products matching your query. Clear search or try another category.",
    clear_all_filters: "Clear All Filters",

    // Brand Features
    cod_title: "CASH ON DELIVERY (COD)",
    cod_desc: "No online payment needed! Check and verify your package before you pay the courier agent.",
    live_gps_title: "LIVE GPS ROUTING",
    live_gps_desc: "Share your exact live map coordinates at checkout to guarantee prompt direct doorstep delivery.",
    wa_synced_title: "WHATSAPP SYNCED",
    wa_synced_desc: "Receive dynamic order status sheets, package details, and tracking alerts directly on your WhatsApp chat.",

    // Reviews
    trusted_by_thousands: "TRUSTED BY THOUSANDS IN SAUDI ARABIA",
    what_customers_say: "WHAT OUR CUSTOMERS ARE SAYING",

    // Facebook Trust Section
    visit_facebook: "VISIT OUR FACEBOOK PAGE",
    fb_trust_title: "100% Trusted Store on Facebook",
    fb_trust_desc: "We are an established boutique on Facebook serving thousands of happy Filipino and local residents across Saudi Arabia with premium fashion and dedicated support.",
    fb_view_page: "Check Our Facebook Page",
    fb_reviews: "Read Customer Feedback & Real Photos",
    fb_followers: "12,000+ Followers",

    // Checkout / Map Section
    select_delivery_pin: "Select Delivery Pin Location",
    map_instruction_text: "Drag the marker or tap anywhere on the map to pin your precise shipping address or Pin Live location",
    pin_live_location: "Pin Live Location",
    reset_to_riyadh: "Reset to Riyadh",
    coordinate_status: "Coordinate Pin Status:",
    location_pin_required: "🔴 Location Pin Required",
    location_pin_saved: "🟢 Lat: {lat}, Lng: {lng}",
    locating: "Locating...",
    tap_map_helper: "👇 Tap map to pin your location",
    contact_info: "Contact Information",
    your_full_name: "Your Full Name",
    whatsapp_number: "WhatsApp Number (e.g. 96650xxxxxxx)",
    shipping_details: "Shipping Details",
    select_city_district: "Select City / District",
    custom_address_landmark: "Custom Street Address / Nearby Landmark",
    order_notes_optional: "Order Notes (Optional / Size instructions)",
    order_summary: "Order Summary",
    apply_coupon: "Apply Coupon",
    enter_coupon_code: "Enter coupon code",
    subtotal: "Subtotal",
    discount: "Discount",
    delivery: "Delivery",
    free: "FREE",
    total: "Total",
    send_order_whatsapp: "Order Confirm",
    order_details_whatsapp_notice: "Order details will be sent to your WhatsApp",
    back_to_cart: "Back to Cart",
    delivery_warning_map: "⚠️ Please pin your delivery location on the map to proceed.",
    order_success: "Order Placed Successfully!",

    // Category Names
    dresses: "Dresses",
    abaya: "Abaya",
    terno: "Terno",
    denim: "Denim",
    shoes: "Shoes",
    "t-shirts": "T-Shirts",
    "night-wear": "Night Wear",
    luggage: "Luggage",
    "combo-pack": "Combo Pack",
    cosmetics: "Cosmetics",
    watch: "Watch",

    // Cart Drawer
    my_shopping_cart: "My Shopping Cart",
    cart_empty: "Your cart is empty",
    add_items_to_cart: "Add premium modest items to your cart to begin your order.",
    continue_shopping: "Continue Shopping",
    item_removed: "Item removed from cart",
    qty: "Qty",
    checkout: "Checkout",
    best_seller: "BEST SELLER",
    limited_stock: "Limited Stock Left!",

    // Product Details / Ops
    buy_now: "Buy Now",
    add_to_cart: "Add to Cart",
    colors: "Available Colors",
    sizes: "Available Sizes",
    packages: "Select Package Style",
    single_piece: "Single Piece",
    related_products: "Related Products You May Like",
    load_more: "Load More Designs",
    explore_products: "Explore Products",
    trending_now: "Trending Now"
  },
  ar: {
    // Header
    free_delivery_banner: "توصيل مجاني على الطلبات الكبيرة في جميع أنحاء المملكة العربية السعودية!",
    riyadh_ksa: "الرياض، السعودية",
    whatsapp_support: "دعم الطلبات عبر واتساب",
    home: "الرئيسية",
    product: "المنتجات",
    collections: "المجموعات",
    all_arrivals: "كل المجموعات",
    my_cart: "سلتي",
    admin: "لوحة التحكم",
    storefront: "المتجر",
    luxury_sub: "المملكة العربية السعودية • أزياء راقية ومحتشمة",

    // Hero Section
    eid_sale: "تخفيضات العيد والصيف الكبرى • حتى 50٪ خصم",
    embrace_elegance: "تألقي بالجمال والأناقة",
    hero_description: "اكتشفي مجموعاتنا الممتازة من العبايات المحتشمة، أطقم الكتان، معاطف الجينز، والأحذية المصممة لأسلوب الحياة العصري في السعودية.",
    shop_abayas: "تسوق العبايات",
    view_terno_sets: "عرض أطقم التيرنو",
    flash_sales_active: "تخفيضات فلاش نشطة الآن!",
    flash_sales_sub: "اطلب مع خدمة الدفع عند الاستلام (COD) في أي مكان بالمملكة. بعض المنتجات تحتوي على أسعار خاصة لمجموعة 12 قطعة. انقر على أي منتج أدناه لمعرفة التفاصيل!",
    instant_wa_forwarding: "⚡ إرسال فوري إلى واتساب",

    // Explorer Section
    filter_by_collection: "تصفية حسب المجموعة:",
    explore_all_designs: "استكشف جميع التصاميم",
    items: "منتجات",
    explore_sub: "أزياء محتشمة، مجموعات تيرنو، ملابس نوم وأحذية فاخرة",
    sort_by: "ترتيب حسب:",
    new_arrivals: "وصلنا حديثاً",
    price_low_high: "السعر: من الأقل إلى الأعلى",
    price_high_low: "السعر: من الأعلى إلى الأقل",
    no_match_found: "لم يتم العثور على نتائج",
    no_match_sub: "لم نتمكن من العثور على أي منتجات مطابقة لطلبك. امسح الفلاتر أو جرب مجموعة أخرى.",
    clear_all_filters: "مسح جميع الفلاتر",

    // Brand Features
    cod_title: "الدفع عند الاستلام (COD)",
    cod_desc: "لا حاجة للدفع عبر الإنترنت! افحص وتحقق من طردك قبل الدفع لوكيل التوصيل.",
    live_gps_title: "تحديد الموقع المباشر عبر GPS",
    live_gps_desc: "شارك إحداثيات موقعك الجغرافي المباشر عند الدفع لضمان التوصيل السريع والمباشر إلى باب منزلك.",
    wa_synced_title: "متزامن مع واتساب",
    wa_synced_desc: "تلقي تحديثات حالة الطلب الديناميكية وتفاصيل الطرد وتنبيهات التتبع مباشرة على محادثة واتساب الخاصة بك.",

    // Reviews
    trusted_by_thousands: "موضع ثقة الآلاف في المملكة العربية السعودية",
    what_customers_say: "ماذا يقول عملاؤنا",

    // Facebook Trust Section
    visit_facebook: "قم بزيارة صفحتنا على فيسبوك",
    fb_trust_title: "متجر موثوق 100٪ على فيسبوك",
    fb_trust_desc: "نحن بوتيك عريق على فيسبوك نخدم آلاف العملاء الفلبينيين والمقيمين المحليين السعداء في جميع أنحاء المملكة العربية السعودية بملابس راقية ودعم مخصص.",
    fb_view_page: "تصفح صفحتنا على فيسبوك",
    fb_reviews: "اقرأ آراء العملاء وشاهد صوراً حقيقية للمنتجات",
    fb_followers: "أكثر من 12,000+ متابع",

    // Checkout / Map Section
    select_delivery_pin: "حدد موقع التوصيل على الخريطة",
    map_instruction_text: "اسحب العلامة أو اضغط في أي مكان على الخريطة لتحديد عنوان الشحن الدقيق الخاص بك أو تحديد موقعك المباشر",
    pin_live_location: "تحديد الموقع المباشر",
    reset_to_riyadh: "إعادة التعيين للرياض",
    coordinate_status: "حالة دبوس الإحداثيات:",
    location_pin_required: "🔴 مطلوب تحديد موقع التوصيل",
    location_pin_saved: "🟢 خط العرض: {lat}، خط الطول: {lng}",
    locating: "جاري تحديد الموقع...",
    tap_map_helper: "👇 اضغط على الخريطة لتحديد موقعك",
    contact_info: "معلومات الاتصال",
    your_full_name: "الاسم الكامل",
    whatsapp_number: "رقم الواتساب (مثال: 96650xxxxxxx)",
    shipping_details: "تفاصيل الشحن",
    select_city_district: "اختر المدينة / الحي",
    custom_address_landmark: "العنوان بالكامل أو معلم مميز قريب",
    order_notes_optional: "ملاحظات الطلب (اختياري / المقاسات المطلوبة)",
    order_summary: "ملخص الطلب",
    apply_coupon: "تطبيق الكوبون",
    enter_coupon_code: "أدخل رمز الكوبون",
    subtotal: "المجموع الفرعي",
    discount: "الخصم",
    delivery: "التوصيل",
    free: "مجاني",
    total: "المجموع الإجمالي",
    send_order_whatsapp: "تأكيد الطلب",
    order_details_whatsapp_notice: "سيتم إرسال تفاصيل الطلب إلى الواتساب الخاص بك",
    back_to_cart: "العودة إلى السلة",
    delivery_warning_map: "⚠️ يرجى تحديد موقع التوصيل على الخريطة أولاً للمتابعة.",
    order_success: "تم إرسال طلبك بنجاح!",

    // Category Names
    dresses: "فساتين",
    abaya: "عبايات",
    terno: "طقم تيرنو",
    denim: "جينز",
    shoes: "أحذية",
    "t-shirts": "تيشيرتات",
    "night-wear": "ملابس نوم",
    luggage: "حقائب سفر",
    "combo-pack": "حزمة كومبو",
    cosmetics: "مستحضرات تجميل",
    watch: "ساعات",

    // Cart Drawer
    my_shopping_cart: "سلة التسوق الخاصة بي",
    cart_empty: "سلتك فارغة حالياً",
    add_items_to_cart: "أضف منتجات راقية إلى سلتك لبدء طلبك.",
    continue_shopping: "مواصلة التسوق",
    item_removed: "تمت إزالة المنتج من السلة",
    qty: "الكمية",
    checkout: "إتمام الطلب",
    best_seller: "الأكثر مبيعاً",
    limited_stock: "الكمية المتبقية محدودة للغاية!",

    // Product Details / Ops
    buy_now: "شراء الآن",
    add_to_cart: "إضافة إلى السلة",
    colors: "الألوان المتاحة",
    sizes: "المقاسات المتاحة",
    packages: "اختر نوع الباقة",
    single_piece: "قطعة واحدة فريدة",
    related_products: "منتجات ذات صلة قد تعجبك",
    load_more: "عرض المزيد من التصاميم",
    explore_products: "استكشف المنتجات",
    trending_now: "الأكثر رواجاً الآن"
  },
  fil: {
    // Header
    free_delivery_banner: "LIBRENG DELIBER PARA SA MARAMIHANG ORDER SA BUONG SAUDI ARABIA!",
    riyadh_ksa: "Riyadh, KSA",
    whatsapp_support: "Suporta sa Order sa WhatsApp",
    home: "Tahanan",
    product: "Produkto",
    collections: "Koleksyon",
    all_arrivals: "Lahat ng Dating",
    my_cart: "Aking Cart",
    admin: "Admin",
    storefront: "Storefront",
    luxury_sub: "SAUDI ARABIA • LUXURY MODEST FASHION",

    // Hero Section
    eid_sale: "EID & TAG-INIT MEGA SALE • HANGGANG 50% OFF",
    embrace_elegance: "YAKAPIN ANG KAGANDAHAN",
    hero_description: "Tuklasin ang aming mga premium na koleksyon ng mga disenteng abaya, linen terno set, denim coat, at sapatos na angkop para sa modernong pamumuhay sa Saudi Arabia.",
    shop_abayas: "Bumili ng mga Abaya",
    view_terno_sets: "Tingnan ang Terno Sets",
    flash_sales_active: "AKTIBO ANG MGA FLASH SALE!",
    flash_sales_sub: "Mag-order gamit ang Cash on Delivery (COD) kahit saan sa KSA. Ang ilang mga aytem ay may espesyal na presyo para sa 12pcs combo. I-click ang anumang produkto sa ibaba para makita ang mga opsyon!",
    instant_wa_forwarding: "⚡ MABILIS NA PAGPAPADALA SA WHATSAPP",

    // Explorer Section
    filter_by_collection: "I-filter ayon sa Koleksyon:",
    explore_all_designs: "TUKLASIN ANG LAHAT NG DISENYO",
    items: "Mga Aytem",
    explore_sub: "Disenteng pananamit, terno combo, damit pangtulog at mga luhong sapatos",
    sort_by: "I-sort ayon sa:",
    new_arrivals: "Mga Bagong Dating",
    price_low_high: "Presyo: Mababa hanggang Mataas",
    price_high_low: "Presyo: Mataas hanggang Mababa",
    no_match_found: "Walang Nahanap na Tugma",
    no_match_sub: "Hindi kami nakahanap ng mga produkto na tumutugma sa iyong query. I-clear ang search o subukan ang ibang kategorya.",
    clear_all_filters: "I-clear ang Lahat ng Filter",

    // Brand Features
    cod_title: "CASH ON DELIVERY (COD)",
    cod_desc: "Walang online na pagbabayad! Suriin at i-verify ang iyong package bago magbayad sa nagdedeliber.",
    live_gps_title: "LIVE NA GPS ROUTING",
    live_gps_desc: "Ibahagi ang iyong eksaktong live na lokasyon sa mapa sa checkout para masiguro ang mabilis na pagdeliber sa iyong pintuan.",
    wa_synced_title: "NAKA-SYNC SA WHATSAPP",
    wa_synced_desc: "Makatanggap ng dinamikong status ng order, mga detalye ng package, at alerto sa pagsubaybay nang direkta sa iyong WhatsApp chat.",

    // Reviews
    trusted_by_thousands: "PINAGKAKATIWALAAN NG LIBO-LIBO SA SAUDI ARABIA",
    what_customers_say: "ANG SINASABI NG AMING MGA CUSTOMER",

    // Facebook Trust Section
    visit_facebook: "BISITAHIN ANG AMING FACEBOOK PAGE",
    fb_trust_title: "100% Pinagkakatiwalaang Tindahan sa Facebook",
    fb_trust_desc: "Kami ay isang kilalang boutique sa Facebook na naglilingkod sa libu-libong masasayang Pilipino at lokal na residente sa buong Saudi Arabia na may mga de-kalidad na kasuotan at maaasahang suporta.",
    fb_view_page: "Tingnan ang Aming Facebook Page",
    fb_reviews: "Basahin ang Feedback ng Customer at mga Totoong Larawan",
    fb_followers: "12,000+ Followers",

    // Checkout / Map Section
    select_delivery_pin: "Piliin ang Lokasyon ng Pin para sa Deliberi",
    map_instruction_text: "Drag the marker or tap anywhere on the map to pin your precise shipping address or Pin Live location",
    pin_live_location: "I-pin ang Live na Lokasyon",
    reset_to_riyadh: "I-reset sa Riyadh",
    coordinate_status: "Status ng Coordinate Pin:",
    location_pin_required: "🔴 Kailangan ang Pin ng Lokasyon",
    location_pin_saved: "🟢 Lat: {lat}, Lng: {lng}",
    locating: "Kinukuha ang lokasyon...",
    tap_map_helper: "👇 I-tap ang mapa para i-pin ang iyong lokasyon",
    contact_info: "Impormasyon sa Pakikipag-ugnayan",
    your_full_name: "Iyong Buong Pangalan",
    whatsapp_number: "Numero sa WhatsApp (hal. 96650xxxxxxx)",
    shipping_details: "Mga Detalye ng Pagpapadala",
    select_city_district: "Piliin ang Lungsod / Distrito",
    custom_address_landmark: "Address ng Kalye / Kalapit na Landmark",
    order_notes_optional: "Mga Tala sa Order (Opsyonal / Mga laki o sukat)",
    order_summary: "Buod ng Order",
    apply_coupon: "Ilapat ang Coupon",
    enter_coupon_code: "Ilagay ang coupon code",
    subtotal: "Subtotal",
    discount: "Discount",
    delivery: "Deliberi",
    free: "LIBRENG",
    total: "Kabuuan",
    send_order_whatsapp: "Kumpirmahin ang Order",
    order_details_whatsapp_notice: "Ang mga detalye ng order ay ipadadala sa iyong WhatsApp",
    back_to_cart: "Bumalik sa Cart",
    delivery_warning_map: "⚠️ Mangyaring i-pin ang iyong lokasyon sa mapa upang magpatuloy.",
    order_success: "Matagumpay na naipadala ang iyong Order!",

    // Category Names
    dresses: "Mga Damit",
    abaya: "Abaya",
    terno: "Terno",
    denim: "Denim",
    shoes: "Mga Sapatos",
    "t-shirts": "Mga T-Shirt",
    "night-wear": "Pangtulog",
    luggage: "Bagahe",
    "combo-pack": "Combo Pack",
    cosmetics: "Kosmetiko",
    watch: "Relo",

    // Cart Drawer
    my_shopping_cart: "Aking Shopping Cart",
    cart_empty: "Walang laman ang iyong cart",
    add_items_to_cart: "Magdagdag ng mga premium na disenteng kasuotan sa iyong cart upang simulan ang iyong order.",
    continue_shopping: "Ipagpatuloy ang Pamimili",
    item_removed: "Inalis ang aytem sa cart",
    qty: "Dami",
    checkout: "Mag-checkout",
    best_seller: "PINAKAMAHUSAY NA SELLER",
    limited_stock: "Limitadong Stock na Lamang!",

    // Product Details / Ops
    buy_now: "Bumili Ngayon",
    add_to_cart: "Idagdag sa Cart",
    colors: "Mga Kulay na Available",
    sizes: "Mga Sukat na Available",
    packages: "Piliin ang Estilo ng Package",
    single_piece: "Isang Piraso Lamang",
    related_products: "Mga Kaugnay na Produkto na Maaari Mong Magustuhan",
    load_more: "Tingnan ang Iba pa",
    explore_products: "I-explore ang mga Produkto",
    trending_now: "Trending Ngayon"
  }
};

type LanguageListener = () => void;
let languageListeners: LanguageListener[] = [];
let currentLanguage: Language = "en";

if (typeof window !== "undefined") {
  try {
    const saved = safeStorage.getItem("kabayan_lang");
    if (saved === "en" || saved === "ar" || saved === "fil") {
      currentLanguage = saved;
    } else {
      // Detect browser/device default language
      const browserLang = navigator.language || (navigator as any).userLanguage || "";
      const lower = browserLang.toLowerCase();
      if (lower.startsWith("ar")) {
        currentLanguage = "ar";
      } else if (lower.startsWith("fil") || lower.startsWith("tl")) {
        currentLanguage = "fil";
      } else {
        currentLanguage = "en";
      }
      safeStorage.setItem("kabayan_lang", currentLanguage);
    }
  } catch (e) {
    console.error(e);
  }
}

function notifyLanguageChange() {
  languageListeners.forEach((l) => l());
  if (typeof window !== "undefined") {
    safeStorage.setItem("kabayan_lang", currentLanguage);
  }
}

export const languageStore = {
  getLanguage(): Language {
    return currentLanguage;
  },
  
  setLanguage(lang: Language) {
    if (currentLanguage !== lang) {
      currentLanguage = lang;
      notifyLanguageChange();
    }
  },

  subscribe(listener: LanguageListener) {
    languageListeners.push(listener);
    return () => {
      languageListeners = languageListeners.filter((l) => l !== listener);
    };
  },

  translate(key: string, params?: Record<string, string | number>): string {
    const dict = (translations[currentLanguage] || translations["en"]) as Record<string, string>;
    const defaultDict = translations["en"] as Record<string, string>;
    let text = dict[key] || defaultDict[key] || String(key);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  }
};

export function useLanguage() {
  const [lang, setLang] = useState<Language>(languageStore.getLanguage());

  useEffect(() => {
    const unsubscribe = languageStore.subscribe(() => {
      setLang(languageStore.getLanguage());
    });
    return unsubscribe;
  }, []);

  const t = (key: string, params?: Record<string, string | number>) => {
    return languageStore.translate(key, params);
  };

  return {
    lang,
    setLang: languageStore.setLanguage,
    t
  };
}
