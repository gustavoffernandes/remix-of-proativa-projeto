import { useState, useEffect } from "react";
import { Menu, X, ShieldCheck, LogOut, User as UserIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const links = [
  { href: "#risco", label: "O Risco" },
  { href: "#solucao", label: "Solução" },
  { href: "#como", label: "Como funciona" },
  { href: "#precos", label: "Preços" },
  { href: "#faq", label: "FAQ" },
  { href: "#contato", label: "Contato" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all",
        scrolled ? "bg-background/85 backdrop-blur-md border-b border-border" : "bg-background/0",
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <a href="#top" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2.2} />
            </span>
            <span className="font-display text-xl tracking-tight text-foreground">Proativa</span>
          </a>

          <nav className="hidden md:flex items-center gap-7">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground max-w-[180px] truncate">
                  <UserIcon className="h-3.5 w-3.5" /> {user.email}
                </span>
                <Button size="sm" variant="ghost" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" /> Sair
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button asChild size="sm" variant="default">
                  <a href="#precos">Garantir 70% OFF</a>
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-muted"
            aria-label="Abrir menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col gap-1 pt-2 border-t border-border">
              {links.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="px-2 py-3 text-sm text-foreground/90 hover:bg-muted rounded-md">
                  {l.label}
                </a>
              ))}
              {user ? (
                <Button className="mt-3 w-full" variant="outline" onClick={() => { setOpen(false); handleLogout(); }}>
                  <LogOut className="h-4 w-4" /> Sair ({user.email})
                </Button>
              ) : (
                <>
                  <Button asChild className="mt-3 w-full" variant="outline">
                    <Link to="/login" onClick={() => setOpen(false)}>Entrar</Link>
                  </Button>
                  <Button asChild className="mt-2 w-full">
                    <a href="#precos" onClick={() => setOpen(false)}>Garantir 70% OFF</a>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
