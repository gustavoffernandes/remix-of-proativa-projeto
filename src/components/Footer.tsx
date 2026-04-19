import { ShieldCheck, Lock } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[oklch(0.24_0.01_80)] text-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-background text-foreground">
                <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2.2} />
              </span>
              <span className="font-display text-xl text-background">Proativa</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-background/65">
              Gestão de Riscos Psicossociais com metodologia Proart. Prepare-se para a NR-01 antes de 26/05/2026.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-background/15 bg-background/5 px-2.5 py-1 text-[11px] text-background/75">
                <Lock className="h-3 w-3" /> SSL seguro
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-background/15 bg-background/5 px-2.5 py-1 text-[11px] text-background/75">
                LGPD
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-background">Produto</p>
            <ul className="mt-4 space-y-2.5 text-sm text-background/65">
              <li><a href="#solucao" className="hover:text-background">Recursos</a></li>
              <li><a href="#como" className="hover:text-background">Como funciona</a></li>
              <li><a href="#precos" className="hover:text-background">Planos</a></li>
              <li><a href="#faq" className="hover:text-background">FAQ</a></li>
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-background">Contato</p>
            <ul className="mt-4 space-y-2.5 text-sm text-background/65">
              <li><a href="mailto:contato@magoweb.com.br" className="hover:text-background">contato@magoweb.com.br</a></li>
              <li><a href="tel:+5567992875364" className="hover:text-background">(67) 99287-5364</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-background/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-background/60">
          <p>© 2026 Proativa. Todos os direitos reservados.</p>
          <p>CNPJ: 12.345.678/0001-90</p>
        </div>
      </div>
    </footer>
  );
}
