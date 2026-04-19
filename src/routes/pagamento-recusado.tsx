// ============================================================================
// /pagamento-recusado — Tela de falha pós Mercado Pago
// ============================================================================
import { useEffect } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { XCircle, ArrowLeft, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import type { BillingCycle, PlanId } from "@/lib/plans";

type Search = {
  status?: string;
  plan?: PlanId;
  cycle?: BillingCycle;
  collection_status?: string;
};

export const Route = createFileRoute("/pagamento-recusado")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    status: typeof s.status === "string" ? s.status : undefined,
    plan: (typeof s.plan === "string" ? s.plan : undefined) as PlanId | undefined,
    cycle: (typeof s.cycle === "string" ? s.cycle : undefined) as BillingCycle | undefined,
    collection_status: typeof s.collection_status === "string" ? s.collection_status : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Pagamento não aprovado — Proativa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: RejectedPage,
});

function RejectedPage() {
  const search = useSearch({ from: "/pagamento-recusado" });
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, loading]);

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <XCircle className="h-9 w-9" strokeWidth={2} />
          </div>
          <h1 className="mt-6 font-display text-3xl sm:text-4xl text-foreground">
            Pagamento não aprovado
          </h1>
          <p className="mt-3 text-muted-foreground">
            Não foi possível concluir sua assinatura. O valor não foi cobrado.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-soft)] space-y-5">
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:p-5 text-sm text-foreground">
            <p className="font-medium">Possíveis motivos:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Cartão sem limite ou inválido.</li>
              <li>Dados digitados incorretamente.</li>
              <li>Operação recusada pelo banco emissor.</li>
              <li>Pagamento cancelado durante o processo.</li>
            </ul>
          </div>

          <Button asChild size="lg" className="w-full">
            <Link
              to="/checkout"
              search={search.plan ? { plan: search.plan, cycle: search.cycle ?? "annual" } : { plan: "professional", cycle: "annual" }}
            >
              <RefreshCcw className="h-4 w-4" /> Tentar novamente
            </Link>
          </Button>

          <Button asChild variant="ghost" className="w-full">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" /> Voltar para a página inicial
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
