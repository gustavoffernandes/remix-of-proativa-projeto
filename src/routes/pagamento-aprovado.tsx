// ============================================================================
// /pagamento-aprovado — Tela de sucesso pós Mercado Pago
// ----------------------------------------------------------------------------
// Proteção: exige usuário logado + parâmetro status=approved (vindo do MP).
// Atualiza o profile com plano contratado.
// ============================================================================
import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { CheckCircle2, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
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
  const [savedPlan, setSavedPlan] = useState<PlanId | undefined>(search.plan);
  const [savedCycle, setSavedCycle] = useState<BillingCycle | undefined>(search.cycle);
  const [updating, setUpdating] = useState(true);
  const plan = getPlan(savedPlan);

  // Validação: status deve ser approved (param do MP)
  const statusOk =
    search.status === "approved" || search.collection_status === "approved";

  useEffect(() => {
    // Sem login → manda pro login preservando params
    if (!authLoading && !user) {
      navigate({ to: "/login", search: { redirect: "/pagamento-aprovado" } as never });
      return;
    }
    // Sem status válido → manda pra home
    if (!statusOk) {
      navigate({ to: "/" });
      return;
    }
    // ⚠️ A ativação do plano é feita SOMENTE pelo servidor (webhook do MP que
    // grava em payment_verifications). O cliente apenas tenta chamar o RPC
    // que valida server-side e, se houver pagamento verificado, concede o
    // role 'admin'. Pode ser que o webhook ainda não tenha chegado quando o
    // usuário é redirecionado — nesse caso, fazemos polling com retry.
    if (user && savedPlan && savedCycle) {
      (async () => {
        let granted = false;
        for (let attempt = 0; attempt < 6; attempt++) {
          const { error: rpcError } = await supabase.rpc("grant_admin_after_payment");
          if (!rpcError) {
            granted = true;
            break;
          }
          // Aguarda 2s e tenta de novo (webhook do MP pode demorar a chegar).
          await new Promise((r) => setTimeout(r, 2000));
        }
        if (!granted) {
          console.warn(
            "Pagamento ainda não confirmado pelo servidor. O acesso será liberado assim que o webhook do Mercado Pago for processado.",
          );
        }
        setUpdating(false);
      })();
    } else {
      // Tenta ler do profile (caso usuário recarregue sem params)
      if (user) {
        supabase
          .from("profiles")
          .select("plan_id, plan_cycle")
          .eq("user_id", user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setSavedPlan(data.plan_id as PlanId);
              setSavedCycle(data.plan_cycle as BillingCycle);
            }
            setUpdating(false);
          });
      }
    }
  }, [user, authLoading, statusOk]);

  if (authLoading || updating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const price = plan && savedCycle ? (savedCycle === "annual" ? plan.price.annual : plan.price.monthly) : null;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center">
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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
              <CheckCircle2 className="h-3.5 w-3.5" /> Aprovado
            </span>
          </div>

          {search.payment_id && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Identificador</span>
              <span className="font-mono text-xs text-foreground">#{search.payment_id}</span>
            </div>
          )}

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
