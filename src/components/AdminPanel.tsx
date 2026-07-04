"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3, ShoppingCart, FolderHeart, Truck, Key,
  Search, Plus, Edit, Trash2, Check, X, Eye,
  TrendingUp, CircleDollarSign, CalendarDays, ExternalLink,
  MapPin, Sliders, ChevronRight, RefreshCw, MessageSquare,
  UploadCloud, CheckCircle, ShieldAlert
} from "lucide-react";
import { Product, Category, Order, DeliveryArea, Coupon, ShopSettings, DashboardStats } from "../types";
import { safeStorage } from "../lib/safeStorage";

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
const localStorage = safeStorage;

interface AdminPanelProps {
  products: Product[];
  categories: Category[];
  areas: DeliveryArea[];
  coupons: Coupon[];
  settings: ShopSettings;
  onRefreshAll: () => void;
}

export default function AdminPanel({
  products,
  categories,
  areas,
  coupons,
  settings,
  onRefreshAll
}: AdminPanelProps) {
  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [adminToken, setAdminToken] = useState("");

  // Tabs: "overview", "orders", "products", "shipping-coupons", "settings"
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem("kabayan_admin_active_tab") || "overview";
    } catch {
      return "overview";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("kabayan_admin_active_tab", activeTab);
    } catch (e) {
      console.error(e);
    }
  }, [activeTab]);

  // Mobile Tab Menu State
  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);

  // Dashboard Stats State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Product forms State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    description: "",
    imageUrlInput: "",
    images: [] as string[],
    price: "",
    offerPrice: "",
    purchasePrice: "",
    rating: "",
    sizePrices: {} as Record<string, number>,
    clothShopOwner: "",
    stock: "",
    sizesInput: "",
    colorsInput: "",
    packageTypesInput: "",
    packagePrices: {} as Record<string, number>,
    status: "active" as "active" | "draft",
    isTrending: false,
    hasDualSizes: false,
    dualSizesTitle1: "Jacket Size",
    dualSizesTitle2: "Jeans Waist Size",
    sizes2Input: "",
    colorImageMap: {} as Record<string, string>,
    isGroupOrder: false
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Category State
  const [newCatName, setNewCatName] = useState("");
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success"
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };
  // Delivery Area State
  const [editingArea, setEditingArea] = useState<DeliveryArea | null>(null);
  const [areaForm, setAreaForm] = useState({ name: "", charge: "", driverCharge: "", deliveryTime: "", freeDeliveryAbove: "", minOrderValue: "" });
  const [isAddingArea, setIsAddingArea] = useState(false);
  const [editingPhoneOrderId, setEditingPhoneOrderId] = useState<string | null>(null);
  const [editPhoneValue, setEditPhoneValue] = useState("");

  // Coupon State
  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [localCoupons, setLocalCoupons] = useState<Coupon[]>([]);
  const [couponForm, setCouponForm] = useState({
    code: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    expiryDate: ""
  });

  // Custom Delete Confirm Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const confirmDeleteAction = (title: string, message: string, onConfirm: () => void) => {
    setDeleteConfirm({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  // Monthly Report Generator State
  const [selectedReportMonth, setSelectedReportMonth] = useState(() => new Date().toISOString().substring(0, 7));

  const getAvailableReportMonths = () => {
    const months = new Set<string>();
    orders.forEach(o => {
      if (o.createdAt) {
        months.add(o.createdAt.substring(0, 7));
      }
    });
    months.add(new Date().toISOString().substring(0, 7));
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  };

  const getMonthlyReportStats = (month: string) => {
    const monthOrders = orders.filter(o => o.createdAt && o.createdAt.startsWith(month));
    const activeOrders = monthOrders.filter(o => o.status !== "Cancelled");
    
    const totalSales = activeOrders.reduce((sum, o) => sum + o.grandTotal, 0);

    const calculateOrderStats = (o: Order) => {
      const cost = o.items.reduce((sum, item) => {
        const pPrice = item.purchasePrice !== undefined ? item.purchasePrice : 0;
        return sum + (pPrice * item.quantity);
      }, 0);
      const driverCost = o.driverDeliveryCharge !== undefined ? o.driverDeliveryCharge : 0;
      const profit = o.status === "Delivered" ? (o.grandTotal - cost - driverCost) : 0;
      return { cost, profit };
    };

    const totalCost = activeOrders.reduce((sum, o) => sum + calculateOrderStats(o).cost, 0);

    const deliveredOrders = monthOrders.filter(o => o.status === "Delivered");
    const totalProfit = deliveredOrders.reduce((sum, o) => sum + calculateOrderStats(o).profit, 0);

    const areaStatsMap: {
      [key: string]: {
        areaName: string;
        sales: number;
        orderCount: number;
        cost: number;
        profit: number;
      }
    } = {};

    monthOrders.forEach(o => {
      const areaName = o.areaName || "Unknown Area";
      if (!areaStatsMap[areaName]) {
        areaStatsMap[areaName] = {
          areaName,
          sales: 0,
          orderCount: 0,
          cost: 0,
          profit: 0
        };
      }

      areaStatsMap[areaName].orderCount += 1;

      if (o.status !== "Cancelled") {
        areaStatsMap[areaName].sales += o.grandTotal;
        const { cost } = calculateOrderStats(o);
        areaStatsMap[areaName].cost += cost;
      }

      if (o.status === "Delivered") {
        const { profit } = calculateOrderStats(o);
        areaStatsMap[areaName].profit += profit;
      }
    });

    const areaStats = Object.values(areaStatsMap).sort((a, b) => b.sales - a.sales);

    return {
      totalOrders: monthOrders.length,
      activeOrdersCount: activeOrders.length,
      deliveredOrdersCount: deliveredOrders.length,
      cancelledOrdersCount: monthOrders.filter(o => o.status === "Cancelled").length,
      totalSales,
      totalCost,
      totalProfit,
      areaStats
    };
  };

  // Settings State
  const [shopSettingsForm, setShopSettingsForm] = useState({
    shopName: "",
    whatsappContact: "",
    currency: "SAR",
    bannerImageInput: "",
    bannerImages: [] as string[],
    aboutUs: "",
    contactEmail: "",
    contactAddress: "",
    metaPixelId: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    messengerPageId: "",
    adminEmail: "",
    adminPassword: ""
  });

  // Verify previous session
  useEffect(() => {
    const savedToken = localStorage.getItem("kabayan_admin_token");
    if (savedToken) {
      setAdminToken(savedToken);
      setIsLoggedIn(true);
    }
  }, []);

  // Sync local coupons with props fallback
  useEffect(() => {
    setLocalCoupons(coupons);
  }, [coupons]);

  // Fetch Admin Data
  useEffect(() => {
    if (isLoggedIn) {
      fetchDashboardStats();
      fetchOrders();
      fetchCoupons();
      // Initialize settings form
      setShopSettingsForm({
        shopName: settings.shopName || "",
        whatsappContact: settings.whatsappContact || "",
        currency: settings.currency || "SAR",
        bannerImageInput: "",
        bannerImages: settings.bannerImages || [],
        aboutUs: settings.aboutUs || "",
        contactEmail: settings.contactEmail || "",
        contactAddress: settings.contactAddress || "",
        metaPixelId: settings.metaPixelId || "",
        metaTitle: settings.metaTitle || "",
        metaDescription: settings.metaDescription || "",
        metaKeywords: settings.metaKeywords || "",
        messengerPageId: settings.messengerPageId || "",
        adminEmail: settings.adminEmail || "",
        adminPassword: settings.adminPassword || ""
      });
    }
  }, [isLoggedIn, settings]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const response = await fetch(API_URL + "/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Login failed");
      }
      const data = await response.json();
      localStorage.setItem("kabayan_admin_token", `Bearer ${data.token}`);
      setAdminToken(`Bearer ${data.token}`);
      setIsLoggedIn(true);
    } catch (err: any) {
      setLoginError(err.message || "Invalid credentials");
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("kabayan_admin_token");
    setAdminToken("");
    setIsLoggedIn(false);
  };

  // Fetch Stats API
  const fetchDashboardStats = async () => {
    setStatsLoading(true);
    try {
      const token = adminToken || localStorage.getItem("kabayan_admin_token");
      const response = await fetch(API_URL + "/admin/stats", {
        headers: { "Authorization": token || "" }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch Orders API
  const fetchOrders = async () => {
    try {
      const token = adminToken || localStorage.getItem("kabayan_admin_token");
      const response = await fetch(API_URL + "/orders", {
        headers: { "Authorization": token || "" }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch orders", err);
    }
  };

  // Update Order Status API
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const token = adminToken || localStorage.getItem("kabayan_admin_token");
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token || ""
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        fetchOrders();
        fetchDashboardStats();
        onRefreshAll();
        // Update selected order view
        if (selectedOrder && selectedOrder.id === orderId) {
          const updatedOrder = { ...selectedOrder, status: status as any };
          setSelectedOrder(updatedOrder);
        }
      } else {
        const err = await response.json();
        showToast(`Error updating order status: ${err.error}`, "error");
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  // Update Customer Phone Number (whatsapp) API
  const handleSaveCustomerPhone = async () => {
    if (!editingPhoneOrderId || !editPhoneValue.trim()) return;
    try {
      const token = adminToken || localStorage.getItem("kabayan_admin_token");
      const response = await fetch(`${API_URL}/orders/${editingPhoneOrderId}/whatsapp`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token || ""
        },
        body: JSON.stringify({ whatsapp: editPhoneValue.trim() })
      });
      if (response.ok) {
        const data = await response.json();
        // Refresh orders list
        fetchOrders();
        // Update selected order view details
        if (selectedOrder && selectedOrder.id === editingPhoneOrderId) {
          setSelectedOrder(data.order || { ...selectedOrder, whatsapp: editPhoneValue.trim() });
        }
        setEditingPhoneOrderId(null);
      } else {
        const err = await response.json();
        showToast(`Error updating phone number: ${err.error}`, "error");
      }
    } catch (err) {
      console.error("Failed to update phone number", err);
    }
  };

  // Delete Order API
  const executeDeleteOrder = async (orderId: string) => {
    try {
      const token = adminToken || localStorage.getItem("kabayan_admin_token");
      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: "DELETE",
        headers: {
          "Authorization": token || ""
        }
      });
      if (response.ok) {
        showToast("Order permanently deleted successfully!", "success");
        fetchOrders();
        fetchDashboardStats();
        onRefreshAll();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(null);
        }
      } else {
        const err = await response.json();
        showToast(`Error deleting order: ${err.error}`, "error");
      }
    } catch (err) {
      console.error("Failed to delete order", err);
      showToast("Failed to delete order. Please try again.", "error");
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    confirmDeleteAction(
      "Delete Order",
      "Are you sure you want to permanently delete this order? This action cannot be undone.",
      () => executeDeleteOrder(orderId)
    );
  };

  // Send Delivery details to customer via WhatsApp
  const handleSendWhatsAppDispatch = (order: Order) => {
    let cleanPhone = order.whatsapp.replace(/[^0-9]/g, "");
    const areaObj = areas.find(a => a.id === order.areaId || a.name === order.areaName);
    const estDeliveryTime = order.deliveryTime || areaObj?.deliveryTime;

    let itemsText = order.items.map((item) => {
      const imgUrl = item.productImage.startsWith("http")
        ? item.productImage
        : `${window.location.origin}${item.productImage}`;
      return `• *${item.quantity}x* ${item.productName}\n  Size: ${item.selectedSize} | Color: ${item.selectedColor} | Type: ${item.selectedPackageType}\n  🖼️ Image: ${imgUrl}`;
    }).join("\n\n");

    const mapText = order.mapLink ? `• *Location Link:* ${order.mapLink}` : "• *Location:* No pin shared";
    const notesText = order.notes ? `• *Notes:* "${order.notes}"` : "";

    const msg = `*📦 KABAYAN SHOP SAUDI - DELIVERY SPECIFICATIONS*
━━━━━━━━━━━━━━━━━━━━━━
*Order Number:* #${order.orderNumber}
*Date:* ${new Date(order.createdAt).toLocaleDateString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}

👤 *CUSTOMER DETAILS:*
• *Name:* ${order.customerName}
• *WhatsApp Contact:* +${cleanPhone}
• *City/Area:* ${order.areaName}
${estDeliveryTime ? `• *Est. Delivery Time:* ${estDeliveryTime}\n` : ""}• *House No:* ${order.houseNo || "N/A"}
• *Full Address:* ${order.fullAddress}
${notesText ? notesText + "\n" : ""}${mapText}

📦 *ORDER ITEMS:*
${itemsText}

━━━━━━━━━━━━━━━━━━━━━━
💰 *PAYMENT SUMMARY:*
• Product Total: ${order.productTotal} SAR
${order.discountAmount ? `• Coupon Discount: -${order.discountAmount} SAR\n` : ""}• Delivery Fee: ${order.deliveryCharge} SAR
👉 *Total Bill:* *${order.grandTotal} SAR* (${order.paymentMethod || "Cash On Delivery"})

━━━━━━━━━━━━━━━━━━━━━━
Thank you for shopping with Kabayan Shop! ❤️`;

    const encodedText = encodeURIComponent(msg);
    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;

    window.open(waUrl, "_blank");
  };

  // Helper to compress image client-side before uploading
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 1000;
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              // Compress to JPEG with 82% quality
              const compressedBase64 = canvas.toDataURL("image/jpeg", 0.82);
              resolve(compressedBase64);
            } else {
              resolve(event.target?.result as string);
            }
          } catch (e) {
            console.error("Canvas compression failed, using original base64:", e);
            resolve(event.target?.result as string);
          }
        };
        img.onerror = () => {
          resolve(event.target?.result as string);
        };
      };
      reader.onerror = () => {
        resolve("");
      };
    });
  };

  // Upload local image file
  const uploadImageFile = async (file: File) => {
    setIsUploading(true);
    setUploadError("");
    try {
      const base64Data = await compressImage(file);
      if (!base64Data) {
        setUploadError("Failed to read file.");
        setIsUploading(false);
        return;
      }

      const token = adminToken || localStorage.getItem("kabayan_admin_token");
      // Change filename extension to .jpg since we convert to JPEG
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const finalFilename = `${baseName || "upload"}.jpg`;

      const response = await fetch(API_URL + "/admin/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token || ""
        },
        body: JSON.stringify({
          filename: finalFilename,
          data: base64Data
        })
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.success && resData.imageUrl) {
          setProductForm(prev => ({
            ...prev,
            images: [...prev.images, resData.imageUrl]
          }));
        } else {
          setUploadError("Failed to upload image. Unexpected server response.");
        }
      } else {
        const err = await response.json();
        setUploadError(err.error || "Failed to upload image.");
      }
      setIsUploading(false);
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(err.message || "An error occurred during file upload.");
      setIsUploading(false);
    }
  };

  // Upload multiple local image files in parallel
  const uploadMultipleImageFiles = async (files: FileList | File[]) => {
    setIsUploading(true);
    setUploadError("");
    const fileList = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (fileList.length === 0) {
      setUploadError("No valid image files selected.");
      setIsUploading(false);
      return;
    }

    try {
      const token = adminToken || localStorage.getItem("kabayan_admin_token");
      
      const uploadPromises = fileList.map(async (file) => {
        try {
          const base64Data = await compressImage(file);
          if (!base64Data) return null;

          const baseName = file.name.replace(/\.[^/.]+$/, "");
          const finalFilename = `${baseName || "upload"}.jpg`;

          const response = await fetch(API_URL + "/admin/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": token || ""
            },
            body: JSON.stringify({
              filename: finalFilename,
              data: base64Data
            })
          });

          if (response.ok) {
            const resData = await response.json();
            if (resData.success && resData.imageUrl) {
              return resData.imageUrl;
            }
          }
          return null;
        } catch (e) {
          console.error("Individual file upload failed:", e);
          return null;
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter((url): url is string => url !== null);

      if (validUrls.length > 0) {
        setProductForm(prev => ({
          ...prev,
          images: [...prev.images, ...validUrls]
        }));
      }

      if (validUrls.length < fileList.length) {
        setUploadError(`Uploaded ${validUrls.length} of ${fileList.length} images successfully. Some files failed.`);
      }
    } catch (err: any) {
      console.error("Batch upload error:", err);
      setUploadError("An error occurred during batch image upload.");
    } finally {
      setIsUploading(false);
    }
  };

  // Add Product Submit API
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = adminToken || localStorage.getItem("kabayan_admin_token");
      const payload = {
        name: productForm.name,
        category: productForm.category || categories[0]?.name || "Uncategorized",
        description: productForm.description,
        images: productForm.images,
        price: Number(productForm.price),
        offerPrice: productForm.offerPrice ? Number(productForm.offerPrice) : undefined,
        purchasePrice: productForm.purchasePrice ? Number(productForm.purchasePrice) : undefined,
        rating: productForm.rating ? Number(productForm.rating) : undefined,
        sizePrices: productForm.sizePrices,
        clothShopOwner: productForm.clothShopOwner,
        stock: Number(productForm.stock),
        sizes: productForm.sizesInput.split(",").map(s => s.trim()).filter(Boolean),
        colors: productForm.colorsInput.split(",").map(c => c.trim()).filter(Boolean),
        packageTypes: productForm.packageTypesInput.split(",").map(p => p.trim()).filter(Boolean),
        packagePrices: productForm.packagePrices,
        status: productForm.status,
        isTrending: !!productForm.isTrending,
        hasDualSizes: productForm.hasDualSizes,
        dualSizesTitle1: productForm.dualSizesTitle1,
        dualSizesTitle2: productForm.dualSizesTitle2,
        sizes2: productForm.sizes2Input.split(",").map(s => s.trim()).filter(Boolean),
        colorImageMap: productForm.colorImageMap,
        isGroupOrder: !!productForm.isGroupOrder
      };

      const response = await fetch(API_URL + "/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token || ""
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setIsAddingProduct(false);
        resetProductForm();
        onRefreshAll();
        showToast("Product added successfully!");
      } else {
        const err = await response.json();
        showToast(err.error || "Failed to add product", "error");
      }
    } catch (err) {
      console.error("Failed to add product", err);
    }
  };

  // Edit Product Submit API
  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const token = adminToken || localStorage.getItem("kabayan_admin_token");
      const payload = {
        name: productForm.name,
        category: productForm.category,
        description: productForm.description,
        images: productForm.images,
        price: Number(productForm.price),
        offerPrice: productForm.offerPrice ? Number(productForm.offerPrice) : undefined,
        purchasePrice: productForm.purchasePrice ? Number(productForm.purchasePrice) : undefined,
        rating: productForm.rating ? Number(productForm.rating) : undefined,
        sizePrices: productForm.sizePrices,
        clothShopOwner: productForm.clothShopOwner,
        stock: Number(productForm.stock),
        sizes: productForm.sizesInput.split(",").map(s => s.trim()).filter(Boolean),
        colors: productForm.colorsInput.split(",").map(c => c.trim()).filter(Boolean),
        packageTypes: productForm.packageTypesInput.split(",").map(p => p.trim()).filter(Boolean),
        packagePrices: productForm.packagePrices,
        status: productForm.status,
        isTrending: !!productForm.isTrending,
        hasDualSizes: productForm.hasDualSizes,
        dualSizesTitle1: productForm.dualSizesTitle1,
        dualSizesTitle2: productForm.dualSizesTitle2,
        sizes2: productForm.sizes2Input.split(",").map(s => s.trim()).filter(Boolean),
        colorImageMap: productForm.colorImageMap,
        isGroupOrder: !!productForm.isGroupOrder
      };

      const response = await fetch(`${API_URL}/products/${editingProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token || ""
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setEditingProduct(null);
        resetProductForm();
        onRefreshAll();
        showToast("Product updated successfully!");
      } else {
        const err = await response.json();
        showToast(err.error || "Failed to update product", "error");
      }
    } catch (err) {
      console.error("Failed to edit product", err);
    }
  };

  // Delete Product API
  const executeDeleteProduct = async (id: string) => {
    try {
      const token = adminToken || localStorage.getItem("kabayan_admin_token");
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
        headers: { "Authorization": token || "" }
      });
      if (response.ok) {
        onRefreshAll();
        showToast("Product deleted successfully!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = (id: string) => {
    confirmDeleteAction(
      "Delete Product",
      "Are you sure you want to delete this product?",
      () => executeDeleteProduct(id)
    );
  };

  // Categories CRUD APIs
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const token = adminToken || localStorage.getItem("kabayan_admin_token");
      const response = await fetch(API_URL + "/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token || ""
        },
        body: JSON.stringify({ name: newCatName })
      });
      if (response.ok) {
        setNewCatName("");
        onRefreshAll();
      } else {
        const err = await response.json();
        showToast(err.error || "Error adding category", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const executeDeleteCategory = async (id: string) => {
    try {
      const token = adminToken || localStorage.getItem("kabayan_admin_token");
      const response = await fetch(`${API_URL}/categories/${id}`, {
        method: "DELETE",
        headers: { "Authorization": token || "" }
      });
      if (response.ok) {
        onRefreshAll();
        showToast("Category deleted successfully!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = (id: string) => {
    confirmDeleteAction(
      "Delete Category",
      "Are you sure you want to delete this category?",
      () => executeDeleteCategory(id)
    );
  };

  // Shipping Area CRUD APIs
  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = adminToken || localStorage.getItem("kabayan_admin_token");
      const response = await fetch(API_URL + "/areas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token || ""
        },
        body: JSON.stringify({
          name: areaForm.name,
          charge: Number(areaForm.charge),
          driverCharge: areaForm.driverCharge ? Number(areaForm.driverCharge) : 0,
          deliveryTime: areaForm.deliveryTime,
          freeDeliveryAbove: areaForm.freeDeliveryAbove ? Number(areaForm.freeDeliveryAbove) : null,
          minOrderValue: areaForm.minOrderValue ? Number(areaForm.minOrderValue) : null
        })
      });
      if (response.ok) {
        setIsAddingArea(false);
        setAreaForm({ name: "", charge: "", driverCharge: "", deliveryTime: "", freeDeliveryAbove: "", minOrderValue: "" });
        onRefreshAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditAreaSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArea) return;
    try {
      const token = adminToken || localStorage.getItem("kabayan_admin_token");
      const response = await fetch(`${API_URL}/areas/${editingArea.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token || ""
        },
        body: JSON.stringify({
          name: areaForm.name,
          charge: Number(areaForm.charge),
          driverCharge: areaForm.driverCharge ? Number(areaForm.driverCharge) : 0,
          deliveryTime: areaForm.deliveryTime,
          freeDeliveryAbove: areaForm.freeDeliveryAbove ? Number(areaForm.freeDeliveryAbove) : null,
          minOrderValue: areaForm.minOrderValue ? Number(areaForm.minOrderValue) : null
        })
      });
      if (response.ok) {
        setEditingArea(null);
        setAreaForm({ name: "", charge: "", driverCharge: "", deliveryTime: "", freeDeliveryAbove: "", minOrderValue: "" });
        onRefreshAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const executeDeleteArea = async (id: string) => {
    try {
      const token = adminToken || localStorage.getItem("kabayan_admin_token");
      const response = await fetch(`${API_URL}/areas/${id}`, {
        method: "DELETE",
        headers: { "Authorization": token || "" }
      });
      if (response.ok) {
        onRefreshAll();
        showToast("Shipping area rate deleted successfully!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteArea = (id: string) => {
    confirmDeleteAction(
      "Delete Shipping Area",
      "Delete this shipping area?",
      () => executeDeleteArea(id)
    );
  };

  // Coupons CRUD APIs
  const fetchCoupons = async () => {
    try {
      const token = adminToken || localStorage.getItem("kabayan_admin_token");
      const response = await fetch(API_URL + "/coupons", {
        headers: { "Authorization": token || "" }
      });
      if (response.ok) {
        const data = await response.json();
        setLocalCoupons(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = adminToken || localStorage.getItem("kabayan_admin_token");
      const response = await fetch(API_URL + "/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token || ""
        },
        body: JSON.stringify({
          code: couponForm.code,
          discountType: couponForm.discountType,
          discountValue: Number(couponForm.discountValue),
          expiryDate: couponForm.expiryDate
        })
      });
      if (response.ok) {
        setIsAddingCoupon(false);
        setCouponForm({ code: "", discountType: "percentage", discountValue: "", expiryDate: "" });
        fetchCoupons();
        onRefreshAll();
      } else {
        const err = await response.json();
        showToast(err.error || "Failed to add coupon", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditCouponSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;
    try {
      const token = adminToken || localStorage.getItem("kabayan_admin_token");
      const response = await fetch(`${API_URL}/coupons/${editingCoupon.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token || ""
        },
        body: JSON.stringify({
          code: couponForm.code,
          discountType: couponForm.discountType,
          discountValue: Number(couponForm.discountValue),
          expiryDate: couponForm.expiryDate
        })
      });
      if (response.ok) {
        setEditingCoupon(null);
        setCouponForm({ code: "", discountType: "percentage", discountValue: "", expiryDate: "" });
        fetchCoupons();
        onRefreshAll();
      } else {
        const err = await response.json();
        showToast(err.error || "Failed to update coupon", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const executeDeleteCoupon = async (id: string) => {
    try {
      const token = adminToken || localStorage.getItem("kabayan_admin_token");
      const response = await fetch(`${API_URL}/coupons/${id}`, {
        method: "DELETE",
        headers: { "Authorization": token || "" }
      });
      if (response.ok) {
        fetchCoupons();
        onRefreshAll();
        showToast("Coupon deleted successfully!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCoupon = (id: string) => {
    confirmDeleteAction(
      "Delete Coupon",
      "Are you sure you want to delete this coupon code?",
      () => executeDeleteCoupon(id)
    );
  };

  // Shop Settings save API
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = adminToken || localStorage.getItem("kabayan_admin_token");
      const response = await fetch(API_URL + "/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token || ""
        },
        body: JSON.stringify({
          shopName: shopSettingsForm.shopName,
          whatsappContact: shopSettingsForm.whatsappContact,
          bannerImages: shopSettingsForm.bannerImages,
          aboutUs: shopSettingsForm.aboutUs,
          contactEmail: shopSettingsForm.contactEmail,
          contactAddress: shopSettingsForm.contactAddress,
          metaPixelId: shopSettingsForm.metaPixelId,
          messengerPageId: shopSettingsForm.messengerPageId,
          currency: shopSettingsForm.currency,
          adminEmail: shopSettingsForm.adminEmail,
          adminPassword: shopSettingsForm.adminPassword,
          metaTitle: shopSettingsForm.metaTitle,
          metaDescription: shopSettingsForm.metaDescription,
          metaKeywords: shopSettingsForm.metaKeywords
        })
      });
      if (response.ok) {
        onRefreshAll();
        setShopSettingsForm(prev => ({ ...prev, adminPassword: "" }));
        showToast("Shop settings saved successfully!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Utility resets
  const resetProductForm = () => {
    setProductForm({
      name: "",
      category: categories[0]?.name || "",
      description: "",
      imageUrlInput: "",
      images: [],
      price: "",
      offerPrice: "",
      purchasePrice: "",
      rating: "",
      sizePrices: {},
      clothShopOwner: "",
      stock: "",
      sizesInput: "S, M, L, XL, Free Size",
      colorsInput: "Multi",
      packageTypesInput: "Single Piece, 3pcs Combo Pack, 12pcs Combo",
      packagePrices: {},
      status: "active",
      isTrending: false,
      hasDualSizes: false,
      dualSizesTitle1: "Jacket Size",
      dualSizesTitle2: "Jeans Waist Size",
      sizes2Input: "28, 30, 32, 34, 36",
      colorImageMap: {},
      isGroupOrder: false
    });
  };

  const handleOpenAddProduct = () => {
    resetProductForm();
    setIsAddingProduct(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      category: prod.category,
      description: prod.description || "",
      imageUrlInput: "",
      images: prod.images || [],
      price: String(prod.price),
      offerPrice: prod.offerPrice ? String(prod.offerPrice) : "",
      purchasePrice: prod.purchasePrice ? String(prod.purchasePrice) : "",
      rating: prod.rating ? String(prod.rating) : "",
      sizePrices: prod.sizePrices || {},
      clothShopOwner: prod.clothShopOwner || "",
      stock: String(prod.stock),
      sizesInput: prod.sizes.join(", "),
      colorsInput: prod.colors.join(", "),
      packageTypesInput: prod.packageTypes.join(", "),
      packagePrices: prod.packagePrices || {},
      status: prod.status,
      isTrending: !!prod.isTrending,
      hasDualSizes: !!prod.hasDualSizes,
      dualSizesTitle1: prod.dualSizesTitle1 || "Jacket Size",
      dualSizesTitle2: prod.dualSizesTitle2 || "Jeans Waist Size",
      sizes2Input: prod.sizes2 ? prod.sizes2.join(", ") : "",
      colorImageMap: prod.colorImageMap || {},
      isGroupOrder: !!prod.isGroupOrder
    });
  };

  // Filter Orders list
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.whatsapp.includes(orderSearch);

    const matchesStatus = orderStatusFilter === "All" || order.status === orderStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Admin Login Screen UI
  if (!isLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-neutral-50">
        <div className="bg-white border border-neutral-200 shadow-xl rounded-2xl p-6 sm:p-10 w-full max-w-md animate-scale-in">
          <div className="text-center mb-8">
            <div className="bg-neutral-900 text-amber-400 p-4 rounded-full inline-block mb-3.5 shadow-md">
              <Key className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-neutral-900 tracking-wider">ADMIN LOG IN</h2>
            <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest font-mono">
              Kabayan Shop Saudi Operations
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Admin Email Address
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="[EMAIL_ADDRESS]"
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Security Password
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm bg-neutral-50 focus:outline-none focus:border-neutral-900"
              />
            </div>

            {loginError && (
              <p className="text-xs font-bold text-red-600">
                ⚠️ {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-neutral-950 hover:bg-black text-amber-400 font-extrabold text-xs uppercase tracking-widest py-3.5 rounded-lg transition shadow-md shadow-black/10"
            >
              Sign In to Dashboard
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-[10px] text-neutral-400">
              Authorized access only. All activities are securely monitored.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">

      {/* Header operations */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <span>OPERATIONS PANEL</span>
            <span className="text-xs bg-amber-100 text-amber-800 font-extrabold px-2.5 py-1 rounded-full font-mono">
              LIVE SYSTEM
            </span>
          </h2>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Store Admin • {new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchDashboardStats();
              fetchOrders();
              onRefreshAll();
            }}
            className="p-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-full text-neutral-700 transition"
            title="Reload Server Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/50 text-xs font-bold px-4 py-2.5 rounded-full transition"
          >
            Logout Securely
          </button>
        </div>
      </div>

      {/* Primary Tab Bar */}
      {/* Desktop Tabs View: Visible on md screens and larger */}
      <div className="hidden md:flex items-center gap-1.5 overflow-x-auto pb-1 mb-8 border-b border-neutral-200/80 scrollbar-hide">
        {[
          { id: "overview", label: "Stats Overview", icon: BarChart3 },
          { id: "orders", label: `Customer Orders (${orders.length})`, icon: ShoppingCart },
          { id: "products", label: `Product Manager (${products.length})`, icon: Sliders },
          { id: "shipping-coupons", label: "Shipping & Coupons", icon: Truck },
          { id: "settings", label: "Shop Customizer", icon: FolderHeart }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider shrink-0 transition border-b-2 -mb-[1px] ${isActive
                ? "border-amber-500 text-black font-black"
                : "border-transparent text-neutral-400 hover:text-neutral-700"
                }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Tab Selector Dropdown: Visible on screen widths below md */}
      <div className="md:hidden relative mb-8">
        <button
          type="button"
          onClick={() => setIsTabMenuOpen(!isTabMenuOpen)}
          className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-wider flex items-center justify-between text-neutral-800 shadow-sm"
        >
          <span className="flex items-center gap-2">
            {(() => {
              const activeInfo = [
                { id: "overview", label: "Stats Overview", icon: BarChart3 },
                { id: "orders", label: `Customer Orders (${orders.length})`, icon: ShoppingCart },
                { id: "products", label: `Product Manager (${products.length})`, icon: Sliders },
                { id: "shipping-coupons", label: "Shipping & Coupons", icon: Truck },
                { id: "settings", label: "Shop Customizer", icon: FolderHeart }
              ].find((t) => t.id === activeTab) || { label: "Select Section", icon: Sliders };
              const ActiveIcon = activeInfo.icon;
              return (
                <>
                  <ActiveIcon className="w-4 h-4 text-amber-500" />
                  <span>{activeInfo.label}</span>
                </>
              );
            })()}
          </span>
          <ChevronRight className={`w-4 h-4 text-neutral-400 transition-transform ${isTabMenuOpen ? "rotate-90" : ""}`} />
        </button>

        {isTabMenuOpen && (
          <div className="absolute top-[105%] left-0 right-0 bg-white border border-neutral-200 rounded-xl shadow-xl z-30 p-1.5 flex flex-col gap-1 divide-y divide-neutral-50 animate-scale-in">
            {[
              { id: "overview", label: "Stats Overview", icon: BarChart3 },
              { id: "orders", label: `Customer Orders (${orders.length})`, icon: ShoppingCart },
              { id: "products", label: `Product Manager (${products.length})`, icon: Sliders },
              { id: "shipping-coupons", label: "Shipping & Coupons", icon: Truck },
              { id: "settings", label: "Shop Customizer", icon: FolderHeart }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsTabMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4.5 py-3.5 text-xs font-bold uppercase tracking-wider transition rounded-lg text-left ${
                    isActive
                      ? "bg-amber-50 text-black"
                      : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-amber-500" : "text-neutral-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 1: OVERVIEW */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === "overview" && (
        <div className="space-y-8">

          {/* Stats Cards Row */}
          {statsLoading || !stats ? (
            <div className="text-center py-20 text-neutral-400 font-semibold flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Retrieving statistics aggregates...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

                {/* Total Orders Card */}
                <div className="bg-white p-5 rounded-2xl border border-neutral-200/70 shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Total Orders</span>
                    <span className="p-2 bg-neutral-100 rounded-lg text-neutral-800">
                      <ShoppingCart className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 font-sans leading-none">{stats.totalOrders}</h3>
                    <p className="text-[10px] text-neutral-400 font-semibold mt-1">Submitted in database</p>
                  </div>
                </div>

                {/* Total Revenue Card */}
                <div className="bg-white p-5 rounded-2xl border border-neutral-200/70 shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-sans">Total Revenue</span>
                    <span className="p-2 bg-green-50 rounded-lg text-green-600">
                      <CircleDollarSign className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 font-sans leading-none">
                      {stats.totalRevenue} <span className="text-xs font-semibold">SAR</span>
                    </h3>
                    <p className="text-[10px] text-green-600 font-bold mt-1">✓ From confirmed sales</p>
                  </div>
                </div>

                {/* Monthly Revenue Card */}
                <div className="bg-white p-5 rounded-2xl border border-neutral-200/70 shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-sans">This Month</span>
                    <span className="p-2 bg-amber-50 rounded-lg text-amber-600">
                      <CalendarDays className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 font-sans leading-none">
                      {stats.monthlyRevenue} <span className="text-xs font-semibold">SAR</span>
                    </h3>
                    <p className="text-[10px] text-amber-600 font-bold mt-1">Current Month Sales</p>
                  </div>
                </div>

                {/* Monthly Profit Card */}
                <div className="bg-amber-50/30 p-5 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-widest font-sans">Monthly Profit</span>
                    <span className="p-2 bg-amber-100 rounded-lg text-amber-700">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl sm:text-3xl font-black text-amber-900 font-sans leading-none">
                      {stats.monthlyProfit !== undefined ? stats.monthlyProfit : 0} <span className="text-xs font-semibold">SAR</span>
                    </h3>
                    <p className="text-[10px] text-amber-700 font-bold mt-1">Est. Net Profit</p>
                  </div>
                </div>

                {/* Active Orders Ratios */}
                <div className="bg-neutral-900 text-white p-5 rounded-2xl border border-neutral-800 shadow-sm flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Pending Fulfils</span>
                    <span className="p-2 bg-neutral-800 rounded-lg text-amber-400">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl sm:text-3xl font-black text-amber-400 font-sans leading-none">
                      {stats.pendingOrders} <span className="text-xs font-semibold text-white">Pending</span>
                    </h3>
                    <p className="text-[10px] text-neutral-400 font-semibold mt-1">
                      {stats.confirmedOrders} confirmed • {stats.deliveredOrders} delivered
                    </p>
                  </div>
                </div>

              </div>

              {/* Graphical Visualizations (Custom SVG Charting Area) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. Daily Sales SVG Bar/Area Chart */}
                <div className="bg-white rounded-2xl border border-neutral-200 p-5">
                  <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-1.5">
                    <CircleDollarSign className="w-4 h-4 text-amber-600" />
                    <span>DAILY SALES GRAPH (LAST 7 DAYS)</span>
                  </h4>

                  {stats.salesByDay.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-neutral-400 text-xs">
                      No sales data captured yet.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="space-y-3.5 pt-2">
                        {stats.salesByDay.map((day, idx) => {
                          const maxAmount = Math.max(...stats.salesByDay.map(d => d.amount), 1);
                          const barWidth = `${Math.max(4, Math.round((day.amount / maxAmount) * 100))}%`;
                          return (
                            <div key={idx} className="flex items-center text-xs">
                              <span className="w-24 font-mono font-bold text-neutral-400 shrink-0">
                                {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                              <div className="flex-grow bg-neutral-100 h-6 rounded overflow-hidden mr-3">
                                <div
                                  className="bg-black text-amber-400 h-full flex items-center justify-end pr-2 text-[10px] font-bold transition-all duration-500 rounded"
                                  style={{ width: barWidth }}
                                >
                                  {day.amount > 0 && `${day.amount} SAR`}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Order Fulfilment Ratio Chart */}
                <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-amber-600" />
                      <span>ORDER STATUS COMPOSITION</span>
                    </h4>

                    {stats.totalOrders === 0 ? (
                      <div className="h-48 flex items-center justify-center text-neutral-400 text-xs">
                        No orders registered in system.
                      </div>
                    ) : (
                      <div className="space-y-4 pt-4">
                        {[
                          { label: "Pending", count: stats.pendingOrders, color: "bg-yellow-500" },
                          { label: "Confirmed", count: stats.confirmedOrders, color: "bg-blue-500" },
                          { label: "Delivered", count: stats.deliveredOrders, color: "bg-green-600" },
                          { label: "Cancelled", count: stats.cancelledOrders, color: "bg-red-500" }
                        ].map((item) => {
                          const percentage = Math.round((item.count / stats.totalOrders) * 100);
                          return (
                            <div key={item.label} className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-neutral-700">{item.label}</span>
                                <span className="text-neutral-500 font-mono">
                                  {item.count} ({percentage}%)
                                </span>
                              </div>
                              <div className="bg-neutral-100 h-2 rounded-full overflow-hidden">
                                <div className={`h-full ${item.color}`} style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* 3. Monthly Report Generator */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4 text-amber-600" />
                      <span>MONTHLY FINANCIAL REPORT GENERATOR</span>
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-semibold mt-1">
                      Compile aggregated total sales, cost, profit margins, and regional matrices.
                    </p>
                  </div>
                  {/* Select month dropdown */}
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-[10px] font-black uppercase text-neutral-400 font-sans">Month:</label>
                    <select
                      value={selectedReportMonth}
                      onChange={(e) => setSelectedReportMonth(e.target.value)}
                      className="px-3 py-1.5 border border-neutral-300 bg-white rounded-lg text-xs font-bold focus:outline-none focus:border-amber-500"
                    >
                      {getAvailableReportMonths().map(month => {
                        const dateObj = new Date(`${month}-02`); // Avoid timezone offsets
                        const monthLabel = dateObj.toLocaleDateString("en-US", { year: "numeric", month: "long" });
                        return (
                          <option key={month} value={month}>{monthLabel}</option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Report Content */}
                {(() => {
                  const report = getMonthlyReportStats(selectedReportMonth);
                  return (
                    <div className="space-y-6">
                      {/* Financial Aggregates Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/50">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block font-sans">Total Sales</span>
                          <span className="text-lg font-black text-neutral-800 mt-1 block">
                            {report.totalSales} <span className="text-[10px] font-semibold">SAR</span>
                          </span>
                          <span className="text-[9px] text-neutral-500 font-semibold block mt-1">
                            {report.activeOrdersCount} non-cancelled orders
                          </span>
                        </div>
                        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/50">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block font-sans">Total Cost</span>
                          <span className="text-lg font-black text-neutral-800 mt-1 block">
                            {report.totalCost} <span className="text-[10px] font-semibold">SAR</span>
                          </span>
                          <span className="text-[9px] text-neutral-500 font-semibold block mt-1">
                            Item purchase costs
                          </span>
                        </div>
                        <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/60">
                          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block font-sans">Total Net Profit</span>
                          <span className="text-lg font-black text-amber-900 mt-1 block">
                            {report.totalProfit} <span className="text-[10px] font-semibold">SAR</span>
                          </span>
                          <span className="text-[9px] text-amber-700 font-semibold block mt-1">
                            From {report.deliveredOrdersCount} delivered orders
                          </span>
                        </div>
                        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/50">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block font-sans">Order Stats</span>
                          <span className="text-lg font-black text-neutral-800 mt-1 block">
                            {report.totalOrders} <span className="text-[10px] font-semibold">Orders</span>
                          </span>
                          <span className="text-[9px] text-neutral-500 font-semibold block mt-1">
                            {report.cancelledOrdersCount} cancelled
                          </span>
                        </div>
                      </div>

                      {/* Regional Performance Metrics Matrix Table */}
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-black uppercase tracking-wider text-neutral-400 font-sans">
                          Saudi Regional Performance Matrix
                        </h5>
                        <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                                  <th className="px-4 py-3">Delivery Area / City</th>
                                  <th className="px-4 py-3 text-right">Orders</th>
                                  <th className="px-4 py-3 text-right">Gross Sales</th>
                                  <th className="px-4 py-3 text-right">Product Cost</th>
                                  <th className="px-4 py-3 text-right">Net Profit</th>
                                  <th className="px-4 py-3 text-right">Margin (%)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-200 text-xs">
                                {report.areaStats.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-neutral-400 font-semibold">
                                      No order activity recorded for this month.
                                    </td>
                                  </tr>
                                ) : (
                                  report.areaStats.map((area) => {
                                    const profitMargin = area.sales > 0 
                                      ? Math.round((area.profit / area.sales) * 100) 
                                      : 0;
                                    return (
                                      <tr key={area.areaName} className="hover:bg-neutral-50/60 font-medium text-neutral-800 transition">
                                        <td className="px-4 py-3 font-bold text-neutral-900">{area.areaName}</td>
                                        <td className="px-4 py-3 text-right font-mono">{area.orderCount}</td>
                                        <td className="px-4 py-3 text-right font-mono">{area.sales} SAR</td>
                                        <td className="px-4 py-3 text-right font-mono text-neutral-500">{area.cost} SAR</td>
                                        <td className={`px-4 py-3 text-right font-mono font-bold ${area.profit > 0 ? "text-emerald-600" : "text-neutral-700"}`}>
                                          {area.profit} SAR
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono">
                                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${profitMargin > 20 ? "bg-emerald-50 text-emerald-700" : "bg-neutral-50 text-neutral-600"}`}>
                                            {profitMargin}%
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </>
          )}

        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 2: ORDERS */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === "orders" && (
        <div className="space-y-6">

          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-neutral-200">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search orders by number, customer name, whatsapp..."
                className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-sans text-neutral-900"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              {["All", "Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition border ${orderStatusFilter === st
                    ? "bg-black text-amber-400 border-black"
                    : "bg-neutral-50 text-neutral-500 border-neutral-200 hover:text-black"
                    }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Grid/Table split with Selected Order details modal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Orders list (2/3 width) */}
            <div className="lg:col-span-2 space-y-3.5">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-neutral-200 text-neutral-400 font-semibold text-xs uppercase tracking-widest">
                  No orders matched current filters.
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`bg-white p-4.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${selectedOrder?.id === order.id
                      ? "border-amber-400 ring-2 ring-amber-400/10 shadow-md"
                      : "border-neutral-200 hover:border-neutral-400"
                      }`}
                  >
                    <div className="flex-grow space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono bg-neutral-100 px-2 py-0.5 rounded text-neutral-800">
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${order.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                          order.status === "Confirmed" ? "bg-blue-100 text-blue-800" :
                            order.status === "Packed" ? "bg-purple-100 text-purple-800" :
                              order.status === "Shipped" ? "bg-indigo-100 text-indigo-800" :
                                order.status === "Delivered" ? "bg-green-100 text-green-800" :
                                  "bg-red-100 text-red-800"
                          }`}>
                          {order.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-neutral-900 font-sans mt-1">
                        {order.customerName}
                      </h4>
                      <p className="text-[11px] text-neutral-500 truncate max-w-sm">
                        📍 {order.areaName} — {order.fullAddress}
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0 flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center gap-2">
                      <span className="text-xs font-mono text-neutral-400">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} Items
                      </span>
                      <span className="text-base font-black text-black font-sans">
                        {order.grandTotal} SAR
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Selected Order Detailed Inspector Sideboard (1/3 width) */}
            <div 
              onClick={() => setSelectedOrder(null)}
              className={selectedOrder
                ? "fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 lg:relative lg:inset-auto lg:z-0 lg:bg-transparent lg:backdrop-blur-none lg:flex-none lg:p-0"
                : "hidden lg:block bg-white p-5 rounded-2xl border border-neutral-200 h-fit space-y-6"
              }
            >
              {selectedOrder ? (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white p-4.5 sm:p-5 rounded-2xl border border-neutral-200 h-fit space-y-4.5 sm:space-y-5 w-full max-w-md shadow-2xl lg:shadow-none max-h-[85vh] overflow-y-auto animate-scale-in"
                >

                  {/* Title & Status Controls */}
                  <div className="border-b border-neutral-100 pb-4">
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-bold font-mono text-neutral-400">
                        ORDER INSPECTOR
                      </span>
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="text-xs text-neutral-400 hover:text-black font-bold"
                      >
                        Clear
                      </button>
                    </div>
                    <h3 className="text-lg font-black text-neutral-900 mt-1 font-mono flex items-center justify-between">
                      <span>{selectedOrder.orderNumber}</span>
                      <span className="text-sm font-sans font-extrabold text-amber-600">
                        {selectedOrder.grandTotal} SAR
                      </span>
                    </h3>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      Placed: {new Date(selectedOrder.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Customer Information */}
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                      Customer Specs:
                    </h4>
                    <div className="bg-neutral-50 rounded-xl p-3.5 border border-neutral-200/50 space-y-2 text-xs">
                      <div>Name: <strong className="text-neutral-900 font-bold">{selectedOrder.customerName}</strong></div>

                      {/* WhatsApp trigger link */}
                      <div className="flex items-center justify-between">
                        <span>WhatsApp Contact:</span>
                        {editingPhoneOrderId === selectedOrder.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editPhoneValue}
                              onChange={(e) => setEditPhoneValue(e.target.value)}
                              className="px-2 py-1 border border-neutral-300 rounded text-xs w-36 font-mono font-bold focus:outline-none focus:border-black bg-white text-neutral-800"
                            />
                            <button
                              onClick={handleSaveCustomerPhone}
                              className="p-1 bg-green-500 hover:bg-green-600 text-white rounded transition cursor-pointer"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingPhoneOrderId(null)}
                              className="p-1 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded transition cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://api.whatsapp.com/send?phone=${selectedOrder.whatsapp.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-green-600 font-bold hover:underline"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>+{selectedOrder.whatsapp}</span>
                            </a>
                            <button
                              onClick={() => {
                                setEditingPhoneOrderId(selectedOrder.id);
                                setEditPhoneValue(selectedOrder.whatsapp);
                              }}
                              className="p-1 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded transition cursor-pointer"
                              title="Edit Phone Number"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div>House No: <strong className="text-neutral-900">{selectedOrder.houseNo || "N/A"}</strong></div>
                      <div>City/Area: <strong className="text-neutral-900">{selectedOrder.areaName}</strong></div>
                      <div>Full Address: <strong className="text-neutral-900 block mt-0.5 leading-snug">{selectedOrder.fullAddress}</strong></div>
                      <div>Payment Option: <strong className="text-neutral-900">{selectedOrder.paymentMethod || "Cash On Delivery"}</strong></div>
                      {selectedOrder.notes && (
                        <div className="italic text-neutral-500 pt-1 border-t border-neutral-200/50">
                          Note: "{selectedOrder.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live GPS Maps Section */}
                  {selectedOrder.lat && selectedOrder.lng ? (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                        Live GPS Coordinates Saved:
                      </h4>
                      <a
                        href={selectedOrder.mapLink}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between text-amber-900 text-xs font-bold transition group"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-amber-600" />
                          <span>Open Live Google Map</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    </div>
                  ) : (
                    <div className="text-[10px] text-neutral-400 bg-neutral-50 p-3 rounded-lg border border-neutral-200/60 font-medium">
                      📍 Geolocation coordinates were not shared by this customer.
                    </div>
                  )}

                  {/* Ordered Items List */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                      Cart Contents:
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex gap-2.5 items-start justify-between text-xs border-b border-neutral-100 pb-2">
                          <div className="w-8 h-11 rounded overflow-hidden shrink-0 bg-neutral-100 flex items-center justify-center relative">
                            <img
                              src={item.productImage}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover blur-[2px] opacity-40 scale-110 pointer-events-none"
                            />
                            <img
                              src={item.productImage}
                              alt=""
                              className="relative z-10 max-w-full max-h-full w-auto h-auto object-contain pointer-events-none"
                            />
                          </div>
                          <div className="flex-grow min-w-0">
                            <span className="font-bold text-neutral-900 block truncate">{item.productName}</span>
                            <span className="text-[9px] text-neutral-400 font-mono block">
                              Sz: {item.selectedSize} | Col: {item.selectedColor} | {item.selectedPackageType}
                            </span>
                            {item.clothShopOwner && (
                              <span className="text-[8px] font-bold bg-amber-50 text-amber-800 border border-amber-200/50 rounded px-1.5 py-0.5 mt-1 inline-block uppercase tracking-wider">
                                Vendor: {item.clothShopOwner}
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-neutral-800 text-right shrink-0">
                            {item.quantity}x
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing break downs */}
                  <div className="bg-neutral-50 p-3.5 rounded-xl text-xs space-y-1.5 font-sans">
                    <div className="flex justify-between text-neutral-500">
                      <span>Products:</span>
                      <span className="font-bold">{selectedOrder.productTotal} SAR</span>
                    </div>
                    {selectedOrder.discountAmount && (
                      <div className="flex justify-between text-green-600">
                        <span>Coupon Discount:</span>
                        <span className="font-bold">-{selectedOrder.discountAmount} SAR</span>
                      </div>
                    )}
                    <div className="flex justify-between text-neutral-500">
                      <span>Delivery Fee:</span>
                      <span className="font-bold">{selectedOrder.deliveryCharge} SAR</span>
                    </div>
                    <div className="flex justify-between font-black text-black pt-1.5 border-t border-neutral-200">
                      <span>Final Bill:</span>
                      <span className="text-amber-600 font-extrabold">{selectedOrder.grandTotal} SAR</span>
                    </div>

                    {/* Private Est. Profit calculation */}
                    {(() => {
                      const totalCost = selectedOrder.items.reduce((costSum: number, item: any) => {
                        const purchasePrice = (item.purchasePrice !== undefined && item.purchasePrice !== 0)
                          ? item.purchasePrice 
                          : (products.find(p => p.id === item.productId)?.purchasePrice || 0);
                        return costSum + (purchasePrice * item.quantity);
                      }, 0);
                      const area = areas.find(a => a.name === selectedOrder.areaName || a.id === selectedOrder.areaId);
                      const driverCost = selectedOrder.driverDeliveryCharge !== undefined && selectedOrder.driverDeliveryCharge !== 0
                        ? selectedOrder.driverDeliveryCharge
                        : (area?.driverCharge || 0);
                      const profit = selectedOrder.grandTotal - totalCost - driverCost;
                      
                      return (
                        <div className="mt-2.5 pt-2 border-t border-dashed border-neutral-200/80 bg-neutral-900/5 -mx-3 px-3 py-2 rounded-lg flex flex-col gap-1 text-[10px] text-neutral-600 animate-fade-in">
                          <div className="flex justify-between font-extrabold text-neutral-800 uppercase tracking-wider text-[11px]">
                            <span className="flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                              Est. Order Profit (Private):
                            </span>
                            <span className="text-amber-600">{profit} SAR</span>
                          </div>
                          <div className="text-[9px] text-neutral-400 leading-snug">
                            Calculation: {selectedOrder.grandTotal} SAR (Bill) - {totalCost} SAR (Cloth Purchase) - {driverCost} SAR (Driver Cost)
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* WhatsApp Forwarding Action */}
                  <div className="pt-4 border-t border-neutral-100 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block mb-1">
                      WhatsApp Dispatch:
                    </span>
                    <button
                      onClick={() => handleSendWhatsAppDispatch(selectedOrder)}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition duration-150 shadow-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Send Delivery Info to WhatsApp</span>
                    </button>
                  </div>

                  {/* Update Order Status actions */}
                  <div className="pt-4 border-t border-neutral-100 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block mb-1">
                      Update Shipping Status:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: "Confirm", value: "Confirmed", style: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
                        { label: "Pack", value: "Packed", style: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
                        { label: "Ship", value: "Shipped", style: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" },
                        { label: "Deliver", value: "Delivered", style: "bg-green-50 text-green-700 hover:bg-green-100" },
                        { label: "Cancel", value: "Cancelled", style: "bg-red-50 text-red-700 hover:bg-red-100" }
                      ].map((btn) => (
                        <button
                          key={btn.value}
                          onClick={() => handleUpdateOrderStatus(selectedOrder.id, btn.value)}
                          disabled={selectedOrder.status === btn.value}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex-grow ${btn.style} disabled:opacity-30 disabled:cursor-not-allowed`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Danger Zone: Delete Order */}
                  <div className="pt-4 border-t border-neutral-100 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 block mb-1">
                      Danger Zone:
                    </span>
                    <button
                      onClick={() => handleDeleteOrder(selectedOrder.id)}
                      className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition duration-150 shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Order Permanently</span>
                    </button>
                  </div>

                </div>
              ) : (
                <div className="text-center py-20 text-neutral-400 text-xs font-medium uppercase tracking-wider">
                  Select an order on the left to inspect coordinates, address, and update status.
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 3: PRODUCTS */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === "products" && (
        <div className="space-y-6">

          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-neutral-200">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
              Active Inventory catalog ({products.length} Items)
            </span>
            <button
              onClick={handleOpenAddProduct}
              className="bg-black hover:bg-neutral-900 text-amber-400 font-extrabold text-xs uppercase tracking-widest px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          {/* Product manager list */}
          {/* Desktop Table View: Visible on md screens and larger */}
          <div className="hidden md:block bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-400 uppercase tracking-widest font-bold border-b border-neutral-200">
                    <th className="p-4">Item Details</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Base Price</th>
                    <th className="p-4">Offer Price</th>
                    <th className="p-4">Purchase Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-neutral-50/50 transition">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-10 h-13 rounded overflow-hidden bg-neutral-100 flex items-center justify-center relative border border-neutral-200 shrink-0">
                          <img
                            src={prod.images[0]}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover blur-[2px] opacity-40 scale-110 pointer-events-none"
                          />
                          <img
                            src={prod.images[0]}
                            alt=""
                            className="relative z-10 max-w-full max-h-full w-auto h-auto object-contain pointer-events-none"
                          />
                        </div>
                        <div>
                          <span className="font-bold text-neutral-900 block">{prod.name}</span>
                          <span className="text-[10px] text-neutral-400 font-mono">Stock level alert: {prod.stock} left</span>
                        </div>
                      </td>
                      <td className="p-4">{prod.category}</td>
                      <td className="p-4 font-mono font-bold text-neutral-800">{prod.price} SAR</td>
                      <td className="p-4 font-mono font-bold text-amber-600">{prod.offerPrice ? `${prod.offerPrice} SAR` : "No Offer"}</td>
                      <td className="p-4 font-mono font-bold text-emerald-600">{prod.purchasePrice ? `${prod.purchasePrice} SAR` : "-"}</td>
                      <td className="p-4 font-mono">{prod.stock}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${prod.status === "active" ? "bg-green-100 text-green-800" : "bg-neutral-100 text-neutral-500"
                          }`}>
                          {prod.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenEditProduct(prod)}
                          className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards Stack View: Visible on screen widths below md */}
          <div className="md:hidden divide-y divide-neutral-100 bg-white rounded-xl border border-neutral-200 overflow-hidden">
            {products.map((prod) => (
              <div key={prod.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-16 rounded overflow-hidden bg-neutral-100 flex items-center justify-center relative border border-neutral-200 shrink-0">
                    <img
                      src={prod.images[0]}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover blur-[2px] opacity-40 scale-110 pointer-events-none"
                    />
                    <img
                      src={prod.images[0]}
                      alt=""
                      className="relative z-10 max-w-full max-h-full w-auto h-auto object-contain pointer-events-none"
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <span className="font-bold text-neutral-900 block truncate">{prod.name}</span>
                    <span className="text-[10px] text-neutral-400 block mt-0.5 font-mono">Category: {prod.category}</span>
                    <span className="text-[10px] text-neutral-400 block font-mono">Stock level: {prod.stock} left</span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-neutral-50 pt-2.5">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">Base Price</span>
                    <span className="font-mono font-bold text-neutral-800">{prod.price} SAR</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">Offer Price</span>
                    <span className="font-mono font-bold text-amber-600">{prod.offerPrice ? `${prod.offerPrice} SAR` : "No Offer"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">Purchase Price</span>
                    <span className="font-mono font-bold text-emerald-600">{prod.purchasePrice ? `${prod.purchasePrice} SAR` : "-"}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider mb-0.5">Status</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${prod.status === "active" ? "bg-green-100 text-green-800" : "bg-neutral-100 text-neutral-500"}`}>
                      {prod.status}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 border-t border-neutral-50 pt-2.5">
                  <button
                    onClick={() => handleOpenEditProduct(prod)}
                    className="flex-grow py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-lg text-center transition flex items-center justify-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Item</span>
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(prod.id)}
                    className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition"
                    title="Delete Product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ADD / EDIT PRODUCT MODAL FORM */}
          {(isAddingProduct || editingProduct) && (
            <div 
              onClick={() => {
                setIsAddingProduct(false);
                setEditingProduct(null);
              }}
              className="fixed inset-0 z-[100] overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-xl rounded-2xl shadow-2xl p-4.5 sm:p-7 flex flex-col max-h-[85vh]"
              >
                <div className="flex justify-between items-center pb-4 border-b border-neutral-100 mb-5">
                  <h3 className="text-lg font-black text-neutral-900 tracking-tight uppercase">
                    {isAddingProduct ? "Add New Fashion Product" : "Edit Fashion Product"}
                  </h3>
                  <button
                    onClick={() => {
                      setIsAddingProduct(false);
                      setEditingProduct(null);
                    }}
                    className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-black"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={isAddingProduct ? handleAddProduct : handleEditProductSubmit}
                  className="space-y-4 overflow-y-auto pr-1 flex-grow text-xs"
                >

                  {/* Name */}
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="e.g. Elegant Black Georgette Abaya with Gold Lace"
                      className="w-full px-3.5 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-black font-medium"
                    />
                  </div>

                  {/* Category Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">
                        Category
                      </label>
                      <select
                        value={productForm.category}
                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                        className="w-full px-3.5 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-black font-medium"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">
                        Status
                      </label>
                      <select
                        value={productForm.status}
                        onChange={(e) => setProductForm({ ...productForm, status: e.target.value as any })}
                        className="w-full px-3.5 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-black font-medium"
                      >
                        <option value="active">Active (Visible)</option>
                        <option value="draft">Draft (Hidden)</option>
                      </select>
                    </div>
                  </div>

                  {/* Trending Product Toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-amber-500/5 rounded-xl border border-amber-500/10">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1">
                        Trending Product KSA
                      </span>
                      <span className="text-[10px] text-neutral-400">Features this design in the highlighted "Trending Now" showcase row.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={productForm.isTrending || false}
                        onChange={(e) => setProductForm({ ...productForm, isTrending: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-50 peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {/* Group Order Toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1">
                        📦 Group Order (Mix Color)
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        If enabled, customers will skip color selection. The item color will automatically default to "Mix Color".
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={productForm.isGroupOrder || false}
                        onChange={(e) => setProductForm({ ...productForm, isGroupOrder: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-50 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Cloth Shop Owner (Admin Only) */}
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">
                      Cloth Shop Owner / Supplier (Admin Only)
                    </label>
                    <input
                      type="text"
                      value={productForm.clothShopOwner}
                      onChange={(e) => setProductForm({ ...productForm, clothShopOwner: e.target.value })}
                      placeholder="e.g. Abaya Boutique, Riyadh Fabrics (Leave blank if internal)"
                      className="w-full px-3.5 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-black font-medium"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">
                      Description
                    </label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      rows={3}
                      placeholder="Write premium product material description details..."
                      className="w-full px-3.5 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-black font-medium resize-none"
                    />
                  </div>

                  {/* Price, Offer Price, Purchase Price, Stock, Rating */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">
                        Base Price (SAR)
                      </label>
                      <input
                        type="number"
                        required
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        placeholder="180"
                        className="w-full px-3.5 py-2 border border-neutral-300 rounded-lg focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">
                        Offer Price (SAR)
                      </label>
                      <input
                        type="number"
                        value={productForm.offerPrice}
                        onChange={(e) => setProductForm({ ...productForm, offerPrice: e.target.value })}
                        placeholder="145"
                        className="w-full px-3.5 py-2 border border-neutral-300 rounded-lg focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-amber-700 uppercase tracking-wide block mb-1">
                        Purchase Price (SAR) *
                      </label>
                      <input
                        type="number"
                        value={productForm.purchasePrice}
                        onChange={(e) => setProductForm({ ...productForm, purchasePrice: e.target.value })}
                        placeholder="e.g. 80"
                        className="w-full px-3.5 py-2 border border-amber-300 bg-amber-50/10 rounded-lg focus:outline-none font-bold text-amber-900 focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">
                        Stock Quantity
                      </label>
                      <input
                        type="number"
                        required
                        value={productForm.stock}
                        onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                        placeholder="25"
                        className="w-full px-3.5 py-2 border border-neutral-300 rounded-lg focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">
                        Rating (1.0 - 5.0)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        value={productForm.rating}
                        onChange={(e) => setProductForm({ ...productForm, rating: e.target.value })}
                        placeholder="e.g. 4.9"
                        className="w-full px-3.5 py-2 border border-neutral-300 rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Image Upload / URLs */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block">
                      Product Images
                    </label>

                    {/* File Dropzone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          uploadMultipleImageFiles(e.dataTransfer.files);
                        }
                      }}
                      className="border-2 border-dashed border-neutral-300 hover:border-amber-500 bg-neutral-50 hover:bg-neutral-100/50 rounded-xl p-5 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2 group relative"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            uploadMultipleImageFiles(e.target.files);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <UploadCloud className="w-8 h-8 text-neutral-400 group-hover:text-amber-500 group-hover:scale-105 transition duration-200" />
                      <div className="text-xs font-bold text-neutral-700">
                        {isUploading ? (
                          <span className="flex items-center gap-1.5 justify-center">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                            Uploading to Storage...
                          </span>
                        ) : (
                          "Drag & drop multiple images here or click to upload"
                        )}
                      </div>
                      <p className="text-[9px] text-neutral-400 font-mono">Supports PNG, JPG, JPEG, WEBP (Batch Upload)</p>
                    </div>

                    {uploadError && (
                      <p className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 p-2 rounded-lg">
                        {uploadError}
                      </p>
                    )}

                    {/* Image URL fallback */}
                    <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 space-y-2">
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wide block">
                        Or add image via URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={productForm.imageUrlInput}
                          onChange={(e) => setProductForm({ ...productForm, imageUrlInput: e.target.value })}
                          placeholder="Paste image URL (e.g., Unsplash link)"
                          className="w-full bg-white px-3 py-1.5 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (productForm.imageUrlInput.trim()) {
                              setProductForm({
                                ...productForm,
                                images: [...productForm.images, productForm.imageUrlInput.trim()],
                                imageUrlInput: ""
                              });
                            }
                          }}
                          className="bg-neutral-800 hover:bg-black text-white px-3 rounded-lg font-bold uppercase tracking-widest text-[9px] shrink-0 transition"
                        >
                          Add URL
                        </button>
                      </div>
                    </div>

                    {/* Image list queue */}
                    {productForm.images.length > 0 && (
                      <div>
                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                          Current Gallery ({productForm.images.length} Image{productForm.images.length > 1 ? "s" : ""})
                        </span>
                        <div className="flex flex-wrap gap-3.5 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                          {productForm.images.map((img, index) => (
                            <div key={index} className="relative w-24 h-32 bg-neutral-200 rounded-lg overflow-hidden group border border-neutral-300 shadow-sm transition hover:shadow">
                              <img src={img} alt="" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  setProductForm({
                                    ...productForm,
                                    images: productForm.images.filter((_, i) => i !== index)
                                  });
                                }}
                                className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                <X className="w-6 h-6" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
 
                    {/* Image to Color Mapping */}
                    {productForm.images.length > 0 && (
                      <div className="mt-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                        <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">
                          🎨 Color-Specific Images (Optional)
                        </span>
                        <p className="text-[10px] text-neutral-400 mb-3.5 leading-snug">
                          Assign a color to an image so it dynamically displays when that color is selected on the storefront.
                        </p>
                        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                          {productForm.images.map((img, index) => {
                            const parsedColors = productForm.colorsInput
                              .split(",")
                              .map(c => c.trim())
                              .filter(Boolean);
                            return (
                              <div key={index} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-neutral-200 shadow-xs">
                                <img src={img} alt="" className="w-16 h-20 object-cover rounded-md border border-neutral-200 shrink-0 bg-neutral-100" referrerPolicy="no-referrer" />
                                <div className="flex-grow min-w-0">
                                  <span className="text-[9px] text-neutral-400 block truncate font-mono">
                                    Image #{index + 1}
                                  </span>
                                  <select
                                    value={productForm.colorImageMap?.[img] || ""}
                                    onChange={(e) => {
                                      const updatedMap = { ...(productForm.colorImageMap || {}) };
                                      if (e.target.value) {
                                        updatedMap[img] = e.target.value;
                                      } else {
                                        delete updatedMap[img];
                                      }
                                      setProductForm({
                                        ...productForm,
                                        colorImageMap: updatedMap
                                      });
                                    }}
                                    className="mt-0.5 w-full bg-neutral-50 text-[10px] px-2 py-1 rounded border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold text-neutral-700"
                                  >
                                    <option value="">-- Generic/Any Color --</option>
                                    {parsedColors.map((col) => (
                                      <option key={col} value={col}>
                                        Show for color: {col}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sizes, Colors, Packaging Option Inputs */}
                  <div className="space-y-3.5 pt-2 border-t border-neutral-100">
                    <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="hasDualSizes"
                          checked={productForm.hasDualSizes}
                          onChange={(e) => setProductForm({ ...productForm, hasDualSizes: e.target.checked })}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-neutral-300 rounded"
                        />
                        <label htmlFor="hasDualSizes" className="text-xs font-bold text-neutral-700 uppercase tracking-wider select-none cursor-pointer">
                          Enable Dual Sizes (e.g. Jacket Jeans Terno)
                        </label>
                      </div>

                      {productForm.hasDualSizes ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-neutral-200/60">
                          <div className="space-y-2">
                            <div>
                              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">
                                Size Type 1 Name (e.g. Jacket Size)
                              </label>
                              <input
                                type="text"
                                value={productForm.dualSizesTitle1}
                                onChange={(e) => setProductForm({ ...productForm, dualSizesTitle1: e.target.value })}
                                placeholder="Jacket Size"
                                className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-md focus:outline-none bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">
                                Size 1 Options (Comma separated)
                              </label>
                              <input
                                type="text"
                                value={productForm.sizesInput}
                                onChange={(e) => setProductForm({ ...productForm, sizesInput: e.target.value })}
                                placeholder="S, M, L, XL, XXL"
                                className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-md focus:outline-none bg-white"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">
                                Size Type 2 Name (e.g. Jeans Waist Size)
                              </label>
                              <input
                                type="text"
                                value={productForm.dualSizesTitle2}
                                onChange={(e) => setProductForm({ ...productForm, dualSizesTitle2: e.target.value })}
                                placeholder="Jeans Waist Size"
                                className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-md focus:outline-none bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">
                                Size 2 Options (Comma separated)
                              </label>
                              <input
                                type="text"
                                value={productForm.sizes2Input}
                                onChange={(e) => setProductForm({ ...productForm, sizes2Input: e.target.value })}
                                placeholder="28, 30, 32, 34, 36"
                                className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-md focus:outline-none bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">
                            Sizes (Comma separated)
                          </label>
                          <input
                            type="text"
                            value={productForm.sizesInput}
                            onChange={(e) => setProductForm({ ...productForm, sizesInput: e.target.value })}
                            placeholder="S, M, L, XL, XXL, Free Size"
                            className="w-full px-3.5 py-2 border border-neutral-300 rounded-lg focus:outline-none bg-white mb-2"
                          />
                        </div>
                      )}

                      {/* Size Prices Customizer */}
                      {productForm.sizesInput.split(",").map(s => s.trim()).filter(Boolean).length > 0 && (
                        <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 mb-2">
                          <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">
                            Set Custom Price for Each Size
                          </label>
                          <p className="text-[10px] text-neutral-400 mb-2.5 leading-normal">
                            Leave blank or 0 to use the product's base price. Useful for multi-sized luggage.
                          </p>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {productForm.sizesInput.split(",").map(s => s.trim()).filter(Boolean).map((sz) => (
                              <div key={sz} className="flex items-center justify-between gap-2 bg-white p-2 rounded-md border border-neutral-200">
                                <span className="text-[11px] font-semibold text-neutral-700 truncate max-w-[60%]">
                                  Size {sz}
                                </span>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="Base"
                                    value={productForm.sizePrices?.[sz] || ""}
                                    onChange={(e) => {
                                      const newPrices = { ...(productForm.sizePrices || {}) };
                                      if (e.target.value) {
                                        newPrices[sz] = Number(e.target.value);
                                      } else {
                                        delete newPrices[sz];
                                      }
                                      setProductForm({ ...productForm, sizePrices: newPrices });
                                    }}
                                    className="w-20 px-2 py-0.5 text-xs text-right border border-neutral-200 rounded focus:outline-none focus:border-amber-500 font-semibold font-mono"
                                  />
                                  <span className="text-[9px] font-bold text-neutral-400 uppercase">SAR</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">
                        Colors (Comma separated)
                      </label>
                      <input
                        type="text"
                        value={productForm.colorsInput}
                        onChange={(e) => setProductForm({ ...productForm, colorsInput: e.target.value })}
                        placeholder="Jet Black, Beige, Emerald Green, Sage Green"
                        className="w-full px-3.5 py-2 border border-neutral-300 rounded-lg focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1">
                        Package Types (Combo options - Comma separated)
                      </label>
                      <input
                        type="text"
                        value={productForm.packageTypesInput}
                        onChange={(e) => setProductForm({ ...productForm, packageTypesInput: e.target.value })}
                        placeholder="Single Piece, 3pcs Combo Pack, 12pcs Combo"
                        className="w-full px-3.5 py-2 border border-neutral-300 rounded-lg focus:outline-none mb-3"
                      />

                      {/* Combo Prices Selector Section */}
                      {productForm.packageTypesInput.split(",").map(p => p.trim()).filter(Boolean).length > 0 && (
                        <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 mb-2">
                          <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block mb-1">
                            Set Custom Price for Each Combo
                          </label>
                          <p className="text-[10px] text-neutral-400 mb-2.5 leading-normal">
                            Leave blank or 0 to auto-calculate the price using the product's base price and bundle size.
                          </p>
                          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                            {productForm.packageTypesInput.split(",").map(p => p.trim()).filter(Boolean).map((pkg) => (
                              <div key={pkg} className="flex items-center justify-between gap-2 bg-white p-2 rounded-md border border-neutral-200">
                                <span className="text-[11px] font-semibold text-neutral-700 truncate max-w-[60%]">
                                  {pkg}
                                </span>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="Auto"
                                    value={productForm.packagePrices[pkg] || ""}
                                    onChange={(e) => {
                                      const newPrices = { ...productForm.packagePrices };
                                      if (e.target.value) {
                                        newPrices[pkg] = Number(e.target.value);
                                      } else {
                                        delete newPrices[pkg];
                                      }
                                      setProductForm({ ...productForm, packagePrices: newPrices });
                                    }}
                                    className="w-20 px-2 py-0.5 text-xs text-right border border-neutral-200 rounded focus:outline-none focus:border-amber-500 font-semibold font-mono"
                                  />
                                  <span className="text-[9px] font-bold text-neutral-400 uppercase">SAR</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="pt-4 border-t border-neutral-100 flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingProduct(false);
                        setEditingProduct(null);
                      }}
                      className="w-1/2 border border-neutral-300 hover:bg-neutral-50 py-3 rounded-lg text-neutral-700 font-bold text-xs uppercase tracking-widest transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 bg-black hover:bg-neutral-900 text-amber-400 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition shadow-lg shadow-black/10"
                    >
                      {isAddingProduct ? "Create Product" : "Save Changes"}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 4: SHIPPING & COUPONS */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === "shipping-coupons" && (
        <div className="space-y-8 text-xs font-medium">

          {/* Top Row: Category Manager & Shipping Rate Matrix side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* A. CATEGORIES CRUD */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 border-b border-neutral-100 pb-2">
                Category Manager
              </h3>

              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Tops, Bra-Panty, Skirts"
                  className="flex-grow px-3.5 py-2 border border-neutral-300 rounded-lg text-xs"
                />
                <button
                  type="submit"
                  className="bg-black hover:bg-neutral-900 text-amber-400 font-bold px-4 rounded-lg transition shrink-0"
                >
                  Create
                </button>
              </form>

              <div className="divide-y divide-neutral-100 max-h-48 overflow-y-auto">
                {categories.map((cat) => (
                  <div key={cat.id} className="py-2.5 flex items-center justify-between">
                    <span className="font-bold text-neutral-900">{cat.name}</span>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-red-500 hover:text-red-600 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* B. SHIPPING AREAS CRUD */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">
                  Saudi Shipping Rate Matrix
                </h3>
                {!isAddingArea && !editingArea && (
                  <button
                    onClick={() => {
                      setAreaForm({ name: "", charge: "", freeDeliveryAbove: "" });
                      setIsAddingArea(true);
                    }}
                    className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Area</span>
                  </button>
                )}
              </div>

              {/* Area Form Addition/Edition */}
              {(isAddingArea || editingArea) && (
                <form
                  onSubmit={isAddingArea ? handleAddArea : handleEditAreaSave}
                  className="bg-neutral-50 p-4 border border-neutral-200 rounded-xl space-y-3"
                >
                  <h4 className="font-bold text-neutral-800 uppercase text-[10px]">
                    {isAddingArea ? "Add Delivery Area" : `Edit Rate for ${editingArea?.name}`}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      value={areaForm.name}
                      onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                      placeholder="e.g. Riyadh, Jeddah"
                      className="px-3 py-2 border border-neutral-300 bg-white rounded-lg text-xs"
                    />
                    <input
                      type="number"
                      required
                      value={areaForm.charge}
                      onChange={(e) => setAreaForm({ ...areaForm, charge: e.target.value })}
                      placeholder="Customer Delivery Fee (SAR)"
                      className="px-3 py-2 border border-neutral-300 bg-white rounded-lg text-xs"
                    />
                    <input
                      type="number"
                      required
                      value={areaForm.driverCharge}
                      onChange={(e) => setAreaForm({ ...areaForm, driverCharge: e.target.value })}
                      placeholder="Driver Delivery Cost (SAR)"
                      className="px-3 py-2 border border-amber-300 bg-amber-50/10 rounded-lg text-xs focus:outline-none focus:border-amber-500 font-semibold text-amber-900"
                    />
                    <input
                      type="text"
                      value={areaForm.deliveryTime}
                      onChange={(e) => setAreaForm({ ...areaForm, deliveryTime: e.target.value })}
                      placeholder="Delivery Estimate (e.g. 1-2 Days, 3-5 Days)"
                      className="px-3 py-2 border border-neutral-300 bg-white rounded-lg text-xs"
                    />
                    <input
                      type="number"
                      value={areaForm.freeDeliveryAbove}
                      onChange={(e) => setAreaForm({ ...areaForm, freeDeliveryAbove: e.target.value })}
                      placeholder="Free Above (SAR) - Optional"
                      className="px-3 py-2 border border-neutral-300 bg-white rounded-lg text-xs"
                    />
                    <input
                      type="number"
                      value={areaForm.minOrderValue}
                      onChange={(e) => setAreaForm({ ...areaForm, minOrderValue: e.target.value })}
                      placeholder="Min Order Value (SAR) - Optional"
                      className="px-3 py-2 border border-neutral-300 bg-white rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingArea(false);
                        setEditingArea(null);
                      }}
                      className="border border-neutral-300 px-3 py-1.5 rounded text-neutral-500 hover:bg-neutral-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-black text-amber-400 font-bold px-4 py-1.5 rounded hover:bg-neutral-900 transition"
                    >
                      Save Area
                    </button>
                  </div>
                </form>
              )}

              <div className="divide-y divide-neutral-100 max-h-48 overflow-y-auto">
                {areas.map((area) => (
                   <div key={area.id} className="py-2.5 flex items-center justify-between">
                     <div>
                       <span className="font-bold text-neutral-900 block">{area.name}</span>
                       <span className="text-[10px] text-neutral-400 font-bold font-mono">
                        Customer Rate: {area.charge} SAR
                        {area.driverCharge !== undefined && area.driverCharge !== null && (
                          <span className="text-amber-600 ml-2 font-black">
                            • Driver Cost: {area.driverCharge} SAR
                          </span>
                        )}
                        {area.deliveryTime && (
                          <span className="text-blue-600 ml-2">
                            • Est: {area.deliveryTime}
                          </span>
                        )}
                        {area.freeDeliveryAbove !== undefined && area.freeDeliveryAbove !== null && (
                          <span className="text-green-600 ml-2">
                            • Free Above {area.freeDeliveryAbove} SAR
                          </span>
                        )}
                        {area.minOrderValue !== undefined && area.minOrderValue !== null && (
                          <span className="text-amber-600 ml-2 font-black">
                            • Min Order: {area.minOrderValue} SAR
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingArea(area);
                          setAreaForm({
                            name: area.name,
                            charge: String(area.charge),
                            driverCharge: area.driverCharge !== undefined && area.driverCharge !== null ? String(area.driverCharge) : "",
                            deliveryTime: area.deliveryTime || "",
                            freeDeliveryAbove: area.freeDeliveryAbove !== undefined && area.freeDeliveryAbove !== null ? String(area.freeDeliveryAbove) : "",
                            minOrderValue: area.minOrderValue !== undefined && area.minOrderValue !== null ? String(area.minOrderValue) : ""
                          });
                        }}
                        className="text-neutral-500 hover:text-black"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteArea(area.id)}
                        className="text-red-500 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Coupon Management Panel (Bottom Row) */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4 h-fit">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">
                Coupons & Discounts Setup
              </h3>
              {!isAddingCoupon && !editingCoupon && (
                <button
                  onClick={() => {
                    setCouponForm({ code: "", discountType: "percentage", discountValue: "", expiryDate: "" });
                    setIsAddingCoupon(true);
                  }}
                  className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Coupon</span>
                </button>
              )}
            </div>

            {(isAddingCoupon || editingCoupon) && (
              <form onSubmit={isAddingCoupon ? handleAddCoupon : handleEditCouponSave} className="bg-neutral-50 p-4 border border-neutral-200 rounded-xl space-y-3">
                <h4 className="font-bold text-neutral-800 uppercase text-[10px]">
                  {isAddingCoupon ? "Add Coupon Code" : `Edit Coupon: ${editingCoupon?.code}`}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-neutral-400 uppercase">Code</label>
                    <input
                      type="text"
                      required
                      value={couponForm.code}
                      onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. KABAYAN10"
                      className="w-full px-3 py-1.5 border border-neutral-300 bg-white rounded-lg text-xs font-bold uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-400 uppercase">Discount Type</label>
                    <select
                      value={couponForm.discountType}
                      onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value as any })}
                      className="w-full px-3 py-1.5 border border-neutral-300 bg-white rounded-lg text-xs"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed SAR</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-400 uppercase">Discount Value</label>
                    <input
                      type="number"
                      required
                      value={couponForm.discountValue}
                      onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                      placeholder="10 or 15"
                      className="w-full px-3 py-1.5 border border-neutral-300 bg-white rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-neutral-400 uppercase">Expiry Date</label>
                    <input
                      type="date"
                      required
                      value={couponForm.expiryDate}
                      onChange={(e) => setCouponForm({ ...couponForm, expiryDate: e.target.value })}
                      className="w-full px-3 py-1.5 border border-neutral-300 bg-white rounded-lg text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCoupon(false);
                      setEditingCoupon(null);
                      setCouponForm({ code: "", discountType: "percentage", discountValue: "", expiryDate: "" });
                    }}
                    className="border border-neutral-300 px-3 py-1 rounded text-neutral-500 hover:bg-neutral-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-black text-amber-400 font-bold px-4 py-1 rounded hover:bg-neutral-900 transition"
                  >
                    {isAddingCoupon ? "Save Code" : "Update Code"}
                  </button>
                </div>
              </form>
            )}

            <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto">
              {localCoupons.map((coupon) => (
                <div key={coupon.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-neutral-900 block font-mono tracking-wider">{coupon.code}</span>
                    <span className="text-[10px] text-neutral-400 font-bold">
                      Saved {coupon.discountValue}{coupon.discountType === "percentage" ? "%" : " SAR"} • Expires: {coupon.expiryDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setEditingCoupon(coupon);
                        setIsAddingCoupon(false);
                        setCouponForm({
                          code: coupon.code,
                          discountType: coupon.discountType,
                          discountValue: String(coupon.discountValue),
                          expiryDate: coupon.expiryDate
                        });
                      }}
                      className="text-neutral-500 hover:text-black transition"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      className="text-red-500 hover:text-red-600 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 5: SETTINGS */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === "settings" && (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 text-xs font-medium">
          <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 border-b border-neutral-100 pb-2 mb-6">
            Store Customization Details
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                E-Commerce Website Name
              </label>
              <input
                type="text"
                required
                value={shopSettingsForm.shopName}
                onChange={(e) => setShopSettingsForm({ ...shopSettingsForm, shopName: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Admin WhatsApp Order Forwarding Number
              </label>
              <input
                type="text"
                required
                value={shopSettingsForm.whatsappContact}
                onChange={(e) => setShopSettingsForm({ ...shopSettingsForm, whatsappContact: e.target.value })}
                placeholder="e.966501234567"
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-xs"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">
                Provide number in country format without zeros or '+' (e.g., 966501234567 for Saudi Arabia).
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Facebook Page ID / Username (for Messenger Chatbot)
              </label>
              <input
                type="text"
                value={shopSettingsForm.messengerPageId}
                onChange={(e) => setShopSettingsForm({ ...shopSettingsForm, messengerPageId: e.target.value })}
                placeholder="e.g. kabayanshopksa"
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-xs"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">
                Leave blank to disable the floating Messenger chat widget.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Homepage Hero Banner Image URLs
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shopSettingsForm.bannerImageInput}
                  onChange={(e) => setShopSettingsForm({ ...shopSettingsForm, bannerImageInput: e.target.value })}
                  placeholder="Paste banner image URL"
                  className="flex-grow px-4 py-2.5 border border-neutral-300 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (shopSettingsForm.bannerImageInput.trim()) {
                      setShopSettingsForm({
                        ...shopSettingsForm,
                        bannerImages: [...shopSettingsForm.bannerImages, shopSettingsForm.bannerImageInput.trim()],
                        bannerImageInput: ""
                      });
                    }
                  }}
                  className="bg-black text-amber-400 font-bold px-4 rounded-lg text-[10px] uppercase tracking-widest shrink-0"
                >
                  Add URL
                </button>
              </div>

              {/* Banner image thumbnails */}
              {shopSettingsForm.bannerImages.length > 0 && (
                <div className="flex flex-col gap-2 mt-2.5 p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
                  {shopSettingsForm.bannerImages.map((banner, index) => (
                    <div key={index} className="flex items-center justify-between gap-3 text-[10px] border-b border-neutral-100 pb-1.5">
                      <span className="truncate flex-grow text-neutral-500">{banner}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setShopSettingsForm({
                            ...shopSettingsForm,
                            bannerImages: shopSettingsForm.bannerImages.filter((_, i) => i !== index)
                          });
                        }}
                        className="text-red-500 hover:text-red-600 font-bold shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                About Us Text Block
              </label>
              <textarea
                value={shopSettingsForm.aboutUs}
                onChange={(e) => setShopSettingsForm({ ...shopSettingsForm, aboutUs: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-xs resize-none"
              />
            </div>

            {/* SEO & Analytics Config */}
            <div className="space-y-4 pt-4 border-t border-neutral-100">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                SEO & Analytics Configuration
              </h4>
              
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Meta (Facebook) Pixel ID
                </label>
                <input
                  type="text"
                  value={shopSettingsForm.metaPixelId}
                  onChange={(e) => setShopSettingsForm({ ...shopSettingsForm, metaPixelId: e.target.value })}
                  placeholder="e.g. 123456789012345"
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-xs font-mono"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  Track events like PageView, AddToCart, and Purchase automatically on Meta Ads Manager.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Meta Title (SEO)
                  </label>
                  <input
                    type="text"
                    value={shopSettingsForm.metaTitle}
                    onChange={(e) => setShopSettingsForm({ ...shopSettingsForm, metaTitle: e.target.value })}
                    placeholder="Enter main page title"
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Meta Keywords (SEO)
                  </label>
                  <input
                    type="text"
                    value={shopSettingsForm.metaKeywords}
                    onChange={(e) => setShopSettingsForm({ ...shopSettingsForm, metaKeywords: e.target.value })}
                    placeholder="e.g. abayas, modest clothing, riyadh"
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Meta Description (SEO)
                </label>
                <textarea
                  value={shopSettingsForm.metaDescription}
                  onChange={(e) => setShopSettingsForm({ ...shopSettingsForm, metaDescription: e.target.value })}
                  rows={2}
                  placeholder="Enter shop description shown in search results..."
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-xs resize-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={shopSettingsForm.contactEmail}
                  onChange={(e) => setShopSettingsForm({ ...shopSettingsForm, contactEmail: e.target.value })}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Contact Address
                </label>
                <input
                  type="text"
                  value={shopSettingsForm.contactAddress}
                  onChange={(e) => setShopSettingsForm({ ...shopSettingsForm, contactAddress: e.target.value })}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Admin Credentials Changer */}
            <div className="bg-amber-50/10 p-5 rounded-2xl border border-amber-200/50 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-amber-700 flex items-center gap-1.5">
                <span>🔑 Admin Login Account Security</span>
              </h4>
              <p className="text-[10px] text-neutral-400 leading-normal">
                You can change the email and password used to access this Admin Panel. If left blank, it will continue to use your default environment configurations.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Admin Login Email
                  </label>
                  <input
                    type="email"
                    value={shopSettingsForm.adminEmail}
                    onChange={(e) => setShopSettingsForm({ ...shopSettingsForm, adminEmail: e.target.value })}
                    placeholder="e.g. admin@kabayanshopksa.com"
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    New Admin Login Password
                  </label>
                  <input
                    type="password"
                    value={shopSettingsForm.adminPassword}
                    onChange={(e) => setShopSettingsForm({ ...shopSettingsForm, adminPassword: e.target.value })}
                    placeholder="Enter new secure password"
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-xs font-medium font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-black hover:bg-neutral-900 text-amber-400 font-extrabold text-xs uppercase tracking-widest py-4 rounded-xl transition shadow-lg shadow-black/10"
            >
              Save Customized Settings
            </button>
          </form>
        </div>
      )}

      {/* Toast Notification (Top Right) */}
      {toast.show && (
        <div className="fixed top-5 right-5 z-[9999] bg-neutral-900 text-white px-6 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-neutral-800 animate-in fade-in slide-in-from-top-5 md:slide-in-from-right-5 duration-300 max-w-sm w-[90%] md:w-full">
          <div className={`p-1.5 rounded-full ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div className="flex-1 text-sm font-semibold tracking-wide">
            {toast.message}
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-neutral-800 text-sm tracking-wide uppercase">
                {deleteConfirm.title}
              </h3>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
              {deleteConfirm.message}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
                className="border border-neutral-300 px-4 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 text-xs font-bold uppercase transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteConfirm.onConfirm();
                  setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition shadow-md shadow-red-600/10"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
