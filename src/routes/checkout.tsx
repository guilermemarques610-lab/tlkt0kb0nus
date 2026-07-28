import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  THREEB_API_KEY,
  THREEB_BASE_URL,
  DEFAULT_PRODUCT_ID,
  formatPrice,
  loadStripeJs,
  type CheckoutConfig,
} from "@/lib/checkout-config";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Finalizar compra | Pago seguro" },
      {
        name: "description",
        content:
          "Completa tu compra de forma segura con tarjeta, Pix, Apple Pay, Google Pay y métodos locales.",
      },
      { property: "og:title", content: "Finalizar compra | Pago seguro" },
      {
        property: "og:description",
        content: "Pago 100% seguro procesado por Stripe. Acceso inmediato tras la compra.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://js.stripe.com" },
      { rel: "preconnect", href: "https://api.stripe.com" },
      { rel: "preconnect", href: "https://idyeyanieitpeysobbgf.supabase.co" },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const [config, setConfig] = useState<CheckoutConfig | null>(null);
  const [email, setEmail] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [ready, setReady] = useState(false);

  const stripeRef = useRef<any>(null);
  const elementsRef = useRef<any>(null);
  const emailRef = useRef("");
  emailRef.current = email;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const productId = params.get("productId") || DEFAULT_PRODUCT_ID;
        if (!productId) {
          setLoadError(
            "Falta el productId. Añade ?productId=TU_ID a la URL o configúralo en src/lib/checkout-config.ts",
          );
          return;
        }

        const res = await fetch(
          `${THREEB_BASE_URL}/get-checkout-config?apiKey=${encodeURIComponent(
            THREEB_API_KEY,
          )}&productId=${encodeURIComponent(productId)}`,
        );
        if (!res.ok) throw new Error(await res.text());
        const data: CheckoutConfig = await res.json();
        if (cancelled) return;
        setConfig(data);

        const Stripe = await loadStripeJs();
        if (cancelled) return;
        const stripe = Stripe(data.publishableKey);
        stripeRef.current = stripe;

        // Elements em modo diferido: monta o Payment Element já agora.
        const elements = stripe.elements({
          mode: "payment",
          amount: data.product.priceCents,
          currency: data.product.currency.toLowerCase(),
          locale: "es",
          appearance: {
            theme: "stripe",
            variables: {
              colorPrimary: "#f43f5e",
              borderRadius: "12px",
              fontFamily: "system-ui, sans-serif",
            },
          },
        });
        elementsRef.current = elements;

        const expr = elements.create("expressCheckout");
        expr.mount("#express-checkout");
        expr.on("confirm", () => {
          void pay();
        });

        const payment = elements.create("payment", {
          terms: { card: "never" },
          fields: { billingDetails: { email: "never" } },
        });
        payment.mount("#payment-element");
        payment.on("ready", () => setReady(true));
      } catch (e: any) {
        if (!cancelled) setLoadError(e?.message || "No se pudo cargar el checkout.");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pay() {
    const stripe = stripeRef.current;
    const elements = elementsRef.current;
    if (!stripe || !elements || !config) return;

    setPayError(null);
    setPaying(true);
    try {
      const buyerEmail = emailRef.current.trim();
      if (!buyerEmail) {
        setPayError("Introduce tu email para recibir el acceso.");
        setPaying(false);
        return;
      }

      const { error: submitError } = await elements.submit();
      if (submitError) {
        setPayError(submitError.message || "Revisa los datos de pago.");
        setPaying(false);
        return;
      }

      const res = await fetch(`${THREEB_BASE_URL}/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: THREEB_API_KEY,
          productId: config.product.id,
          quantity: 1,
          buyerEmail,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { clientSecret, paymentIntentId } = await res.json();

      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/obrigado?payment_intent=${paymentIntentId}`,
          payment_method_data: { billing_details: { email: buyerEmail } },
        },
      });
      if (error) setPayError(error.message || "No se pudo procesar el pago.");
    } catch (e: any) {
      setPayError(e?.message || "No se pudo procesar el pago.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-pink-100 via-rose-50 to-white px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <h1 className="mb-5 text-center text-2xl font-black text-neutral-900">
          Finalizar compra
        </h1>

        {loadError && (
          <div className="rounded-2xl border border-rose-200 bg-white p-5 text-sm text-rose-600 shadow">
            {loadError}
          </div>
        )}

        {!loadError && (
          <section className="rounded-3xl bg-white p-5 shadow-xl sm:p-6">
            {/* Resumo do produto */}
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3">
              {config?.product.imageUrl ? (
                <img
                  src={config.product.imageUrl}
                  alt={config.product.name}
                  className="h-14 w-14 rounded-xl object-cover"
                />
              ) : (
                <div className="h-14 w-14 animate-pulse rounded-xl bg-neutral-200" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-neutral-800">
                  {config?.product.name ?? "Cargando…"}
                </p>
                {config?.product.description && (
                  <p className="truncate text-xs text-neutral-500">
                    {config.product.description}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-base font-black text-rose-500">
                {config
                  ? formatPrice(config.product.priceCents, config.product.currency)
                  : "—"}
              </span>
            </div>

            {/* Email */}
            <label className="mb-1 block text-sm font-semibold text-neutral-700" htmlFor="email">
              Tu email
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="mb-4 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
            />

            {/* Carteiras acima do Payment Element */}
            <div id="express-checkout" className="mb-4" />

            <div id="payment-element" className="mb-4 min-h-[120px]" />

            {payError && (
              <p className="mb-3 text-sm font-medium text-rose-600" role="alert">
                {payError}
              </p>
            )}

            <button
              type="button"
              onClick={() => void pay()}
              disabled={!ready || paying}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 py-4 font-bold text-white shadow-lg transition-all hover:from-rose-600 hover:to-rose-700 active:scale-[0.99] disabled:opacity-50"
            >
              {paying
                ? "Procesando…"
                : `Pagar ${
                    config ? formatPrice(config.product.priceCents, config.product.currency) : ""
                  }`}
            </button>

            <p className="mt-4 text-center text-[11px] leading-snug text-neutral-400">
              Pago seguro. Tus datos de tarjeta se procesan directamente por Stripe y nunca pasan
              por nuestros servidores.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
