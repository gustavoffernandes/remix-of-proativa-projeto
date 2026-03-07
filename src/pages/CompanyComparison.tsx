import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useSurveyData } from "@/hooks/useSurveyData";
import { questions } from "@/data/mockData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const COLORS = ["hsl(217, 71%, 45%)", "hsl(170, 60%, 45%)", "hsl(38, 92%, 55%)", "hsl(280, 60%, 55%)", "hsl(0, 72%, 55%)", "hsl(200, 80%, 50%)"];

export default function CompanyComparison() {
  const { isLoading, hasData, companies, respondents, getSectionAverage, getCompanyRespondents, getAvailableSections, getSectorAverages } = useSurveyData();
  const [selected, setSelected] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState<"company" | "sector">("company");
  const [sectorCompanyId, setSectorCompanyId] = useState<string>("");
  const [crossSector, setCrossSector] = useState<string>("");
  const availableSections = getAvailableSections();
  const effectiveSelected = selected.length > 0 ? selected : companies.map(c => c.id);
  const toggle = (id: string) => { const current = effectiveSelected; setSelected(current.includes(id) ? current.filter(x => x !== id) : [...current, id]); };

  if (isLoading) return <DashboardLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  if (!hasData) return <DashboardLayout><div className="flex flex-col items-center justify-center h-64 text-center"><p className="text-sm text-muted-foreground">Nenhum dado disponível.</p></div></DashboardLayout>;

  const selectedCompanies = companies.filter(c => effectiveSelected.includes(c.id));

  // Company comparison data
  const data = availableSections.map((s) => {
    const row: Record<string, string | number> = { name: s.shortName };
    selectedCompanies.forEach(c => { row[c.name.split(" ")[0]] = getSectionAverage(s.id, c.id); });
    return row;
  });

  // Radar data
  const radarData = availableSections.map((s) => {
    const row: Record<string, string | number> = { subject: s.shortName };
    selectedCompanies.forEach(c => { row[c.name.split(" ")[0]] = getSectionAverage(s.id, c.id); });
    return row;
  });

  // Sector comparison
  const effectiveSectorCompany = sectorCompanyId || companies[0]?.id || "";
  const sectorAvgs = getSectorAverages(effectiveSectorCompany);
  const sectorChartData = availableSections.map(s => {
    const row: Record<string, string | number> = { name: s.shortName };
    sectorAvgs.forEach(sa => { row[sa.sector.substring(0, 8)] = sa.sectionAvgs[s.id] || 0; });
    return row;
  });

  // Cross-company sector comparison
  const allSectors = [...new Set(respondents.map(r => r.sector))].sort();
  const effectiveCrossSector = crossSector || allSectors[0] || "";
  const crossSectorData = effectiveCrossSector ? availableSections.map(s => {
    const row: Record<string, string | number> = { name: s.shortName };
    selectedCompanies.forEach(c => {
      const pool = respondents.filter(r => r.companyId === c.id && r.sector === effectiveCrossSector);
      if (pool.length === 0) { row[c.name.split(" ")[0]] = 0; return; }
      const qs = questions.filter(q => q.section === s.id);
      const qsWithData = qs.filter(q => pool.some(r => r.answers[q.id] !== undefined));
      if (qsWithData.length === 0) { row[c.name.split(" ")[0]] = 0; return; }
      const avg = qsWithData.reduce((acc, q) => {
        const withAns = pool.filter(r => r.answers[q.id] !== undefined);
        return acc + (withAns.length > 0 ? withAns.reduce((a, r) => a + r.answers[q.id], 0) / withAns.length : 0);
      }, 0) / qsWithData.length;
      row[c.name.split(" ")[0]] = Math.round(avg * 100) / 100;
    });
    return row;
  }) : [];

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comparação</h1>
          <p className="text-sm text-muted-foreground mt-1">Compare desempenho entre empresas e setores</p>
        </div>

        <div className="flex gap-2 mb-2">
          <button onClick={() => setCompareMode("company")} className={cn("rounded-lg px-4 py-2 text-sm font-medium transition-all", compareMode === "company" ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}>Por Empresa</button>
          <button onClick={() => setCompareMode("sector")} className={cn("rounded-lg px-4 py-2 text-sm font-medium transition-all", compareMode === "sector" ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}>Por Setor</button>
        </div>

        {compareMode === "company" && (
          <>
            <div className="flex flex-wrap gap-2">
              {companies.map(c => (
                <button key={c.id} onClick={() => toggle(c.id)}
                  className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    effectiveSelected.includes(c.id) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50")}>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} /> {c.name} ({getCompanyRespondents(c.id).length})
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <h3 className="mb-4 text-sm font-semibold text-card-foreground">Comparação por Pilar</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {selectedCompanies.map((c, i) => <Bar key={c.id} dataKey={c.name.split(" ")[0]} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />)}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <h3 className="mb-4 text-sm font-semibold text-card-foreground">Radar Comparativo</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={100}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9 }} />
                      {selectedCompanies.map((c, i) => <Radar key={c.id} name={c.name.split(" ")[0]} dataKey={c.name.split(" ")[0]} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.1} strokeWidth={2} />)}
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <h3 className="mb-4 text-sm font-semibold text-card-foreground">Tendência por Pilar</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {selectedCompanies.map((c, i) => <Line key={c.id} type="monotone" dataKey={c.name.split(" ")[0]} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} />)}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cross-company same sector comparison */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <h3 className="mb-3 text-sm font-semibold text-card-foreground">Mesmo Setor entre Empresas</h3>
                <select value={effectiveCrossSector} onChange={e => setCrossSector(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm mb-3 w-full">
                  {allSectors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={crossSectorData} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {selectedCompanies.map((c, i) => <Bar key={c.id} dataKey={c.name.split(" ")[0]} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />)}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        {compareMode === "sector" && (
          <>
            <div className="flex flex-col sm:flex-row gap-3">
              <select value={effectiveSectorCompany} onChange={e => setSectorCompanyId(e.target.value)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm w-full sm:w-auto">
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <h3 className="mb-4 text-sm font-semibold text-card-foreground">Setores por Pilar</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectorChartData} barCategoryGap="15%">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      {sectorAvgs.map((sa, i) => <Bar key={sa.sector} dataKey={sa.sector.substring(0, 8)} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />)}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <h3 className="mb-4 text-sm font-semibold text-card-foreground">Radar por Setor</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={sectorChartData.map(d => ({ ...d, subject: d.name }))} cx="50%" cy="50%" outerRadius={100}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9 }} />
                      {sectorAvgs.map((sa, i) => <Radar key={sa.sector} name={sa.sector} dataKey={sa.sector.substring(0, 8)} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.1} strokeWidth={2} />)}
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h3 className="mb-4 text-sm font-semibold text-card-foreground">Detalhamento por Setor</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border"><th className="px-4 py-2 text-left font-semibold text-muted-foreground">Setor</th><th className="px-4 py-2 text-center font-semibold text-muted-foreground">Resp.</th>{availableSections.map(s => <th key={s.id} className="px-4 py-2 text-center font-semibold text-muted-foreground">{s.shortName}</th>)}</tr></thead>
                  <tbody>{sectorAvgs.map(sa => (
                    <tr key={sa.sector} className="border-b border-border/50">
                      <td className="px-4 py-2 font-medium text-foreground">{sa.sector}</td>
                      <td className="px-4 py-2 text-center text-muted-foreground">{sa.count}</td>
                      {availableSections.map(s => {
                        const val = sa.sectionAvgs[s.id] || 0;
                        return <td key={s.id} className="px-4 py-2 text-center"><span className={cn("font-medium", val < 3 ? "text-destructive" : val >= 4 ? "text-success" : "text-foreground")}>{val.toFixed(2)}</span></td>;
                      })}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
