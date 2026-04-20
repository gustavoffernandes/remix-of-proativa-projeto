// ============================================================================
// /login — Entrar na conta
// ============================================================================
import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Search = { redirect?: string; plan?: string; cycle?: string };

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    plan: typeof s.plan === "string" ? s.plan : undefined,
    cycle: typeof s.cycle === "string" ? s.cycle : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar — Proativa" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

function LoginPage() {
  const search = useSearch({ from: "/login" });
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      const target = search.redirect || (search.plan ? "/checkout" : "/");
      navigate({ to: target, search: search.plan ? { plan: search.plan, cycle: search.cycle } : undefined } as never);
    }
  }, [user, authLoading]);

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
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setSubmitting(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid") || msg.includes("credentials")) {
        setServerError("E-mail ou senha incorretos. Verifique seus dados e tente novamente.");
      } else if (msg.includes("not confirmed") || msg.includes("confirm")) {
        setServerError("Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.");
      } else {
        setServerError(error.message);
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-md px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Acesso seguro
          </span>
          <h1 className="mt-3 font-display text-3xl text-foreground">Entrar na conta</h1>
        </div>

        <form onSubmit={onSubmit} className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-soft)] space-y-4">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5" />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1.5" />
            {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
          </div>

          {serverError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Entrando…</> : "Entrar"}
          </Button>

          <div className="text-center">
            <Link to="/esqueci-senha" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">
              Esqueci a senha
            </Link>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/cadastro" search={search as never} className="text-foreground underline underline-offset-4">
              Criar conta
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
