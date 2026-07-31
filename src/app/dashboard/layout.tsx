"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

import styles from "./dashboard.module.css";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import RightPanel from "./components/RightPanel";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !session) {
      router.push("/");
    }
  }, [session, loading, router]);

  if (loading || !session) return null;

  return (
    <div className={styles.container}>
      <Navbar openSidebar={() => setSidebarOpen(true)} />

      <Sidebar
        isOpen={sidebarOpen}
        closeSidebar={() => setSidebarOpen(false)}
      />

      <main className={styles.main}>
        <div className={styles.content}>
          {children}
        </div>

        <RightPanel />
      </main>
    </div>
  );
}
