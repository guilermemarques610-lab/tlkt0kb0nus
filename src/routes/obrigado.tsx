import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { THREEB_BASE_URL, formatPrice, loadStripeJs } from "@/lib/checkout-config";

export const Route = createFileRoute("/obrigado")({
  head: () => ({
    meta: [
      { title: "¡Gracias por tu compra! | Acceso liberado" },
      {
        name: "description",
        content: "Tu pago se ha confirmado. Accede ahora mismo a tu contenido.",
      },
      { property: "og:title", content: "¡Gracias por tu compra!" },
      { property: "og:description", content: "Tu pago se ha confirmado. Accede a tu contenido." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Obrigado,
});

type OrderStatus = {
  status: string;
  orderId?: string;
  deliveryUrl?: string;
  productName?: string;
  canUpsell?: boolean;
  upsellOneClick?: boolean;
  upsellProduct?: {
    id?: string;
    name?: string;
    description?: string;
    priceCents?: number;
    currency?: string;
    imageUrl?: string;
    checkoutUrl?: string;
  };
};

function Obrigado() {
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upsellState, setUpsellState] = useState<"idle" | "loading" | "paid" | "owned">("idle");
  const [upsellError, setUpsellError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let tries = 0;

    const poll = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const pi = params.get("payment_intent");
        if (!pi) {
          setError("Falta el identificador del pago.");
          return;
        }
        const res = await fetch(
          `${THREEB_BASE_URL}/get-order-status?session_id=${encodeURIComponent(pi)}`,
        );
        if (!res.ok) throw new Error(await res.text());
        const data: OrderStatus = await res.json();
        if (cancelled) return;
        setOrder(data);
        if (data.status !== "paid" && tries < 10) {
          tries += 1;
          setTimeout(poll, 2000);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "No se pudo verificar el pago.");
      }
    };

    void poll();
    return () => {
      cancelled = true;
    };
  }, []);

  async function buyUpsell() {
    if (!order?.orderId) return;
    setUpsellError(null);
    setUpsellState("loading");
    try {
      const res = await fetch(`${THREEB_BASE_URL}/create-upsell`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalOrderId: order.orderId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      if (data.status === "paid") {
        setUpsellState("paid");
      } else if (data.status === "already_purchased") {
        setUpsellState("owned");
      } else if (data.status === "requires_action") {
        const Stripe = await loadStripeJs();
        const stripe = Stripe(data.publishableKey);
        const { error } = await stripe.handleNextAction({ clientSecret: data.clientSecret });
        if (error) throw new Error(error.message);
        setUpsellState("paid");
      }
    } catch (e: any) {
      setUpsellError(e?.message || "No se pudo completar la compra.");
      setUpsellState("idle");
    }
  }

  const paid = order?.status === "paid";
  const up = order?.upsellProduct;

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-pink-100 via-rose-50 to-white px-4 py-10">
      <div className="mx-auto w-full max-w-md space-y-5">
        <section className="rounded-3xl bg-white p-6 text-center shadow-xl">
          {error ? (
            <p className="text-sm text-rose-600">{error}</p>
          ) : !order ? (
            <p className="text-sm text-neutral-500">Verificando tu pago…</p>
          ) : paid ? (
            <>
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-2xl font-black text-emerald-600">
                ✓
              </div>
              <h1 className="mb-2 text-2xl font-black text-neutral-900">¡Gracias por tu compra!</h1>
              <p className="mb-5 text-sm text-neutral-600">
                Tu pago de <strong>{order.productName}</strong> se ha confirmado correctamente.
              </p>
              {order.deliveryUrl && (
                <a
                  href={order.deliveryUrl}
                  className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-rose-600 py-4 font-bold text-white shadow-lg transition-all hover:from-rose-600 hover:to-rose-700"
                >
                  Acceder a mi contenido
                </a>
              )}
            </>
          ) : (
            <>
              <h1 className="mb-2 text-xl font-black text-neutral-900">Procesando tu pago…</h1>
              <p className="text-sm text-neutral-600">
                Estamos confirmando la transacción. Esta página se actualiza sola.
              </p>
            </>
          )}
        </section>

        {paid && order?.canUpsell && up && (
          <section className="rounded-3xl border-2 border-rose-200 bg-white p-6 shadow-xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-rose-500">
              Oferta exclusiva por única vez
            </p>
            <div className="mb-4 flex items-center gap-3">
              {up.imageUrl && (
                <img
                  src={up.imageUrl}
                  alt={up.name ?? "Oferta"}
                  className="h-14 w-14 rounded-xl object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-neutral-800">{up.name}</p>
                {up.description && (
                  <p className="line-clamp-2 text-xs text-neutral-500">{up.description}</p>
                )}
              </div>
              {typeof up.priceCents === "number" && (
                <span className="shrink-0 font-black text-rose-500">
                  {formatPrice(up.priceCents, up.currency || "eur")}
                </span>
              )}
            </div>

            {upsellState === "paid" ? (
              <p className="text-center text-sm font-semibold text-emerald-600">
                ¡Añadido a tu compra! Revisa tu email.
              </p>
            ) : upsellState === "owned" ? (
              <p className="text-center text-sm text-neutral-500">Ya tienes este producto.</p>
            ) : order.upsellOneClick ? (
              <button
                type="button"
                onClick={() => void buyUpsell()}
                disabled={upsellState === "loading"}
                className="w-full rounded-full bg-gradient-to-r from-rose-500 to-rose-600 py-4 font-bold text-white shadow-lg transition-all hover:from-rose-600 hover:to-rose-700 disabled:opacity-50"
              >
                {upsellState === "loading" ? "Procesando…" : "Añadir con 1 clic"}
              </button>
            ) : (
              <a
                href={up.checkoutUrl || `/checkout?productId=${up.id ?? ""}`}
                className="block w-full rounded-full bg-gradient-to-r from-rose-500 to-rose-600 py-4 text-center font-bold text-white shadow-lg transition-all hover:from-rose-600 hover:to-rose-700"
              >
                Quiero esta oferta
              </a>
            )}

            {upsellError && (
              <p className="mt-3 text-center text-sm text-rose-600">{upsellError}</p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
