

# Plano de Atualizações do Sistema PROATIVA

## Resumo das Alterações

4 frentes de trabalho: Heatmap (legenda), Privacidade (outliers), Métricas por setor, e Planos de Ação (reformulação).

---

## 1. Identificador e Legenda no Heatmap

**Arquivo:** `src/components/dashboard/HeatmapTable.tsx`, `src/pages/Heatmap.tsx`

- Adicionar badge "Positiva" ou "Negativa" ao lado do título da seção no Heatmap
- Adicionar legenda visual abaixo da tabela com faixas de cores:
  - Verde (≥4 para positivas / ≤2 para negativas) = Bom
  - Amarelo (3-3.9 positivas / 2.1-3 negativas) = Moderado
  - Vermelho (<3 positivas / >3 negativas) = Ruim
- A legenda será um componente visual com amostras de cor e rótulos claros

## 2. Anonimização nos Outliers (Perfil por Empresa)

**Arquivo:** `src/pages/Reports.tsx`

- Na tabela "Respostas Fora do Padrão" (outliers, linha ~384-398), substituir `o.respondent.name` por um identificador anônimo como "Respondente 1", "Respondente 2", etc.
- Manter setor visível (não identifica diretamente a pessoa)
- Isso afeta apenas a visualização no relatório da empresa; dados brutos permanecem intactos

## 3. Métricas de Quantidade por Setor no Relatório

**Arquivos:** `src/pages/Reports.tsx`, `src/lib/pdfExport.ts`

- Na seção "Respostas por Setor" (Reports.tsx, linha ~358-377), adicionar colunas:
  - "Esperado" (quantidade de funcionários esperados por setor — se disponível)
  - "Respondidos" (quantidade de formulários preenchidos daquele setor)
  - "% Preenchimento" (respondidos / esperado)
- Como atualmente não existe uma tabela de setores por empresa, vamos usar os dados já existentes: o campo `sector` dos respondentes para contar respostas, e o `employee_count` da empresa como referência geral
- No PDF (`pdfExport.ts`), replicar a mesma tabela expandida na seção de setores

**Nota:** Sem criar uma estrutura de setores por empresa (com quantidade esperada por setor), só é possível mostrar a contagem real de respostas por setor e o percentual sobre o total de respostas. Para granularidade completa (esperado por setor), seria necessário uma nova tabela — que pode ser feita em uma segunda iteração.

## 4. Reformulação dos Planos de Ação

### 4a. Tabela "O que / Por que / Como"

**Arquivos:** `src/pages/ActionPlans.tsx`, `src/pages/Reports.tsx`, `src/lib/pdfExport.ts`

- Reformular a exibição das tarefas do plano de ação para incluir 3 colunas:
  - **O que** (título da tarefa)
  - **Por que** (descrição/justificativa — campo `description` já existente na tabela `action_plan_tasks`)
  - **Como** (campo `observation` reutilizado como "como fazer")
- No site: cada tarefa expandida mostra essas 3 informações em formato de mini-tabela
- No PDF: usar `autoTable` com cabeçalho ["O que", "Por que", "Como", "Status"]

### 4b. Indicador Visual de Status (Executada / Pendente)

**Arquivos:** `src/pages/ActionPlans.tsx`, `src/pages/Reports.tsx`

- Tarefas concluídas: ícone de check verde + fundo verde claro
- Tarefas pendentes: ícone de relógio amarelo/cinza + fundo amarelo claro
- Badge com texto "Executada" (verde) ou "Pendente" (amarelo/cinza)

### 4c. Sincronização PDF ↔ Site

**Arquivo:** `src/lib/pdfExport.ts`

- O PDF já é gerado dinamicamente no momento do clique — ele já reflete o estado atual do banco
- Passar os dados reais de `plans` e `tasks` (do hook `useActionPlans`) para a função `exportCompanyPDF` ao invés de gerar planos sugeridos estáticos
- Assim, qualquer alteração feita nos planos no site será automaticamente refletida no PDF quando exportado
- Atualizar a interface `PDFExportData` para aceitar `plans` e `tasks` opcionais

---

## Detalhes Técnicos

### Arquivos modificados:
1. `src/components/dashboard/HeatmapTable.tsx` — legenda + badge tipo
2. `src/pages/Heatmap.tsx` — passar info de tipo da seção
3. `src/pages/Reports.tsx` — anonimizar outliers, expandir tabela setores, reformular exibição planos
4. `src/pages/ActionPlans.tsx` — reformular tabela tarefas (O que/Por que/Como), indicadores visuais
5. `src/lib/pdfExport.ts` — sincronizar com planos reais, tabela O que/Por que/Como, indicadores visuais, métricas setor
6. `src/hooks/useActionPlans.ts` — sem alteração de schema necessária

### Nenhuma migração de banco necessária
- Os campos `description` e `observation` já existem em `action_plan_tasks`
- Serão reutilizados como "Por que" e "Como" respectivamente

