import { useState } from "react";
import { Check, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PlanId } from "@/lib/plans";

type Plan = {
  id: PlanId;
  name: string;
  desc: string;
  monthly: { from: string; now: string };
  annual: { from: string; now: string };
  features: { label: string; included: boolean }[];
  highlighted?: boolean;
};

const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    desc: "Pequenas empresas e consultores independentes.",
    monthly: { from: "R$ 69,90", now: "R$ 20,97" },
    annual: { from: "R$ 697,00", now: "R$ 209,10" },
    features: [
      { label: "1 empresa", included: true },
      { label: "1 pesquisa/mês", included: true },
      { label: "20 respondentes", included: true },
      { label: "Relatório PDF + Excel", included: true },
      { label: "Matriz de Risco P×S", included: false },
      { label: "Filtros GHE/Setor", included: false },
      { label: "Suporte dedicado", included: false },
    ],
  },
  {
    id: "professional",
    name: "Profissional",
    desc: "Empresas e consultorias SST em crescimento.",
    monthly: { from: "R$ 99,90", now: "R$ 29,97" },
    annual: { from: "R$ 997,00", now: "R$ 299,10" },
    features: [
      { label: "Até 10 empresas", included: true },
      { label: "10 pesquisas/mês", included: true },
      { label: "200 respondentes", included: true },
      { label: "Relatório PDF + Excel", included: true },
      { label: "Matriz de Risco P×S", included: true },
      { label: "Filtros GHE/Setor", included: true },
      { label: "Suporte dedicado", included: false },
    ],
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Empresarial",
    desc: "Grandes operações, redes e consultorias.",
    monthly: { from: "R$ 199,90", now: "R$ 59,97" },
    annual: { from: "R$ 1.997,00", now: "R$ 599,10" },
    features: [
      { label: "25 empresas", included: true },
      { label: "50 pesquisas/mês", included: true },
      { label: "500 respondentes", included: true },
      { label: "Relatório PDF + Excel", included: true },
      { label: "Matriz de Risco P×S", included: true },
      { label: "Filtros GHE/Setor", included: true },
      { label: "Suporte dedicado", included: true },
    ],
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="precos" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-warning/15 text-warning-foreground px-3 py-1 text-xs font-medium">
            🔥 Lançamento — 70% OFF
          </span>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl text-foreground text-balance">
            Conformidade com condição exclusiva.
          </h2>
          <p className="mt-4 text-muted-foreground text-pretty">
            Garanta o Proativa agora e construa o histórico de prevenção antes da NR-01 entrar em vigor.
          </p>

          <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
            {(["monthly", "annual"] as const).map((opt) => {
              const active = (opt === "annual") === annual;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAnnual(opt === "annual")}
                  className={cn(
                    "px-4 py-1.5 text-sm rounded-full transition-colors",
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {opt === "monthly" ? "Mensal" : "Anual"}
                  {opt === "annual" && (
                    <span className="ml-1.5 text-[10px] uppercase tracking-wider text-success">
                      -2 meses
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile: carrossel lateral */}
        <div className="mt-12 lg:hidden -mx-4">
          <div className="snap-row items-stretch">
            {plans.map((p) => {
              const price = annual ? p.annual : p.monthly;
              return (
                <div
                  key={p.name}
                  className={cn(
                    "snap-item relative rounded-2xl border bg-card p-6 flex flex-col",
                    p.highlighted
                      ? "border-foreground shadow-[var(--shadow-elevated)]"
                      : "border-border",
                  )}
                >
                  {p.highlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground text-background px-3 py-1 text-[11px] font-medium tracking-wide">
                      Mais escolhido
                    </span>
                  )}
                  <h3 className="font-display text-2xl text-foreground">{p.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground min-h-[40px]">{p.desc}</p>

                  <div className="mt-6">
                    <p className="text-xs text-muted-foreground line-through">De {price.from}</p>
                    <p className="mt-1 flex items-baseline gap-1.5">
                      <span className="font-display text-4xl text-foreground">{price.now}</span>
                      <span className="text-sm text-muted-foreground">
                        /{annual ? "ano" : "mês"}
                      </span>
                    </p>
                  </div>

                  <ul className="mt-6 space-y-2.5 flex-1">
                    {p.features.map((f) => (
                      <li key={f.label} className="flex items-start gap-2.5 text-sm">
                        {f.included ? (
                          <Check className="h-4 w-4 mt-0.5 text-success shrink-0" strokeWidth={2.5} />
                        ) : (
                          <X className="h-4 w-4 mt-0.5 text-muted-foreground/50 shrink-0" />
                        )}
                        <span className={f.included ? "text-foreground" : "text-muted-foreground/70"}>
                          {f.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    className="mt-8 w-full"
                    variant={p.highlighted ? "default" : "outline"}
                    size="lg"
                  >
                    <Link
                      to="/checkout"
                      search={{ plan: p.id, cycle: annual ? "annual" : "monthly" }}
                    >
                      Assinar {p.name}
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-center text-[11px] uppercase tracking-widest text-muted-foreground">
            ← deslize para comparar →
          </p>
        </div>

        {/* Desktop: grid */}
        <div className="mt-12 hidden lg:grid gap-6 lg:grid-cols-3">
          {plans.map((p) => {
            const price = annual ? p.annual : p.monthly;
            return (
              <div
                key={p.name}
                className={cn(
                  "relative rounded-2xl border bg-card p-6 sm:p-8 flex flex-col",
                  p.highlighted
                    ? "border-foreground shadow-[var(--shadow-elevated)] lg:scale-[1.02]"
                    : "border-border",
                )}
              >
                {p.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground text-background px-3 py-1 text-[11px] font-medium tracking-wide">
                    Mais escolhido
                  </span>
                )}
                <h3 className="font-display text-2xl text-foreground">{p.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground min-h-[40px]">{p.desc}</p>

                <div className="mt-6">
                  <p className="text-xs text-muted-foreground line-through">
                    De {price.from}
                  </p>
                  <p className="mt-1 flex items-baseline gap-1.5">
                    <span className="font-display text-4xl text-foreground">{price.now}</span>
                    <span className="text-sm text-muted-foreground">
                      /{annual ? "ano" : "mês"}
                    </span>
                  </p>
                </div>

                <ul className="mt-6 space-y-2.5 flex-1">
                  {p.features.map((f) => (
                    <li key={f.label} className="flex items-start gap-2.5 text-sm">
                      {f.included ? (
                        <Check className="h-4 w-4 mt-0.5 text-success shrink-0" strokeWidth={2.5} />
                      ) : (
                        <X className="h-4 w-4 mt-0.5 text-muted-foreground/50 shrink-0" />
                      )}
                      <span className={f.included ? "text-foreground" : "text-muted-foreground/70"}>
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className="mt-8 w-full"
                  variant={p.highlighted ? "default" : "outline"}
                  size="lg"
                >
                  <Link
                    to="/checkout"
                    search={{ plan: p.id, cycle: annual ? "annual" : "monthly" }}
                  >
                    Assinar {p.name}
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Promoção limitada — 91% das licenças com desconto máximo já foram pré-reservadas.
        </p>
      </div>
    </section>
  );
}
