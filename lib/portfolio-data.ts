export type ProjectVisual = "archi" | "intelligence" | "atendimento" | "alc-site" | "mldds" | "portal" | "automy" | "voss";
export type ProjectScreenshot = {
  src: string;
  alt: string;
  objectPosition?: string;
  privacy?: "public" | "redacted";
};
export type PortfolioProject = {
  name: string;
  eyebrow: string;
  description: string;
  visual: ProjectVisual;
  href?: string;
  action?: string;
  access?: "private";
  stack: readonly string[];
  screenshot?: ProjectScreenshot;
};
// ARCHI é a central corporativa; ALC Prevenção de Perdas é o antigo Inteligência ALC.
// Repositórios privados não devem ser expostos como links públicos.
export const portfolioProjects: readonly PortfolioProject[] = [
  {
    "name": "ALC ARCHI",
    "eyebrow": "Plataforma corporativa · Identidade e acessos",
    "description": "Central de gestão da ALC com MFA, sessões revogáveis, liberações por setor e entrada no Administrativo por SSO. A integração de outros módulos ainda aguarda homologação.",
    "visual": "archi",
    "access": "private",
    "stack": [
      "Next.js",
      "TypeScript",
      "PostgreSQL",
      "Supabase Auth",
      "SSO",
      "Railway"
    ]
  },
  {
    "name": "ALC Prevenção de Perdas",
    "eyebrow": "Inteligência operacional · Aplicativo setorial",
    "description": "Antigo Inteligência ALC: análise de PNR, pré-faturamento, perdas, conciliação e indicadores operacionais. Funciona de forma independente do ARCHI até a integração ser aprovada.",
    "visual": "intelligence",
    "access": "private",
    "stack": [
      "Next.js",
      "React",
      "TypeScript",
      "PostgreSQL",
      "Supabase",
      "Railway"
    ],
    "screenshot": {
      "src": "/projects/inteligencia-alc.png",
      "alt": "Tela do ALC Prevenção de Perdas com dados sensíveis previamente ocultados",
      "objectPosition": "top center",
      "privacy": "redacted"
    }
  },
  {
    "name": "ALC Atendimento",
    "eyebrow": "Atendimento operacional · WhatsApp",
    "description": "Aplicação independente para tratativas de PNR, conversas, evidências e filas, com integração WhatsApp Cloud API e automação assistida pela agente Ellie.",
    "visual": "atendimento",
    "access": "private",
    "stack": [
      "Next.js",
      "TypeScript",
      "PostgreSQL",
      "WhatsApp Cloud API",
      "IA"
    ]
  },
  {
    "name": "MLDDS",
    "eyebrow": "Automação desktop · Logística",
    "description": "Automação e roteirização de processos logísticos, com regras de negócio, validações e rastreabilidade.",
    "visual": "mldds",
    "href": "https://github.com/ofmrmatte/MLDDS-Releases",
    "action": "Ver versões públicas",
    "stack": [
      "C#",
      ".NET 8",
      "WPF",
      "Automação"
    ],
    "screenshot": {
      "src": "/projects/mldds.png",
      "alt": "Interface desktop do MLDDS",
      "objectPosition": "top center",
      "privacy": "public"
    }
  },
  {
    "name": "Portal do Motorista",
    "eyebrow": "PWA · Pagamentos e contestações",
    "description": "Aplicação mobile-first para documentos, pagamentos, pendências e contestações dos motoristas.",
    "visual": "portal",
    "href": "https://github.com/ofmrmatte/painel_motorista",
    "action": "Ver repositório",
    "stack": [
      "Next.js",
      "React",
      "TypeScript",
      "Supabase",
      "PWA"
    ]
  },
  {
    "name": "Automy",
    "eyebrow": "ERP · Plataforma SaaS",
    "description": "Plataforma em desenvolvimento para gestão empresarial, clientes, contratos, finanças, indicadores e portal do cliente.",
    "visual": "automy",
    "href": "https://automy.dev.br",
    "action": "Conhecer o produto",
    "stack": [
      "React",
      "TypeScript",
      "TanStack",
      "PostgreSQL",
      "Better Auth",
      "Railway"
    ]
  },
  {
    "name": "Site ALC & Pereira Filho",
    "eyebrow": "Site institucional · Projeto público",
    "description": "Website institucional para apresentação de serviços logísticos, operação, equipe, contato e solicitação comercial.",
    "visual": "alc-site",
    "href": "https://github.com/ofmrmatte/ALC-Pereira-Filho-Transportes",
    "action": "Ver repositório",
    "stack": [
      "HTML",
      "CSS",
      "JavaScript",
      "Vercel"
    ]
  },
  {
    "name": "VOSS Barber Lounge",
    "eyebrow": "Website comercial · Experiência digital",
    "description": "Site comercial com serviços, profissionais, galeria, clube de benefícios e jornadas de agendamento.",
    "visual": "voss",
    "href": "https://voss-barber-lounge.vercel.app",
    "action": "Acessar site",
    "stack": [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Vercel"
    ]
  }
];
