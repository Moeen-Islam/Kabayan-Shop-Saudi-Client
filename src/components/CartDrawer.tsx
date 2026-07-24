"use client";

import React from "react";
import Image from "next/image";
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Heart, Minus, Plus, ArrowLeft } from "lucide-react";
import { useCart } from "../lib/cartStore";
import { useLanguage } from "../lib/translationStore";
import { getOptimizedImageUrl } from "../lib/imageOptimizer";


interface CartDrawerProps {
  onClose: () => void;
  onOpenCheckout: () => void;
  onSelectProductById?: (id: string) => void;
}

export default function CartDrawer({ onClose, onOpenCheckout, onSelectProductById }: CartDrawerProps) {
  const { items, subtotal, removeItem, updateQuantity } = useCart();
  const { t, lang } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      {/* Outer Click Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-in-right">
        {/* Header */}
        <div className="px-4 py-5 border-b border-neutral-100 flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-neutral-500 hover:text-black transition cursor-pointer select-none"
            title="Back to products"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === "ar" ? "العودة" : "Back"}</span>
          </button>

          <div className="flex items-center gap-1.5 flex-grow justify-center">
            <ShoppingBag className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-black text-neutral-900 uppercase tracking-widest truncate">
              {t("my_shopping_cart")} ({items.reduce((sum, i) => sum + i.quantity, 0)})
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-neutral-100 transition text-neutral-400 hover:text-black"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart items list */}
        <div className="flex-grow overflow-y-auto px-5 py-4 divide-y divide-neutral-100">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-center">
              <div className="bg-neutral-50 p-6 rounded-full mb-4">
                <ShoppingBag className="w-10 h-10 text-neutral-300" />
              </div>
              <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-widest mb-1">
                {t("cart_empty")}
              </h3>
              <p className="text-xs text-neutral-400 max-w-[240px] leading-relaxed mb-6">
                {t("add_items_to_cart")}
              </p>
              <button
                onClick={onClose}
                className="bg-black hover:bg-neutral-900 text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full transition"
              >
                {t("continue_shopping")}
              </button>
            </div>
          ) : (
            items.map((item, idx) => (
              <div key={idx} className="py-4 flex gap-4">
                {/* Product Thumbnail */}
                <div 
                  onClick={() => onSelectProductById?.(item.productId)}
                  className="w-20 h-26 bg-neutral-50 rounded-lg overflow-hidden border border-neutral-100 shrink-0 cursor-pointer hover:border-amber-400 hover:opacity-90 transition duration-150 flex items-center justify-center relative"
                  title="Click to edit options"
                >
                  <Image
                    src={item.productImage}
                    alt=""
                    fill
                    sizes="80px"
                    className="absolute inset-0 w-full h-full object-cover blur-md opacity-40 scale-110 pointer-events-none"
                  />
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    sizes="80px"
                    className="relative z-10 w-full h-full object-contain pointer-events-none"
                  />
                </div>

                {/* Details */}
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <h4 
                      onClick={() => onSelectProductById?.(item.productId)}
                      className="text-xs font-bold text-neutral-950 leading-snug line-clamp-2 tracking-tight cursor-pointer hover:text-amber-600 hover:underline transition duration-150"
                      title="Click to edit options"
                    >
                      {item.productName}
                    </h4>
                    
                    {/* Selected Options */}
                    <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 mt-1 items-center">
                      <span className="text-[10px] text-neutral-500 font-mono font-medium">
                        Size: <span className="text-neutral-800 font-bold">{item.selectedSize}</span>
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono font-medium">
                        Color: <span className="text-neutral-800 font-bold">{item.selectedColor}</span>
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono font-medium block w-full">
                        Pkg: <span className="text-amber-600 font-bold">{item.selectedPackageType}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectProductById?.(item.productId)}
                        className="text-[10px] text-amber-600 font-extrabold hover:text-amber-700 hover:underline transition mt-1"
                      >
                        {lang === "ar" ? "تعديل الخيارات" : lang === "fil" ? "Baguhin ang Opsyon" : "Edit Options"}
                      </button>
                    </div>
                  </div>

                  {/* Quantity and Price adjustment */}
                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity Selector */}
                    <div className="flex items-center gap-1 border border-neutral-200 rounded-md overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.selectedColor, item.selectedSize, item.selectedPackageType, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-neutral-50 transition text-neutral-500"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-neutral-800">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.selectedColor, item.selectedSize, item.selectedPackageType, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-neutral-50 transition text-neutral-500"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Cost Details */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-neutral-900 font-sans">
                        {Number((item.price * item.quantity).toFixed(2))} SAR
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId, item.selectedColor, item.selectedSize, item.selectedPackageType)}
                        className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        {items.length > 0 && (
          <div className="p-5 border-t border-neutral-100 bg-neutral-50">
            {/* Subtotal */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{t("subtotal")}:</span>
              <span className="text-lg font-black text-black font-sans">{subtotal} SAR</span>
            </div>
            
            <p className="text-[10px] text-neutral-400 mb-5 leading-snug">
              * Delivery fees and any coupon codes will be applied automatically at the checkout screen. No registration is required!
            </p>

            {/* CTA checkout button */}
            <button
              onClick={onOpenCheckout}
              className="w-full bg-black hover:bg-neutral-900 text-white font-bold text-sm tracking-wider uppercase py-4 rounded-full flex items-center justify-center gap-2 transition shadow-lg shadow-black/15"
            >
              <span>{t("checkout")}</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>

            {/* Badges */}
            <div className="flex justify-center gap-4 mt-4 text-[10px] text-neutral-500">
              <div className="flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                <span>Genuine Products</span>
              </div>
              <div className="flex items-center gap-1 font-semibold">
                <Heart className="w-3.5 h-3.5 text-amber-500" />
                <span>Customer Trust</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
