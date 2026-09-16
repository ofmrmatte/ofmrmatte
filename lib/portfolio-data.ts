export type ProjectVisual = "intelligence" | "alc-site" | "mldds";

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
  href: string;
  action: string;
  visual: ProjectVisual;
  stack: readonly string[];
  screenshot?: ProjectScreenshot;
};

export const portfolioProjects = [
  {
    name: "Inteligência ALC",
    eyebrow: "Plataforma de inteligência operacional",
    description:
      "Centraliza PNR, pré-faturamento, risco, conciliação, qualidade e gestão operacional em uma única visão, reduzindo dispersão de dados e apoiando decisões mais rápidas.",
    href: "https://github.com/ofmrmatte/Inteligencia_ALC",
    action: "Ver projeto",
    visual: "intelligence",
    stack: ["Next.js", "React", "TypeScript", "Supabase", "PostgreSQL"],
    screenshot: {
      src: "/projects/inteligencia-alc.png",
      alt: "Tela do Inteligência ALC com dados sensíveis previamente redigidos",
      objectPosition: "top center",
      privacy: "redacted"
    }
  },
  {
    name: "Novo site da ALC",
    eyebrow: "Presença digital e experiência institucional",
    description:
      "Reconstrução do site institucional da transportadora com foco em clareza comercial, credibilidade, responsividade e uma apresentação mais forte da operação e da marca.",
    href: "https://alc-pereira-filho-preview.vercel.app",
    action: "Acessar site",
    visual: "alc-site",
    stack: ["HTML", "CSS", "JavaScript", "Vercel"]
  },
  {
    name: "MLDDS",
    eyebrow: "Automação operacional assistida",
    description:
      "Aplicação desktop para apoiar roteirização e execução de processos logísticos com regras de negócio, validações, rastreabilidade e segurança operacional.",
    href: "https://github.com/ofmrmatte/MLDDS-Releases",
    action: "Ver releases",
    visual: "mldds",
    stack: ["C#", ".NET 8", "WPF", "Automação"],
    screenshot: {
      src: "/projects/mldds.png",
      alt: "Tela de operação do MLDDS 4.0",
      objectPosition: "top center",
      privacy: "public"
    }
  }
] as const satisfies readonly PortfolioProject[];
