import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "A pesquisa tem validade jurídica?",
    a: "Sim. Todo o fluxo do Proativa segue boas práticas de documentação exigidas pelo PGR e pela nova NR-01. Cada resposta é registrada com data, hora e versão da pesquisa, gerando uma trilha de evidências rastreável. Os relatórios em PDF e as exportações em Excel servem como prova formal de que sua empresa cumpriu a obrigação de mapear, analisar e tratar os riscos psicossociais — material aceito por auditorias internas, fiscais do trabalho e perícias judiciais.",
  },
  {
    q: "Como vocês garantem o anonimato dos colaboradores?",
    a: "O Proativa separa a identidade do respondente dos dados de resposta desde o momento da coleta. Aplicamos os princípios da LGPD com agregação mínima — resultados só são exibidos quando há respondentes suficientes para impedir reidentificação por cargo, setor ou GHE. Nenhum gestor consegue ver a resposta individual de uma pessoa específica, apenas indicadores coletivos. Isso protege o colaborador e blinda a empresa contra acusações de retaliação.",
  },
  {
    q: "O sistema serve para clínicas de SST e consultorias?",
    a: "Sim, e foi desenhado pensando nesse caso de uso. Os planos Profissional e Empresarial permitem gerenciar várias empresas-cliente em um único painel, com padronização de pesquisas, comparativos entre carteiras e exportação de relatórios já formatados. No plano superior também é possível personalizar o PDF com a marca da consultoria (white label), entregando o documento direto para o cliente final sem retrabalho.",
  },
  {
    q: "Quão rápido consigo colocar para rodar?",
    a: "Em poucos dias. O cadastro, a configuração da pesquisa e o disparo do link anônimo levam menos de uma hora. À medida que as respostas chegam, o dashboard processa em tempo real — heatmap, demografia e tendências aparecem automaticamente. Não há projeto de TI, integração obrigatória nem instalação. Basta navegador e e-mail dos colaboradores ou um QR Code no mural da empresa.",
  },
  {
    q: "Onde ficam armazenados os dados? É seguro?",
    a: "Os dados ficam em servidores em conformidade com a LGPD, com criptografia em trânsito (HTTPS/SSL) e em repouso. Aplicamos controle de acesso por papel — cada usuário enxerga apenas o que precisa para o trabalho dele. Realizamos backups regulares e mantemos logs de auditoria de quem acessou o quê. Você também pode solicitar a exportação completa ou a exclusão dos dados a qualquer momento, conforme prevê a lei.",
  },
  {
    q: "O desconto de 70% vale para sempre?",
    a: "Não. É uma condição exclusiva do lote de lançamento, com vagas limitadas. O desconto é travado para o assinante enquanto a assinatura permanecer ativa, mas, uma vez encerrado o lote, novos clientes só conseguem entrar pelo valor cheio. Quanto antes você assinar, mais barato fica o custo recorrente da conformidade pelos próximos anos.",
  },
  {
    q: "Posso migrar de plano depois?",
    a: "Sim, a qualquer momento. Você pode subir de plano conforme a operação cresce, ganha novas empresas-cliente ou precisa de mais respondentes por mês. O upgrade é proporcional — você paga apenas a diferença pelo período restante do ciclo. Também é possível reduzir o plano em ciclos seguintes, sem multa nem fidelidade longa.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 sm:py-28 bg-surface">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-background/70">FAQ</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl text-background text-balance">
            Perguntas frequentes
          </h2>
        </div>

        <Accordion type="single" collapsible className="mt-10 w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border">
              <AccordionTrigger className="text-left font-medium text-background hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-background/75 leading-relaxed text-justify">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
