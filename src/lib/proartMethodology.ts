/**
 * PROART Methodology - Dr. Emílio Peres Facas (UnB)
 * Protocol for Psychosocial Risk Assessment at Work
 * 
 * 4 Scales, 10 Factors, 91 Questions
 * Risk Classification + P×S Matrix (SESI 2022)
 */

// ========== SCALE & FACTOR DEFINITIONS ==========

export type ScaleType = "positive" | "negative" | "mixed";
export type RiskLevel = "low" | "medium" | "high";
export type PRLevel = "NA" | "PR4" | "PR3" | "PR2" | "PR1";

export interface ProartFactor {
  id: string;
  scaleId: string;
  name: string;
  shortName: string;
  type: "positive" | "negative";
  questionIds: string[];
  cronbach: number;
}

export interface ProartScale {
  id: string;
  name: string;
  shortName: string;
  type: ScaleType;
  questionCount: number;
  factors: ProartFactor[];
}

// Inverted questions (global numbering 1-19, 25-31, 37)
// c1-c19 (all EOT), g6-g12 (EEG), g18 (EEG)
export const INVERTED_QUESTION_IDS = new Set([
  "c1","c2","c3","c4","c5","c6","c7","c8","c9","c10",
  "c11","c12","c13","c14","c15","c16","c17","c18","c19",
  "g6","g7","g8","g9","g10","g11","g12",
  "g18"
]);

export const PROART_SCALES: ProartScale[] = [
  {
    id: "contexto",
    name: "Escala de Organização do Trabalho (EOT)",
    shortName: "EOT",
    type: "positive",
    questionCount: 19,
    factors: [
      {
        id: "divisao_tarefas",
        scaleId: "contexto",
        name: "Divisão das Tarefas",
        shortName: "Div. Tarefas",
        type: "positive",
        questionIds: ["c1","c2","c3","c4","c5","c6","c7"],
        cronbach: 0.89,
      },
      {
        id: "divisao_social",
        scaleId: "contexto",
        name: "Divisão Social do Trabalho",
        shortName: "Div. Social",
        type: "positive",
        questionIds: ["c8","c9","c10","c11","c12","c13","c14","c15","c16","c17","c18","c19"],
        cronbach: 0.87,
      },
    ],
  },
  {
    id: "gestao",
    name: "Escala de Estilos de Gestão (EEG)",
    shortName: "EEG",
    type: "mixed",
    questionCount: 21,
    factors: [
      {
        id: "individualista",
        scaleId: "gestao",
        name: "Estilo Individualista",
        shortName: "Individualista",
        type: "negative",
        questionIds: ["g1","g2","g3","g4","g5","g6","g7","g8","g9","g10","g11"],
        cronbach: 0.85,
      },
      {
        id: "coletivista",
        scaleId: "gestao",
        name: "Estilo Coletivista",
        shortName: "Coletivista",
        type: "positive",
        questionIds: ["g12","g13","g14","g15","g16","g17","g18","g19","g20","g21"],
        cronbach: 0.88,
      },
    ],
  },
  {
    id: "vivencias",
    name: "Escala de Indicadores de Sofrimento no Trabalho (EIST)",
    shortName: "EIST",
    type: "negative",
    questionCount: 28,
    factors: [
      {
        id: "falta_sentido",
        scaleId: "vivencias",
        name: "Falta de Sentido no Trabalho",
        shortName: "Falta Sentido",
        type: "negative",
        questionIds: ["v1","v2","v3","v4","v5","v6","v7","v8","v9"],
        cronbach: 0.91,
      },
      {
        id: "esgotamento",
        scaleId: "vivencias",
        name: "Esgotamento Mental",
        shortName: "Esgotamento",
        type: "negative",
        questionIds: ["v10","v11","v12","v13","v14","v15","v16","v17"],
        cronbach: 0.93,
      },
      {
        id: "falta_reconhecimento",
        scaleId: "vivencias",
        name: "Falta de Reconhecimento",
        shortName: "Falta Reconhec.",
        type: "negative",
        questionIds: ["v18","v19","v20","v21","v22","v23","v24","v25","v26","v27","v28"],
        cronbach: 0.89,
      },
    ],
  },
  {
    id: "saude",
    name: "Escala de Danos Relacionados ao Trabalho (EDT)",
    shortName: "EDT",
    type: "negative",
    questionCount: 23,
    factors: [
      {
        id: "danos_psicologicos",
        scaleId: "saude",
        name: "Danos Psicológicos",
        shortName: "D. Psicológicos",
        type: "negative",
        questionIds: ["s1","s2","s3","s4","s5","s6","s7"],
        cronbach: 0.94,
      },
      {
        id: "danos_sociais",
        scaleId: "saude",
        name: "Danos Sociais",
        shortName: "D. Sociais",
        type: "negative",
        questionIds: ["s8","s9","s10","s11","s12","s13","s14"],
        cronbach: 0.89,
      },
      {
        id: "danos_fisicos",
        scaleId: "saude",
        name: "Danos Físicos",
        shortName: "D. Físicos",
        type: "negative",
        questionIds: ["s15","s16","s17","s18","s19","s20","s21","s22","s23"],
        cronbach: 0.92,
      },
    ],
  },
];

