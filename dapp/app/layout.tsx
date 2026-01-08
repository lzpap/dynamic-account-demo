import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import '@iota/dapp-kit/dist/index.css';
import { Suspense } from 'react';
import { AppProviders } from "@/providers/AppProviders";
import { APP_STATIC_THEME } from "@/lib/constants/theme.constants";
import { ConnectionGuard } from "@/components/ConnectionGuard";
import { Navbar } from "@/components/layout/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "iSafe",
  description: "Dynamic multisig accounts powered by IOTA",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={APP_STATIC_THEME}>
            <body className="antialiased">
                <AppProviders>
                    <Suspense>
                        <ConnectionGuard>
                            <Navbar />
                            {children}
                        </ConnectionGuard>
                    </Suspense>
                </AppProviders>
            </body>
        </html>
    );
}
