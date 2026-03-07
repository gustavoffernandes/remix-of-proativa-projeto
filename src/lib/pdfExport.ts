import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { type Question } from "@/data/mockData";
import { PROART_SCALES, ALL_FACTORS, classifyRisk, getRiskLabel, calculatePxS, getPRLevelLabel } from "@/lib/proartMethodology";

export interface PDFExportData {
  companies: { id: string; name: string; sector: string; employees: number; color: string }[];
  sections: { id: string; name: string; shortName: string }[];
  questions: Question[];
  respondents: { id: string; companyId: string; name: string; sex: string; age: number; sector: string; answers: Record<string, number> }[];
  getCompanyRespondents: (companyId: string) => any[];
  getSectionAverage: (sectionId: string, companyId?: string) => number;
  getQuestionAverage: (questionId: string, companyId?: string) => number;
  getAnswerDistribution: (questionId: string, companyId?: string) => { value: number; count: number; percentage: number }[];
  getAvailableSections: () => { id: string; name: string; shortName: string }[];
  getAvailableQuestions: () => Question[];
}

const COLORS = {
  primary: [15, 30, 61] as [number, number, number],
  accent: [59, 130, 246] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  warning: [234, 179, 8] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  text: [30, 30, 30] as [number, number, number],
  muted: [120, 120, 120] as [number, number, number],
  bg: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

function addHeader(doc: jsPDF, companyName: string, subtitle: string) {
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, doc.internal.pageSize.width, 38, "F");

  doc.setFillColor(...COLORS.accent);
  doc.circle(22, 19, 10, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("P", 19, 23);

  doc.setFontSize(16);
  doc.text("PROATIVA", 38, 17);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(subtitle, 38, 25);

  doc.setFontSize(8);
  doc.text(companyName, 38, 33);
}

function addFooter(doc: jsPDF, pageNum: number) {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);
  doc.text(`PROATIVA - Relatório gerado em ${new Date().toLocaleDateString("pt-BR")}`, 14, pageHeight - 10);
  doc.text(`Página ${pageNum}`, doc.internal.pageSize.width - 30, pageHeight - 10);
}

function getClassification(value: number, type: "positive" | "negative" = "positive"): { label: string; color: [number, number, number] } {
  const risk = classifyRisk(value, type);
  if (risk === "low") return { label: "Risco Baixo", color: COLORS.success };
  if (risk === "medium") return { label: "Risco Médio", color: COLORS.warning };
  return { label: "Risco Alto", color: COLORS.danger };
}

