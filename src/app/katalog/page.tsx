"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import KatalogContent from "@/components/KatalogContent";

export default function KatalogPage() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && session) {
      router.push("/dashboard/katalog");
    }
  }, [session, authLoading, router]);

  return (
    <Suspense fallback={
      <div style={{ padding: "80px", textAlign: "center", color: "#9e8268" }}>Memuat katalog...</div>
    }>
      <KatalogContent hideNavbar={false} />
    </Suspense>
  );
}
