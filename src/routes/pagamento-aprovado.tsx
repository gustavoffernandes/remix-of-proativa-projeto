// ============================================================================
// /pagamento-aprovado — Tela informativa pós Mercado Pago
// ----------------------------------------------------------------------------
// IMPORTANTE: A ativação do plano e a concessão da role admin acontecem
// EXCLUSIVAMENTE no webhook (server-side), via função apply_payment_status.
// Esta tela apenas lê o estado atual do profile e mostra ao usuário.
// ============================================================================
import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { CheckCircle2, Clock, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { getPlan, formatBRL, type BillingCycle, type PlanId } from "@/lib/plans";

type Search = {
  status?: string;
  plan?: PlanId;
  cycle?: BillingCycle;
  payment_id?: string;
  collection_status?: string;
};

export const Route = createFileRoute("/pagamento-aprovado")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    status: typeof s.status === "string" ? s.status : undefined,
    plan: (typeof s.plan === "string" ? s.plan : undefined) as PlanId | undefined,
    cycle: (typeof s.cycle === "string" ? s.cycle : undefined) as BillingCycle | undefined,
    payment_id: typeof s.payment_id === "string" ? s.payment_id : undefined,
    collection_status: typeof s.collection_status === "string" ? s.collection_status : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Pagamento aprovado — Proativa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ApprovedPage,
});

// 🔧 ALTERE AQUI quando a dashboard estiver no ar.
const DASHBOARD_URL = "https://dashboard.proativa.app";

function ApprovedPage() {
  const search = useSearch({ from: "/pagamento-aprovado" });
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [planStatus, setPlanStatus] = useState<string | null>(null);
  const [savedPlan, setSavedPlan] = useState<PlanId | undefined>(search.plan);
  const [savedCycle, setSavedCycle] = useState<BillingCycle | undefined>(search.cycle);
  const [checking, setChecking] = useState(true);
  const plan = getPlan(savedPlan);

  // Validação: status deve ser approved (param do MP)
  const statusOk =
    search.status === "approved" || search.collection_status === "approved";

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login", search: { redirect: "/pagamento-aprovado" } as never });
      return;
    }
    if (!statusOk) {
      navigate({ to: "/" });
      return;
    }
    if (!user) return;

    // Faz polling no profile até ver plan_status='active' (webhook pode demorar)
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 8;

    const poll = async () => {
      attempts++;
      const { data } = await supabase
        .from("profiles")
        .select("plan_id, plan_cycle, plan_status")
        .eq("user_id", user.id)
        .single();

      if (cancelled) return;

      if (data) {
        setPlanStatus(data.plan_status);
        if (data.plan_id) setSavedPlan(data.plan_id as PlanId);
        if (data.plan_cycle) setSavedCycle(data.plan_cycle as BillingCycle);

        if (data.plan_status === "active" || attempts >= maxAttempts) {
          setChecking(false);
          return;
        }
      }
      // Tenta de novo em 2s
      setTimeout(poll, 2000);
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, statusOk]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const price = plan && savedCycle ? (savedCycle === "annual" ? plan.price.annual : plan.price.monthly) : null;
  const isActive = planStatus === "active";

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center">
          {isActive ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="h-9 w-9" strokeWidth={2} />
              </div>
              <span className="mt-6 inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-success">
                <ShieldCheck className="h-3.5 w-3.5" /> Pagamento confirmado
              </span>
              <h1 className="mt-3 font-display text-3xl sm:text-4xl text-foreground">
                Bem-vindo ao Proativa!
              </h1>
              <p className="mt-3 text-muted-foreground">
                Seu pagamento foi aprovado e sua assinatura já está ativa.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning/20 text-warning-foreground">
                {checking ? <Loader2 className="h-9 w-9 animate-spin" /> : <Clock className="h-9 w-9" strokeWidth={2} />}
              </div>
              <h1 className="mt-6 font-display text-3xl sm:text-4xl text-foreground">
                Confirmando seu pagamento…
              </h1>
              <p className="mt-3 text-muted-foreground">
                Estamos aguardando a confirmação do Mercado Pago. Isso costuma levar alguns segundos.
                Você pode fechar esta página — assim que confirmado, sua assinatura será ativada
                automaticamente e enviaremos um e-mail.
              </p>
            </>
          )}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-soft)] space-y-6">
          {plan && (
            <div className="flex items-start justify-between gap-4 border-b border-border pb-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Plano contratado</p>
                <h2 className="mt-1 font-display text-2xl text-foreground">{plan.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {savedCycle === "annual" ? "Cobrança anual" : "Cobrança mensal"}
                </p>
              </div>
              {price && (
                <div className="text-right">
                  <p className="font-display text-2xl text-foreground">{formatBRL(price)}</p>
                  <p className="text-xs text-muted-foreground">/{savedCycle === "annual" ? "ano" : "mês"}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Aprovado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/20 px-3 py-1 text-xs font-medium text-warning-foreground">
                <Clock className="h-3.5 w-3.5" /> Aguardando confirmação
              </span>
            )}
          </div>

          {search.payment_id && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Identificador</span>
              <span className="font-mono text-xs text-foreground">#{search.payment_id}</span>
            </div>
          )}

          {isActive ? (
            <>
              <div className="rounded-xl bg-muted/50 p-4 sm:p-5 border border-border">
                <p className="text-sm text-foreground">
                  <strong>Acesso à dashboard:</strong> use as <strong>mesmas credenciais</strong> ({user?.email})
                  para entrar. Não é necessário criar uma nova conta.
                </p>
              </div>

              <a
                href={DASHBOARD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Acessar a dashboard <ExternalLink className="h-4 w-4" />
              </a>

              <p className="text-center text-xs text-muted-foreground">
                Link provisório de teste — será atualizado quando a dashboard estiver no ar.
              </p>
            </>
          ) : (
            <div className="rounded-xl bg-muted/50 p-4 sm:p-5 border border-border">
              <p className="text-sm text-foreground">
                Enviaremos um e-mail para <strong>{user?.email}</strong> assim que a ativação for concluída.
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">Voltar para a página inicial</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
