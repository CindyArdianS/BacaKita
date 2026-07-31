"use client";

import { Suspense } from "react";
import KatalogContent from "@/components/KatalogContent";

export default function DashboardKatalogPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: "80px", textAlign: "center", color: "#9e8268" }}>Memuat katalog...</div>
    }>
      <KatalogContent hideNavbar={true} />
    </Suspense>
  );
}
