import type { Metadata } from "next";
import AppClient from "../../components/AppClient";

export const metadata: Metadata = {
  title: "All Collections | Kabayan Shop Saudi",
  description: "Browse all collections at Kabayan Shop Saudi - Premium dresses, abayas, terno sets, denim, footwear, sleepwear, and more.",
};

export default function CollectionsPage() {
  return <AppClient initialRoute="/collections" initialCategory="" />;
}
