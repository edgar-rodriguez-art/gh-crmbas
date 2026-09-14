import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "crmbas · CRM de equipamiento informático",
    template: "%s · crmbas",
  },
  description:
    "CRM para distribución y servicios informáticos, conforme al RGPD y a la normativa española.",
  robots: { index: false, follow: false },
  applicationName: "crmbas",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2545eb",
};

export default function LayoutRaiz({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-ES">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
