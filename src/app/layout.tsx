import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hamster key generator",
  description: "here you can generate hamster keys for free , safely and fast",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      <script src="https://sad.adsgram.ai/js/sad.min.js"></script>
      </head>
      <body className={outfit.className}>
        {children}
        <Analytics />
        </body>
    </html>
  );
}
