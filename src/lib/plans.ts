// ============================================================================
// CATÁLOGO DE PLANOS — Proativa
// ----------------------------------------------------------------------------
// Fonte única de verdade dos planos. Editar aqui altera Pricing E Checkout.
// Os preços DEVEM bater com os produtos cadastrados no painel do Mercado Pago.
// ============================================================================

export type BillingCycle = "monthly" | "annual";

export type PlanId = "starter" | "professional" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  /** Preço em REAIS (R$), valor numérico — Mercado Pago aceita decimal. */
  price: {
    monthly: number;
    annual: number;
  };
}

// 🔧 ALTERE OS VALORES ABAIXO conforme sua tabela final.
// (valores promocionais 70% OFF — manter sincronizado com Pricing.tsx)
export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "Pequenas empresas e consultores independentes.",
    price: { monthly: 0.10, annual: 0.10 },
  },
  professional: {
    id: "professional",
    name: "Profissional",
    description: "Empresas e consultorias SST em crescimento.",
    price: { monthly: 29.97, annual: 299.9 },
  },
  enterprise: {
    id: "enterprise",
    name: "Empresarial",
    description: "Grandes operações, redes e consultorias.",
    price: { monthly: 59.97, annual: 599.9 },
  },
};

export function getPlan(id: string | undefined): Plan | null {
  if (!id) return null;
  return (PLANS as Record<string, Plan>)[id] ?? null;
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
