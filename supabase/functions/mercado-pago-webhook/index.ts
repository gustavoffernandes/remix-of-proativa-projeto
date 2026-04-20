// =============================================================================
// MERCADO PAGO WEBHOOK — server-side payment verification
// -----------------------------------------------------------------------------
// Receives webhook notifications from Mercado Pago, fetches the payment from
// the MP API using the secret access token, validates it is "approved", and
// records a verified payment in `payment_verifications`.
//
// Only after a row exists in `payment_verifications` (status='approved') will
// the database function `grant_admin_after_payment` activate the user's plan
// and grant admin access. This prevents users from self-granting admin rights
// by tampering with profile fields or URL parameters.
//
// This function is intentionally PUBLIC (no JWT). Mercado Pago calls it.
// =============================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MP_API = "https://api.mercadopago.com/v1/payments";

interface MPPayment {
  id: number | string;
  status: string;
  status_detail?: string;
  transaction_amount?: number;
  external_reference?: string;
  metadata?: Record<string, unknown>;
  payer?: { email?: string };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
      return json({ error: "MP token not configured" }, 500);
    }

    // MP envia { type: "payment", data: { id: "..." } } ou query ?topic=payment&id=...
    const url = new URL(req.url);
    let paymentId: string | null =
      url.searchParams.get("id") ?? url.searchParams.get("data.id");

    if (!paymentId && req.headers.get("content-type")?.includes("application/json")) {
      const body = await req.json().catch(() => null);
      paymentId =
        body?.data?.id?.toString() ??
        body?.resource?.toString().split("/").pop() ??
        null;
    }

    if (!paymentId) {
      return json({ ok: true, ignored: "no payment id" });
    }

    // Fetch payment from MP API to verify authenticity & status
    const mpRes = await fetch(`${MP_API}/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!mpRes.ok) {
      console.error("MP fetch failed", mpRes.status, await mpRes.text());
      return json({ error: "MP fetch failed" }, 502);
    }
    const payment = (await mpRes.json()) as MPPayment;

    const meta = (payment.metadata ?? {}) as Record<string, string>;
    const userId = meta.user_id ?? meta.userId ?? null;
    const planId = meta.plan_id ?? meta.planId ?? null;
    const cycle = meta.cycle ?? null;

    if (!userId || !planId || !cycle) {
      console.error("Missing metadata on payment", payment.id, meta);
      return json({ ok: true, ignored: "missing metadata" });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error } = await supabase
      .from("payment_verifications")
      .upsert(
        {
          user_id: userId,
          payment_id: payment.id.toString(),
          plan_id: planId,
          plan_cycle: cycle,
          status: payment.status,
          amount: payment.transaction_amount ?? null,
          raw: payment as unknown as Record<string, unknown>,
        },
        { onConflict: "payment_id" },
      );

    if (error) {
      console.error("DB upsert error", error);
      return json({ error: error.message }, 500);
    }

    return json({ ok: true, status: payment.status });
  } catch (e) {
    console.error("Webhook error", e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
