// ============================================================================
// /esqueci-senha — Solicitação de recuperação por e-mail
// ============================================================================
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/esqueci-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — Proativa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ForgotPage,
});

const schema = z.object({ email: z.string().trim().email("E-mail inválido") });

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar para o login
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-md px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="font-display text-3xl text-foreground text-center">Recuperar senha</h1>
        <p className="mt-2 text-sm text-muted-foreground text-center">
          Enviaremos um link para você redefinir sua senha.
        </p>

        {sent ? (
          <div className="mt-8 rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-soft)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
              <MailCheck className="h-6 w-6" />
            </div>
            <h2 className="mt-4 font-display text-xl text-foreground">Verifique seu e-mail</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Se houver uma conta para <strong>{email}</strong>, enviamos um link para redefinir a senha.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link to="/login">Voltar ao login</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-soft)] space-y-4">
            <div>
              <Label htmlFor="email">E-mail cadastrado</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" autoComplete="email" />
            </div>
            {error && <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</> : "Enviar link"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
