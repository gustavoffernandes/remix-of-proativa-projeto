// ============================================================================
// /pagamento-pendente — Pagamento aguardando confirmação (Pix/Boleto)
// ============================================================================
import { useEffect } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import type { BillingCycle, PlanId } from "@/lib/plans";

type Search = {
  status?: string;
  plan?: PlanId;
  cycle?: BillingCycle;
};

export const Route = createFileRoute("/pagamento-pendente")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    status: typeof s.status === "string" ? s.status : undefined,
    plan: (typeof s.plan === "string" ? s.plan : undefined) as PlanId | undefined,
    cycle: (typeof s.cycle === "string" ? s.cycle : undefined) as BillingCycle | undefined,
  }),
  head: () => ({
    meta: [
      { title: "Pagamento pendente — Proativa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PendingPage,
});

function PendingPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  useSearch({ from: "/pagamento-pendente" });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading]);

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning/20 text-warning-foreground">
            <Clock className="h-9 w-9" strokeWidth={2} />
          </div>
          <h1 className="mt-6 font-display text-3xl sm:text-4xl text-foreground">
            Aguardando confirmação
          </h1>
          <p className="mt-3 text-muted-foreground">
            Seu pagamento (Pix ou Boleto) foi registrado e está em análise.
            Assim que for compensado, sua assinatura será liberada automaticamente.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-soft)] space-y-4">
          <p className="text-sm text-foreground">
            Você receberá um e-mail em <strong>{user?.email}</strong> assim que a confirmação chegar.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" /> Voltar para a página inicial
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
