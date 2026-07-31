"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

// Legacy checkout page — redirect to subscription or buku detail
export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  useEffect(() => {
    // Map old numeric book IDs to new string IDs  
    const idMap: Record<string, string> = {
      "1": "1", "2": "2", "3": "7", "4": "11",
      "5": "6", "6": "4", "7": "5", "8": "1",
    };
    const newId = idMap[String(id)] ?? String(id);
    router.replace(`/buku/${newId}`);
  }, [id, router]);

  return null;
}