// ============================================================================
// Contact — Formulário de contato (salva em contact_messages)
// ============================================================================
import { useState } from "react";
import { z } from "zod";
import { Loader2, MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Descreva sua dúvida (mín. 10 caracteres)").max(2000),
});

export function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

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
    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      message: parsed.data.message,
    });
    setSubmitting(false);
    if (error) {
      setServerError("Não foi possível enviar agora. Tente novamente em instantes.");
      return;
    }
    setSent(true);
    setForm({ name: "", email: "", phone: "", message: "" });
  }

  return (
    <section id="contato" className="py-20 sm:py-28 bg-muted/30 border-t border-border">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 grid gap-10 lg:grid-cols-2 lg:gap-16 items-start">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" /> Fale conosco
          </span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl text-foreground text-balance">
            Tem alguma dúvida? Estamos aqui.
          </h2>
          <p className="mt-4 text-muted-foreground text-pretty">
            Conte sobre sua empresa, sua dúvida sobre a NR-01 ou sobre os planos do Proativa.
            Respondemos em até 1 dia útil.
          </p>
          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">E-mail:</strong>{" "}
              <a href="mailto:contato@magoweb.com.br" className="hover:text-foreground">contato@magoweb.com.br</a>
            </p>
            <p>
              <strong className="text-foreground">Telefone:</strong>{" "}
              <a href="tel:+5567992875364" className="hover:text-foreground">(67) 99287-5364</a>
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-soft)] space-y-4">
          {sent ? (
            <div className="text-center py-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-xl text-foreground">Mensagem enviada!</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Recebemos sua dúvida e retornaremos em breve.
              </p>
              <Button type="button" variant="outline" className="mt-6" onClick={() => setSent(false)}>
                Enviar outra mensagem
              </Button>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="c-name">Nome</Label>
                  <Input id="c-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" maxLength={120} />
                  {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="c-phone">Telefone</Label>
                  <Input id="c-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5" placeholder="(00) 00000-0000" maxLength={30} />
                </div>
              </div>
              <div>
                <Label htmlFor="c-email">E-mail</Label>
                <Input id="c-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5" maxLength={255} />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="c-message">Sua dúvida</Label>
                <Textarea id="c-message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mt-1.5 min-h-[120px]" maxLength={2000} placeholder="Conte como podemos ajudar..." />
                {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
              </div>

              {serverError && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">{serverError}</div>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</> : <><Send className="h-4 w-4" /> Enviar mensagem</>}
              </Button>
            </>
          )}
        </form>
      </div>
    </section>
  );
}
