import { LayoutGrid, Filter, ListChecks, Building2, FileDown, Lock } from "lucide-react";

const features = [
  {
    icon: LayoutGrid,
    title: "Heatmap de Riscos",
    desc: "Matriz P×S com leitura instantânea por setor e GHE.",
  },
  {
    icon: Filter,
    title: "Análise demográfica",
    desc: "Filtre por gênero, idade, cargo e compare evolução histórica.",
  },
  {
    icon: ListChecks,
    title: "Planos de ação",
    desc: "Gerenciamento integrado das medidas de mitigação no dashboard.",
  },
  {
    icon: Building2,
    title: "Multi-empresas",
    desc: "Compare unidades e filiais no mesmo painel consolidado.",
  },
  {
    icon: FileDown,
    title: "PDF em 1 clique",
    desc: "Relatório pronto para anexar ao PGR. Integração com Sheets.",
  },
  {
    icon: Lock,
    title: "100% Anônimo · LGPD",
    desc: "Coleta blindada que protege colaborador e empresa.",
  },
];

export function Solution() {
  return (
    <section id="solucao" className="py-20 sm:py-28 bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-widest text-accent">Solução</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl text-background text-balance">
            O Proativa faz o trabalho complexo por você.
          </h2>
          <p className="mt-4 text-background/70 text-pretty">
            A única plataforma focada na metodologia Proart que entrega tudo que a auditoria exige.
          </p>
        </div>

        {/* Mobile: carrossel lateral */}
        <div className="mt-10 sm:hidden -mx-4">
          <div className="snap-row">
            {features.map((f) => (
              <div key={f.title} className="snap-item rounded-2xl border border-border bg-card p-6">
                <f.icon className="h-5 w-5 text-primary" strokeWidth={2} />
                <h3 className="mt-5 font-display text-lg text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: grid */}
        <div className="mt-12 hidden sm:grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="bg-card p-6 sm:p-8">
              <f.icon className="h-5 w-5 text-primary" strokeWidth={2} />
              <h3 className="mt-5 font-display text-lg text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
