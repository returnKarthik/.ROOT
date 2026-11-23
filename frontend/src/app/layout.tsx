import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { FeedProvider } from "@/context/FeedContext";

export const metadata: Metadata = {
  title: ".ROOT",
  description: "Modern Social Platform",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-[#101114] text-[#F1F0EB] min-h-screen">
        <AuthProvider>
          <FeedProvider>
            {children}
          </FeedProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
