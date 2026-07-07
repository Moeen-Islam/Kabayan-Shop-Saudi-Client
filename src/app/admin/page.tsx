import type { Metadata } from "next";
import AppClient from "../../components/AppClient";

export const metadata: Metadata = {
  title: "Admin Panel Operations | Kabayan Shop Saudi",
  description: "Kabayan Shop Saudi admin dashboard panel for statistics, order updates, stock levels, and store settings customization.",
  robots: {
    index: false,
    follow: false,
  }
};

export default function AdminPage() {
  return <AppClient initialRoute="/admin" />;
}
