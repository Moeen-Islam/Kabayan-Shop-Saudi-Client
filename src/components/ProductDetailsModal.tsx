"use client";

import React, { useState, useEffect } from "react";
import { X, Check, ShoppingCart, ArrowRight, Minus, Plus, RefreshCw, ZoomIn, ChevronRight } from "lucide-react";
import { Product } from "../types";
import { cartStore } from "../lib/cartStore";
import { trackPixelEvent } from "../lib/metaPixel";
import { getOptimizedImageUrl } from "../lib/imageOptimizer";
import { useLanguage } from "../lib/translationStore";

const API_URL = (() => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
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
export function getPackageMultiplierAndDiscount(pkgName: string): { multiplier: number; discount: number } {
  const name = (pkgName || "").toLowerCase();
  let count = 1;
  const packOfMatch = name.match(/(?:pack|combo|set|pieces|pcs)\s*(?:of)?\s*(\d+)/i) || 
                      name.match(/(\d+)\s*(?:pcs|pc|piece|pieces|pack|combo|set)/i) ||
                      name.match(/^(\d+)\s*$/);
                      
  if (packOfMatch && packOfMatch[1]) {
    count = parseInt(packOfMatch[1], 10);
  } else if (name.includes("pair") || name.includes("terno")) {
    count = 2;
  } else if (name.includes("double")) {
    count = 2;
  } else if (name.includes("triple")) {
    count = 3;
  } else if (name.includes("dozen")) {
    count = 12;
  } else {
    const digitMatch = name.match(/(\d+)/);
    if (digitMatch) {
      count = parseInt(digitMatch[1], 10);
    }
  }

  if (isNaN(count) || count <= 0) {
    count = 1;
  }

  let discount = 1.0;
  if (count === 1) {
    discount = 1.0;
  } else if (count === 2) {
    discount = 0.90; // 10% off
  } else if (count === 3) {
    discount = 0.85; // 15% off
  } else if (count >= 4 && count <= 5) {
    discount = 0.80; // 20% off
  } else if (count >= 6 && count <= 11) {
    discount = 0.75; // 25% off
  } else if (count >= 12) {
    discount = 0.70; // 30% off
  }

  return { multiplier: count, discount };
}

interface ProductDetailsModalProps {
  product: Product;
  allProducts: Product[];
  onClose: () => void;
  onAddToCartSuccess: () => void;
  onBuyNowSuccess: () => void;
  onSelectRelated: (product: Product) => void;
  isFullPage?: boolean;
}

function getHexColor(colorName: string): string {
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

  if (map[col]) return map[col];

  // Try matching individual tokens
  const tokens = col.split(/\s+/);
  for (const t of tokens) {
    if (map[t]) return map[t];
  }

  return "#cbd5e1";
}

export default function ProductDetailsModal({
  product: propProduct,
  allProducts,
  onClose,
  onAddToCartSuccess,
  onBuyNowSuccess,
  onSelectRelated,
  isFullPage = false
}: ProductDetailsModalProps) {
  const { lang, t } = useLanguage();
  const [fullProduct, setFullProduct] = useState<Product | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [addingState, setAddingState] = useState<"idle" | "adding" | "added">("idle");

  // Fetch full details dynamically if this is a lightweight catalog card
  useEffect(() => {
    if (!propProduct) return;
    const isLightweight = !propProduct.description || !propProduct.sizes || propProduct.sizes.length === 0;

    if (isLightweight) {
      setIsLoadingDetails(true);
      fetch(`${API_URL}/products/slug/${propProduct.slug}`)
        .then(res => {
          if (!res.ok) throw new Error("Failed to load details");
          return res.json();
        })
        .then(data => {
          setFullProduct(data);
        })
        .catch(err => {
          console.error("Error loading product details:", err);
          setFullProduct(propProduct);
        })
        .finally(() => {
          setIsLoadingDetails(false);
        });
    } else {
      setFullProduct(propProduct);
      setIsLoadingDetails(false);
    }
  }, [propProduct]);

  const product = fullProduct || propProduct;

  const [activeImage, setActiveImage] = useState((propProduct && propProduct.images && propProduct.images[0]) || "");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedSize2, setSelectedSize2] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedSizes2, setSelectedSizes2] = useState<string[]>([]);
  const [isSameSizeAll, setIsSameSizeAll] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [chooseCustomColors, setChooseCustomColors] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});

  // Reset local state when product changes
  useEffect(() => {
    if (!product) return;
    setActiveImage((product.images && product.images[0]) || "");
    const initialSize = (product.sizes && product.sizes[0]) || "Free Size";
    const initialSize2 = (product.hasDualSizes && product.sizes2 && product.sizes2[0]) || "";
    setSelectedSize(initialSize);
    setSelectedSize2(initialSize2);
    
    const initialColor = product.isGroupOrder
      ? "Mix Color"
      : ((product.colors && product.colors[0]) || "Multi");
    setSelectedColor(initialColor);
    setSelectedColors([initialColor]);
    setSelectedSizes([initialSize]);
    setSelectedSizes2([initialSize2]);
    setIsSameSizeAll(true);
    setSelectedPackage((product.packageTypes && product.packageTypes[0]) || "Single Piece");
    setQuantity(1);
    setIsZoomed(false);
    setChooseCustomColors(false);
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const defaultColor = (product.isGroupOrder && !chooseCustomColors)
      ? "Mix Color"
      : (selectedColor || (product.colors && product.colors[0]) || "Multi");
    setSelectedColors((prev) => {
      const next = [...prev];
      if (next.length < quantity) {
        while (next.length < quantity) {
          next.push(defaultColor);
        }
      } else if (next.length > quantity) {
        next.splice(quantity);
      }
      return next;
    });
  }, [quantity, product, selectedColor, chooseCustomColors]);

  // Sync color selection states when chooseCustomColors toggle is flipped
  useEffect(() => {
    if (!product || !product.isGroupOrder) return;
    
    if (chooseCustomColors) {
      const defaultColor = (product.colors && product.colors[0]) || "Multi";
      setSelectedColor(defaultColor);
      setSelectedColors(Array.from({ length: quantity }, () => defaultColor));
    } else {
      setSelectedColor("Mix Color");
      setSelectedColors(Array.from({ length: quantity }, () => "Mix Color"));
    }
  }, [chooseCustomColors, product, quantity]);

  // Keep selectedPackage and quantity in sync when quantity changes manually
  useEffect(() => {
    if (!product || !product.packageTypes || product.packageTypes.length === 0) return;

    // Look for a package where the multiplier matches quantity exactly
    const matched = product.packageTypes.find((pkg) => {
      const { multiplier } = getPackageMultiplierAndDiscount(pkg);
      return multiplier === quantity;
    });

    if (matched && selectedPackage !== matched) {
      setSelectedPackage(matched);
    } else if (!matched && quantity === 1) {
      const singlePkg = product.packageTypes.find((pkg) => {
        const name = pkg.toLowerCase();
        return name.includes("single") || name.includes("one") || getPackageMultiplierAndDiscount(pkg).multiplier === 1;
      });
      if (singlePkg && selectedPackage !== singlePkg) {
        setSelectedPackage(singlePkg);
      }
    }
  }, [quantity, product, selectedPackage]);

  const hasOffer = product.offerPrice !== undefined && product.offerPrice < product.price;
  const defaultBasePrice = hasOffer ? product.offerPrice! : product.price;

  // Use custom size price if defined for the selected size
  const basePrice = (product.sizePrices && selectedSize && product.sizePrices[selectedSize] !== undefined)
    ? product.sizePrices[selectedSize]
    : defaultBasePrice;
  
  let activePrice = 0;
  let multiplier = 1;
  let discount = 1;
  
  const pkgInfo = getPackageMultiplierAndDiscount(selectedPackage);
  multiplier = pkgInfo.multiplier;
  
  if (product.packagePrices && product.packagePrices[selectedPackage] !== undefined) {
    activePrice = product.packagePrices[selectedPackage];
    const regularCost = basePrice * multiplier;
    if (regularCost > activePrice) {
      discount = activePrice / regularCost;
    }
  } else {
    discount = pkgInfo.discount;
    activePrice = Math.round(basePrice * multiplier * discount);
  }

  // Calculate the unit price (total combo price divided by number of pieces) so that in cart: price * quantity = activePrice
  const unitPrice = multiplier > 0 ? Math.round((activePrice / multiplier) * 100) / 100 : basePrice;

  // Handle Zoom logic
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomStyle({
      backgroundImage: `url(${activeImage})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: "200%"
    });
  };

  // Add to Cart handler with premium micro-animations
  const handleAddToCart = () => {
    if (product.stock === 0 || addingState !== "idle") return;
    
    setAddingState("adding");

    // Perform the item addition after a minor delay to show the "Adding..." animation state
    setTimeout(() => {
      let finalSize = "";
      if (quantity > 1 && !isSameSizeAll) {
        if (product.hasDualSizes) {
          finalSize = selectedSizes.map((sz, idx) => {
            return `#${idx + 1}: (${product.dualSizesTitle1 || "Size 1"}: ${sz} | ${product.dualSizesTitle2 || "Size 2"}: ${selectedSizes2[idx] || ""})`;
          }).join(" • ");
        } else {
          finalSize = selectedSizes.join(", ");
        }
      } else {
        finalSize = product.hasDualSizes
          ? `${product.dualSizesTitle1 || "Jacket Size"}: ${selectedSize} | ${product.dualSizesTitle2 || "Jeans Waist Size"}: ${selectedSize2}`
          : selectedSize;
      }

      const finalColor = product.isGroupOrder
        ? (chooseCustomColors ? (selectedColors.length > 0 ? selectedColors.join(", ") : selectedColor) : "Mix Color")
        : ((multiplier > 1 && product.isDefaultMixedColor) ? "Mix Colors" : (selectedColors.length > 0 ? selectedColors.join(", ") : selectedColor));

      cartStore.addItem({
        productId: product.id,
        productName: product.name,
        productImage: product.images[0] || "",
        quantity,
        price: unitPrice,
        selectedColor: finalColor,
        selectedSize: finalSize,
        selectedPackageType: selectedPackage,
        basePrice,
        packageTypes: product.packageTypes,
        packagePrices: product.packagePrices
      });

      trackPixelEvent("AddToCart", {
        content_name: product.name,
        content_ids: [product.id],
        content_type: "product",
        value: unitPrice * quantity,
        currency: "SAR"
      });

      setAddingState("added");

      // Fire success callback in the background
      onAddToCartSuccess();

      // Reset back to idle after 1.5s
      setTimeout(() => {
        setAddingState("idle");
      }, 1500);
    }, 600);
  };

  // Buy Now handler
  const handleBuyNow = () => {
    if (product.stock === 0) return;

    let finalSize = "";
    if (quantity > 1 && !isSameSizeAll) {
      if (product.hasDualSizes) {
        finalSize = selectedSizes.map((sz, idx) => {
          return `#${idx + 1}: (${product.dualSizesTitle1 || "Size 1"}: ${sz} | ${product.dualSizesTitle2 || "Size 2"}: ${selectedSizes2[idx] || ""})`;
        }).join(" • ");
      } else {
        finalSize = selectedSizes.join(", ");
      }
    } else {
      finalSize = product.hasDualSizes
        ? `${product.dualSizesTitle1 || "Jacket Size"}: ${selectedSize} | ${product.dualSizesTitle2 || "Jeans Waist Size"}: ${selectedSize2}`
        : selectedSize;
    }

    const finalColor = product.isGroupOrder
      ? (chooseCustomColors ? (selectedColors.length > 0 ? selectedColors.join(", ") : selectedColor) : "Mix Color")
      : ((multiplier > 1 && product.isDefaultMixedColor) ? "Mix Colors" : (selectedColors.length > 0 ? selectedColors.join(", ") : selectedColor));

    cartStore.addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0] || "",
      quantity,
      price: unitPrice,
      selectedColor: finalColor,
      selectedSize: finalSize,
      selectedPackageType: selectedPackage,
      basePrice,
      packageTypes: product.packageTypes,
      packagePrices: product.packagePrices
    });

    trackPixelEvent("AddToCart", {
      content_name: product.name,
      content_ids: [product.id],
      content_type: "product",
      value: unitPrice * quantity,
      currency: "SAR"
    });

    trackPixelEvent("InitiateCheckout", {
      content_ids: [product.id],
      content_type: "product",
      value: unitPrice * quantity,
      currency: "SAR"
    });

    onBuyNowSuccess();
  };

  // Get related products (same category, excluding current product)
  const relatedProducts = allProducts
    .filter(p => p.category === product.category && p.id !== product.id && p.status === "active")
    .slice(0, 3);

  return (
    <div className={isFullPage ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4" : "fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex justify-center p-2 sm:p-4 items-start sm:items-center"}>
      
      {isFullPage && (
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-black transition-colors mb-2 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 rotate-180 text-neutral-400" />
          <span>Back to Products</span>
        </button>
      )}

      <div className={isFullPage ? "bg-white w-full rounded-2xl border border-neutral-200/80 shadow-md overflow-hidden flex flex-col" : "relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-20px)] sm:max-h-[90vh] my-auto"}>
        
        {/* Header bar */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-100 bg-white">
          <span className="text-xs font-black uppercase tracking-widest text-amber-600 font-mono">
            {isFullPage ? "Product Details" : "Product Detail Overview"}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 transition text-neutral-500 hover:text-black cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className={isFullPage ? "p-6 space-y-8" : "overflow-y-auto p-6 flex-grow"}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Column: Image Slider and Zoom */}
            <div className="flex flex-col gap-4 min-w-0">
              {/* Main Image Stage */}
              <div 
                className="relative aspect-[3/4] bg-neutral-50 rounded-xl overflow-hidden border border-neutral-100 cursor-zoom-in flex items-center justify-center"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
              >
                {isZoomed ? (
                  <div 
                    className="absolute inset-0 bg-no-repeat w-full h-full pointer-events-none"
                    style={zoomStyle}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center relative bg-neutral-50">
                    <img
                      src={getOptimizedImageUrl(activeImage, window.innerWidth < 640 ? 500 : 800)}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover blur-lg opacity-40 scale-110 select-none pointer-events-none"
                    />
                    <img
                      src={getOptimizedImageUrl(activeImage, window.innerWidth < 640 ? 500 : 800)}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="relative z-10 max-w-full max-h-full w-auto h-auto object-contain pointer-events-none"
                    />
                  </div>
                )}

                {!isZoomed && (
                  <div className="absolute bottom-3 right-3 bg-black/60 text-white p-2 rounded-full pointer-events-none shadow-md z-20">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Thumbnails Gallery */}
              {product.images.length > 1 && (
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-hide w-full">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`relative w-16 sm:w-20 aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all flex items-center justify-center bg-neutral-50 shrink-0 ${
                        activeImage === img ? "border-amber-400 scale-95" : "border-transparent hover:border-neutral-300"
                      }`}
                    >
                      <img
                        src={getOptimizedImageUrl(img, 150)}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover blur-md opacity-40 scale-110 pointer-events-none"
                      />
                      <img
                        src={getOptimizedImageUrl(img, 150)}
                        alt={`${product.name} gallery ${idx}`}
                        referrerPolicy="no-referrer"
                        className="relative z-10 max-w-full max-h-full w-auto h-auto object-contain pointer-events-none"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Selections and Details */}
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 mb-1">
                {product.category}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight leading-tight mb-2">
                {product.name}
              </h2>

              {/* Stock status indicator */}
              <div className="mb-4">
                {product.stock > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                    {t("in_stock", { units: product.stock })}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-red-700 bg-red-50 px-2.5 py-1 rounded-full font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    {t("out_of_stock")}
                  </span>
                )}
              </div>

              {/* Price display */}
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/50 flex items-center justify-between mb-6">
                <div>
                  <span className="text-xs text-neutral-400 font-semibold block mb-0.5">PRICE IN SAR</span>
                  <div className="flex items-baseline gap-2">
                    {hasOffer ? (
                      <>
                        <span className="text-2xl sm:text-3xl font-extrabold text-black">
                          {activePrice} <span className="text-sm font-semibold">SAR</span>
                        </span>
                        {multiplier === 1 && (
                          <span className="text-sm text-neutral-400 line-through">
                            {product.price} SAR
                          </span>
                        )}
                        {discount < 1.0 ? (
                          <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded ml-1">
                            COMBO SAVE {Math.round((1 - discount) * 100)}%
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded ml-1">
                            SAVE {Math.round(((product.price - product.offerPrice!) / product.price) * 100)}%
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-2xl sm:text-3xl font-extrabold text-black">
                          {activePrice} <span className="text-sm font-semibold">SAR</span>
                        </span>
                        {discount < 1.0 && (
                          <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded ml-1">
                            COMBO SAVE {Math.round((1 - discount) * 100)}%
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-neutral-400 font-semibold block mb-0.5">SHIPPING</span>
                  <span className="text-xs font-bold text-neutral-700 bg-neutral-200/50 px-2 py-1 rounded">
                    Fast KSA Delivery
                  </span>
                </div>
              </div>

              {/* Selection controls */}
              <div className="space-y-4 mb-6">
                {/* 1. Package Type Selection */}
                {product.packageTypes && product.packageTypes.length > 0 && (
                  <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">
                      {t("select_package_option")}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.packageTypes.map((pkg) => {
                        let pkgPrice = 0;
                        if (product.packagePrices && product.packagePrices[pkg] !== undefined) {
                          pkgPrice = product.packagePrices[pkg];
                        } else {
                          const { multiplier: m, discount: d } = getPackageMultiplierAndDiscount(pkg);
                          pkgPrice = Math.round(basePrice * m * d);
                        }
                        return (
                          <button
                            key={pkg}
                            type="button"
                            onClick={() => {
                              setSelectedPackage(pkg);
                              const { multiplier: m } = getPackageMultiplierAndDiscount(pkg);
                              if (m > 0) {
                                setQuantity(m);
                              }
                            }}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition flex flex-col items-start min-w-[120px] ${
                              selectedPackage === pkg
                                ? "bg-black text-white border-black shadow-sm"
                                : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                            }`}
                          >
                            <span className="font-bold">{pkg}</span>
                            <span className={`text-[10px] mt-0.5 font-mono font-bold ${
                              selectedPackage === pkg ? "text-amber-300" : "text-amber-600"
                            }`}>
                              {pkgPrice} SAR
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Color Selection Option for Group Orders */}
                {product.colors && product.colors.length > 0 && product.isGroupOrder && (
                  <div className="flex items-center gap-2 bg-neutral-50 p-3 rounded-lg border border-neutral-200/50 mb-3">
                    <input
                      type="checkbox"
                      id="choose-custom-colors"
                      checked={chooseCustomColors}
                      onChange={(e) => setChooseCustomColors(e.target.checked)}
                      className="w-4 h-4 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-500 accent-neutral-900 cursor-pointer"
                    />
                    <label htmlFor="choose-custom-colors" className="text-xs font-bold text-neutral-700 cursor-pointer select-none">
                      {t("choose_specific_colors")}
                    </label>
                  </div>
                )}

                {/* 2. Color Selection */}
                {product.colors && product.colors.length > 0 && (
                  (product.isGroupOrder && chooseCustomColors) ||
                  (!product.isGroupOrder && (multiplier === 1 || !product.isDefaultMixedColor))
                ) && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                      {t("select_color") + (quantity > 1 ? ` (${quantity} ${t("items")})` : "")}
                    </label>
                    {quantity > 1 ? (
                      <div className="space-y-3 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/80">
                        <p className="text-[10px] text-neutral-400 font-medium leading-normal mb-1">
                          {t("choose_colors_for_each", { quantity })}
                        </p>
                        {Array.from({ length: quantity }).map((_, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200/50 last:border-0 pb-2.5 last:pb-0">
                            <span className="text-xs font-bold text-neutral-700 font-mono">
                              {t("item_color_index", { index: idx + 1 })}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {product.colors.map((color) => {
                                const isCurrent = selectedColors[idx] === color;
                                return (
                                  <button
                                    key={color}
                                    type="button"
                                    onClick={() => {
                                      const updated = [...selectedColors];
                                      updated[idx] = color;
                                      setSelectedColors(updated);
                                      setSelectedColor(color);
                                      if (product.colorImageMap) {
                                        const mappedImg = Object.keys(product.colorImageMap).find(
                                          (img) => product.colorImageMap![img] === color
                                        );
                                        if (mappedImg) {
                                          setActiveImage(mappedImg);
                                        }
                                      }
                                    }}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition flex items-center gap-1.5 ${
                                      isCurrent
                                        ? "bg-neutral-900 text-white border-neutral-900 shadow-xs"
                                        : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                                    }`}
                                  >
                                    <span
                                      className="w-2 h-2 rounded-full border border-black/10 shrink-0"
                                      style={{
                                        backgroundColor: color.toLowerCase() === "multi" ? undefined : getHexColor(color),
                                        background: color.toLowerCase() === "multi" ? "linear-gradient(135deg, #ef4444, #3b82f6, #22c55e)" : undefined
                                      }}
                                    />
                                    <span>{color}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {product.colors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              setSelectedColor(color);
                              setSelectedColors([color]);
                              if (product.colorImageMap) {
                                const mappedImg = Object.keys(product.colorImageMap).find(
                                  (img) => product.colorImageMap![img] === color
                                );
                                if (mappedImg) {
                                  setActiveImage(mappedImg);
                                }
                              }
                            }}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
                              selectedColor === color
                                ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                                : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                              style={{
                                backgroundColor: color.toLowerCase() === "multi" ? undefined : getHexColor(color),
                                background: color.toLowerCase() === "multi" ? "linear-gradient(135deg, #ef4444, #3b82f6, #22c55e)" : undefined
                              }}
                            />
                            <span>{color}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Size Selection */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                    {t("select_size") + (quantity > 1 ? ` (${quantity} ${t("items")})` : "")}
                  </label>
 
                  {quantity > 1 && (
                    <div className="flex items-center gap-2 mb-1 bg-neutral-100/50 p-2 rounded-lg border border-neutral-200/50 w-fit">
                      <input
                        type="checkbox"
                        id="same-size-checkbox"
                        checked={isSameSizeAll}
                        onChange={(e) => setIsSameSizeAll(e.target.checked)}
                        className="rounded text-amber-500 focus:ring-amber-400 cursor-pointer h-4 w-4"
                      />
                      <label htmlFor="same-size-checkbox" className="text-xs font-bold text-neutral-700 cursor-pointer select-none">
                        {t("same_size_all", { quantity })}
                      </label>
                    </div>
                  )}
 
                  {(quantity > 1 && !isSameSizeAll) ? (
                    <div className="space-y-4 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/80">
                      <p className="text-[10px] text-neutral-400 font-medium leading-normal mb-1">
                        {t("size_customization_helper", { quantity })}
                      </p>
                      {Array.from({ length: quantity }).map((_, idx) => (
                        <div key={idx} className="flex flex-col gap-2 border-b border-neutral-200/50 last:border-0 pb-3.5 last:pb-0">
                          <span className="text-xs font-bold text-neutral-700 font-mono">
                            {t("item_size_index", { index: idx + 1 })}
                          </span>
                          
                          {product.hasDualSizes ? (
                            <div className="space-y-2">
                              {product.sizes && product.sizes.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider w-20 shrink-0">
                                    {product.dualSizesTitle1 || "Jacket"}:
                                  </span>
                                  {product.sizes.map((sz) => (
                                    <button
                                      key={sz}
                                      type="button"
                                      onClick={() => {
                                        const updated = [...selectedSizes];
                                        updated[idx] = sz;
                                        setSelectedSizes(updated);
                                      }}
                                      className={`px-2 py-1 text-[11px] font-bold rounded border transition cursor-pointer ${
                                        selectedSizes[idx] === sz
                                          ? "bg-amber-400 text-black border-amber-400"
                                          : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                                      }`}
                                    >
                                      {sz}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {product.sizes2 && product.sizes2.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider w-20 shrink-0">
                                    {product.dualSizesTitle2 || "Jeans"}:
                                  </span>
                                  {product.sizes2.map((sz2) => (
                                    <button
                                      key={sz2}
                                      type="button"
                                      onClick={() => {
                                        const updated = [...selectedSizes2];
                                        updated[idx] = sz2;
                                        setSelectedSizes2(updated);
                                      }}
                                      className={`px-2 py-1 text-[11px] font-bold rounded border transition cursor-pointer ${
                                        selectedSizes2[idx] === sz2
                                          ? "bg-amber-400 text-black border-amber-400"
                                          : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                                      }`}
                                    >
                                      {sz2}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {product.sizes.map((sz) => (
                                <button
                                  key={sz}
                                  type="button"
                                  onClick={() => {
                                    const updated = [...selectedSizes];
                                    updated[idx] = sz;
                                    setSelectedSizes(updated);
                                  }}
                                  className={`px-2.5 py-1 text-[11px] font-bold rounded border transition cursor-pointer ${
                                    selectedSizes[idx] === sz
                                      ? "bg-amber-400 text-black border-amber-400"
                                      : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
                                  }`}
                                >
                                  {sz}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    product.hasDualSizes ? (
                      <div className="space-y-4">
                        {product.sizes && product.sizes.length > 0 && (
                          <div>
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                              {t("select_size") + ` (${product.dualSizesTitle1 || "Size 1"}):`}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {product.sizes.map((size) => (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => setSelectedSize(size)}
                                  className={`px-3.5 h-12 rounded-lg border transition flex flex-col items-center justify-center min-w-[3.5rem] cursor-pointer ${
                                    selectedSize === size
                                      ? "bg-amber-400 text-black border-amber-400 font-extrabold"
                                      : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                                  }`}
                                >
                                  <span className="text-xs font-bold leading-none">{size}</span>
                                  {product.sizePrices?.[size] !== undefined && (
                                    <span className="text-[8px] font-bold mt-1 leading-none opacity-80">
                                      {product.sizePrices[size]} SAR
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
 
                        {product.sizes2 && product.sizes2.length > 0 && (
                          <div>
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                              {t("select_size") + ` (${product.dualSizesTitle2 || "Size 2"}):`}
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {product.sizes2.map((size) => (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => setSelectedSize2(size)}
                                  className={`px-3.5 h-10 rounded-lg text-xs font-bold border transition flex items-center justify-center min-w-[3rem] cursor-pointer ${
                                    selectedSize2 === size
                                      ? "bg-amber-400 text-black border-amber-400 font-extrabold"
                                      : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                                  }`}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      product.sizes && product.sizes.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {product.sizes.map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => setSelectedSize(size)}
                              className={`h-12 px-3.5 rounded-lg border transition flex flex-col items-center justify-center min-w-[3.5rem] cursor-pointer ${
                                selectedSize === size
                                  ? "bg-amber-400 text-black border-amber-400 font-extrabold"
                                  : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                              }`}
                            >
                              <span className="text-xs font-bold leading-none">{size}</span>
                              {product.sizePrices?.[size] !== undefined && (
                                <span className="text-[8px] font-bold mt-1 leading-none opacity-80">
                                  {product.sizePrices[size]} SAR
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )
                    )
                  )}
                </div>

                {/* 4. Quantity Selector */}
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">
                    {t("select_quantity")}
                  </label>
                  <div className="flex items-center gap-1 w-32 border border-neutral-200 rounded-lg overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-neutral-50 transition text-neutral-500 font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="flex-grow text-center text-sm font-bold text-neutral-800">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => Math.min(product.stock, prev + 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-neutral-50 transition text-neutral-500 font-bold"
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Purchase Actions */}
              <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0 || addingState !== "idle"}
                  className={`flex items-center justify-center gap-2 font-bold text-sm py-3.5 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed select-none ${
                    addingState === "added"
                      ? "bg-emerald-500 border border-emerald-500 text-white animate-pulse shadow-md shadow-emerald-500/20"
                      : addingState === "adding"
                      ? "bg-amber-500 border border-amber-500 text-white cursor-wait"
                      : "border border-black text-black hover:bg-neutral-50 cursor-pointer"
                  }`}
                >
                  {addingState === "adding" ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t("adding")}</span>
                    </>
                  ) : addingState === "added" ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{t("added")}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span>{t("add_to_cart")}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="flex items-center justify-center gap-2 bg-black hover:bg-neutral-900 font-bold text-sm text-white py-3.5 rounded-full transition shadow-lg shadow-black/15 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{t("buy_now")}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Product description (Accordion style / text block) */}
              <div className="mt-6 pt-5 border-t border-neutral-100">
                <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-widest mb-2">
                  {t("product_description")}
                </h4>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans">
                  {product.description}
                </p>
              </div>

            </div>
          </div>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="mt-12 pt-8 border-t border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900 uppercase tracking-wider mb-6">
                {t("related_products")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {relatedProducts.map((rel) => {
                  const hasRelOffer = rel.offerPrice !== undefined && rel.offerPrice < rel.price;
                  return (
                    <div
                      key={rel.id}
                      onClick={() => onSelectRelated(rel)}
                      className="group cursor-pointer flex gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-100 hover:border-amber-400/30 transition-all duration-300"
                    >
                      <div className="w-16 h-20 bg-neutral-100 rounded-lg overflow-hidden shrink-0">
                        <img
                          src={rel.images[0]}
                          alt={rel.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="text-[9px] font-bold uppercase text-amber-600 tracking-wider">
                          {rel.category}
                        </span>
                        <h4 className="text-xs font-semibold text-neutral-800 line-clamp-1 leading-snug tracking-tight mb-1">
                          {rel.name}
                        </h4>
                        <span className="text-xs font-bold text-black font-sans">
                          {hasRelOffer ? rel.offerPrice : rel.price} SAR
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
