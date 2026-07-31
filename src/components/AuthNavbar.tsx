"use client";

/**
 * AuthNavbar — Digunakan pada halaman standalone (buku, cart, checkout)
 * yang perlu tampil seperti dashboard ketika user sudah login,
 * tapi tetap menampilkan PublicNavbar saat belum login.
 */

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import DashboardNavbar from "@/app/dashboard/components/Navbar";
import DashboardSidebar from "@/app/dashboard/components/Sidebar";
import PublicNavbar from "@/components/PublicNavbar";

export default function AuthNavbar() {
  const { session } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (session) {
    return (
      <>
        <DashboardNavbar openSidebar={() => setSidebarOpen(true)} />
        <DashboardSidebar
          isOpen={sidebarOpen}
          closeSidebar={() => setSidebarOpen(false)}
        />
      </>
    );
  }

  return <PublicNavbar />;
}
