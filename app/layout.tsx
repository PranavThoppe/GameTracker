import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Fantasy GameTracker",
  description: "Sleeper + local TV games + model picks",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-gray-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}