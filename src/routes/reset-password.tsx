// ============================================================================
// /reset-password — Definir nova senha (link enviado por email)
// ============================================================================
import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — Proativa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPage,
});

const schema = z
  .object({
    password: z.string().min(8, "Mínimo 8 caracteres").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "As senhas não coincidem" });

function ResetPage() {
  const navigate = useNavigate();
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // O Supabase processa o token do hash automaticamente; aqui só validamos.
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setHasRecoverySession(true);
    } else {
      // Mesmo sem hash, pode ter sessão de recovery ativa
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setHasRecoverySession(true);
      });
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setSubmitting(false);
    if (error) {
      setServerError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => navigate({ to: "/login" }), 2000);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Login
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-md px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="font-display text-3xl text-foreground text-center">Definir nova senha</h1>

        {!hasRecoverySession ? (
          <div className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8 text-center shadow-[var(--shadow-soft)]">
            <p className="text-sm text-muted-foreground">
              Link inválido ou expirado. Solicite um novo link de recuperação.
            </p>
            <Button asChild className="mt-6">
              <Link to="/esqueci-senha">Solicitar novo link</Link>
            </Button>
          </div>
        ) : done ? (
          <div className="mt-8 rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-soft)]">
            <p className="text-foreground">Senha atualizada! Redirecionando…</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-soft)] space-y-4">
            <div>
              <Label htmlFor="password">Nova senha</Label>
              <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1.5" autoComplete="new-password" />
              {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
            </div>
            <div>
              <Label htmlFor="confirm">Confirmar senha</Label>
              <Input id="confirm" type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} className="mt-1.5" autoComplete="new-password" />
              {errors.confirm && <p className="mt-1 text-xs text-destructive">{errors.confirm}</p>}
            </div>
            {serverError && <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">{serverError}</div>}
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando…</> : "Salvar nova senha"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
