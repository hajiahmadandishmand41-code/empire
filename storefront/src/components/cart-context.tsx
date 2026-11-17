"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SpreeApiError, getCart } from "@/lib/api";
import type { Cart } from "@/lib/api";

const SESSION_KEY = "empire.session.v1";

export type StoredSession = { email?: string; token: string; refresh_token: string };

/** api.ts owns the authoritative tokens (`empire.cart.v1`, `empire.session.v1`).
 * This context adds only what a UI needs on top of them: the cart in memory,
 * the header badge count, the session, and one shared error slot. */
function readSession(): StoredSession | null {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null") as StoredSession | null;
    return parsed && typeof parsed.token === "string" ? parsed : null;
  } catch { return null; }
}

function describeError(cause: unknown): string {
  if (cause instanceof SpreeApiError) return cause.message || cause.code || "backend_error";
  return "backend_error";
}

type CartContextValue = {
  cart: Cart | null;
  session: StoredSession | null;
  loading: boolean;
  error: string | null;
  itemCount: number;
  /** Adopt the cart returned by any mutation (add, update, remove, complete). */
  setCart: (cart: Cart | null) => void;
  refreshCart: () => Promise<void>;
  setError: (message: string | null) => void;
  clearSession: () => void;
  /** Called after login/register so the header updates without a reload. */
  refreshSession: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [session, setSessionState] = useState<StoredSession | null>(null);
  // True only for the first load; later refreshes keep the current cart on
  // screen instead of flashing a skeleton over known data.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Pure read: resolves the cart and never touches state, so it is safe to
   * call from an effect body. api.ts already turns a 404 (expired guest cart)
   * into null, so anything that rejects here is a genuine failure. */
  async function readCartState(): Promise<{ cart: Cart | null; error: string | null }> {
    try {
      return { cart: await getCart(), error: null };
    } catch (cause) {
      return { cart: null, error: describeError(cause) };
    }
  }

  const applyCartState = useCallback((state: { cart: Cart | null; error: string | null }) => {
    setCart(state.cart);
    setError(state.error);
    setSessionState(readSession());
    setLoading(false);
  }, []);

  const refreshCart = useCallback(async () => {
    applyCartState(await readCartState());
  }, [applyCartState]);

  useEffect(() => {
    // State is only ever written from the promise callback, never
    // synchronously in the effect body, so mounting cannot cascade renders.
    let active = true;
    void readCartState().then((state) => { if (active) applyCartState(state); });
    return () => { active = false; };
  }, [applyCartState]);

  const refreshSession = useCallback(() => setSessionState(readSession()), []);
  const clearSession = useCallback(() => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* storage blocked */ }
    setSessionState(null);
  }, []);

  const itemCount = useMemo(
    () => (cart?.items ?? []).reduce((total, item) => total + item.quantity, 0),
    [cart],
  );

  const value = useMemo<CartContextValue>(
    () => ({ cart, session, loading, error, itemCount, setCart, refreshCart, setError, clearSession, refreshSession }),
    [cart, session, loading, error, itemCount, refreshCart, clearSession, refreshSession],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
