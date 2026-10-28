export type ProjectVisual = "archi" | "alc-site" | "mldds" | "mf-stream";

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
// Prevenção de Perdas e Atendimento compõem o catálogo de subsistemas do ARCHI.
// Eles preservam serviços próprios enquanto o SSO central está em homologação.
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
    status: "Subsistema existente · SSO em homologação",
    description: "Análise de PNR, perdas, risco e pré-faturamento. Integra o ecossistema ARCHI, mas continua operando em serviço próprio até a homologação do acesso central."
  },
  {
    name: "Atendimento",
    status: "Subsistema existente · SSO em homologação",
    description: "Tratativas de PNR, conversas WhatsApp, evidências, filas e agente Ellie. A entrada ainda ocorre pela Prevenção de Perdas até a integração com o ARCHI."
  }
];

export const portfolioProjects: readonly PortfolioProject[] = [
  {
    name: "MF Stream",
    eyebrow: "Streaming · Filmes, séries e TV ao vivo",
    description: "Aplicativo de mídia com contas, perfis, reprodução HLS, controle parental e progresso salvo. Interface responsiva e infraestrutura preparada para publicação no Railway.",
    visual: "mf-stream",
    stack: ["Node.js", "JavaScript", "Better Auth", "SQLite / PostgreSQL", "HLS", "Docker"],
    screenshot: { src: "/projects/mf-stream.png", alt: "Tela de acesso do MF Stream", privacy: "public" }
  },
  {
    name: "ALC ARCHI",
    eyebrow: "Plataforma corporativa · Identidade e acessos",
    description:
      "Central corporativa de gestão e identidade da ALC. Organiza os subsistemas por setor, com MFA, permissões de acesso e integrações graduais entre aplicações. Consulte o detalhamento em Ver mais.",
    visual: "archi",
    stack: ["Next.js", "TypeScript", "PostgreSQL", "Supabase Auth", "SSO", "Railway"]
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
    name: "Site ALC & Pereira Filho",
    eyebrow: "Site institucional · Logística",
    description:
      "Website institucional multipágina para apresentação de serviços logísticos, operação, equipe, contato e solicitações comerciais.",
    visual: "alc-site",
    stack: ["HTML", "CSS", "JavaScript", "Vercel"]
  }
];