export function exportCompanyPDF(companyId: string, data: PDFExportData) {
  const company = data.companies.find(c => c.id === companyId);
  if (!company) return;

  const doc = new jsPDF();
  const pool = data.getCompanyRespondents(companyId);
  const availableSections = data.getAvailableSections();
  const availableQuestions = data.getAvailableQuestions();
  let pageNum = 1;

  addHeader(doc, company.name, "Relatório Individual");
  addFooter(doc, pageNum);

  let y = 48;

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.text);
  doc.setFont("helvetica", "bold");
  doc.text("Informações da Empresa", 14, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Empresa: ${company.name}`, 14, y); y += 5;
  doc.text(`Setor: ${company.sector}`, 14, y); y += 5;
  doc.text(`Funcionários: ${company.employees}`, 14, y); y += 5;
  doc.text(`Respostas: ${pool.length}`, 14, y); y += 5;
  doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 14, y); y += 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Resultados por Fator (Protocolo PROART - Facas/UnB)", 14, y);
  y += 4;

  const factorData = ALL_FACTORS.map(f => {
    const qIds = f.questionIds;
    const answers = pool.flatMap((r: any) => qIds.map((qId: string) => r.answers[qId]).filter((v: any) => v !== undefined));
    const avg = answers.length > 0 ? (answers as number[]).reduce((a: number, b: number) => a + b, 0) / answers.length : 0;
    const scale = PROART_SCALES.find(s => s.id === f.scaleId);
    const cls = getClassification(avg, f.type);
    return [scale?.shortName || "", f.name, f.type === "positive" ? "Positiva" : "Negativa", avg.toFixed(2), cls.label];
  });

  autoTable(doc, {
    startY: y,
    head: [["Escala", "Fator", "Tipo", "Média", "Classificação"]],
    body: factorData,
    theme: "grid",
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 7, fontStyle: "bold" },
    bodyStyles: { fontSize: 7, textColor: COLORS.text },
    alternateRowStyles: { fillColor: COLORS.bg },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 4) {
        const label = factorData[data.row.index]?.[4];
        if (label === "Risco Alto") data.cell.styles.textColor = COLORS.danger;
        else if (label === "Risco Médio") data.cell.styles.textColor = COLORS.warning;
        else data.cell.styles.textColor = COLORS.success;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // P×S Matrix page
  doc.addPage();
  pageNum++;
  addHeader(doc, company.name, "Matriz de Risco P×S (SESI 2022)");
  addFooter(doc, pageNum);

  const eotAvg = factorData.filter(f => f[0] === "EOT").reduce((a, f) => a + parseFloat(f[3]), 0) / Math.max(1, factorData.filter(f => f[0] === "EOT").length);
  const colAvg = parseFloat(factorData.find(f => f[1].includes("Coletivista"))?.[3] || "0");
  const eistAvg = factorData.filter(f => f[0] === "EIST").reduce((a, f) => a + parseFloat(f[3]), 0) / Math.max(1, factorData.filter(f => f[0] === "EIST").length);
  const edtAvg = factorData.filter(f => f[0] === "EDT").reduce((a, f) => a + parseFloat(f[3]), 0) / Math.max(1, factorData.filter(f => f[0] === "EDT").length);
  const pxs = calculatePxS(eotAvg, colAvg, eistAvg, edtAvg, pool.length, Math.round(pool.length * 0.3));

  let py = 48;
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.text);
  doc.setFont("helvetica", "bold");
  doc.text("Resultado da Matriz P×S", 14, py); py += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Probabilidade (P): ${pxs.P}`, 14, py); py += 5;
  doc.text(`Severidade (S): ${pxs.S}`, 14, py); py += 5;
  doc.text(`Risco (P×S): ${pxs.risk}`, 14, py); py += 5;
  doc.text(`Classificação: ${getPRLevelLabel(pxs.prLevel)}`, 14, py); py += 5;
  doc.text(`Prazo de Ação: ${pxs.deadlineDays === 0 ? "Imediato" : pxs.deadlineDays + " dias"}`, 14, py); py += 10;

  // Resumo por escala (legacy)
  const summaryData = availableSections.map(s => {
    const avg = data.getSectionAverage(s.id, companyId);
    const scale = PROART_SCALES.find(sc => sc.id === s.id);
    const scaleType = scale?.type === "positive" ? "positive" as const : "negative" as const;
    const cls = getClassification(avg, scaleType);
    return [s.name, avg.toFixed(2), cls.label];
  });

  autoTable(doc, {
    startY: py,
    head: [["Escala", "Média", "Classificação"]],
    body: summaryData,
    theme: "grid",
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: COLORS.text },
    alternateRowStyles: { fillColor: COLORS.bg },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 2) {
        const label = summaryData[data.row.index]?.[2];
        if (label === "Risco Alto") data.cell.styles.textColor = COLORS.danger;
        else if (label === "Risco Médio") data.cell.styles.textColor = COLORS.warning;
        else data.cell.styles.textColor = COLORS.success;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // Detalhamento por seção - agora com contagem de pessoas por opção
  availableSections.forEach(section => {
    const qs = availableQuestions.filter(q => q.section === section.id);
    if (qs.length === 0) return;

    doc.addPage();
    pageNum++;
    addHeader(doc, company.name, `Detalhamento - ${section.name}`);
    addFooter(doc, pageNum);

    const tableData = qs.map(q => {
      const avg = data.getQuestionAverage(q.id, companyId);
      const dist = data.getAnswerDistribution(q.id, companyId);
      return [
        `${q.number}`,
        q.text,
        avg.toFixed(2),
        ...dist.map(d => `${d.count} (${d.percentage}%)`),
      ];
    });

    autoTable(doc, {
      startY: 48,
      head: [["Nº", "Pergunta", "Média", "Nunca", "Raramente", "Às vezes", "Frequente", "Sempre"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 7, fontStyle: "bold" },
      bodyStyles: { fontSize: 7, textColor: COLORS.text },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 45 },
        2: { cellWidth: 12, halign: "center", fontStyle: "bold" },
      },
      alternateRowStyles: { fillColor: COLORS.bg },
      margin: { left: 14, right: 14 },
    });
  });

  // Respostas por setor da empresa
  const sectors = [...new Set(pool.map((r: any) => r.sector))].sort();
  if (sectors.length > 0) {
    doc.addPage();
    pageNum++;
    addHeader(doc, company.name, "Respostas por Setor");
    addFooter(doc, pageNum);

    const sectorTableData = sectors.map(sector => {
      const sectorPool = pool.filter((r: any) => r.sector === sector);
      const sectionAvgs = availableSections.map(s => {
        const qs = availableQuestions.filter(q => q.section === s.id);
        if (qs.length === 0 || sectorPool.length === 0) return "0.00";
        const qsWithData = qs.filter(q => sectorPool.some((r: any) => r.answers[q.id] !== undefined));
        if (qsWithData.length === 0) return "0.00";
        const avg = qsWithData.reduce((acc, q) => {
          const sum = sectorPool.reduce((a: number, r: any) => a + (r.answers[q.id] || 0), 0);
          return acc + sum / sectorPool.length;
        }, 0) / qsWithData.length;
        return avg.toFixed(2);
      });
      return [sector, `${sectorPool.length}`, ...sectionAvgs];
    });

    autoTable(doc, {
      startY: 48,
      head: [["Setor", "Respostas", ...availableSections.map(s => s.shortName)]],
      body: sectorTableData,
      theme: "grid",
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8, textColor: COLORS.text },
      alternateRowStyles: { fillColor: COLORS.bg },
      margin: { left: 14, right: 14 },
    });
  }

  doc.save(`relatorio_${company.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
}

export function exportComparisonPDF(companyIds: string[], data: PDFExportData, sectorFilter?: string) {
  const selected = data.companies.filter(c => companyIds.includes(c.id));
  if (selected.length === 0) return;

  const doc = new jsPDF("landscape");
  const availableSections = data.getAvailableSections();
  const availableQuestions = data.getAvailableQuestions();
  let pageNum = 1;

  const subtitle = sectorFilter ? `Comparativo - Setor: ${sectorFilter}` : "Relatório Comparativo";
  addHeader(doc, selected.map(c => c.name).join(" vs "), subtitle);
  addFooter(doc, pageNum);

  let y = 48;

  const overviewData = selected.map(c => {
    const avgs = availableSections.map(s => data.getSectionAverage(s.id, c.id).toFixed(2));
    const overall = availableSections.length > 0
      ? (availableSections.reduce((acc, s) => acc + data.getSectionAverage(s.id, c.id), 0) / availableSections.length).toFixed(2)
      : "0";
    return [c.name, `${data.getCompanyRespondents(c.id).length}`, ...avgs, overall];
  });

  autoTable(doc, {
    startY: y,
    head: [["Empresa", "Respostas", ...availableSections.map(s => s.shortName), "Média"]],
    body: overviewData,
    theme: "grid",
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: COLORS.text },
    alternateRowStyles: { fillColor: COLORS.bg },
    margin: { left: 14, right: 14 },
  });

  availableSections.forEach(section => {
    const qs = availableQuestions.filter(q => q.section === section.id);
    if (qs.length === 0) return;

    doc.addPage("landscape");
    pageNum++;
    addHeader(doc, `Comparativo - ${section.name}`, subtitle);
    addFooter(doc, pageNum);

    const tableData = qs.map(q => {
      const vals = selected.map(c => {
        const avg = data.getQuestionAverage(q.id, c.id);
        const dist = data.getAnswerDistribution(q.id, c.id);
        const total = dist.reduce((a, d) => a + d.count, 0);
        return `${avg.toFixed(2)} (n=${total})`;
      });
      return [`${q.number}`, q.text, ...vals];
    });

    autoTable(doc, {
      startY: 48,
      head: [["Nº", "Pergunta", ...selected.map(c => c.name)]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 7, fontStyle: "bold" },
      bodyStyles: { fontSize: 7, textColor: COLORS.text },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 70 },
      },
      alternateRowStyles: { fillColor: COLORS.bg },
      margin: { left: 14, right: 14 },
    });
  });

  doc.save(`comparativo_PROATIVA_${new Date().toISOString().split("T")[0]}.pdf`);
}
