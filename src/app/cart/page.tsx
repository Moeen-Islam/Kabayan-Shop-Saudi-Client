import type { Metadata } from "next";
import AppClient from "../../components/AppClient";

export const metadata: Metadata = {
  title: "Shopping Cart | Kabayan Shop Saudi",
  description: "View and manage items in your shopping cart before completing your checkout at Kabayan Shop Saudi.",
};

export default function CartPage() {
  return <AppClient initialRoute="/cart" />;
}
