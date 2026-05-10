'use client';

import { SessionProvider } from "next-auth/react";
import { SettingsProvider } from "@/context/SettingsContext";
import { CartProvider } from "@/context/CartContext";
import { StoreSettings } from "@/lib/pricing";

export function Providers({ 
  children, 
  initialSettings 
}: { 
  children: React.ReactNode,
  initialSettings?: StoreSettings 
}) {
  return (
    <SessionProvider>
      <SettingsProvider initialSettings={initialSettings}>
        <CartProvider>
          {children}
        </CartProvider>
      </SettingsProvider>
    </SessionProvider>
  );
}