export const ALL_FACTORS = PROART_SCALES.flatMap(s => s.factors);

// ========== RISK CLASSIFICATION ==========

/**
 * Classify risk based on PROART methodology
 * Positive scales: ≥3.70 = LOW, 2.30-3.69 = MEDIUM, <2.30 = HIGH
 * Negative scales: ≤2.29 = LOW, 2.30-3.69 = MEDIUM, ≥3.70 = HIGH
 */
export function classifyRisk(value: number, type: "positive" | "negative"): RiskLevel {
  if (type === "positive") {
    if (value >= 3.70) return "low";
    if (value >= 2.30) return "medium";
    return "high";
  } else {
    if (value <= 2.29) return "low";
    if (value <= 3.69) return "medium";
    return "high";
  }
}

export function getRiskLabel(level: RiskLevel): string {
  switch (level) {
    case "low": return "Risco Baixo";
    case "medium": return "Risco Médio";
    case "high": return "Risco Alto";
  }
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case "low": return "text-success";
    case "medium": return "text-warning";
    case "high": return "text-destructive";
  }
}

export function getRiskBgColor(level: RiskLevel): string {
  switch (level) {
    case "low": return "bg-success/15";
    case "medium": return "bg-warning/15";
    case "high": return "bg-destructive/15";
  }
}

// ========== P×S MATRIX (SESI 2022) ==========

/**
 * Auto-calculate P×S variables from survey data
 * E (Exposure): Mapped from EIST average (frequency of suffering)
 * C (Control): Mapped from EOT average (inverted - higher = better control = lower value)
 * G (Severity): Mapped from EDT average (severity of damages)
 * PE (People Exposed): Mapped from % of respondents with high risk
 */
function mapScoreToVariable(score: number, type: "positive" | "negative"): number {
  // Map 1-5 average to 1-4 variable
  if (type === "negative") {
    // Higher score = worse = higher variable
    if (score >= 3.70) return 4;
    if (score >= 2.70) return 3;
    if (score >= 1.70) return 2;
    return 1;
  } else {
    // Higher score = better = lower variable (inverted)
    if (score >= 3.70) return 1;
    if (score >= 2.70) return 2;
    if (score >= 1.70) return 3;
    return 4;
  }
}

export function calculatePxS(
  eotAvg: number,
  eegColAvg: number,
  eistAvg: number,
  edtAvg: number,
  totalRespondents: number,
  highRiskCount: number,
): { P: number; S: number; risk: number; prLevel: PRLevel; deadlineDays: number } {
  const E = mapScoreToVariable(eistAvg, "negative"); // Exposure from EIST
  const C = mapScoreToVariable((eotAvg + eegColAvg) / 2, "positive"); // Control from EOT + EEG-Col
  const G = mapScoreToVariable(edtAvg, "negative"); // Severity from EDT

  // PE based on percentage of high risk respondents
  const highRiskPct = totalRespondents > 0 ? (highRiskCount / totalRespondents) * 100 : 0;
  let PE: number;
  if (highRiskPct >= 75) PE = 4;
  else if (highRiskPct >= 50) PE = 3;
  else if (highRiskPct >= 25) PE = 2;
  else PE = 1;

  const P = Math.min(5, Math.floor((E + C * 2) / 3) + 1);
  const S = Math.min(5, Math.floor((G * 2 + PE) / 3) + 1);
  const risk = P * S;

  let prLevel: PRLevel;
  let deadlineDays: number;
  if (risk >= 25) { prLevel = "PR1"; deadlineDays = 0; }
  else if (risk >= 15) { prLevel = "PR2"; deadlineDays = 30; }
  else if (risk >= 10) { prLevel = "PR3"; deadlineDays = 90; }
  else if (risk >= 6) { prLevel = "PR4"; deadlineDays = 180; }
  else { prLevel = "NA"; deadlineDays = 365; }

  return { P, S, risk, prLevel, deadlineDays };
}

