"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  ShoppingBag, Search, Sparkles, Star, ChevronLeft, ChevronRight,
  MapPin, Phone, Heart, ArrowRight, ShieldCheck, Instagram, Mail, Info, RefreshCw,
  MessageCircle, Facebook, ThumbsUp, ExternalLink, CheckCircle, X, MessageSquare, ShieldAlert
} from "lucide-react";
import Header from "./Header";
import ProductCard from "./ProductCard";
import CartDrawer from "./CartDrawer";
import { Product, Category, DeliveryArea, Coupon, ShopSettings } from "../types";
import { useCart } from "../lib/cartStore";
import { safeStorage } from "../lib/safeStorage";
import { useLanguage } from "../lib/translationStore";
import { initMetaPixel } from "../lib/metaPixel";
import { getOptimizedImageUrl } from "../lib/imageOptimizer";

const AdminPanel = dynamic(() => import("./AdminPanel"), { ssr: false });
const ProductDetailsModal = dynamic(() => import("./ProductDetailsModal"), { ssr: false });
const CheckoutModal = dynamic(() => import("./CheckoutModal"), { ssr: false });

const FallbackLoading = () => (
  <div className="w-full py-24 flex items-center justify-center bg-transparent">
    <div className="text-center space-y-4">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin mx-auto" />
        <Sparkles className="w-4 h-4 text-amber-400 absolute inset-0 m-auto animate-pulse" />
      </div>
    </div>
  </div>
);

const API_URL = (() => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl + "/api";
  }
  const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
    if (isIp) {
      return `http://${hostname}:5000/api`;
    }
    return "/api";
  }
  return (envUrl || "http://localhost:5000") + "/api";
})();

interface AppClientProps {
  initialRoute?: string;
  initialCategory?: string;
  initialSlug?: string;
}

