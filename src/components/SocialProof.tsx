const quotes = [
  {
    name: "Mariana Costa",
    role: "Diretora de RH · Indústria de autopeças",
    text: "Economizamos semanas de tabulação e evitamos um processo trabalhista grave usando os planos de ação do Proativa.",
  },
  {
    name: "Ricardo Almeida",
    role: "Consultor SST · Campo Grande/MS",
    text: "Antes eram três dias fechando Excel. Hoje o PDF sai em minutos — o cliente vê o heatmap e já entende onde agir.",
  },
];

export function SocialProof() {
  return (
    <section className="py-20 sm:py-28 bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl text-background text-balance">
            Relatos
          </h2>
        </div>

        {/* Quotes — mobile carrossel */}
        <div className="mt-10 sm:hidden -mx-4">
          <div className="snap-row">
            {quotes.map((q) => (
              <figure key={q.name} className="snap-item rounded-2xl border border-border bg-card p-6">
                <blockquote className="font-display text-lg text-foreground text-balance leading-snug">
                  “{q.text}”
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    {q.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{q.name}</p>
                    <p className="text-xs text-muted-foreground">{q.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        {/* Quotes — desktop grid */}
        <div className="mt-10 hidden sm:grid gap-4 sm:grid-cols-2">
          {quotes.map((q) => (
            <figure key={q.name} className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <blockquote className="font-display text-lg sm:text-xl text-foreground text-balance leading-snug">
                “{q.text}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  {q.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{q.name}</p>
                  <p className="text-xs text-muted-foreground">{q.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