export function getPRLevelLabel(level: PRLevel): string {
  switch (level) {
    case "PR1": return "PR1 - Ação Imediata";
    case "PR2": return "PR2 - 30 dias";
    case "PR3": return "PR3 - 90 dias";
    case "PR4": return "PR4 - 180 dias";
    case "NA": return "NA - Manter";
  }
}

export function getPRLevelColor(level: PRLevel): string {
  switch (level) {
    case "PR1": return "text-destructive";
    case "PR2": return "text-destructive";
    case "PR3": return "text-warning";
    case "PR4": return "text-primary";
    case "NA": return "text-success";
  }
}

export function getPRLevelBgColor(level: PRLevel): string {
  switch (level) {
    case "PR1": return "bg-destructive/20";
    case "PR2": return "bg-destructive/15";
    case "PR3": return "bg-warning/15";
    case "PR4": return "bg-primary/15";
    case "NA": return "bg-success/15";
  }
}

// ========== PRE-DEFINED ACTION PLANS ==========

export interface SuggestedAction {
  factorId: string;
  riskLevel: RiskLevel;
  title: string;
  tasks: string[];
}

export const SUGGESTED_ACTIONS: SuggestedAction[] = [
  // EOT - Divisão das Tarefas
  { factorId: "divisao_tarefas", riskLevel: "high", title: "Reestruturar condições de trabalho", tasks: [
    "Avaliar adequação do quadro de funcionários vs demanda",
    "Mapear necessidades de recursos e equipamentos",
    "Revisar prazos e metas de produtividade",
    "Implementar programa de manutenção preventiva de equipamentos",
    "Criar canal de solicitação de recursos",
  ]},
  { factorId: "divisao_tarefas", riskLevel: "medium", title: "Melhorar condições de trabalho", tasks: [
    "Realizar pesquisa de necessidades de recursos",
    "Ajustar ritmo de trabalho com base no feedback",
    "Revisar adequação do espaço físico",
  ]},
  // EOT - Divisão Social
  { factorId: "divisao_social", riskLevel: "high", title: "Promover participação e autonomia", tasks: [
    "Implementar reuniões participativas de planejamento",
    "Criar programa de comunicação organizacional",
    "Estabelecer canais de feedback ascendente",
    "Revisar critérios de avaliação de desempenho",
    "Promover autonomia nas tarefas rotineiras",
  ]},
  { factorId: "divisao_social", riskLevel: "medium", title: "Fortalecer comunicação interna", tasks: [
    "Realizar workshops de comunicação eficaz",
    "Revisar fluxos de informação entre setores",
    "Criar espaços de diálogo entre equipes",
  ]},
  // EEG - Individualista
  { factorId: "individualista", riskLevel: "high", title: "Reformular estilo de gestão", tasks: [
    "Capacitar lideranças em gestão participativa",
    "Reduzir centralização de decisões",
    "Implementar programa de desenvolvimento de líderes",
    "Criar comitês de decisão compartilhada",
    "Estabelecer política de gestão horizontal",
  ]},
  { factorId: "individualista", riskLevel: "medium", title: "Desenvolver lideranças", tasks: [
    "Oferecer treinamento em liderança colaborativa",
    "Implementar avaliação 360° para gestores",
    "Criar programa de mentoria",
  ]},
  // EEG - Coletivista
  { factorId: "coletivista", riskLevel: "high", title: "Fortalecer cultura colaborativa", tasks: [
    "Implementar projetos interdepartamentais",
    "Criar programa de reconhecimento coletivo",
    "Promover eventos de integração de equipes",
    "Estabelecer metas de equipe além de individuais",
    "Valorizar inovação com programa de ideias",
  ]},
  { factorId: "coletivista", riskLevel: "medium", title: "Incentivar trabalho em equipe", tasks: [
    "Promover dinâmicas de team building",
    "Criar espaços de compartilhamento de boas práticas",
    "Implementar sistema de sugestões",
  ]},
  // EIST - Falta de Sentido
  { factorId: "falta_sentido", riskLevel: "high", title: "Resgatar sentido e propósito no trabalho", tasks: [
    "Alinhar tarefas com propósito organizacional",
    "Implementar programa de job rotation",
    "Criar programa de desenvolvimento de carreira",
    "Conectar resultados individuais ao impacto social",
    "Realizar workshops de propósito e significado",
  ]},
  { factorId: "falta_sentido", riskLevel: "medium", title: "Fortalecer propósito organizacional", tasks: [
    "Comunicar impacto do trabalho de cada área",
    "Oferecer oportunidades de aprendizado",
    "Diversificar atividades rotineiras",
  ]},
  // EIST - Esgotamento
  { factorId: "esgotamento", riskLevel: "high", title: "Combater esgotamento mental", tasks: [
    "Implementar programa de saúde mental no trabalho",
    "Oferecer apoio psicológico (EAP)",
    "Revisar carga de trabalho e distribuição de tarefas",
    "Criar política de desconexão digital",
    "Implementar pausas programadas e ginástica laboral",
  ]},
  { factorId: "esgotamento", riskLevel: "medium", title: "Prevenir esgotamento", tasks: [
    "Monitorar indicadores de carga de trabalho",
    "Oferecer workshops de gerenciamento de estresse",
    "Implementar flexibilidade de horários quando possível",
  ]},
  // EIST - Falta de Reconhecimento
  { factorId: "falta_reconhecimento", riskLevel: "high", title: "Criar cultura de reconhecimento", tasks: [
    "Implementar programa formal de reconhecimento",
    "Criar canais de expressão e diálogo",
    "Revisar política de feedback contínuo",
    "Estabelecer programa de valorização profissional",
    "Implementar pesquisa de clima organizacional periódica",
  ]},
  { factorId: "falta_reconhecimento", riskLevel: "medium", title: "Melhorar reconhecimento", tasks: [
    "Implementar feedback regular das lideranças",
    "Criar programa de destaque mensal",
    "Promover diálogo aberto entre equipes",
  ]},
  // EDT - Danos Psicológicos
  { factorId: "danos_psicologicos", riskLevel: "high", title: "Intervir em danos psicológicos", tasks: [
    "Encaminhar para avaliação psicológica especializada",
    "Implementar programa de apoio emocional",
    "Criar grupo de apoio entre pares",
    "Oferecer acompanhamento psicoterapêutico",
    "Revisar fatores organizacionais causadores",
  ]},
  { factorId: "danos_psicologicos", riskLevel: "medium", title: "Prevenir danos psicológicos", tasks: [
    "Oferecer rodas de conversa sobre saúde emocional",
    "Monitorar indicadores de bem-estar",
    "Capacitar líderes para identificar sinais de sofrimento",
  ]},
  // EDT - Danos Sociais
  { factorId: "danos_sociais", riskLevel: "high", title: "Intervir em danos sociais", tasks: [
    "Avaliar relações interpessoais no ambiente de trabalho",
    "Implementar programa de mediação de conflitos",
    "Criar atividades de integração social",
    "Oferecer apoio para conflitos familiares relacionados ao trabalho",
    "Implementar política anti-assédio",
  ]},
  { factorId: "danos_sociais", riskLevel: "medium", title: "Prevenir isolamento social", tasks: [
    "Promover atividades de integração",
    "Criar espaços de convivência",
    "Monitorar relações interpessoais",
  ]},
  // EDT - Danos Físicos
  { factorId: "danos_fisicos", riskLevel: "high", title: "Intervir em danos físicos", tasks: [
    "Encaminhar para avaliação médica ocupacional",
    "Revisar ergonomia dos postos de trabalho",
    "Implementar programa de ginástica laboral",
    "Avaliar e corrigir riscos ergonômicos",
    "Criar programa de prevenção de LER/DORT",
  ]},
  { factorId: "danos_fisicos", riskLevel: "medium", title: "Prevenir danos físicos", tasks: [
    "Oferecer orientação ergonômica",
    "Implementar pausas ativas",
    "Monitorar queixas de saúde física",
  ]},
];

export function getSuggestedActions(factorId: string, riskLevel: RiskLevel): SuggestedAction | undefined {
  return SUGGESTED_ACTIONS.find(a => a.factorId === factorId && a.riskLevel === riskLevel);
}

// ========== P×S MATRIX DISPLAY ==========

export const PXS_MATRIX: number[][] = [
  [5, 10, 15, 20, 25],  // P=5
  [4,  8, 12, 16, 20],  // P=4
  [3,  6,  9, 12, 15],  // P=3
  [2,  4,  6,  8, 10],  // P=2
  [1,  2,  3,  4,  5],  // P=1
];

export function getMatrixCellPR(value: number): PRLevel {
  if (value >= 25) return "PR1";
  if (value >= 15) return "PR2";
  if (value >= 10) return "PR3";
  if (value >= 6) return "PR4";
  return "NA";
}
