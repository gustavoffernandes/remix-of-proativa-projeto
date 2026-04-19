import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Risk } from "@/components/Risk";
import { Solution } from "@/components/Solution";
import { HowItWorks } from "@/components/HowItWorks";
import { SocialProof } from "@/components/SocialProof";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Proativa — NR-01 Riscos Psicossociais | PGR sem planilhas" },
      {
        name: "description",
        content:
          "Plataforma para Gestão de Riscos Psicossociais (NR-01). Mapeie, analise e gere relatórios prontos para o PGR. 70% OFF no lançamento — adeque sua empresa antes de 26/05/2026.",
      },
      {
        name: "keywords",
        content:
          "NR-01, riscos psicossociais, PGR, saúde mental no trabalho, SST, metodologia Proart, conformidade trabalhista, burnout ocupacional, gestão de riscos",
      },
      { name: "author", content: "Proativa" },
      { name: "robots", content: "index, follow" },
      { name: "language", content: "pt-BR" },
      { name: "theme-color", content: "#59554e" },

      { property: "og:type", content: "website" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:site_name", content: "Proativa" },
      { property: "og:title", content: "Proativa — Conformidade NR-01 sem planilhas" },
      {
        property: "og:description",
        content:
          "Plataforma com metodologia Proart para Gestão de Riscos Psicossociais. Heatmap, planos de ação e PDF pronto para o PGR.",
      },

      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Proativa — Conformidade NR-01 sem planilhas" },
      {
        name: "twitter:description",
        content:
          "Mapeie, analise e gere relatórios de Riscos Psicossociais prontos para o PGR. 70% OFF no lançamento.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://proativa.app/" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Proativa",
              url: "https://proativa.app",
              description:
                "Plataforma de Gestão de Riscos Psicossociais para conformidade com a NR-01.",
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+55-67-99287-5364",
                email: "contato@magoweb.com.br",
                contactType: "sales",
                areaServed: "BR",
                availableLanguage: ["Portuguese"],
              },
            },
            {
              "@type": "SoftwareApplication",
              name: "Proativa",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "AggregateOffer",
                priceCurrency: "BRL",
                lowPrice: "20.97",
                highPrice: "59.97",
                offerCount: "3",
              },
            },
            {
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "A pesquisa tem validade jurídica para o PGR?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Sim. O fluxo segue boas práticas de documentação para o PGR com rastreabilidade e relatórios exportáveis baseados na metodologia Proart.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Como o Proativa garante o anonimato dos colaboradores?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text:
                      "Aplicamos separação de identidade, controles LGPD e agregação mínima dos dados para evitar reidentificação dos respondentes.",
                  },
                },
              ],
            },
          ],
        }),
      },
    ],
  }),
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Risk />
        <Solution />
        <HowItWorks />
        <Pricing />
        <SocialProof />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
