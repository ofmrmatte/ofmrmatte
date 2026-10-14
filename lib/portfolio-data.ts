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
  href?: string;
  action?: string;
  visual: ProjectVisual;
  stack: readonly string[];
  access?: "private";
  screenshot?: ProjectScreenshot;
};

// O ARCHI é a central corporativa. O antigo Inteligência ALC é o aplicativo
// setorial ALC Prevenção de Perdas. Não publicar URLs de serviços internos.
export const portfolioProjects: readonly PortfolioProject[] = [
  {
    name: "ALC ARCHI",
    eyebrow: "Plataforma corporativa · Identidade e acessos",
    description: "Central corporativa da ALC com identidade compartilhada, MFA, sessões revogáveis, permissões por setor e acesso ao Administrativo por SSO. A integração dos demais módulos está sendo homologada.",
    visual: "archi",
    access: "private",
    stack: ["Next.js", "TypeScript", "PostgreSQL", "Supabase Auth", "SSO", "Railway"]
  },
  {
    name: "ALC Prevenção de Perdas",
    eyebrow: "Inteligência operacional · Aplicativo setorial",
    description: "Evolução do antigo Inteligência ALC: análise de PNR, pré-faturamento, perdas, conciliações e indicadores operacionais. Permanece independente do ARCHI até a integração ser aprovada.",
    visual: "intelligence",
    access: "private",
    stack: ["Next.js", "React", "TypeScript", "PostgreSQL", "Supabase", "Railway"],
    screenshot: {
      src: "/projects/inteligencia-alc.png",
      alt: "Painel ALC Prevenção de Perdas, antigo Inteligência ALC, com dados sensíveis previamente ocultados no arquivo",
      objectPosition: "top center",
      privacy: "redacted"
    }
  },
  {
    name: "ALC Atendimento",
    eyebrow: "Atendimento operacional · WhatsApp",
    description: "Aplicativo dedicado a tratativas de PNR, conversas, evidências, filas e atendimento via WhatsApp Cloud API, com automações controladas e agente virtual Ellie.",
    visual: "atendimento",
    access: "private",
    stack: ["Next.js", "TypeScript", "PostgreSQL", "WhatsApp Cloud API", "IA"]
  },
  {
    name: "MLDDS",
    eyebrow: "Automação desktop · Logística",
    description: "Solução desktop para automatizar processos logísticos e roteirização, aplicando regras de negócio, validações, rastreabilidade e integração com fluxos operacionais.",
    href: "https://github.com/ofmrmatte/MLDDS-Releases",
    action: "Ver versões públicas",
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
    eyebrow: "PWA · Operações e comunicação",
    description: "Aplicação mobile-first para motoristas acompanharem pendências, pagamentos, documentos e contestações com autenticação e rastreabilidade.",
    href: "https://github.com/ofmrmatte/painel_motorista",
    action: "Ver repositório",
    visual: "portal",
    stack: ["Next.js", "React", "TypeScript", "Supabase", "PWA"]
  },
  {
    name: "Automy",
    eyebrow: "ERP · Plataforma SaaS em desenvolvimento",
    description: "Plataforma para gestão empresarial e automação de processos, com clientes, contratos, indicadores, financeiro, relatórios e portal do cliente.",
    href: "https://automy.dev.br",
    action: "Conhecer o produto",
    visual: "automy",
    stack: ["React", "TypeScript", "TanStack", "PostgreSQL", "Better Auth", "Railway"]
  },
  {
    name: "Site ALC & Pereira Filho",
    eyebrow: "Site institucional · Projeto público",
    description: "Portal institucional responsivo para apresentação de serviços logísticos, operação, equipe, contatos e solicitações comerciais.",
    href: "https://github.com/ofmrmatte/ALC-Pereira-Filho-Transportes",
    action: "Ver repositório",
    visual: "alc-site",
    stack: ["HTML", "CSS", "JavaScript", "Vercel"]
  },
  {
    name: "VOSS Barber Lounge",
    eyebrow: "Website comercial · Experiência digital",
    description: "Site institucional com serviços, profissionais, galeria, clube de benefícios e caminhos de agendamento, com arquitetura responsiva.",
    href: "https://voss-barber-lounge.vercel.app",
    action: "Acessar site",
    visual: "voss",
    stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Vercel"]
  }
];
