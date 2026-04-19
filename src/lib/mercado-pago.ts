// ============================================================================
// SERVER FUNCTION — Mercado Pago Checkout Pro
// ----------------------------------------------------------------------------
// Cria uma "preferência" de pagamento no Mercado Pago e devolve a URL para
// onde o usuário deve ser redirecionado (init_point do Checkout Pro).
//
// 🔐 REQUER a variável de ambiente (secret) MERCADO_PAGO_ACCESS_TOKEN.
//    - Produção: token APP_USR-... do app real (painel Mercado Pago)
//    - Testes:   token TEST-... (painel Mercado Pago → Suas integrações)
//
// 📝 Para alterar DADOS DA EMPRESA (descritor na fatura, e-mail, metadados),
//    edite o objeto `preference` mais abaixo.
//
// 📚 Docs: https://www.mercadopago.com.br/developers/pt/reference/preferences/_checkout_preferences/post
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { getPlan, type BillingCycle } from "./plans";

const MP_API = "https://api.mercadopago.com/checkout/preferences";

export interface CheckoutInput {
  planId: string;
  cycle: BillingCycle;
  /** Origin do site, enviado pelo cliente para montar back_urls absolutas. */
  origin: string;
}

export const createMercadoPagoCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: unknown): CheckoutInput => {
    const i = input as Partial<CheckoutInput> | null;
    if (!i?.planId || !i?.cycle || !i?.origin) {
      throw new Error("planId, cycle e origin são obrigatórios.");
    }
    if (i.cycle !== "monthly" && i.cycle !== "annual") {
      throw new Error("cycle deve ser 'monthly' ou 'annual'.");
    }
    return { planId: i.planId, cycle: i.cycle, origin: i.origin };
  })
  .handler(async ({ data }) => {
    const plan = getPlan(data.planId);
    if (!plan) {
      throw new Error("Plano inválido.");
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error(
        "MERCADO_PAGO_ACCESS_TOKEN não configurado. Adicione o token em Lovable Cloud → Secrets.",
      );
    }

    const unitPrice =
      data.cycle === "annual" ? plan.price.annual : plan.price.monthly;

    // 🔧 Personalize aqui os DADOS DO RECEBEDOR / METADADOS exibidos no checkout.
    const preference = {
      items: [
        {
          id: `${plan.id}-${data.cycle}`,
          title: `Proativa — Plano ${plan.name} (${
            data.cycle === "annual" ? "Anual" : "Mensal"
          })`,
          description: plan.description,
          quantity: 1,
          unit_price: unitPrice,
          currency_id: "BRL",
          category_id: "services",
        },
      ],
      metadata: {
        plan_id: plan.id,
        cycle: data.cycle,
        product: "proativa",
      },
      statement_descriptor: "PROATIVA",
      back_urls: {
        success: `${data.origin}/checkout/sucesso?plan=${plan.id}`,
        failure: `${data.origin}/checkout/erro?plan=${plan.id}`,
        pending: `${data.origin}/checkout/pendente?plan=${plan.id}`,
      },
      auto_return: "approved",
      // notification_url: `${data.origin}/api/mercado-pago-webhook`, // (futuro)
    };

    const res = await fetch(MP_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preference),
    });

    const json = (await res.json()) as {
      init_point?: string;
      sandbox_init_point?: string;
      message?: string;
    };

    if (!res.ok || !json.init_point) {
      throw new Error(
        json.message ?? `Falha ao criar preferência (HTTP ${res.status}).`,
      );
    }

    // Em ambiente de teste, redireciona para sandbox automaticamente.
    const isTestToken = accessToken.startsWith("TEST-");
    return {
      init_point:
        isTestToken && json.sandbox_init_point
          ? json.sandbox_init_point
          : json.init_point,
    };
  });
