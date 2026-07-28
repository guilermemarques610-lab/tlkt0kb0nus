import { createFileRoute } from "@tanstack/react-router";

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
  return (
    <main className="min-h-screen w-full bg-neutral-500 px-4 py-10 flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl bg-white px-7 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
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

        <a
          href="/checkout"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-rose-500 to-rose-600 py-4 text-[17px] font-black text-white shadow-lg transition-all hover:from-rose-600 hover:to-rose-700 active:scale-[0.99]"
        >
          Intentar de nuevo
          <span aria-hidden="true">→</span>
        </a>

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
