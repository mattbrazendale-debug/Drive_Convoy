import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Convoy + Dispatch | Drive",
  description: "Shared classroom road trip with live teacher dispatch",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NZ">
      <body>{children}</body>
    </html>
  );
}
