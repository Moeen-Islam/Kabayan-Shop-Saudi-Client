"use client";

import React from "react";
import { Star } from "lucide-react";
import { useLanguage } from "../lib/translationStore";

export default function Testimonials() {
  const { t } = useLanguage();

  const testimonialList = [
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
  ];

  return (
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
        {testimonialList.map((testimonial, idx) => (
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
  );
}
