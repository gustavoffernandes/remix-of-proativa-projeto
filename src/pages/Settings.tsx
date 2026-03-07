import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Settings as SettingsIcon, User, Bell, Palette, Shield, Save, UserPlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

type TabId = "perfil" | "usuarios" | "notificacoes" | "aparencia" | "geral";

const allTabs: { id: TabId; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "usuarios", label: "Usuários", icon: UserPlus, adminOnly: true },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "aparencia", label: "Aparência", icon: Palette },
  { id: "geral", label: "Geral", icon: SettingsIcon },
];

export default function Settings() {
  const { user, isAdmin } = useAuth();
  const tabs = allTabs.filter(t => !t.adminOnly || isAdmin);
  const [activeTab, setActiveTab] = useState<TabId>("perfil");
  const [profile, setProfile] = useState({ name: "Admin", email: user?.email ?? "", role: "Gestor SST", company: "PROATIVA Consultoria" });
  const [notifications, setNotifications] = useState({ emailSync: true, emailReport: false, browserNotifications: true });
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "user" | "company_user">("user");
  const [newUserCompanyId, setNewUserCompanyId] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);

  const { data: companiesList = [] } = useQuery({
    queryKey: ["companies-for-user-creation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("google_forms_config")
        .select("id, company_name")
        .eq("is_active", true)
        .order("company_name");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) { toast({ title: "Preencha todos os campos", variant: "destructive" }); return; }
    if (newUserPassword.length < 8) { toast({ title: "Senha deve ter pelo menos 8 caracteres", variant: "destructive" }); return; }
    if (newUserRole === "company_user" && !newUserCompanyId) { toast({ title: "Selecione uma empresa para o Usuário Empresa", variant: "destructive" }); return; }
    setCreatingUser(true);
    try {
      const body: Record<string, string> = { email: newUserEmail, password: newUserPassword, role: newUserRole };
      if (newUserRole === "company_user") body.company_id = newUserCompanyId;
      const { data, error } = await supabase.functions.invoke("create-user", { body });
      if (error) throw error;
      const roleLabel = newUserRole === "admin" ? "Administrador" : newUserRole === "company_user" ? "Usuário Empresa" : "Usuário Geral";
      toast({ title: "Usuário criado!", description: `${newUserEmail} foi adicionado como ${roleLabel}.` });
      setNewUserEmail(""); setNewUserPassword(""); setNewUserRole("user"); setNewUserCompanyId("");
    } catch (e: any) { toast({ title: "Erro ao criar usuário", description: e.message, variant: "destructive" }); }
    setCreatingUser(false);
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div><h1 className="text-2xl font-bold text-foreground">Configurações</h1><p className="text-sm text-muted-foreground mt-1">Gerencie seu perfil e preferências</p></div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-56 shrink-0">
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                    activeTab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                  <t.icon className="h-4 w-4" /> {t.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex-1 rounded-xl border border-border bg-card p-6 shadow-card">
            {activeTab === "perfil" && (
              <div className="space-y-4 max-w-md">
                <h3 className="text-lg font-semibold text-card-foreground">Perfil</h3>
                {["name", "email", "role", "company"].map(field => (
                  <div key={field} className="space-y-1">
                    <label className="text-sm font-medium text-foreground capitalize">{field === "name" ? "Nome" : field === "email" ? "E-mail" : field === "role" ? "Cargo" : "Empresa"}</label>
                    <input value={profile[field as keyof typeof profile]} onChange={e => setProfile({ ...profile, [field]: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" readOnly={field === "email"} />
                  </div>
                ))}
                <button onClick={() => toast({ title: "Perfil salvo!" })} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"><Save className="h-4 w-4" /> Salvar</button>
              </div>
            )}
            {activeTab === "usuarios" && (
              <div className="space-y-4 max-w-md">
                <h3 className="text-lg font-semibold text-card-foreground">Criar Novo Usuário</h3>
                <div className="space-y-1"><label className="text-sm font-medium text-foreground">E-mail</label><input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="novo@email.com" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" /></div>
                <div className="space-y-1"><label className="text-sm font-medium text-foreground">Senha</label><input type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} placeholder="Mínimo 8 caracteres" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition" /></div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Tipo de Usuário</label>
                  <select value={newUserRole} onChange={e => { setNewUserRole(e.target.value as "admin" | "user" | "company_user"); setNewUserCompanyId(""); }} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <option value="user">Usuário Geral (visualiza todas as empresas)</option>
                    <option value="company_user">Usuário Empresa (restrito a uma empresa)</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {newUserRole === "admin" && "Acesso total: gerencia integrações, usuários e todos os dados."}
                    {newUserRole === "user" && "Visualiza dados de todas as empresas, sem permissão de administração."}
                    {newUserRole === "company_user" && "Visualiza apenas os dados da empresa selecionada abaixo."}
                  </p>
                </div>
                {newUserRole === "company_user" && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">Empresa Vinculada</label>
                    <select value={newUserCompanyId} onChange={e => setNewUserCompanyId(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                      <option value="">Selecione uma empresa...</option>
                      {companiesList.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                    </select>
                  </div>
                )}
                <button onClick={handleCreateUser} disabled={creatingUser} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">{creatingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Criar Usuário</button>
              </div>
            )}
            {activeTab === "notificacoes" && (
              <div className="space-y-4 max-w-md">
                <h3 className="text-lg font-semibold text-card-foreground">Notificações</h3>
                {[{ key: "emailSync", label: "E-mail ao sincronizar dados" }, { key: "emailReport", label: "E-mail ao gerar relatório" }, { key: "browserNotifications", label: "Notificações do navegador" }].map(n => (
                  <label key={n.key} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={notifications[n.key as keyof typeof notifications]} onChange={e => setNotifications({ ...notifications, [n.key]: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                    <span className="text-sm text-foreground">{n.label}</span>
                  </label>
                ))}
              </div>
            )}
            {activeTab === "aparencia" && (
              <div className="space-y-4 max-w-md">
                <h3 className="text-lg font-semibold text-card-foreground">Aparência</h3>
                <p className="text-sm text-muted-foreground">Configurações de aparência em breve.</p>
              </div>
            )}
            {activeTab === "geral" && (
              <div className="space-y-4 max-w-md">
                <h3 className="text-lg font-semibold text-card-foreground">Geral</h3>
                <p className="text-sm text-muted-foreground">Configurações gerais da plataforma.</p>
                <div className="rounded-lg bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Versão: 2.0.0</p><p className="text-xs text-muted-foreground">© 2026 PROATIVA</p></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
