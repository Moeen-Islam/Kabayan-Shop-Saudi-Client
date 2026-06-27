import { useState, useEffect } from "react";
import { OrderItem } from "../types";
import { safeStorage } from "./safeStorage";

export interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number; // Item price or offerPrice
  selectedColor: string;
  selectedSize: string;
  selectedPackageType: string;
  basePrice?: number;
  packageTypes?: string[];
  packagePrices?: Record<string, number>;
}

// A simple pub-sub system for cross-component state updates
type Listener = () => void;
let listeners: Listener[] = [];

let cartItems: CartItem[] = [];

// Load initial cart
if (typeof window !== "undefined") {
  try {
    const saved = safeStorage.getItem("kabayan_cart");
    if (saved) {
      cartItems = JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load cart from safeStorage", e);
  }
}

function notify() {
  listeners.forEach((l) => l());
  if (typeof window !== "undefined") {
    safeStorage.setItem("kabayan_cart", JSON.stringify(cartItems));
  }
}

export const cartStore = {
  getItems() {
    return cartItems;
  },

  subscribe(listener: Listener) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },

  addItem(item: CartItem) {
    // Check if exactly same item is already in cart
    const existingIndex = cartItems.findIndex(
      (i) =>
        i.productId === item.productId &&
        i.selectedColor === item.selectedColor &&
        i.selectedSize === item.selectedSize &&
        i.selectedPackageType === item.selectedPackageType
    );

    if (existingIndex > -1) {
      cartItems[existingIndex].quantity += item.quantity;
    } else {
      cartItems.push(item);
    }
    notify();
  },

  removeItem(productId: string, color: string, size: string, packageType: string) {
    cartItems = cartItems.filter(
      (i) =>
        !(
          i.productId === productId &&
          i.selectedColor === color &&
          i.selectedSize === size &&
          i.selectedPackageType === packageType
        )
    );
    notify();
  },

  updateQuantity(
    productId: string,
    color: string,
    size: string,
    packageType: string,
    quantity: number
  ) {
    const index = cartItems.findIndex(
      (i) =>
        i.productId === productId &&
        i.selectedColor === color &&
        i.selectedSize === size &&
        i.selectedPackageType === packageType
    );

    if (index > -1) {
      const item = cartItems[index];
      const newQty = Math.max(1, quantity);
      item.quantity = newQty;

      // Dynamically adjust price and package type based on the new quantity if basePrice is available
      if (item.basePrice !== undefined) {
        const pkgTypes = item.packageTypes || ["Single Piece"];
        const pkgPrices = item.packagePrices || {};

        // Find if there is an explicit package type matching the new quantity
        let matchedPkg = pkgTypes.find((pkg) => {
          const name = pkg.toLowerCase();
          let count = 1;
          const match = name.match(/(?:pack|combo|set|pieces|pcs)\s*(?:of)?\s*(\d+)/i) || 
                        name.match(/(\d+)\s*(?:pcs|pc|piece|pieces|pack|combo|set)/i) ||
                        name.match(/^(\d+)\s*$/);
          if (match && match[1]) {
            count = parseInt(match[1], 10);
          } else if (name.includes("pair") || name.includes("terno") || name.includes("double")) {
            count = 2;
          } else if (name.includes("triple")) {
            count = 3;
          } else if (name.includes("dozen")) {
            count = 12;
          }
          return count === newQty;
        });

        if (!matchedPkg && newQty === 1) {
          matchedPkg = pkgTypes.find(
            (p) =>
              p.toLowerCase().includes("single") ||
              p.toLowerCase().includes("one")
          ) || pkgTypes[0];
        }

        if (matchedPkg) {
          item.selectedPackageType = matchedPkg;
          let pkgPrice = pkgPrices[matchedPkg];
          if (pkgPrice === undefined) {
            const name = matchedPkg.toLowerCase();
            let count = 1;
            const match = name.match(/(?:pack|combo|set|pieces|pcs)\s*(?:of)?\s*(\d+)/i) || 
                          name.match(/(\d+)\s*(?:pcs|pc|piece|pieces|pack|combo|set)/i);
            if (match && match[1]) {
              count = parseInt(match[1], 10);
            }
            let disc = 1.0;
            if (count === 2) disc = 0.90;
            else if (count === 3) disc = 0.85;
            else if (count >= 4 && count <= 5) disc = 0.80;
            else if (count >= 6 && count <= 11) disc = 0.75;
            else if (count >= 12) disc = 0.70;

            pkgPrice = Math.round(item.basePrice * count * disc);
          }
          item.price = Math.round((pkgPrice / newQty) * 100) / 100;
        } else {
          // Fallback dynamic progressive discount
          let disc = 1.0;
          if (newQty === 2) disc = 0.90;
          else if (newQty === 3) disc = 0.85;
          else if (newQty >= 4 && newQty <= 5) disc = 0.80;
          else if (newQty >= 6 && newQty <= 11) disc = 0.75;
          else if (newQty >= 12) disc = 0.70;

          item.price = Math.round(item.basePrice * disc * 100) / 100;
        }
      }

      notify();
    }
  },

  clearCart() {
    cartItems = [];
    notify();
  },

  getSubtotal() {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
};

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(cartStore.getItems());

  useEffect(() => {
    const unsubscribe = cartStore.subscribe(() => {
      setItems([...cartStore.getItems()]);
    });
    return unsubscribe;
  }, []);

  return {
    items,
    subtotal: cartStore.getSubtotal(),
    addItem: cartStore.addItem,
    removeItem: cartStore.removeItem,
    updateQuantity: cartStore.updateQuantity,
    clearCart: cartStore.clearCart
  };
}
