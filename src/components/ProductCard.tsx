"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Star, ShoppingCart, Percent, AlertCircle } from "lucide-react";
import { Product } from "../types";
import { useLanguage } from "../lib/translationStore";
import { getOptimizedImageUrl } from "../lib/imageOptimizer";

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

function getSwatchBackground(colorName: string): string {
  const col = colorName.trim().toLowerCase();
  const map: Record<string, string> = {
    red: "#ef4444",
    blue: "#3b82f6",
    green: "#22c55e",
    yellow: "#eab308",
    purple: "#a855f7",
    pink: "#ec4899",
    orange: "#f97316",
    black: "#171717",
    white: "#ffffff",
    gray: "#9ca3af",
    grey: "#9ca3af",
    brown: "#78350f",
    navy: "#1e3a8a",
    teal: "#14b8a6",
    gold: "#fbbf24",
    silver: "#cbd5e1",
    beige: "#f5f5dc",
    cream: "#fffdd0",
    maroon: "#800000",
    khaki: "#f0e68c",
    peach: "#ffdab9",
    lavender: "#e6e6fa",
    olive: "#808000",
    terracotta: "#e2725b",
    lilac: "#c8a2c8",
    plum: "#dda0dd",
    mint: "#98ff98",
    burgundy: "#800020",
    mustard: "#e1ad01",
    magenta: "#ff00ff",
    charcoal: "#36454f"
  };

  if (col === "multi") {
    return "linear-gradient(135deg, #ef4444, #3b82f6, #22c55e)";
  }

  // Clean string and split into tokens
  const cleanStr = col.replace(/[^a-z\s/]/g, "");
  const tokens = cleanStr.split(/[\s/]+/);
  const matchedColors: string[] = [];

  for (const t of tokens) {
    if (map[t]) {
      matchedColors.push(map[t]);
    }
  }

  if (matchedColors.length === 1) {
    return matchedColors[0];
  } else if (matchedColors.length > 1) {
    return `linear-gradient(135deg, ${matchedColors.join(", ")})`;
  }

  return "#cbd5e1";
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  const { lang } = useLanguage();
  const [selectedColor, setSelectedColor] = useState(
    product && product.isGroupOrder
      ? "Mix Color"
      : (product && product.colors && product.colors[0] ? product.colors[0] : "")
  );

  const hasOffer = product && product.offerPrice !== undefined && product.offerPrice < product.price;
  const activePrice = hasOffer ? product.offerPrice! : (product ? product.price : 0);
  
  // Calculate discount percentage
  const discountPercent = hasOffer && product
    ? Math.round(((product.price - product.offerPrice!) / product.price) * 100) 
    : 0;

  // Determine low stock condition
  const isLowStock = product && product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product && product.stock === 0;

  // Check if it is a bundle or combo offer
  const isCombo = product && product.packageTypes && Array.isArray(product.packageTypes) && product.packageTypes.some(
    p => p && p.toLowerCase().includes("combo") || p.toLowerCase().includes("pack") || p.toLowerCase().includes("bundle")
  );

  // Helper to find the correct image for a color
  const getDisplayImage = () => {
    if (!product) return "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200";
    const images = product.images || [];
    if (!selectedColor) return images[0] || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200";

    // 1. Check if we have an explicit mapping
    if (product.colorImageMap) {
      const mappedImg = Object.keys(product.colorImageMap).find(
        (img) => product.colorImageMap![img] === selectedColor
      );
      if (mappedImg) return mappedImg;
    }

    // 2. Check if any image contains the selected color name in its URL or filename
    const lowerCol = selectedColor.toLowerCase();
    const matchedByFilename = images.find((img) =>
      img && img.toLowerCase().includes(lowerCol)
    );
    if (matchedByFilename) return matchedByFilename;

    // 3. Fallback to matching indexes if possible
    const colorIndex = (product.colors || []).indexOf(selectedColor);
    if (colorIndex !== -1 && images[colorIndex]) {
      return images[colorIndex];
    }

    // Default to the first image
    return images[0] || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200";
  };
 
  const rawImage = getDisplayImage();
  const displayImage = getOptimizedImageUrl(rawImage, 400);

  return (
    <div
      onClick={() => onSelect(product)}
      className="group bg-white rounded-lg overflow-hidden border border-neutral-200/80 shadow-sm hover:shadow-xl hover:border-amber-500/30 transition-all duration-300 cursor-pointer flex flex-col h-full"
    >
      {/* Product Image Stage */}
      <div className="relative aspect-[3/4] bg-neutral-100 overflow-hidden flex items-center justify-center">
        {/* Soft blurred background for filling empty gaps elegantly */}
        <Image
          src={rawImage}
          alt=""
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 250px"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover blur-lg opacity-40 scale-110 select-none pointer-events-none"
        />
        <Image
          src={rawImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 250px"
          loading="lazy"
          className="relative z-10 w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
        />

        {/* Promo and Info Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {discountPercent > 0 && (
            <span className="bg-black text-amber-400 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-sm flex items-center gap-1 shadow-md">
              <Percent className="w-3 h-3 text-amber-400" />
              <span>{lang === "ar" ? `وفر %${discountPercent}` : lang === "fil" ? `SAVE ${discountPercent}%` : `SAVE ${discountPercent}%`}</span>
            </span>
          )}
          {isCombo && (
            <span className="bg-amber-400 text-black text-[9px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-sm shadow-md">
              {lang === "ar" ? "عرض كومبو مميز" : lang === "fil" ? "SUPER VALUE COMBO" : "SUPER VALUE COMBO"}
            </span>
          )}
        </div>

        {/* Stock Warnings */}
        <div className="absolute bottom-2.5 right-2.5 z-10">
          {isOutOfStock ? (
            <span className="bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm shadow-md flex items-center gap-1">
              {lang === "ar" ? "نفدت الكمية" : lang === "fil" ? "Out of Stock" : "Out of Stock"}
            </span>
          ) : isLowStock ? (
            <span className="bg-amber-600 text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-md flex items-center gap-1 animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{lang === "ar" ? `متبقي ${product.stock} فقط!` : lang === "fil" ? `${product.stock} na lang!` : `Only ${product.stock} Left!`}</span>
            </span>
          ) : null}
        </div>

        {/* Overlay hover effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content Details */}
      <div className="p-4 flex flex-col flex-grow">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 mb-1">
          {product.category}
        </span>
        <h3 className="text-sm font-semibold text-neutral-800 line-clamp-2 leading-snug tracking-tight mb-2 group-hover:text-amber-600 transition-colors">
          {product.name}
        </h3>

        {/* Dynamic Reviews Section */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex text-amber-400">
            {[...Array(5)].map((_, i) => {
              const starVal = i + 1;
              const displayRating = product.rating || 4.9;
              const isFilled = starVal <= Math.round(displayRating);
              return (
                <Star 
                  key={i} 
                  className={`w-3.5 h-3.5 ${isFilled ? "fill-current" : "text-neutral-200"}`} 
                />
              );
            })}
          </div>
          <span className="text-[10px] text-neutral-500 font-semibold">({(product.rating || 4.9).toFixed(1)}/5)</span>
        </div>

        {/* Color Swatch Selection inside Card */}
        {product.colors && product.colors.length > 0 && !product.isGroupOrder && (
          <div className="flex items-center gap-1.5 mt-1 mb-3 flex-wrap">
            {product.colors.map((color) => {
              const isActive = selectedColor === color;
              const swatchBg = getSwatchBackground(color);
              return (
                <button
                  key={color}
                  type="button"
                  title={color}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedColor(color);
                  }}
                  className={`relative w-5 h-5 rounded-full border transition-all flex items-center justify-center shrink-0 overflow-hidden after:absolute after:inset-[-14px] after:content-[''] after:cursor-pointer ${
                    isActive
                      ? "ring-2 ring-amber-500 border-white scale-110 shadow-sm"
                      : "border-neutral-300 hover:border-neutral-400"
                  }`}
                  style={{
                    background: swatchBg
                  }}
                >
                  {isActive && (
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      color.toLowerCase().includes("white") ? "bg-black" : "bg-white"
                    } shadow-[0_1px_2px_rgba(0,0,0,0.3)]`} />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Price and Action Section */}
        <div className="mt-auto pt-3 border-t border-neutral-100 flex items-center justify-between">
          <div className="flex flex-col">
            {hasOffer ? (
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-black tracking-tight">
                  {product.offerPrice} <span className="text-xs font-semibold">SAR</span>
                </span>
                <span className="text-xs text-neutral-500 line-through">
                  {product.price} SAR
                </span>
              </div>
            ) : (
              <span className="text-base font-bold text-black tracking-tight">
                {product.price} <span className="text-xs font-semibold">SAR</span>
              </span>
            )}
          </div>

          <span className="bg-neutral-900 text-white group-hover:bg-amber-400 group-hover:text-black p-2 rounded-full transition-all duration-300">
            <ShoppingCart className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}