export default function AppClient({ initialRoute = "/", initialCategory = "", initialSlug = "" }: AppClientProps) {
  const router = useRouter();
  const { items, subtotal } = useCart();
  const { lang, t } = useLanguage();

  const getCategoryName = (cat: Category) => {
    const keyTrans = t(cat.slug);
    if (keyTrans !== cat.slug) return keyTrans;

    const slugKey = cat.slug.toLowerCase().trim();
    const fallbackMap: Record<string, Record<string, string>> = {
      ar: {
        "bra-panty": "ملابس داخلية",
        "tops": "بلايز",
        "skirts": "تنانير",
        "pants": "بنطلونات",
        "jackets": "جاكيتات",
        "coats": "معاطف",
        "jeans": "جينز",
        "accessories": "إكسسوارات",
        "bags": "حقائب",
        "socks": "جوارب"
      },
      fil: {
        "bra-panty": "Bra at Panty",
        "tops": "Tops",
        "skirts": "Palda",
        "pants": "Pantalon",
        "jackets": "Jacket",
        "coats": "Kapa",
        "jeans": "Jeans",
        "accessories": "Aksesorya",
        "bags": "Mga Bag",
        "socks": "Medyas"
      }
    };

    if (lang === "ar" && fallbackMap.ar[slugKey]) return fallbackMap.ar[slugKey];
    if (lang === "fil" && fallbackMap.fil[slugKey]) return fallbackMap.fil[slugKey];

    return cat.name;
  };

  // Helper to parse cached storefront data for 0ms initial render
  const getCachedStorefrontData = () => {
    try {
      const cachedProds = safeStorage.getItem("kabayan_cached_products");
      const cachedCats = safeStorage.getItem("kabayan_cached_categories");
      const cachedAreas = safeStorage.getItem("kabayan_cached_areas");
      const cachedSettings = safeStorage.getItem("kabayan_cached_settings");

      if (cachedProds && cachedCats && cachedAreas && cachedSettings) {
        return {
          products: JSON.parse(cachedProds),
          categories: JSON.parse(cachedCats),
          areas: JSON.parse(cachedAreas),
          settings: JSON.parse(cachedSettings),
          hasCache: true
        };
      }
    } catch (err) {
      console.error("Failed to parse cached storefront files:", err);
    }
    return { hasCache: false };
  };

  const cached = getCachedStorefrontData();

  // Core API State (Initialized from local storage cache for 0ms loads)
  const [products, setProducts] = useState<Product[]>(cached.products || []);
  const [categories, setCategories] = useState<Category[]>(cached.categories || []);
  const [areas, setAreas] = useState<DeliveryArea[]>(cached.areas || []);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(cached.settings || {
    shopName: "Kabayan Shop Saudi",
    whatsappContact: "966501234567",
    currency: "SAR",
    bannerImages: []
  });

  const [loading, setLoading] = useState(!cached.hasCache);

  // Filter & Search State
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || "");
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high">("newest");

  // Interaction UI Toggles
  const [isCartOpen, setIsCartOpen] = useState(initialRoute === "/cart");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(initialRoute === "/admin");
  const [isMessengerChatOpen, setIsMessengerChatOpen] = useState(false);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);

  // Catalog pagination and page tracking states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(false);
  const [totalProductsCount, setTotalProductsCount] = useState(0);

  // Client-side Wishlist persistence
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Hero slideshow index
  const [currentHeroIdx, setCurrentHeroIdx] = useState(0);

  // Waking up server status states
  const [showWakingUpText, setShowWakingUpText] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  // Fetch all core resources with automated retry loops
  const fetchAllData = async (retryCount = 0, page = 1, isLoadMore = false) => {
    try {
      setConnectionError(false);

      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", "12");
      if (selectedCategory) params.append("category", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);

      const isInitialRequest = page === 1 && !isLoadMore;

      let productsData;
      let categoriesData = categories;
      let areasData = areas;
      let settingsData = settings;

      if (isInitialRequest) {
        // Attempt to load settings, categories, and areas from localStorage cache for instant visual render
        const cachedCats = safeStorage.getItem("kabayan_cached_categories");
        const cachedAreas = safeStorage.getItem("kabayan_cached_areas");
        const cachedSettings = safeStorage.getItem("kabayan_cached_settings");

        if (cachedCats) setCategories(JSON.parse(cachedCats));
        if (cachedAreas) setAreas(JSON.parse(cachedAreas));
        if (cachedSettings) setSettings(JSON.parse(cachedSettings));

        const initRes = await fetch(`${API_URL}/storefront/init?${params.toString()}`);
        if (!initRes.ok) {
          throw new Error("Failed to load storefront data resources");
        }

        const initData = await initRes.json();
        productsData = initData;
        categoriesData = initData.categories;
        areasData = initData.areas;
        settingsData = initData.settings;

        setCategories(categoriesData);
        setAreas(areasData);
        setSettings(settingsData);

        // Preload the next hero image in the background for instant transitions
        if (settingsData.bannerImages && settingsData.bannerImages.length > 1) {
          const nextImg = new Image();
          nextImg.src = getOptimizedImageUrl(settingsData.bannerImages[1], window.innerWidth < 640 ? 600 : 1200);
        }
      } else {
        const prodRes = await fetch(`${API_URL}/products?${params.toString()}`);
        if (!prodRes.ok) {
          throw new Error("Failed to load product page");
        }
        productsData = await prodRes.json();
      }

      // If loading next page, append; otherwise overwrite
      if (isLoadMore) {
        setProducts(prev => {
          const ids = new Set(prev.map(p => p.id));
          const fresh = productsData.products.filter((p: Product) => !ids.has(p.id));
          return [...prev, ...fresh];
        });
      } else {
        setProducts(productsData.products);
      }

      setCurrentPage(productsData.page);
      setHasMoreProducts(productsData.hasMore);
      setTotalProductsCount(productsData.total);

      // Persist the resolved data back to local cache for instant load next time (only cache homepage page-1)
      if (isInitialRequest && !selectedCategory && !searchQuery) {
        try {
          safeStorage.setItem("kabayan_cached_products", JSON.stringify(productsData.products));
          safeStorage.setItem("kabayan_cached_categories", JSON.stringify(categoriesData));
          safeStorage.setItem("kabayan_cached_areas", JSON.stringify(areasData));
          safeStorage.setItem("kabayan_cached_settings", JSON.stringify(settingsData));
        } catch (err) {
          console.error("Failed to write layout configurations to cache:", err);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error(`Storefront fetch attempt ${retryCount + 1} failed:`, error);
      
      // Auto-retry up to 5 times
      if (retryCount < 5) {
        setTimeout(() => {
          fetchAllData(retryCount + 1, page, isLoadMore);
        }, 3000);
      } else {
        if (products.length > 0) {
          setLoading(false);
        } else {
          setConnectionError(true);
          setLoading(false);
        }
      }
    }
  };

  // Fetch full unpaginated product list for admin panel
  const fetchAdminProducts = async () => {
    try {
      const response = await fetch(API_URL + "/products?admin=true");
      if (response.ok) {
        const fullProducts = await response.json();
        setProducts(fullProducts);
      }
    } catch (err) {
      console.error("Failed to load admin products:", err);
    }
  };

  useEffect(() => {
    // Silent pre-warming ping to separate Express server
    fetch(API_URL.replace("/api", "")).catch(() => {});

    const path = typeof window !== "undefined" ? window.location.pathname : initialRoute;
    if (path === "/admin") {
      fetchAdminProducts();
    } else {
      fetchAllData(0, 1, false);
    }

    // Load wishlist
    try {
      const savedWish = safeStorage.getItem("kabayan_wishlist");
      if (savedWish) setWishlist(JSON.parse(savedWish));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Monitor loading timer to show helper waking-up alert if it takes long
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowWakingUpText(true);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setShowWakingUpText(false);
    }
  }, [loading]);

  // Initialize Meta Pixel & SEO tags dynamically
  useEffect(() => {
    if (settings) {
      if (settings.metaPixelId) {
        initMetaPixel(settings.metaPixelId);
      }
      
      // Update page titles
      if (settings.metaTitle) {
        document.title = settings.metaTitle;
      } else if (settings.shopName) {
        document.title = settings.shopName;
      }
      
      // Update meta tags
      if (settings.metaDescription) {
        let metaDescEl = document.querySelector('meta[name="description"]');
        if (!metaDescEl) {
          metaDescEl = document.createElement('meta');
          metaDescEl.setAttribute('name', 'description');
          document.head.appendChild(metaDescEl);
        }
        metaDescEl.setAttribute('content', settings.metaDescription);
      }
      
      if (settings.metaKeywords) {
        let metaKeyEl = document.querySelector('meta[name="keywords"]');
        if (!metaKeyEl) {
          metaKeyEl = document.createElement('meta');
          metaKeyEl.setAttribute('name', 'keywords');
          document.head.appendChild(metaKeyEl);
        }
        metaKeyEl.setAttribute('content', settings.metaKeywords);
      }
    }
  }, [settings]);


  // Slide rotation interval
  useEffect(() => {
    if (settings.bannerImages && settings.bannerImages.length > 0) {
      const timer = setInterval(() => {
        setCurrentHeroIdx((prev) => (prev + 1) % settings.bannerImages.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [settings.bannerImages]);

  // Smooth scroll to product grid on filter change
  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }
    if (!isAdminMode) {
      const element = document.getElementById("all-products-section");
      if (element) {
        const headerOffset = 130; // offset for sticky header
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + (window.scrollY || window.pageYOffset) - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    }
  }, [selectedCategory, searchQuery]);

  // Navigation handlers with clean SPA URL path synchronisation
  const handleSetSelectedCategory = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    setSearchQuery("");
    setIsCartOpen(false);
    setIsAdminMode(false);
    if (categorySlug) {
      window.history.pushState(null, "", `/collections/${categorySlug}`);
    } else {
      window.history.pushState(null, "", `/collections`);
    }
  };

  const handleSetSearchQuery = (query: string) => {
    setSearchQuery(query);
    if (query) {
      window.history.pushState(null, "", `/search?q=${encodeURIComponent(query)}`);
    } else {
      window.history.pushState(null, "", "/");
    }
  };

  const handleOpenCart = () => {
    setIsCartOpen(true);
    setIsAdminMode(false);
    window.history.pushState(null, "", "/cart");
  };

  const handleCloseCart = () => {
    setIsCartOpen(false);
    if (selectedCategory) {
      window.history.pushState(null, "", `/collections/${selectedCategory}`);
    } else if (window.location.pathname === "/product") {
      window.history.pushState(null, "", "/product");
    } else {
      window.history.pushState(null, "", "/");
    }
  };

  const handleOpenAdmin = () => {
    setIsAdminMode(true);
    setIsCartOpen(false);
    fetchAdminProducts();
    window.history.pushState(null, "", "/admin");
  };

  const handleExitAdmin = () => {
    setIsAdminMode(false);
    fetchAllData(0, 1, false);
    window.history.pushState(null, "", "/");
  };

  const handleGoHome = () => {
    setSelectedCategory("");
    setSearchQuery("");
    setSelectedProduct(null);
    setIsCartOpen(false);
    setIsAdminMode(false);
    window.history.pushState(null, "", "/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGoToProduct = () => {
    setSelectedCategory("");
    setSearchQuery("");
    setSelectedProduct(null);
    setIsCartOpen(false);
    setIsAdminMode(false);
    window.history.pushState(null, "", "/product");

    setTimeout(() => {
      const element = document.getElementById("all-products-section");
      if (element) {
        const headerOffset = 130;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + (window.scrollY || window.pageYOffset) - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    }, 100);
  };

  // Parse route on mount / back-forward navigation
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname;
      if (path === "/admin") {
        setIsAdminMode(true);
        setIsCartOpen(false);
        setSelectedProduct(null);
        fetchAdminProducts();
      } else if (path === "/cart") {
        setIsCartOpen(true);
        setIsAdminMode(false);
        setSelectedProduct(null);
      } else if (path.startsWith("/collections/")) {
        const cat = path.replace("/collections/", "");
        setSelectedCategory(cat);
        setIsCartOpen(false);
        setIsAdminMode(false);
        setSelectedProduct(null);
      } else if (path === "/collections") {
        setSelectedCategory("");
        setIsCartOpen(false);
        setIsAdminMode(false);
        setSelectedProduct(null);
        setTimeout(() => {
          const element = document.getElementById("all-products-section");
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }, 500);
      } else if (path.startsWith("/product/")) {
        const slug = path.replace("/product/", "");
        const prod = products.find(p => p.slug === slug);
        if (prod) {
          setSelectedProduct(prod);
        } else {
          // Fetch from server if not loaded yet
          fetch(`${API_URL}/products/slug/${slug}`)
            .then(res => {
              if (!res.ok) throw new Error("Product not found");
              return res.json();
            })
            .then(data => {
              if (data && !data.error) {
                setSelectedProduct(data);
              }
            })
            .catch(err => console.error("Router failed to fetch product:", err));
        }
        setIsCartOpen(false);
        setIsAdminMode(false);
      } else if (path === "/product") {
        setSelectedCategory("");
        setSelectedProduct(null);
        setIsCartOpen(false);
        setIsAdminMode(false);
        setTimeout(() => {
          const element = document.getElementById("all-products-section");
          if (element) {
            const headerOffset = 130;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + (window.scrollY || window.pageYOffset) - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: "smooth" });
          }
        }, 500);
      } else if (path.startsWith("/search")) {
        const searchParams = new URLSearchParams(window.location.search);
        const query = searchParams.get("q") || "";
        setSearchQuery(query);
        setIsCartOpen(false);
        setIsAdminMode(false);
        setSelectedProduct(null);
      } else {
        // Root path "/"
        setSelectedCategory("");
        setSearchQuery("");
        setIsCartOpen(false);
        setIsAdminMode(false);
        setSelectedProduct(null);
      }
    };

    if (!loading) {
      handleUrlRoute();
    }

    const handlePopState = () => {
      handleUrlRoute();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [loading, products]);

  // Handle URL change search or category queries reloading
  useEffect(() => {
    if (!isFirstRender) {
      setLoading(true);
      fetchAllData(0, 1, false);
    } else {
      setIsFirstRender(false);
    }
  }, [selectedCategory, searchQuery]);

  // Reset window scroll position to top when a product details card opens or changes
  useEffect(() => {
    if (selectedProduct) {
      window.scrollTo({ top: 0, behavior: "instant" as any });
    }
  }, [selectedProduct]);

  // Handle wishlist toggle
  const toggleWishlist = (prodId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated;
    if (wishlist.includes(prodId)) {
      updated = wishlist.filter(id => id !== prodId);
    } else {
      updated = [...wishlist, prodId];
    }
    setWishlist(updated);
    try {
      safeStorage.setItem("kabayan_wishlist", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Filter & Sort Products (Category and Search filter are executed server-side)
  const filteredProducts = products.filter((prod) => {
    return prod.status === "active";
  });

  // Sort (Trending products pinned to the top first, then sorted by selection)
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (a.isTrending && !b.isTrending) return -1;
    if (!a.isTrending && b.isTrending) return 1;
 
    const aPrice = a.offerPrice !== undefined ? a.offerPrice : a.price;
    const bPrice = b.offerPrice !== undefined ? b.offerPrice : b.price;
 
    if (sortBy === "price-low") return aPrice - bPrice;
    if (sortBy === "price-high") return bPrice - aPrice;
 
    // Default: newest
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (loading && products.length === 0 && categories.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-sm mx-auto">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin mx-auto" />
            <Sparkles className="w-6 h-6 text-amber-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-widest font-sans uppercase">
              Loading Premium Fashion...
            </h1>
            <p className="text-xs text-neutral-500 font-mono">KABAYAN SHOP SAUDI</p>
          </div>
          {showWakingUpText && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center space-y-2 animate-fade-in">
              <p className="text-[11px] text-amber-400 font-bold uppercase tracking-wider animate-pulse">
                ⚡ Waking up the server
              </p>
              <p className="text-[10px] text-neutral-400 leading-relaxed">
                Free hosting servers take up to 25s to spin up from sleep. The shop will load automatically once active. Thank you!
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-sm mx-auto">
          <div className="bg-red-500/10 text-red-500 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto border border-red-500/25">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-bold tracking-widest font-sans uppercase">
              Connection Failed
            </h1>
            <p className="text-xs text-neutral-500 leading-relaxed">
              We couldn't connect to our servers to load the fashion catalog. Please check your internet connection and try again.
            </p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              setConnectionError(false);
              fetchAllData(0);
            }}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs uppercase py-3 rounded-full transition-all tracking-wider cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-between selection:bg-amber-400 selection:text-black overflow-x-hidden w-full max-w-full">

      {/* 1. Brand Header */}
      <Header
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={handleSetSelectedCategory}
        searchQuery={searchQuery}
        setSearchQuery={handleSetSearchQuery}
        onOpenCart={handleOpenCart}
        onOpenAdmin={handleOpenAdmin}
        isAdminMode={isAdminMode}
        onExitAdmin={handleExitAdmin}
        onGoHome={handleGoHome}
        onGoToProduct={handleGoToProduct}
      />

      {/* 2. Main Workspace Layout */}
      <main className="flex-grow">
        {isAdminMode ? (
          /* Render full Operations dashboard screen */
          <Suspense fallback={<FallbackLoading />}>
            <AdminPanel
              products={products}
              categories={categories}
              areas={areas}
              coupons={coupons}
              settings={settings}
              onRefreshAll={fetchAllData}
            />
          </Suspense>
        ) : selectedProduct ? (
          /* Render dedicated full-page Product detail page */
          <Suspense fallback={<FallbackLoading />}>
            <ProductDetailsModal
              product={selectedProduct}
              allProducts={products}
              onClose={() => {
                setSelectedProduct(null);
                window.history.pushState(null, "", "/");
              }}
              onAddToCartSuccess={() => {
                // Do not close the modal, allowing customer to keep selecting/buying
              }}
              onBuyNowSuccess={() => {
                setSelectedProduct(null);
                window.history.pushState(null, "", "/");
                setIsCheckoutOpen(true);
              }}
              onSelectRelated={(prod) => {
                setSelectedProduct(prod);
                window.history.pushState(null, "", `/product/${prod.slug}`);
              }}
              isFullPage={true}
            />
          </Suspense>
        ) : (
          /* Render Customer-facing shop website storefront */
          <div className="space-y-12 pb-16 md:pb-24">

            {/* A. Dynamic Promo Banner Hero Section */}
            {settings.bannerImages && settings.bannerImages.length > 0 && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
                <section className="relative w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/8] bg-black overflow-hidden shadow-lg rounded-2xl min-h-[320px] sm:min-h-0">
                  <img
                    src={getOptimizedImageUrl(settings.bannerImages[currentHeroIdx], window.innerWidth < 640 ? 600 : 1200)}
                    alt="Shop Luxury Banner"
                    referrerPolicy="no-referrer"
                    fetchPriority="high"
                    className="absolute inset-0 w-full h-full object-cover object-center brightness-50 transition-all duration-1000"
                  />

                  {/* Text overlays */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent flex items-center px-4 sm:px-12 md:px-20">
                    <div className="max-w-xl space-y-3 sm:space-y-4">
                      <span className="inline-flex items-center gap-1.5 bg-amber-400 text-black text-[9px] sm:text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm animate-pulse shadow-md">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t("eid_sale")}</span>
                      </span>
                      <h2 className="text-2xl sm:text-3.5xl md:text-5xl font-black text-white tracking-tight leading-tight uppercase font-sans">
                        {t("embrace_elegance")}
                      </h2>
                      <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-light font-sans max-w-md">
                        {t("hero_description")}
                      </p>
                      <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
                        <button
                          onClick={() => handleGoToProduct()}
                          className="relative overflow-hidden bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest px-8 py-3.5 rounded-full transition-all duration-300 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-105 active:scale-95 flex items-center gap-2 group cursor-pointer border border-amber-400/20 shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:shadow-[0_0_25px_rgba(245,158,11,0.7)]"
                        >
                          <Sparkles className="w-4 h-4 text-black shrink-0 animate-pulse" />
                          <span>{t("explore_products")}</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Prev/Next Slides navigation buttons */}
                  {settings.bannerImages.length > 1 && (
                    <div className="absolute bottom-4 right-4 flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentHeroIdx((prev) => (prev - 1 + settings.bannerImages.length) % settings.bannerImages.length)}
                        className="p-1.5 bg-black/60 hover:bg-amber-400 hover:text-black rounded-full text-white transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[11px] font-mono text-white/80 font-bold bg-black/50 px-2.5 py-0.5 rounded-full">
                        {currentHeroIdx + 1} / {settings.bannerImages.length}
                      </span>
                      <button
                        onClick={() => setCurrentHeroIdx((prev) => (prev + 1) % settings.bannerImages.length)}
                        className="p-1.5 bg-black/60 hover:bg-amber-400 hover:text-black rounded-full text-white transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* B. Flash Sale Promo ticker */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-gradient-to-r from-amber-600 to-amber-500 rounded-2xl p-4 sm:p-6 text-black flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-md">
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-wider font-sans flex items-center gap-2">
                    <Sparkles className="w-5 h-5 fill-current animate-spin" />
                    <span>{t("flash_sales_active")}</span>
                  </h3>
                  <p className="text-xs font-semibold text-black/80 max-w-lg">
                    {t("flash_sales_sub")}
                  </p>
                </div>
                <div className="bg-black text-amber-400 px-5 py-3 rounded-xl font-mono text-xs font-bold text-center border border-amber-400/10 self-start sm:self-center shrink-0">
                  {t("instant_wa_forwarding")}
                </div>
              </div>
            </section>

            {/* C. Product Listing Grid & Sorting */}
            <section id="all-products-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

              {/* Product Filter Section placed down with the products */}
              {categories.length > 0 && (
                <div className="flex flex-col gap-2 border-b border-neutral-100 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 font-mono">
                    {t("filter_by_collection")}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 pb-1">
                    <button
                      onClick={() => handleSetSelectedCategory("")}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border transition cursor-pointer ${selectedCategory === ""
                          ? "bg-neutral-950 text-white border-neutral-950 shadow-sm"
                          : "bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200 hover:text-neutral-900"
                        }`}
                    >
                      {t("all_arrivals")}
                    </button>
                    {(isCategoriesExpanded ? categories : categories.slice(0, 5)).map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleSetSelectedCategory(cat.slug)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border transition cursor-pointer ${selectedCategory.toLowerCase() === cat.slug.toLowerCase()
                            ? "bg-amber-500 text-black border-amber-500 shadow-sm"
                            : "bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200 hover:text-neutral-900"
                          }`}
                      >
                        {getCategoryName(cat)}
                      </button>
                    ))}
                    {categories.length > 5 && (
                      <button
                        onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                        className="px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest border border-dashed border-amber-500/40 text-amber-600 bg-amber-500/5 hover:bg-amber-500/10 transition cursor-pointer flex items-center gap-1"
                      >
                        <span>{isCategoriesExpanded ? "Show Less" : `+ ${categories.length - 5} More`}</span>
                        <svg className={`w-3 h-3 transition-transform ${isCategoriesExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200">
                <div>
                  <h3 className="text-lg font-black uppercase text-neutral-900 tracking-wider flex items-center gap-1.5">
                    {selectedCategory ? (lang === "ar" ? `مجموعة ${t(selectedCategory) !== selectedCategory ? t(selectedCategory) : selectedCategory}` : `${(t(selectedCategory) !== selectedCategory ? t(selectedCategory) : selectedCategory).toUpperCase()} COLLECTION`) : t("explore_all_designs")}
                    <span className="text-xs bg-neutral-900 text-white font-mono px-2 py-0.5 rounded ml-1 font-bold">
                      {sortedProducts.length} {t("items")}
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {t("explore_sub")}
                  </p>
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider font-sans shrink-0">
                    {t("sort_by")}
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-xs font-bold text-neutral-800 focus:outline-none"
                  >
                    <option value="newest">{t("new_arrivals")}</option>
                    <option value="price-low">{t("price_low_high")}</option>
                    <option value="price-high">{t("price_high_low")}</option>
                  </select>
                </div>
              </div>

              {/* Product Catalog Grid */}
              {/* Product Catalog Grid */}
              {loading ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                    {[...Array(8)].map((_, idx) => (
                      <div key={idx} className="bg-white rounded-lg overflow-hidden border border-neutral-200/80 shadow-sm animate-pulse flex flex-col h-full">
                        <div className="aspect-[3/4] bg-neutral-200" />
                        <div className="p-4 flex flex-col flex-grow space-y-3">
                          <div className="h-3 bg-neutral-200 rounded w-1/4" />
                          <div className="h-4 bg-neutral-200 rounded w-3/4" />
                          <div className="h-3 bg-neutral-200 rounded w-1/2" />
                          <div className="h-6 bg-neutral-200 rounded-full w-1/3 mt-auto" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : sortedProducts.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-2xl border border-neutral-200/80 shadow-inner">
                  <div className="bg-neutral-50 p-4 rounded-full inline-block mb-3.5">
                    <Search className="w-10 h-10 text-neutral-300" />
                  </div>
                  <h4 className="text-sm font-bold text-neutral-800 uppercase tracking-widest mb-1">
                    {t("no_match_found")}
                  </h4>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                    {t("no_match_sub")}
                  </p>
                  <button
                    onClick={() => {
                      handleSetSelectedCategory("");
                    }}
                    className="mt-5 bg-black hover:bg-neutral-900 text-white text-xs font-bold uppercase px-5 py-2.5 rounded-full transition"
                  >
                    {t("clear_all_filters")}
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                    {sortedProducts.map((product) => (
                      <div key={product.id} className="relative group">

                        {/* Interactive Product Listing Card */}
                        <ProductCard
                          product={product}
                          onSelect={(prod) => {
                            setSelectedProduct(prod);
                            window.history.pushState(null, "", `/product/${prod.slug}`);
                          }}
                        />

                        {/* Wishlist Heart Icon Toggle Overlay */}
                        <button
                          onClick={(e) => toggleWishlist(product.id, e)}
                          className={`absolute top-2.5 right-2.5 z-20 p-2 rounded-full shadow-md backdrop-blur-xs transition ${wishlist.includes(product.id)
                              ? "bg-amber-400 text-black scale-110"
                              : "bg-white/80 hover:bg-white text-neutral-400 hover:text-red-500 hover:scale-110"
                            }`}
                          title="Add to wishlist"
                        >
                          <Heart className={`w-3.5 h-3.5 ${wishlist.includes(product.id) ? "fill-current" : ""}`} />
                        </button>

                      </div>
                    ))}
                  </div>

                  {hasMoreProducts && (
                    <div className="flex justify-center pt-6">
                      <button
                        onClick={() => fetchAllData(0, currentPage + 1, true)}
                        className="bg-neutral-900 hover:bg-amber-500 hover:text-neutral-950 text-white font-extrabold text-[11px] uppercase tracking-widest px-8 py-3.5 rounded-full transition-all duration-300 shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <span>{t("load_more") || "Load More Designs"}</span>
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

            </section>

            {/* D. Brand Features Row (Icon badges) */}
            <section className="bg-black text-white py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <div className="bg-neutral-800 text-amber-400 p-3.5 rounded-xl">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold uppercase tracking-wider">{t("cod_title")}</h4>
                    <p className="text-xs text-neutral-400 leading-snug">
                      {t("cod_desc")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <div className="bg-neutral-800 text-amber-400 p-3.5 rounded-xl">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold uppercase tracking-wider">{t("live_gps_title")}</h4>
                    <p className="text-xs text-neutral-400 leading-snug">
                      {t("live_gps_desc")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <div className="bg-neutral-800 text-amber-400 p-3.5 rounded-xl">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold uppercase tracking-wider">{t("wa_synced_title")}</h4>
                    <p className="text-xs text-neutral-400 leading-snug">
                      {t("wa_synced_desc")}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* E. Customer Reviews Testimonial Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="text-center space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-amber-600 block">
                  {t("trusted_by_thousands")}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight uppercase">
                  {t("what_customers_say")}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    name: "Mariam Al-Harbi",
                    city: "Riyadh, KSA",
                    review: "The black georgette abaya with gold embroidery is absolutely stunning! High-density linen fabric, perfect length, and the package arrived in Riyadh in just 2 days. Sharing my live location was so easy!",
                    rating: 5
                  },
                  {
                    name: "Amelia Cruz",
                    city: "Jeddah, KSA",
                    review: "Outstanding service! I ordered the 3pcs Cotton Tees Combo pack and a Linen Terno Set. The quality is premium and highly breathable. Will definitely purchase more modest garments for Eid!",
                    rating: 5
                  },
                  {
                    name: "Sarah G.",
                    city: "Dammam, KSA",
                    review: "I love that login is not required to buy. I just selected my city, shared my coordinates, and clicked 'Send order to WhatsApp'. The admin responded instantly and confirmed. Highly recommended!",
                    rating: 5
                  }
                ].map((testimonial, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl border border-neutral-200/70 shadow-sm space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex text-amber-400">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                      <p className="text-xs sm:text-sm text-neutral-600 italic leading-relaxed">
                        "{testimonial.review}"
                      </p>
                    </div>
                    <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900">{testimonial.name}</span>
                      <span className="text-[10px] font-bold text-neutral-400 font-mono uppercase">{testimonial.city}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* F. Facebook Page Trust Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-gradient-to-br from-blue-50 via-white to-amber-50/30 rounded-3xl p-6 sm:p-8 md:p-10 border border-blue-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4 max-w-2xl text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                      <Facebook className="w-3 h-3 fill-current" />
                      <span>{t("visit_facebook")}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-amber-200">
                      <ShieldCheck className="w-3 h-3" />
                      <span>100% VERIFIED</span>
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight uppercase leading-tight">
                    {t("fb_trust_title")}
                  </h3>

                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans font-light">
                    {t("fb_trust_desc")}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-blue-50 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="text-left">
                        <div className="text-[11px] font-bold text-neutral-900 font-mono">12,000+</div>
                        <div className="text-[9px] text-neutral-400 font-medium uppercase font-sans tracking-wider">{t("fb_followers")}</div>
                      </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-blue-50 flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="text-left">
                        <div className="text-[11px] font-bold text-neutral-900 font-mono">100%</div>
                        <div className="text-[9px] text-neutral-400 font-medium uppercase font-sans tracking-wider">Happy Buyers</div>
                      </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-blue-50 flex items-center gap-2 col-span-2 sm:col-span-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                      <div className="text-left">
                        <div className="text-[11px] font-bold text-neutral-900 font-mono">4.9 / 5.0</div>
                        <div className="text-[9px] text-neutral-400 font-medium uppercase font-sans tracking-wider">Page Rating</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 bg-white p-6 rounded-2xl border border-blue-50 shadow-md shadow-blue-500/5 min-w-[260px] w-full md:w-auto">
                  <div className="w-20 h-20 relative shrink-0">
                    <svg viewBox="0 0 200 200" className="w-full h-full rounded-2xl shadow-lg border border-neutral-800" xmlns="http://www.w3.org/2000/svg">
                      {/* Dark blue gradient background */}
                      <defs>
                        <radialGradient id="bg-grad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                          <stop offset="0%" stopColor="#121d33" />
                          <stop offset="100%" stopColor="#050a12" />
                        </radialGradient>
                        <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ffe293" />
                          <stop offset="30%" stopColor="#dca842" />
                          <stop offset="70%" stopColor="#fbf3b9" />
                          <stop offset="100%" stopColor="#b88324" />
                        </linearGradient>
                        <filter id="gold-glow" x="-10%" y="-10%" width="120%" height="120%">
                          <feGaussianBlur stdDeviation="1.2" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>

                      <rect width="200" height="200" rx="16" fill="url(#bg-grad)" />

                      {/* Royal Wreath / Crown Emblem */}
                      <g transform="translate(100, 80) scale(0.85)" filter="url(#gold-glow)">
                        {/* Outer Dotted/Floral Circle */}
                        <circle cx="0" cy="0" r="40" fill="none" stroke="url(#gold-grad)" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.8" />
                        <circle cx="0" cy="0" r="36" fill="none" stroke="url(#gold-grad)" strokeWidth="0.75" />

                        {/* Crown Peak on top */}
                        <path d="M -12 -38 L -6 -48 L 0 -42 L 6 -48 L 12 -38 Z" fill="url(#gold-grad)" />
                        <circle cx="-12" cy="-38" r="2" fill="url(#gold-grad)" />
                        <circle cx="-6" cy="-48" r="2" fill="url(#gold-grad)" />
                        <circle cx="0" cy="-42" r="2" fill="url(#gold-grad)" />
                        <circle cx="6" cy="-48" r="2" fill="url(#gold-grad)" />
                        <circle cx="12" cy="-38" r="2" fill="url(#gold-grad)" />

                        {/* Symmetrical Laurel Leaves / Wreath */}
                        <path d="M -30 0 C -40 -20 -15 -35 -5 -30 C -15 -25 -25 -10 -30 0" fill="url(#gold-grad)" />
                        <path d="M 30 0 C 40 -20 15 -35 5 -30 C 15 -25 25 -10 30 0" fill="url(#gold-grad)" />

                        {/* Elegant Ribbon / Symmetrical Swoosh inside */}
                        <path d="M -25 15 C -10 25 10 25 25 15 C 15 15 -15 15 -25 15" fill="url(#gold-grad)" />

                        {/* Center stylized symbol */}
                        <path d="M -15 5 C -15 -15 -5 -15 -2 -5 L 0 -15 L 2 -5 C 5 -15 15 -15 15 5 C 10 5 5 -5 0 5 C -5 -5 -10 5 -15 5 Z" fill="url(#gold-grad)" />
                        <path d="M -8 10 C -4 5 4 5 8 10 C 4 8 -4 8 -8 10" fill="url(#gold-grad)" />
                      </g>

                      {/* Typography */}
                      <text x="100" y="145" textAnchor="middle" fill="url(#gold-grad)" fontSize="11" fontWeight="bold" fontFamily="Cinzel, Georgia, serif" letterSpacing="1.5">KABAYAN SHOP</text>
                      <line x1="50" y1="156" x2="150" y2="156" stroke="url(#gold-grad)" strokeWidth="0.5" opacity="0.6" />
                      <text x="100" y="172" textAnchor="middle" fill="url(#gold-grad)" fontSize="9" fontWeight="medium" fontFamily="Cinzel, Georgia, serif" letterSpacing="4">SAUDI</text>
                    </svg>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:scale-110 transition-transform duration-200">
                      <Facebook className="w-3 h-3 fill-current" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h4 className="text-sm font-extrabold text-neutral-900 tracking-wide">Kabayan Shop Saudi</h4>
                    <p className="text-[10px] text-neutral-400 font-mono mt-0.5">facebook.com/kabayanshopSaudi1</p>
                  </div>
                  <a
                    href="https://www.facebook.com/kabayanshopSaudi1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-5 rounded-xl flex items-center justify-center gap-2 transition hover:scale-102 hover:shadow-lg hover:shadow-blue-600/10"
                  >
                    <span>{t("fb_view_page")}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <p className="text-[9px] text-neutral-400 text-center font-medium">
                    {t("fb_reviews")}
                  </p>
                </div>
              </div>
            </section>

          </div>
        )}
      </main>

      {/* 3. Shop Footer */}
      {!isAdminMode && (
        <footer className="bg-neutral-900 text-neutral-300 pt-16 pb-8 border-t border-neutral-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">

            {/* Column 1: Store Intro */}
            <div className="space-y-4">
              <h4 className="text-white text-base font-black tracking-widest font-sans uppercase">
                KABAYAN <span className="text-amber-400">SHOP</span>
              </h4>
              <p className="text-xs leading-relaxed text-neutral-400 font-light">
                {settings.aboutUs || "Premium modesty apparel, dresses, terno sets and fine footwear in Riyadh and across Saudi Arabia."}
              </p>
              <div className="flex items-center gap-3 text-neutral-400 pt-1">
                <a href="#wa" className="hover:text-amber-400 transition" title="WhatsApp Customer Line">
                  <Phone className="w-4 h-4" />
                </a>
                <a href="#instagram" className="hover:text-amber-400 transition" title="Instagram Profile">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#mail" className="hover:text-amber-400 transition" title="Email Contact">
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-3 text-xs">
              <h5 className="text-white font-bold uppercase tracking-wider font-mono">Collections</h5>
              <ul className="space-y-1.5 text-neutral-400">
                {categories.slice(0, 5).map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => setSelectedCategory(cat.slug)}
                      className="hover:text-white transition uppercase text-[10px] font-semibold"
                    >
                      {getCategoryName(cat)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Policy Links */}
            <div className="space-y-3 text-xs">
              <h5 className="text-white font-bold uppercase tracking-wider font-mono">Legals</h5>
              <ul className="space-y-1.5 text-neutral-400">
                <li><a href="#privacy" className="hover:text-white transition uppercase text-[10px] font-semibold">Privacy Policy</a></li>
                <li><a href="#terms" className="hover:text-white transition uppercase text-[10px] font-semibold">Terms & Conditions</a></li>
                <li><a href="#shipping" className="hover:text-white transition uppercase text-[10px] font-semibold">Shipping Policy</a></li>
              </ul>
            </div>

            {/* Column 4: Contact & Support */}
            <div className="space-y-3 text-xs">
              <h5 className="text-white font-bold uppercase tracking-wider font-mono">Contact Info</h5>
              <ul className="space-y-2 text-neutral-400 leading-relaxed font-sans">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{settings.contactAddress || "Olaya Dist, Riyadh, Kingdom of Saudi Arabia"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>+{settings.whatsappContact || "8801765865757"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{settings.contactEmail || "moeenislam8089@gmail.com"}</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Copyright bottom bar */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-neutral-500 font-medium">
            <span>© {new Date().getFullYear()} {settings.shopName || "Kabayan Shop Saudi"}. All Rights Reserved. Modest Fashion Saudi.</span>
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              <span>Cash on Delivery (COD) Verified Partner KSA</span>
            </div>
          </div>
        </footer>
      )}

      {/* 4. CLIENT INTERACTION MODALS & DRAWERS */}

      {/* A. PRODUCT DETAILS MODAL VIEW */}
      {/* ProductDetailsModal is now rendered inline above inside main workspace flow as a proper full-page product detail page */}

      {/* B. CART DRAWER COMPONENT */}
      {isCartOpen && (
        <CartDrawer
          onClose={handleCloseCart}
          onOpenCheckout={() => {
            setIsCartOpen(false);
            setIsCheckoutOpen(true);
          }}
          onSelectProductById={(id) => {
            const prod = products.find(p => p.id === id);
            if (prod) {
              setSelectedProduct(prod);
              setIsCartOpen(false);
            }
          }}
        />
      )}

      {/* C. CHECKOUT MODAL FORM */}
      {isCheckoutOpen && (
        <Suspense fallback={<FallbackLoading />}>
          <CheckoutModal
            areas={areas}
            settings={settings}
            onClose={() => setIsCheckoutOpen(false)}
            onBackToCart={() => {
              setIsCheckoutOpen(false);
              setIsCartOpen(true);
            }}
            onOrderSuccess={() => {
              setIsCheckoutOpen(false);
              fetchAllData(); // refresh stock numbers on storefront!
            }}
            onSelectProductById={(id) => {
              const prod = products.find(p => p.id === id);
              if (prod) {
                setSelectedProduct(prod);
                setIsCheckoutOpen(false);
              }
            }}
          />
        </Suspense>
      )}

      {/* D. FLOATING WHATSAPP CHAT BUTTON */}
      <a
        href={`https://wa.me/${settings?.whatsappContact || "8801765865757"}?text=Hello%20Kabayan%20Shop%20Saudi!%20I%20am%20visiting%20your%20website%20and%20would%20like%20to%20inquire%20about%20your%20latest%20modest%20fashion%20collection%20and%20special%20offers.`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 group cursor-pointer"
        title="Chat with us on WhatsApp"
        id="whatsapp-float-btn"
      >
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30 animate-ping pointer-events-none"></span>
        <svg className="w-6.5 h-6.5 text-white fill-current group-hover:rotate-12 transition-transform duration-300" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-out whitespace-nowrap text-xs font-bold uppercase tracking-wider pl-0 group-hover:pl-2">
          Chat With Us
        </span>
      </a>

      {/* E. FLOATING MESSENGER CHAT BUTTON & CHATBOT PANEL */}
      {(settings?.messengerPageId || "kabayanshopSaudi1") && (
        <>
          {/* Floating Messenger Icon Bubble */}
          <button
            onClick={() => setIsMessengerChatOpen(!isMessengerChatOpen)}
            className="fixed bottom-24 right-6 z-40 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 group cursor-pointer animate-none"
            title="Chat with us on Facebook Messenger"
            id="messenger-float-btn"
          >
            <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-30 animate-ping pointer-events-none"></span>
            <svg className="w-6.5 h-6.5 text-white fill-white group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.36 2 2 6.13 2 11.7c0 3.22 1.43 6.05 3.67 7.78V22l2.4-1.3c1.2.33 2.5.53 3.93.53 5.64 0 10-4.13 10-9.7C22 6.13 17.64 2 12 2zm1.03 12.87l-2.67-2.85-5.2 2.85 5.7-6.06 2.7 2.85 5.17-2.85-5.7 6.06z"/>
            </svg>
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-out whitespace-nowrap text-xs font-bold uppercase tracking-wider pl-0 group-hover:pl-2">
              Messenger Chat
            </span>
          </button>

          {/* Chatbot Window */}
          {isMessengerChatOpen && (
            <div className="fixed bottom-38 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-none font-sans">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/20">
                    <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.36 2 2 6.13 2 11.7c0 3.22 1.43 6.05 3.67 7.78V22l2.4-1.3c1.2.33 2.5.53 3.93.53 5.64 0 10-4.13 10-9.7C22 6.13 17.64 2 12 2zm1.03 12.87l-2.67-2.85-5.2 2.85 5.7-6.06 2.7 2.85 5.17-2.85-5.7 6.06z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-black tracking-wider uppercase leading-none">Kabayan Chatbot</h4>
                    <span className="text-[9px] text-blue-100 font-semibold mt-1 block">Replies within minutes</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMessengerChatOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-full transition"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Chat Body */}
              <div className="p-4 space-y-3 bg-neutral-50 h-64 overflow-y-auto">
                <div className="flex items-start gap-2 max-w-[85%] text-left">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold shrink-0">
                    KB
                  </div>
                  <div className="bg-white p-2.5 rounded-2xl rounded-tl-none border border-neutral-200/80 shadow-xs text-xs text-neutral-800 leading-normal">
                    👋 Salam & Hello! Welcome to Kabayan Shop Saudi support.
                  </div>
                </div>

                <div className="flex items-start gap-2 max-w-[85%] text-left">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold shrink-0">
                    KB
                  </div>
                  <div className="bg-white p-2.5 rounded-2xl rounded-tl-none border border-neutral-200/80 shadow-xs text-xs text-neutral-800 leading-normal">
                    Would you like to send us a direct message on Messenger? Click the button below to start chatting with our Facebook Page!
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 bg-white border-t border-neutral-150 flex flex-col gap-2 items-center">
                <a
                  href={`https://m.me/${settings?.messengerPageId || "kabayanshopSaudi1"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider transition shadow-md shadow-blue-600/10 flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.36 2 2 6.13 2 11.7c0 3.22 1.43 6.05 3.67 7.78V22l2.4-1.3c1.2.33 2.5.53 3.93.53 5.64 0 10-4.13 10-9.7C22 6.13 17.64 2 12 2zm1.03 12.87l-2.67-2.85-5.2 2.85 5.7-6.06 2.7 2.85 5.17-2.85-5.7 6.06z"/>
                  </svg>
                  <span>Chat on Messenger</span>
                </a>
                <span className="text-[9px] text-neutral-400 font-medium">Powered by Facebook Messenger</span>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
