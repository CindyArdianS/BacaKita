import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";

export const metadata = {
  title: "BacaKita",
  description: "Platform Buku Digital",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif" }}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
