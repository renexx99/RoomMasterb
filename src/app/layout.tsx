import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Import Mantine styles
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import { AppProvider } from "@/core/providers/AppProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RoomMaster - Hotel Management System",
  description: "A comprehensive PMS for modern hotel chains.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}

