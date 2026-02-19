import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loyalty Passes",
  description: "Loyalty Passes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}