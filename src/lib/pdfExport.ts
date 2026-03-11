import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { type Question } from "@/data/mockData";
import { PROART_SCALES, ALL_FACTORS, classifyRisk, getRiskLabel, calculatePxS, getPRLevelLabel, getSuggestedActions } from "@/lib/proartMethodology";

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

  addHeader(doc, company.name, "Relatório PROART - Avaliação de Riscos Psicossociais");
  addFooter(doc, pageNum);

  let y = 48;

  // 1. Company Info
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  doc.setFont("helvetica", "bold");
  doc.text("1. Informações da Avaliação", 14, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Empresa: ${company.name}`, 14, y); y += 5;
  doc.text(`Setor: ${company.sector}`, 14, y); y += 5;
  doc.text(`Nº de Funcionários: ${company.employees}`, 14, y); y += 5;
  doc.text(`Questionários Preenchidos: ${pool.length}`, 14, y); y += 5;
  doc.text(`Taxa de Resposta: ${company.employees > 0 ? Math.round((pool.length / company.employees) * 100) : 0}%`, 14, y); y += 5;
  doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 14, y); y += 10;

  // Demographics summary
  const sexGroups: Record<string, number> = {};
  const ageGroups: Record<string, number> = { "18-25": 0, "26-35": 0, "36-45": 0, "46-55": 0, "56+": 0 };
  pool.forEach((r: any) => {
    sexGroups[r.sex] = (sexGroups[r.sex] || 0) + 1;
    if (r.age <= 25) ageGroups["18-25"]++;
    else if (r.age <= 35) ageGroups["26-35"]++;
    else if (r.age <= 45) ageGroups["36-45"]++;
    else if (r.age <= 55) ageGroups["46-55"]++;
    else ageGroups["56+"]++;
  });

  doc.setFont("helvetica", "bold");
  doc.text("Perfil dos Participantes", 14, y); y += 6;
  doc.setFont("helvetica", "normal");
  Object.entries(sexGroups).forEach(([sex, count]) => {
    doc.text(`${sex}: ${count} (${Math.round((count / pool.length) * 100)}%)`, 20, y); y += 4;
  });
  y += 4;

  // 2. Results
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("2. Resultados Encontrados", 14, y);
  y += 4;

  const factorData = ALL_FACTORS.map(f => {
    const qIds = f.questionIds;
    const answers = pool.flatMap((r: any) => qIds.map((qId: string) => r.answers[qId]).filter((v: any) => v !== undefined));
    const avg = answers.length > 0 ? (answers as number[]).reduce((a: number, b: number) => a + b, 0) / answers.length : 0;
    const scale = PROART_SCALES.find(s => s.id === f.scaleId);
    const cls = getClassification(avg, f.type);
    return { factor: f, avg: Math.round(avg * 100) / 100, risk: classifyRisk(avg, f.type), cls, scaleName: scale?.shortName || "" };
  });

  // Scale-level results
  PROART_SCALES.forEach(scale => {
    const scaleFactors = factorData.filter(f => f.factor.scaleId === scale.id);
    const scaleAvg = scaleFactors.length > 0 ? scaleFactors.reduce((a, f) => a + f.avg, 0) / scaleFactors.length : 0;
    const scaleType = scale.type === "positive" ? "positive" as const : "negative" as const;
    const scaleCls = getClassification(scaleAvg, scaleType);

    if (y > 240) {
      doc.addPage();
      pageNum++;
      addHeader(doc, company.name, "Resultados por Escala");
      addFooter(doc, pageNum);
      y = 48;
    }

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.text);
    doc.text(`${scale.shortName} – ${scale.name}`, 14, y);
    doc.setTextColor(...scaleCls.color);
    doc.text(`Média: ${scaleAvg.toFixed(2)} - ${scaleCls.label}`, 120, y);
    doc.setTextColor(...COLORS.text);
    y += 6;

    // Risk distribution for scale
    const riskDist = { low: 0, medium: 0, high: 0 };
    pool.forEach((r: any) => {
      const answers = scaleFactors.flatMap(f => f.factor.questionIds.map((qId: string) => r.answers[qId]).filter((v: any) => v !== undefined));
      if (answers.length === 0) return;
      const avg = (answers as number[]).reduce((a: number, b: number) => a + b, 0) / answers.length;
      const risk = classifyRisk(avg, scaleType);
      riskDist[risk]++;
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const total = riskDist.low + riskDist.medium + riskDist.high;
    if (scaleType === "positive") {
      doc.text(`Risco Alto (1,00-2,29): ${total > 0 ? Math.round((riskDist.high / total) * 100) : 0}% (${riskDist.high} resp.)`, 20, y); y += 4;
      doc.text(`Risco Médio (2,30-3,69): ${total > 0 ? Math.round((riskDist.medium / total) * 100) : 0}% (${riskDist.medium} resp.)`, 20, y); y += 4;
      doc.text(`Risco Baixo (3,70-5,00): ${total > 0 ? Math.round((riskDist.low / total) * 100) : 0}% (${riskDist.low} resp.)`, 20, y); y += 4;
    } else {
      doc.text(`Risco Alto (3,70-5,00): ${total > 0 ? Math.round((riskDist.high / total) * 100) : 0}% (${riskDist.high} resp.)`, 20, y); y += 4;
      doc.text(`Risco Médio (2,30-3,69): ${total > 0 ? Math.round((riskDist.medium / total) * 100) : 0}% (${riskDist.medium} resp.)`, 20, y); y += 4;
      doc.text(`Risco Baixo (1,00-2,29): ${total > 0 ? Math.round((riskDist.low / total) * 100) : 0}% (${riskDist.low} resp.)`, 20, y); y += 4;
    }

    // Factor results
    doc.setFont("helvetica", "bold");
    doc.text("Resultados por Fator:", 20, y); y += 4;
    doc.setFont("helvetica", "normal");
    scaleFactors.forEach(f => {
      doc.setTextColor(...f.cls.color);
      doc.text(`${f.factor.name}: ${f.avg.toFixed(2)} - ${f.cls.label}`, 24, y);
      doc.setTextColor(...COLORS.text);
      y += 4;
    });
    y += 4;
  });

  // Factor Table
  autoTable(doc, {
    startY: y > 220 ? undefined : y,
    head: [["Escala", "Fator", "Tipo", "Média", "Classificação"]],
    body: factorData.map(f => [f.scaleName, f.factor.name, f.factor.type === "positive" ? "Positiva" : "Negativa", f.avg.toFixed(2), f.cls.label]),
    theme: "grid",
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 7, fontStyle: "bold" },
    bodyStyles: { fontSize: 7, textColor: COLORS.text },
    alternateRowStyles: { fillColor: COLORS.bg },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 4) {
        const label = factorData[data.row.index]?.cls.label;
        if (label === "Risco Alto") data.cell.styles.textColor = COLORS.danger;
        else if (label === "Risco Médio") data.cell.styles.textColor = COLORS.warning;
        else data.cell.styles.textColor = COLORS.success;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // 3. P×S Matrix page
  doc.addPage();
  pageNum++;
  addHeader(doc, company.name, "Cálculo do Risco e Matriz de Risco");
  addFooter(doc, pageNum);

  const eotAvg = factorData.filter(f => f.scaleName === "EOT").reduce((a, f) => a + f.avg, 0) / Math.max(1, factorData.filter(f => f.scaleName === "EOT").length);
  const colAvg = factorData.find(f => f.factor.name.includes("Coletivista"))?.avg || 0;
  const eistAvg = factorData.filter(f => f.scaleName === "EIST").reduce((a, f) => a + f.avg, 0) / Math.max(1, factorData.filter(f => f.scaleName === "EIST").length);
  const edtAvg = factorData.filter(f => f.scaleName === "EDT").reduce((a, f) => a + f.avg, 0) / Math.max(1, factorData.filter(f => f.scaleName === "EDT").length);
  const pxs = calculatePxS(eotAvg, colAvg, eistAvg, edtAvg, pool.length, Math.round(pool.length * 0.3));

  let py = 48;
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  doc.setFont("helvetica", "bold");
  doc.text("3. Cálculo do Risco e Matriz de Risco", 14, py); py += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("RISCO = PROBABILIDADE × SEVERIDADE", 14, py); py += 8;

  doc.setFont("helvetica", "bold");
  doc.text("Variáveis Calculadas:", 14, py); py += 6;
  doc.setFont("helvetica", "normal");
  doc.text(`Probabilidade (P): ${pxs.P}`, 20, py); py += 5;
  doc.text(`Severidade (S): ${pxs.S}`, 20, py); py += 5;
  doc.text(`Risco (P×S): ${pxs.risk}`, 20, py); py += 5;
  doc.text(`Classificação: ${getPRLevelLabel(pxs.prLevel)}`, 20, py); py += 5;
  doc.text(`Prazo de Ação: ${pxs.deadlineDays === 0 ? "Imediato" : pxs.deadlineDays + " dias"}`, 20, py); py += 10;

  // P×S Matrix table
  doc.setFont("helvetica", "bold");
  doc.text("Matriz de Classificação dos Riscos:", 14, py); py += 4;

  autoTable(doc, {
    startY: py,
    head: [["P \\ S", "S=1", "S=2", "S=3", "S=4", "S=5"]],
    body: [
      ["P=5", "5", "10", "15", "20", "25"],
      ["P=4", "4", "8", "12", "16", "20"],
      ["P=3", "3", "6", "9", "12", "15"],
      ["P=2", "2", "4", "6", "8", "10"],
      ["P=1", "1", "2", "3", "4", "5"],
    ],
    theme: "grid",
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 8, fontStyle: "bold", halign: "center" },
    bodyStyles: { fontSize: 8, textColor: COLORS.text, halign: "center" },
    columnStyles: { 0: { fontStyle: "bold" } },
    margin: { left: 40, right: 40 },
    didParseCell: (data) => {
      if (data.section === "body") {
        const val = parseInt(data.cell.raw as string);
        if (!isNaN(val)) {
          if (val >= 17) data.cell.styles.fillColor = [254, 202, 202]; // red
          else if (val >= 10) data.cell.styles.fillColor = [254, 240, 138]; // yellow
          else if (val >= 5) data.cell.styles.fillColor = [187, 247, 208]; // green
          else data.cell.styles.fillColor = [219, 234, 254]; // blue

          // Highlight active cell
          if (val === pxs.risk) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.textColor = [0, 0, 0];
          }
        }
      }
    },
  });

  // Risk levels table
  py = (doc as any).lastAutoTable?.finalY + 10 || 200;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Determinação dos Níveis de Risco e Conduta:", 14, py); py += 4;

  autoTable(doc, {
    startY: py,
    head: [["Nível", "Classificação", "Conduta"]],
    body: [
      ["Crítico (17-25)", "PR4", "Ações corretivas prioritárias. Reavaliação após implementação."],
      ["Alto (10-16)", "PR3", "Rotinas reavaliadas e novas medidas implantadas."],
      ["Moderado (5-9)", "PR2", "Rotinas monitoradas, avaliar novas medidas."],
      ["Baixo (1-4)", "PR1", "Manter controle existente, avaliar prevenção adicional."],
    ],
    theme: "grid",
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontSize: 7, fontStyle: "bold" },
    bodyStyles: { fontSize: 7, textColor: COLORS.text },
    columnStyles: { 2: { cellWidth: 80 } },
    margin: { left: 14, right: 14 },
  });

  // 4. Conclusion page
  doc.addPage();
  pageNum++;
  addHeader(doc, company.name, "Conclusão e Plano de Ação");
  addFooter(doc, pageNum);

  let cy = 48;
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  doc.setFont("helvetica", "bold");
  doc.text("4. Conclusão", 14, cy); cy += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const riskLabelMap: Record<string, string> = { "PR1": "BAIXO", "PR2": "MODERADO", "PR3": "ALTO", "PR4": "CRÍTICO", "NA": "BAIXO" };
  const conclusionText = [
    `A avaliação dos riscos psicossociais realizada através do protocolo PROART revelou que o`,
    `ambiente de trabalho avaliado apresenta classificação de risco ${riskLabelMap[pxs.prLevel] || "MODERADO"} (${pxs.prLevel}),`,
    `com índice P×S igual a ${pxs.risk}.`,
    ``,
    `Os principais pontos de atenção identificados foram:`,
  ];

  conclusionText.forEach(line => {
    doc.text(line, 14, cy); cy += 5;
  });

  PROART_SCALES.forEach(scale => {
    const scaleFactors = factorData.filter(f => f.factor.scaleId === scale.id);
    const scaleAvg = scaleFactors.length > 0 ? scaleFactors.reduce((a, f) => a + f.avg, 0) / scaleFactors.length : 0;
    const scaleType = scale.type === "positive" ? "positive" as const : "negative" as const;
    const cls = getClassification(scaleAvg, scaleType);
    doc.text(`• ${scale.name}: ${cls.label} (média ${scaleAvg.toFixed(2)})`, 18, cy); cy += 5;
  });

  cy += 3;
  doc.text(`Recomenda-se a implementação das ações propostas no Plano de Ação, com reavaliação`, 14, cy); cy += 5;
  doc.text(`em 6 a 12 meses para acompanhamento da evolução dos indicadores.`, 14, cy); cy += 12;

  // 5. Action Plan
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("5. Plano de Ação Sugerido", 14, cy); cy += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Com base nos resultados obtidos, recomenda-se a implementação das seguintes ações:", 14, cy); cy += 8;

  let actionNum = 1;
  PROART_SCALES.forEach(scale => {
    const scaleFactors = factorData.filter(f => f.factor.scaleId === scale.id);
    const riskyFactors = scaleFactors.filter(f => f.risk === "high" || f.risk === "medium");

    if (riskyFactors.length === 0) return;

    if (cy > 240) {
      doc.addPage();
      pageNum++;
      addHeader(doc, company.name, "Plano de Ação (cont.)");
      addFooter(doc, pageNum);
      cy = 48;
    }

    const scaleAvg = scaleFactors.reduce((a, f) => a + f.avg, 0) / scaleFactors.length;
    const scaleType = scale.type === "positive" ? "positive" as const : "negative" as const;
    const cls = getClassification(scaleAvg, scaleType);

    doc.setFont("helvetica", "bold");
    doc.text(`${actionNum}. ${scale.name} - ${cls.label}`, 14, cy); cy += 5;
    doc.setFont("helvetica", "normal");

    riskyFactors.forEach(f => {
      const suggested = getSuggestedActions(f.factor.id, f.risk);
      if (!suggested) return;
      suggested.tasks.forEach(task => {
        if (cy > 275) {
          doc.addPage();
          pageNum++;
          addHeader(doc, company.name, "Plano de Ação (cont.)");
          addFooter(doc, pageNum);
          cy = 48;
        }
        doc.text(`  • ${task}`, 18, cy); cy += 4;
      });
    });

    cy += 4;
    actionNum++;
  });

  // Section detail pages
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

  // Sector breakdown
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

  // Footer page
  doc.addPage();
  pageNum++;
  addHeader(doc, company.name, "");
  addFooter(doc, pageNum);

  let fy = 80;
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.text("PROART - Protocolo de Avaliação dos Riscos Psicossociais no Trabalho", 14, fy); fy += 8;
  doc.text(`Relatório gerado automaticamente em ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`, 14, fy); fy += 5;
  doc.text(`Empresa avaliada: ${company.name}`, 14, fy); fy += 8;
  doc.text("As interpretações e recomendações devem ser validadas por profissional habilitado.", 14, fy);

  doc.save(`relatorio_PROART_${company.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
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
