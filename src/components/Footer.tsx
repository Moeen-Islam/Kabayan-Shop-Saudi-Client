"use client";

import React from "react";
import { Phone, Instagram, Mail, MapPin, ShieldCheck } from "lucide-react";
import { Category, ShopSettings } from "../types";
import { useLanguage } from "../lib/translationStore";

interface FooterProps {
  settings: ShopSettings;
  categories: Category[];
  setSelectedCategory: (slug: string) => void;
}

export default function Footer({ settings, categories, setSelectedCategory }: FooterProps) {
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

  return (
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
  );
}
