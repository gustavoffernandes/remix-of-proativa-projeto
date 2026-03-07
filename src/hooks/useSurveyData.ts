import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { questions, sections, type Respondent, type Company } from "@/data/mockData";

export interface SurveyResponse {
  id: string;
  config_id: string;
  response_timestamp: string | null;
  respondent_name: string | null;
  sex: string | null;
  age: number | null;
  sector: string | null;
  answers: Record<string, number>;
}

export interface RealCompany {
  id: string;
  name: string;
  sector: string;
  employees: number;
  color: string;
}

const COMPANY_COLORS = [
  "hsl(217, 71%, 45%)", "hsl(170, 60%, 45%)", "hsl(38, 92%, 55%)",
  "hsl(280, 60%, 55%)", "hsl(0, 72%, 55%)", "hsl(200, 80%, 50%)",
  "hsl(330, 65%, 50%)", "hsl(150, 55%, 45%)",
];

export function useSurveyData() {
  const { userCompanyId, isCompanyUser } = useAuth();

  const { data: configs = [], isLoading: loadingConfigs } = useQuery({
    queryKey: ["google-forms-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("google_forms_config")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: rawResponses = [], isLoading: loadingResponses } = useQuery({
    queryKey: ["survey-responses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("survey_responses")
        .select("*");
      if (error) throw error;
      return (data || []) as SurveyResponse[];
    },
  });

  const isLoading = loadingConfigs || loadingResponses;

  // Filter configs and responses by company if user is company_user
  const filteredConfigs = isCompanyUser && userCompanyId
    ? configs.filter(c => c.id === userCompanyId)
    : configs;

  const filteredRawResponses = isCompanyUser && userCompanyId
    ? rawResponses.filter(r => r.config_id === userCompanyId)
    : rawResponses;

  const companies: RealCompany[] = filteredConfigs.map((c, i) => ({
    id: c.id,
    name: c.company_name,
    sector: "—",
    employees: filteredRawResponses.filter(r => r.config_id === c.id).length,
    color: COMPANY_COLORS[i % COMPANY_COLORS.length],
  }));

  const respondents: Respondent[] = filteredRawResponses.map(r => {
    const formattedAnswers: Record<string, number> = {};

    if (r.answers) {
      Object.entries(r.answers).forEach(([columnHeader, cellValue]) => {
        const matchedQuestion = questions.find(q => 
          columnHeader.toLowerCase().includes(q.text.toLowerCase()) ||
          q.text.toLowerCase().includes(columnHeader.toLowerCase())
        );

        if (matchedQuestion) {
          let numValue = parseInt(String(cellValue), 10);

          if (isNaN(numValue)) {
            const textVal = String(cellValue).toLowerCase();
            if (textVal.includes("nunca")) numValue = 1;
            else if (textVal.includes("raramente")) numValue = 2;
            else if (textVal.includes("vezes")) numValue = 3;
            else if (textVal.includes("frequentemente")) numValue = 4;
            else if (textVal.includes("sempre")) numValue = 5;
          }

          if (numValue >= 1 && numValue <= 5) {
            formattedAnswers[matchedQuestion.id] = numValue;
          }
        }
      });
    }

    return {
      id: r.id,
      companyId: r.config_id,
      name: r.respondent_name || "Anônimo",
      sex: (r.sex === "Masculino" || r.sex === "Feminino") ? r.sex : "Prefiro não declarar",
      age: r.age || 0,
      sector: r.sector || "Não informado",
      answers: formattedAnswers,
      responseTimestamp: r.response_timestamp,
    };
  });

  const hasData = respondents.length > 0;

  function getCompanyRespondents(companyId: string): Respondent[] {
    return respondents.filter(r => r.companyId === companyId);
  }

  function getQuestionAverage(questionId: string, companyId?: string): number {
    const pool = companyId ? getCompanyRespondents(companyId) : respondents;
    const withAnswer = pool.filter(r => r.answers[questionId] !== undefined);
    if (withAnswer.length === 0) return 0;
    const sum = withAnswer.reduce((acc, r) => acc + (r.answers[questionId] || 0), 0);
    return Math.round((sum / withAnswer.length) * 100) / 100;
  }

  function getSectionAverage(sectionId: string, companyId?: string): number {
    const sectionQuestions = questions.filter(q => q.section === sectionId);
    if (sectionQuestions.length === 0) return 0;
    const pool = companyId ? getCompanyRespondents(companyId) : respondents;
    if (pool.length === 0) return 0;

    const questionsWithData = sectionQuestions.filter(q =>
      pool.some(r => r.answers[q.id] !== undefined)
    );
    if (questionsWithData.length === 0) return 0;

    const avg = questionsWithData.reduce((acc, q) => acc + getQuestionAverage(q.id, companyId), 0) / questionsWithData.length;
    return Math.round(avg * 100) / 100;
  }

  function getAnswerDistribution(questionId: string, companyId?: string) {
    const pool = companyId ? getCompanyRespondents(companyId) : respondents;
    const withAnswer = pool.filter(r => r.answers[questionId] !== undefined);
    return [1, 2, 3, 4, 5].map(value => {
      const count = withAnswer.filter(r => r.answers[questionId] === value).length;
      return {
        value,
        count,
        percentage: withAnswer.length > 0 ? Math.round((count / withAnswer.length) * 100) : 0,
      };
    });
  }

  function getAvailableQuestions() {
    const available = new Set<string>();
    respondents.forEach(r => {
      Object.keys(r.answers).forEach(k => available.add(k));
    });
    return questions.filter(q => available.has(q.id));
  }

  function getAvailableSections() {
    const availableQs = getAvailableQuestions();
    const sectionIds = new Set(availableQs.map(q => q.section));
    return sections.filter(s => sectionIds.has(s.id));
  }

  function getOutlierResponses(companyId: string, threshold: number = 1.5) {
    const pool = getCompanyRespondents(companyId);
    const outliers: { respondent: Respondent; questionId: string; value: number; sectorAvg: number; deviation: number }[] = [];

    const sectorGroups: Record<string, Respondent[]> = {};
    pool.forEach(r => {
      if (!sectorGroups[r.sector]) sectorGroups[r.sector] = [];
      sectorGroups[r.sector].push(r);
    });

    Object.entries(sectorGroups).forEach(([, sectorRespondents]) => {
      if (sectorRespondents.length < 3) return;

      const availableQs = getAvailableQuestions();
      availableQs.forEach(q => {
        const answers = sectorRespondents.filter(r => r.answers[q.id] !== undefined).map(r => r.answers[q.id]);
        if (answers.length < 3) return;

        const mean = answers.reduce((a, b) => a + b, 0) / answers.length;
        const stdDev = Math.sqrt(answers.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / answers.length);
        if (stdDev === 0) return;

        sectorRespondents.forEach(r => {
          if (r.answers[q.id] === undefined) return;
          const deviation = Math.abs(r.answers[q.id] - mean) / stdDev;
          if (deviation >= threshold) {
            outliers.push({
              respondent: r,
              questionId: q.id,
              value: r.answers[q.id],
              sectorAvg: Math.round(mean * 100) / 100,
              deviation: Math.round(deviation * 100) / 100,
            });
          }
        });
      });
    });

    return outliers.sort((a, b) => b.deviation - a.deviation);
  }

  function getSectorAverages(companyId: string) {
    const pool = getCompanyRespondents(companyId);
    const sectorSet = [...new Set(pool.map(r => r.sector))].sort();
    const availableSects = getAvailableSections();

    return sectorSet.map(sector => {
      const sectorPool = pool.filter(r => r.sector === sector);
      const sectionAvgs: Record<string, number> = {};
      availableSects.forEach(s => {
        const qs = questions.filter(q => q.section === s.id);
        const qsWithData = qs.filter(q => sectorPool.some(r => r.answers[q.id] !== undefined));
        if (qsWithData.length === 0) { sectionAvgs[s.id] = 0; return; }
        const avg = qsWithData.reduce((acc, q) => {
          const withAns = sectorPool.filter(r => r.answers[q.id] !== undefined);
          if (withAns.length === 0) return acc;
          return acc + withAns.reduce((a, r) => a + r.answers[q.id], 0) / withAns.length;
        }, 0) / qsWithData.length;
        sectionAvgs[s.id] = Math.round(avg * 100) / 100;
      });
      return { sector, count: sectorPool.length, sectionAvgs };
    });
  }

  return {
    isLoading,
    hasData,
    companies,
    respondents,
    getCompanyRespondents,
    getQuestionAverage,
    getSectionAverage,
    getAnswerDistribution,
    getAvailableQuestions,
    getAvailableSections,
    getOutlierResponses,
    getSectorAverages,
  };
}
