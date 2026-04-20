// ============================================================================
// /checkout — Resumo do plano + criação da preferência Mercado Pago
// ----------------------------------------------------------------------------
// Exige usuário autenticado. Salva o plano no profile ANTES do redirect e
// dispara o Checkout Pro do MP.
// ============================================================================

import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, Loader2, CreditCard, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { getPlan, formatBRL, type BillingCycle, type PlanId } from "@/lib/plans";

type Search = {
  plan?: PlanId;
  cycle?: BillingCycle;
};

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    plan: (search.plan as PlanId) ?? "professional",
    cycle: (search.cycle as BillingCycle) ?? "annual",
  }),
  head: () => ({
    meta: [
      { title: "Checkout — Proativa" },
      { name: "description", content: "Finalize sua assinatura do Proativa com segurança via Mercado Pago." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { plan: planId, cycle } = useSearch({ from: "/checkout" });
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const plan = getPlan(planId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exige autenticação — redireciona pro login preservando o plano escolhido
  useEffect(() => {
    if (!authLoading && !user) {
      navigate({
        to: "/login",
        search: { redirect: "/checkout", plan: planId, cycle } as never,
      });
    }
  }, [user, authLoading, planId, cycle]);

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="font-display text-2xl text-foreground">Plano não encontrado</h1>
          <Link to="/" className="mt-4 inline-block text-primary underline">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    );
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const price = cycle === "annual" ? plan.price.annual : plan.price.monthly;

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      // ⚠️ A intenção de plano é registrada no Mercado Pago via metadata e o
      // webhook server-side é a única fonte de verdade para ativar o plano.
      // O cliente NÃO altera plan_status/plan_id no profile diretamente.
      const { createMercadoPagoCheckout } = await import("@/lib/mercado-pago");
      const data = await createMercadoPagoCheckout({
        data: {
          planId: planId!,
          cycle: cycle!,
          origin: window.location.origin,
          userId: user!.id,
        },
      });
      if (!data?.init_point) {
        throw new Error("Não foi possível iniciar o pagamento.");
      }
      window.location.href = data.init_point;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserIcon className="h-3.5 w-3.5" /> {user.email}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Pagamento seguro
          </span>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl text-foreground">
            Confirme sua assinatura
          </h1>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-soft)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Plano selecionado
              </p>
              <h2 className="mt-1 font-display text-2xl text-foreground">{plan.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
            </div>
            <span className="rounded-full bg-accent/30 px-3 py-1 text-xs font-medium text-foreground">
              {cycle === "annual" ? "Anual" : "Mensal"}
            </span>
          </div>

          <div className="mt-6 border-t border-border pt-6 flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <div className="text-right">
              <p className="font-display text-3xl text-foreground">{formatBRL(price)}</p>
              <p className="text-xs text-muted-foreground">
                /{cycle === "annual" ? "ano" : "mês"} · 70% OFF lançamento
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button onClick={handleCheckout} disabled={loading} size="lg" className="mt-8 w-full">
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Redirecionando…</>
            ) : (
              <><CreditCard className="h-4 w-4" /> Pagar com Mercado Pago</>
            )}
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Você será redirecionado para o ambiente seguro do Mercado Pago.
            Aceitamos Pix, cartão de crédito e boleto.
          </p>
        </div>
      </main>
    </div>
  );
}
