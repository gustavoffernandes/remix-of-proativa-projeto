const steps = [
  {
    n: "01",
    title: "Dispare a pesquisa anônima",
    desc: "Link seguro, em conformidade com LGPD, pronto para circular em minutos.",
  },
  {
    n: "02",
    title: "O dashboard processa em tempo real",
    desc: "Heatmap, demografia e tendências atualizadas a cada resposta.",
  },
  {
    n: "03",
    title: "Exporte o PDF e crie planos de ação",
    desc: "Documentação pronta para o PGR e medidas rastreáveis no mesmo lugar.",
  },
];

export function HowItWorks() {
  return (
    <section id="como" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-widest text-accent-foreground/70">Como funciona</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl text-foreground text-balance">
            Três passos. Zero complicação.
          </h2>
        </div>

        {/* Mobile: carrossel */}
        <div className="mt-10 sm:hidden -mx-4">
          <div className="snap-row">
            {steps.map((s) => (
              <div key={s.n} className="snap-item rounded-2xl border border-border bg-card p-6">
                <span className="font-display text-5xl text-foreground/10 leading-none">{s.n}</span>
                <h3 className="mt-4 font-display text-xl text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: grid */}
        <ol className="mt-12 hidden sm:grid gap-6 sm:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="relative rounded-2xl border border-border bg-card p-6 sm:p-8">
              <span className="font-display text-5xl text-foreground/10 leading-none">{s.n}</span>
              <h3 className="mt-4 font-display text-xl text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
