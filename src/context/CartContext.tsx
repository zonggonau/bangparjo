'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CJProduct } from '@/lib/cj-api';
import { useSession } from 'next-auth/react';
import { syncCartAction, getCartAction } from '@/lib/actions';
import { toast } from 'react-hot-toast';

export interface CartItem extends CJProduct {
  quantity: number;
  selectedVid?: string;   // CJ variant ID — required by createOrderV2
  selectedSku?: string;   // CJ variant SKU — fallback for createOrderV2
  selectedVariantName?: string; // Descriptive name (e.g. Size: XL, Color: Blue)
  selectedVariantImage?: string; // Variant image URL
}

interface CartContextType {
  items: CartItem[];
  isLoaded: boolean;
  addToCart: (product: CJProduct, variant?: { vid: string; sku: string; name?: string; image?: string }, quantity?: number) => void;
  removeFromCart: (pid: string, vid?: string) => void;
  updateQuantity: (pid: string, quantity: number, vid?: string) => void;
  clearCart: () => void;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { data: session } = useSession();

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('cart', JSON.stringify(items));
      } catch (e) {
        console.error('Failed to save cart to localStorage:', e);
      }
    }
  }, [items, isLoaded]);

  // Sync to DB when session changes or items change (debounced)
  useEffect(() => {
    if (!isLoaded) return;
    if (!session?.user?.email) return;

    const timer = setTimeout(async () => {
      try {
        await syncCartAction(items);
      } catch (e) {
        console.error('Cart sync to DB failed:', e);
      }
    }, 2000); // Debounce 2s

    return () => clearTimeout(timer);
  }, [items, isLoaded, session?.user?.email]);

  // Load from DB when user logs in
  useEffect(() => {
    if (!isLoaded) return;
    if (!session?.user?.email) return;

    const loadFromDB = async () => {
      try {
        const data = await getCartAction();
        if (data.success && data.data && data.data.length > 0) {
          // Merge: prefer localStorage items, but add DB items if cart is empty
          setItems(prev => {
            if (prev.length > 0) return prev; // Keep local items
            return data.data.map((dbItem: any) => ({
              pid: dbItem.pid,
              selectedVid: dbItem.vid || undefined,
              selectedSku: dbItem.sku || undefined,
              selectedVariantName: dbItem.variantName || undefined,
              productName: dbItem.productName || '',
              productNameEn: dbItem.productNameEn || '',
              productImage: dbItem.productImage || '',
              bigImage: dbItem.bigImage || '',
              selectedVariantImage: dbItem.bigImage || dbItem.productImage || '',
              sellPrice: dbItem.sellPrice || 0,
              quantity: dbItem.quantity || 1,
              categoryName: dbItem.categoryName || '',
            }));
          });
        }
      } catch (e) {
        console.error('Cart load from DB failed:', e);
      }
    };

    loadFromDB();
  }, [session?.user?.email, isLoaded]);

  const addToCart = (product: CJProduct, variant?: { vid: string; sku: string; name?: string; image?: string }, quantity = 1) => {
    setIsLoaded(true);
    setItems(prev => {
      const existing = prev.find(i => i.pid === product.pid && i.selectedVid === variant?.vid);
      if (existing) {
        return prev.map(i =>
          (i.pid === product.pid && i.selectedVid === variant?.vid)
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [
        ...prev,
        {
          ...product,
          quantity: quantity,
          selectedVid: variant?.vid,
          selectedSku: variant?.sku,
          selectedVariantName: variant?.name,
          selectedVariantImage: variant?.image,
        },
      ];
    });
    toast.success('Added to cart!');
  };

  const removeFromCart = (pid: string, vid?: string) => {
    setItems(prev => prev.filter(i => !(i.pid === pid && i.selectedVid === vid)));
  };

  const updateQuantity = (pid: string, quantity: number, vid?: string) => {
    if (quantity < 1) {
      removeFromCart(pid, vid);
      return;
    }
    setItems(prev => prev.map(i => (i.pid === pid && i.selectedVid === vid) ? { ...i, quantity } : i));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((acc, item) => item.quantity + acc, 0);

  return (
    <CartContext.Provider value={{ items, isLoaded, addToCart, removeFromCart, updateQuantity, clearCart, totalItems }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
