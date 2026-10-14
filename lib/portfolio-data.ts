export type ProjectVisual = "archi" | "intelligence" | "atendimento" | "alc-site" | "mldds" | "portal";

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
  stack: readonly string[];
  screenshot?: ProjectScreenshot;
};

export type ArchiSubsystem = {
  name: string;
  status: string;
  description: string;
};

// Situações fundamentadas na documentação de outubro/2026 do monorepo ALC.
// O ARCHI centraliza a identidade e a entrada, não incorpora os apps setoriais
// ao mesmo processo nem presume integrações ainda não homologadas.
export const archiSubsystems: readonly ArchiSubsystem[] = [
  {
    name: "Identidade e acessos",
    status: "Em operação",
    description: "Login, MFA, sessões revogáveis, perfis, setores, diretório de usuários e controle de permissões."
  },
  {
    name: "Administrativo",
    status: "SSO integrado · Backend em homologação",
    description: "Documentos, períodos, CRM de motoristas e bases, com telas autenticadas de apresentação enquanto os dados reais são homologados."
  },
  {
    name: "Recursos Humanos (RH)",
    status: "Em preparação",
    description: "Colaboradores da matriz, jornada Secullum, férias, contratos e documentos; migração de dados ainda não ativada."
  },
  {
    name: "Frotas",
    status: "Telas propostas",
    description: "Área setorial de gestão de frota com interface de apresentação e integração operacional a validar."
  },
  {
    name: "Gerenciamento de Risco (GR)",
    status: "Telas propostas",
    description: "Visão setorial de risco com funcionalidades e dados operacionais ainda sujeitos à homologação."
  },
  {
    name: "Monitoramento",
    status: "Telas propostas",
    description: "Ambiente de acompanhamento operacional com telas de apresentação e integração pendente."
  },
  {
    name: "Operação",
    status: "Telas propostas",
    description: "Módulo setorial para centralização de rotinas e informações operacionais, em validação."
  },
  {
    name: "Captação",
    status: "Telas propostas",
    description: "Área de captação com fluxos e telas planejados; dados reais ainda não integrados."
  },
  {
    name: "Financeiro",
    status: "Aplicativo independente · Em homologação",
    description: "Contas a pagar e receber, boletos, conferências e liberação ou bloqueio de pagamentos, com integração prevista ao Administrativo."
  },
  {
    name: "Fiscal",
    status: "Aplicativo independente · Em homologação",
    description: "Conferência e organização de documentos fiscais, com troca de informações pelo contrato setorial do Financeiro."
  },
  {
    name: "Prevenção de Perdas",
    status: "Aplicativo existente · Integração planejada",
    description: "PNR, análise de perdas, risco e pré-faturamento. Segue operando separadamente do ARCHI."
  },
  {
    name: "Atendimento",
    status: "Aplicativo existente · Integração planejada",
    description: "Tratativas, conversas WhatsApp, evidências, filas e agente Ellie. Entrada atual continua pelo sistema de Prevenção de Perdas."
  }
];

export const portfolioProjects: readonly PortfolioProject[] = [
  {
    name: "ALC ARCHI",
    eyebrow: "Plataforma corporativa · Identidade e acessos",
    description:
      "Hub corporativo da ALC com identidade compartilhada, MFA, permissões por setor e integração entre aplicativos independentes. Explore os subsistemas e seu estágio de implantação.",
    visual: "archi",
    stack: ["Next.js", "TypeScript", "PostgreSQL", "Supabase Auth", "SSO", "Railway"]
  },
  {
    name: "ALC Prevenção de Perdas",
    eyebrow: "Inteligência operacional · Aplicativo setorial",
    description:
      "Antigo Inteligência ALC: análise de PNR, pré-faturamento, perdas, conciliação e indicadores operacionais. Permanece independente do ARCHI até sua integração ser aprovada.",
    visual: "intelligence",
    stack: ["Next.js", "React", "TypeScript", "PostgreSQL", "Supabase", "Railway"],
    screenshot: {
      src: "/projects/inteligencia-alc.png",
      alt: "Tela da ALC Prevenção de Perdas com dados sensíveis ocultados no arquivo",
      objectPosition: "top center",
      privacy: "redacted"
    }
  },
  {
    name: "ALC Atendimento",
    eyebrow: "Atendimento operacional · WhatsApp",
    description:
      "Aplicação independente para tratativas de PNR, conversas, evidências e filas, com integração à WhatsApp Cloud API e automação assistida pela agente Ellie.",
    visual: "atendimento",
    stack: ["Next.js", "TypeScript", "PostgreSQL", "WhatsApp Cloud API", "IA"]
  },
  {
    name: "MLDDS",
    eyebrow: "Automação desktop · Logística",
    description:
      "Automação e roteirização de processos logísticos, com regras de negócio, validações e rastreabilidade.",
    visual: "mldds",
    stack: ["C#", ".NET 8", "WPF", "Automação"],
    screenshot: {
      src: "/projects/mldds.png",
      alt: "Interface desktop do MLDDS",
      objectPosition: "top center",
      privacy: "public"
    }
  },
  {
    name: "Portal do Motorista",
    eyebrow: "PWA · Pagamentos e contestações",
    description:
      "Aplicação mobile-first para motoristas acompanharem documentos, pagamentos, pendências e contestações em uma experiência responsiva e autenticada.",
    visual: "portal",
    stack: ["Next.js", "React", "TypeScript", "Supabase", "PWA"]
  },
  {
    name: "Site ALC & Pereira Filho",
    eyebrow: "Site institucional · Logística",
    description:
      "Website institucional multipágina para apresentação de serviços logísticos, operação, equipe, contato e solicitações comerciais.",
    visual: "alc-site",
    stack: ["HTML", "CSS", "JavaScript", "Vercel"]
  }
];
