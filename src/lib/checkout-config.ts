// Chave PÚBLICA da 3B Pagamentos (visível no front, apenas identifica a loja).
export const THREEB_API_KEY =
  "3bpk_live_227cbff66aa8444abd44447a3b85bdde98bf9533ece74da893cf04b6fbc6788c";

export const THREEB_BASE_URL = "https://idyeyanieitpeysobbgf.supabase.co/functions/v1";

// ID do produto padrão. Pode ser sobrescrito por ?productId=... na URL.
export const DEFAULT_PRODUCT_ID = "9918bdb2-d1c2-47fa-94e3-df985caa2b95";

export type CheckoutConfig = {
  store: { name: string };
  product: {
    id: string;
    name: string;
    description?: string;
    priceCents: number;
    currency: string;
    imageUrl?: string;
    requiresShipping?: boolean;
  };
  publishableKey: string;
};

export function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: (currency || "eur").toUpperCase(),
  }).format(cents / 100);
}

let stripePromise: Promise<any> | null = null;

export function loadStripeJs(): Promise<any> {
  if (stripePromise) return stripePromise;
  stripePromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    const w = window as any;
    if (w.Stripe) return resolve(w.Stripe);
    const existing = document.querySelector<HTMLScriptElement>("script[data-stripe-js]");
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).Stripe));
      existing.addEventListener("error", () => reject(new Error("stripe.js failed")));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://js.stripe.com/v3/";
    s.async = true;
    s.dataset.stripeJs = "true";
    s.onload = () => resolve((window as any).Stripe);
    s.onerror = () => reject(new Error("stripe.js failed"));
    document.head.appendChild(s);
  });
  return stripePromise;
}
