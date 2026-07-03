"use client";

import React, { useState } from "react";
import { ShoppingBag, Search, ShieldAlert, Sparkles, MapPin, Phone, ChevronDown, Menu, X, Languages } from "lucide-react";
import { useCart } from "../lib/cartStore";
import { Category } from "../types";
import { useLanguage, Language } from "../lib/translationStore";

interface HeaderProps {
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (slug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  isAdminMode: boolean;
  onExitAdmin: () => void;
  onGoHome?: () => void;
  onGoToProduct?: () => void;
}

export default function Header({
  categories,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  onOpenCart,
  onOpenAdmin,
  isAdminMode,
  onExitAdmin,
  onGoHome,
  onGoToProduct
}: HeaderProps) {
  const { items } = useCart();
  const { lang, setLang, t } = useLanguage();
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false);

  const scrollToProducts = () => {
    setTimeout(() => {
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
    }, 150);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white text-neutral-900 border-b border-neutral-200 shadow-md">
      {/* Top Banner Bar */}
      <div className="w-full bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-black text-[10px] sm:text-xs font-semibold py-1 px-4 flex flex-col sm:flex-row justify-between items-center gap-1 text-center sm:text-left tracking-wider font-sans">
        <div className="flex items-center gap-1 justify-center sm:justify-start w-full sm:w-auto">
          <Sparkles className="w-3.5 h-3.5 animate-pulse shrink-0" />
          <span className="leading-tight break-words">{t("free_delivery_banner")}</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>{t("riyadh_ksa")}</span>
          </div>
          <div className="flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" />
            <span>{t("whatsapp_support")}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* 1. Left side: Logo Brand */}
          <div className="flex-shrink-0">
            <div 
              className="flex flex-col cursor-pointer"
              onClick={() => {
                if (onGoHome) {
                  onGoHome();
                } else {
                  setSelectedCategory("");
                  setSearchQuery("");
                  if (isAdminMode) onExitAdmin();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            >
              <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-widest text-neutral-900 font-sans flex items-center gap-1 sm:gap-1.5 leading-none">
                KABAYAN <span className="text-amber-600 font-serif font-black">SHOP</span>
              </h1>
              <span className="text-[8px] sm:text-[10px] tracking-[0.05em] sm:tracking-[0.25em] text-neutral-500 font-mono mt-1 uppercase whitespace-normal sm:whitespace-nowrap max-w-[160px] sm:max-w-none leading-tight">
                {t("luxury_sub")}
              </span>
            </div>
          </div>

          {/* 2. Middle Section: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-12 font-sans">
            <button
              onClick={() => {
                if (onGoHome) {
                  onGoHome();
                } else {
                  setSelectedCategory("");
                  setSearchQuery("");
                  if (isAdminMode) onExitAdmin();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className="text-sm font-bold text-neutral-700 hover:text-amber-600 transition uppercase tracking-wider"
            >
              {t("home")}
            </button>
            <button
              onClick={() => {
                if (onGoToProduct) {
                  onGoToProduct();
                } else {
                  setSelectedCategory("");
                  setSearchQuery("");
                  if (isAdminMode) onExitAdmin();
                  scrollToProducts();
                }
              }}
              className="text-sm font-bold text-neutral-700 hover:text-amber-600 transition uppercase tracking-wider"
            >
              {t("product")}
            </button>
            
            {/* Categories Dropdown */}
            <div className="relative group/dropdown">
              <button className="flex items-center gap-1 text-sm font-bold text-neutral-700 hover:text-amber-600 transition uppercase tracking-wider py-2">
                <span>{t("collections")}</span>
                <ChevronDown className="w-4 h-4 transition-transform group-hover/dropdown:rotate-180 duration-200" />
              </button>
              <div className="absolute left-0 mt-1 w-48 bg-white border border-neutral-100 rounded-xl shadow-xl py-2 opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all duration-200 z-50">
                <button
                  onClick={() => {
                    setSelectedCategory("");
                    if (isAdminMode) onExitAdmin();
                    scrollToProducts();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 hover:text-amber-600 transition"
                >
                  {t("all_arrivals")}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.slug);
                      if (isAdminMode) onExitAdmin();
                      scrollToProducts();
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-600 hover:bg-neutral-50 hover:text-amber-600 transition"
                  >
                    {getCategoryName(cat)}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          {/* 3. Right Section: Cart, Language Selector, Admin */}
          <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
            {/* Language Selector Dropdown */}
            <div className="relative group/lang">
              <button className="flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-full px-3 py-1.5 text-xs text-neutral-800 font-bold transition">
                <Languages className="w-3.5 h-3.5 text-amber-600" />
                <span>{lang === "en" ? "Eng" : lang === "ar" ? "العربية" : "Filipino"}</span>
                <ChevronDown className="w-3 h-3 text-neutral-500" />
              </button>
              <div className="absolute right-0 mt-1 w-32 bg-white border border-neutral-100 rounded-xl shadow-xl py-1 opacity-0 invisible group-hover/lang:opacity-100 group-hover/lang:visible transition-all duration-200 z-50">
                <button
                  onClick={() => setLang("en")}
                  className={`w-full text-center px-3 py-2 text-xs font-bold transition ${lang === "en" ? "text-amber-600 bg-neutral-50" : "text-neutral-700 hover:bg-neutral-50"}`}
                >
                  English (Eng)
                </button>
                <button
                  onClick={() => setLang("ar")}
                  className={`w-full text-center px-3 py-2 text-xs font-bold transition ${lang === "ar" ? "text-amber-600 bg-neutral-50" : "text-neutral-700 hover:bg-neutral-50"}`}
                >
                  العربية (Arabic)
                </button>
                <button
                  onClick={() => setLang("fil")}
                  className={`w-full text-center px-3 py-2 text-xs font-bold transition ${lang === "fil" ? "text-amber-600 bg-neutral-50" : "text-neutral-700 hover:bg-neutral-50"}`}
                >
                  Filipino
                </button>
              </div>
            </div>

            {/* Cart Button */}
            {!isAdminMode && (
              <button
                id="desk-cart-btn"
                onClick={onOpenCart}
                className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs transition duration-300 font-black border border-amber-500 select-none bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-105 active:scale-95 cursor-pointer animate-pulse-subtle"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{t("my_cart")}</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full ml-1 transition duration-300 bg-black text-amber-400">
                  {totalItemsCount}
                </span>
              </button>
            )}

            {/* Admin Option - Storefront exit only */}
            {isAdminMode && (
              <button
                onClick={onExitAdmin}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-1.5 rounded-full transition shadow-md shadow-amber-500/20"
              >
                {t("storefront")}
              </button>
            )}
          </div>

          {/* Mobile Navigation Controls */}
          <div className="flex items-center gap-1 lg:hidden">
            {/* Mobile Language Selector (Cycles on click) */}
            <button 
              onClick={() => {
                const nextLang: Record<Language, Language> = { en: "ar", ar: "fil", fil: "en" };
                setLang(nextLang[lang]);
              }}
              className="flex items-center gap-1 bg-neutral-100 border border-neutral-200 rounded-full px-2 py-1 text-[10px] text-neutral-800 font-bold transition mr-1"
              title="Change Language"
            >
              <Languages className="w-3 h-3 text-amber-600" />
              <span>{lang === "en" ? "EN" : lang === "ar" ? "AR" : "PH"}</span>
            </button>

            {!isAdminMode && (
              <button
                id="mob-cart-btn"
                onClick={onOpenCart}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black transition duration-300 border border-amber-500 select-none bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-105 active:scale-95 cursor-pointer animate-pulse-subtle"
                aria-label="View Cart"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full ml-0.5 transition duration-300 bg-black text-amber-400">
                  {totalItemsCount}
                </span>
              </button>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-neutral-700 hover:text-amber-600 transition"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="mt-4 pt-4 border-t border-neutral-100 lg:hidden flex flex-col gap-4 animate-fade-in">

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  if (onGoHome) {
                    onGoHome();
                  } else {
                    setSelectedCategory("");
                    setSearchQuery("");
                    if (isAdminMode) onExitAdmin();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                  setIsMobileMenuOpen(false);
                }}
                className="text-left w-full py-2 px-3 hover:bg-neutral-50 rounded-lg text-xs font-bold uppercase tracking-wider text-neutral-700 hover:text-amber-600 transition"
              >
                {t("home")}
              </button>
              <button
                onClick={() => {
                  if (onGoToProduct) {
                    onGoToProduct();
                  } else {
                    setSelectedCategory("");
                    setSearchQuery("");
                    if (isAdminMode) onExitAdmin();
                    scrollToProducts();
                  }
                  setIsMobileMenuOpen(false);
                }}
                className="text-left w-full py-2 px-3 hover:bg-neutral-50 rounded-lg text-xs font-bold uppercase tracking-wider text-neutral-700 hover:text-amber-600 transition"
              >
                {t("product")}
              </button>
              
              {/* Expandable categories menu for mobile */}
              <div className="flex flex-col">
                <button
                  onClick={() => setIsCategoriesDropdownOpen(!isCategoriesDropdownOpen)}
                  className="flex items-center justify-between w-full py-2 px-3 hover:bg-neutral-50 rounded-lg text-xs font-bold uppercase tracking-wider text-neutral-700 hover:text-amber-600 transition"
                >
                  <span>{t("collections")}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCategoriesDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isCategoriesDropdownOpen && (
                  <div className="pl-4 mt-1 flex flex-col gap-1 border-l-2 border-neutral-100">
                    <button
                      onClick={() => {
                        setSelectedCategory("");
                        if (isAdminMode) onExitAdmin();
                        setIsMobileMenuOpen(false);
                        scrollToProducts();
                      }}
                      className="text-left py-1.5 px-3 text-[11px] font-bold uppercase text-neutral-600 hover:text-amber-600"
                    >
                      {t("all_arrivals")}
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.slug);
                          if (isAdminMode) onExitAdmin();
                          setIsMobileMenuOpen(false);
                          scrollToProducts();
                        }}
                        className="text-left py-1.5 px-3 text-[11px] font-semibold uppercase text-neutral-500 hover:text-amber-600"
                      >
                        {getCategoryName(cat)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin Panel button for mobile - Storefront exit only */}
              {isAdminMode && (
                <button
                  onClick={() => {
                    onExitAdmin();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left w-full mt-2 py-2 px-3 bg-amber-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider text-center"
                >
                  {t("storefront")}
                </button>
              )}

            </div>
          </div>
        )}

      </div>
    </header>
  );
}
