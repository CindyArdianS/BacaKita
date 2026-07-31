"use client";

import { redirect } from "next/navigation";

// Legacy /purchase page — redirect to the new /katalog page
export default function PurchasePage() {
  redirect("/katalog");
}