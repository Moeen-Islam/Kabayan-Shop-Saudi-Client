import React, { useState, useEffect } from "react";
import { X, Check, ShoppingCart, ArrowRight, Minus, Plus, RefreshCw, ZoomIn } from "lucide-react";
import { Product } from "../types";
import { cartStore } from "../lib/cartStore";
import { trackPixelEvent } from "../lib/metaPixel";

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
    olive: "#808000"
  };
  return map[col] || "#cbd5e1";
}

export default function ProductDetailsModal({
  product,
  allProducts,
  onClose,
  onAddToCartSuccess,
  onBuyNowSuccess,
  onSelectRelated
}: ProductDetailsModalProps) {
  const [activeImage, setActiveImage] = useState((product && product.images && product.images[0]) || "");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedSize2, setSelectedSize2] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});

  // Reset local state when product changes
  useEffect(() => {
    if (!product) return;
    setActiveImage((product.images && product.images[0]) || "");
    setSelectedSize((product.sizes && product.sizes[0]) || "Free Size");
    setSelectedSize2((product.hasDualSizes && product.sizes2 && product.sizes2[0]) || "");
    const initialColor = (product.colors && product.colors[0]) || "Multi";
    setSelectedColor(initialColor);
    setSelectedColors([initialColor]);
    setSelectedPackage((product.packageTypes && product.packageTypes[0]) || "Single Piece");
    setQuantity(1);
    setIsZoomed(false);
  }, [product]);

  // Keep selectedColors array in sync with the current quantity
  useEffect(() => {
    if (!product) return;
    const defaultColor = selectedColor || (product.colors && product.colors[0]) || "Multi";
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
  }, [quantity, product, selectedColor]);

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
  const basePrice = hasOffer ? product.offerPrice! : product.price;
  
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

  // Add to Cart handler
  const handleAddToCart = () => {
    if (product.stock === 0) return;
    
    const finalSize = product.hasDualSizes
      ? `${product.dualSizesTitle1 || "Jacket Size"}: ${selectedSize} | ${product.dualSizesTitle2 || "Jeans Waist Size"}: ${selectedSize2}`
      : selectedSize;

    const finalColor = selectedColors.length > 0 ? selectedColors.join(", ") : selectedColor;

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

    onAddToCartSuccess();
  };

  // Buy Now handler
  const handleBuyNow = () => {
    if (product.stock === 0) return;

    const finalSize = product.hasDualSizes
      ? `${product.dualSizesTitle1 || "Jacket Size"}: ${selectedSize} | ${product.dualSizesTitle2 || "Jeans Waist Size"}: ${selectedSize2}`
      : selectedSize;

    const finalColor = selectedColors.length > 0 ? selectedColors.join(", ") : selectedColor;

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header bar */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-100 bg-white">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-600 font-mono">
            Product Detail Overview
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 transition text-neutral-500 hover:text-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="overflow-y-auto p-6 flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Column: Image Slider and Zoom */}
            <div className="flex flex-col gap-4">
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
                      src={activeImage}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover blur-lg opacity-40 scale-110 select-none pointer-events-none"
                    />
                    <img
                      src={activeImage}
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
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`relative w-16 sm:w-20 aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all flex items-center justify-center bg-neutral-50 ${
                        activeImage === img ? "border-amber-400 scale-95" : "border-transparent hover:border-neutral-300"
                      }`}
                    >
                      <img
                        src={img}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover blur-md opacity-40 scale-110 pointer-events-none"
                      />
                      <img
                        src={img}
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
                    In Stock ({product.stock} units available)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-red-700 bg-red-50 px-2.5 py-1 rounded-full font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    Out of Stock / Restocking Soon
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
                      1. Select Package Option:
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

                {/* 2. Color Selection */}
                {product.colors && product.colors.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                      2. Select Color{quantity > 1 ? `s (${quantity} Items)` : ""}:
                    </label>
                    {quantity > 1 ? (
                      <div className="space-y-3 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/80">
                        <p className="text-[10px] text-neutral-400 font-medium leading-normal mb-1">
                          Select the color for each of your {quantity} items below:
                        </p>
                        {Array.from({ length: quantity }).map((_, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200/50 last:border-0 pb-2.5 last:pb-0">
                            <span className="text-xs font-bold text-neutral-700 font-mono">
                              Item #{idx + 1} Color:
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
                {product.hasDualSizes ? (
                  <div className="space-y-4">
                    {product.sizes && product.sizes.length > 0 && (
                      <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">
                          3. Select {product.dualSizesTitle1 || "Jacket Size"}:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {product.sizes.map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => setSelectedSize(size)}
                              className={`px-3 h-10 rounded-lg text-xs font-bold border transition flex items-center justify-center min-w-[3rem] ${
                                selectedSize === size
                                  ? "bg-amber-400 text-black border-amber-400"
                                  : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {product.sizes2 && product.sizes2.length > 0 && (
                      <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">
                          Select {product.dualSizesTitle2 || "Jeans Waist Size"}:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {product.sizes2.map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => setSelectedSize2(size)}
                              className={`px-3 h-10 rounded-lg text-xs font-bold border transition flex items-center justify-center min-w-[3rem] ${
                                selectedSize2 === size
                                  ? "bg-amber-400 text-black border-amber-400"
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
                    <div>
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">
                        3. Select Size:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`w-12 h-10 rounded-lg text-xs font-bold border transition flex items-center justify-center ${
                              selectedSize === size
                                ? "bg-amber-400 text-black border-amber-400"
                                : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                )}

                {/* 4. Quantity Selector */}
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-2">
                    4. Select Quantity:
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
                  disabled={product.stock === 0}
                  className="flex items-center justify-center gap-2 border border-black hover:bg-neutral-50 font-bold text-sm text-black py-3.5 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add To Cart</span>
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="flex items-center justify-center gap-2 bg-black hover:bg-neutral-900 font-bold text-sm text-white py-3.5 rounded-full transition shadow-lg shadow-black/15 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Buy Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Product description (Accordion style / text block) */}
              <div className="mt-6 pt-5 border-t border-neutral-100">
                <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-widest mb-2">
                  Product Description
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
                You May Also Like
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
