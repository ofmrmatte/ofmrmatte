import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Database,
  EnvelopeSimple,
  GithubLogo,
  LinkedinLogo,
  Robot,
  UserCircle
} from "@phosphor-icons/react/dist/ssr";
import { PortfolioMotion } from "./components/PortfolioMotion";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

const navItems = [
  ["Sobre", "#sobre"],
  ["Projetos", "#projetos"],
  ["Competências", "#competencias"],
  ["Formação", "#formacao"],
  ["Contato", "#contato"]
] as const;

const projectCards = [
  {
    name: "Inteligência ALC",
    eyebrow: "Plataforma de inteligência operacional",
    description:
      "Centraliza PNR, pré-faturamento, risco, conciliação, qualidade e gestão operacional em uma única visão, reduzindo dispersão de dados e apoiando decisões mais rápidas.",
    href: "https://github.com/ofmrmatte/Inteligencia_ALC",
    action: "Ver projeto",
    visual: "intelligence"
  },
  {
    name: "Novo site da ALC",
    eyebrow: "Presença digital e experiência institucional",
    description:
      "Reconstrução do site institucional da transportadora com foco em clareza comercial, credibilidade, responsividade e uma apresentação mais forte da operação e da marca.",
    href: "https://alcepereirafilho.com.br",
    action: "Acessar site",
    visual: "alc-site"
  },
  {
    name: "MLDDS",
    eyebrow: "Automação operacional assistida",
    description:
      "Aplicação desktop para apoiar roteirização e execução de processos logísticos com regras de negócio, validações, rastreabilidade e segurança operacional.",
    href: "https://github.com/ofmrmatte/MLDDS-Releases",
    action: "Ver releases",
    visual: "mldds"
  }
] as const;

const competencies = [
  {
    title: "Gestão & Operações",
    text: "Leitura de processos, indicadores e gargalos para transformar rotina operacional em fluxos mais claros, controláveis e eficientes.",
    Icon: Briefcase
  },
  {
    title: "Sistemas & Dados",
    text: "Modelagem de informações, dashboards, integrações e aplicações que transformam dados dispersos em visão confiável para decisão.",
    Icon: Database
  },
  {
    title: "Automação & IA aplicada",
    text: "Desenvolvimento de automações e soluções assistidas por IA para reduzir retrabalho, acelerar ciclos e ampliar capacidade operacional.",
    Icon: Robot
  }
] as const;

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      M
    </span>
  );
}

function IntelligencePreview() {
  return (
    <div className="product-preview intelligence-preview" aria-label="Representação visual do Inteligência ALC">
      <div className="preview-sidebar" aria-hidden="true">
        <span className="sidebar-logo">ALC</span>
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="preview-main">
        <div className="preview-topline">
          <div>
            <span className="preview-kicker">Inteligência ALC</span>
            <strong>Visão operacional</strong>
          </div>
          <span className="preview-pill">Dados consolidados</span>
        </div>
        <div className="metric-grid">
          {["PNR", "Pré-faturamento", "Conciliação", "Qualidade"].map((label) => (
            <div className="metric-card" key={label}>
              <span>{label}</span>
              <strong>Visão integrada</strong>
              <small>Monitoramento contínuo</small>
            </div>
          ))}
        </div>
        <div className="preview-charts">
          <div className="line-chart-card">
            <div className="chart-heading">
              <span>Evolução operacional</span>
              <span className="chart-legend">Indicadores</span>
            </div>
            <svg viewBox="0 0 420 150" role="img" aria-label="Gráfico ilustrativo de evolução operacional">
              <path d="M10 126 C 58 106, 76 66, 118 78 S 178 118, 218 72 S 288 44, 330 62 S 382 38, 410 30" />
              <path className="secondary-line" d="M10 138 C 52 126, 84 96, 122 104 S 182 130, 220 102 S 280 82, 326 94 S 376 68, 410 72" />
            </svg>
          </div>
          <div className="status-card">
            <span>Status dos fluxos</span>
            <div className="donut" aria-hidden="true" />
            <div className="status-list">
              <span><i className="status-dot status-dot-success" /> Validado</span>
              <span><i className="status-dot status-dot-progress" /> Em análise</span>
              <span><i className="status-dot status-dot-neutral" /> Monitorado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlcSitePreview() {
  return (
    <div className="product-preview site-preview">
      <Image
        src="https://raw.githubusercontent.com/ofmrmatte/ALC-Pereira-Filho-Transportes/main/assets/images/frota/alc-frota-operacao.jpg"
        alt="Frota da ALC Pereira Filho Transportes em operação"
        fill
        sizes="(max-width: 900px) 100vw, 33vw"
      />
      <div className="site-preview-overlay">
        <span className="site-preview-brand">ALC</span>
        <div>
          <span>Transporte e logística</span>
          <strong>Operação apresentada com mais clareza.</strong>
        </div>
      </div>
    </div>
  );
}

function MlddsPreview() {
  return (
    <div className="product-preview mldds-preview" aria-label="Representação visual do fluxo do MLDDS">
      <div className="mldds-window">
        <div className="mldds-titlebar">
          <span className="window-dot" />
          <span className="window-dot" />
          <span className="window-dot" />
          <strong>MLDDS · Operação</strong>
        </div>
        <div className="mldds-flow">
          {[
            ["01", "Captura", "Snapshot operacional"],
            ["02", "Regras", "Classificação e contexto"],
            ["03", "Roteirização", "Plano de execução"],
            ["04", "Validação", "Aplicar com segurança"]
          ].map(([step, title, text], index) => (
            <div className="flow-step" key={title}>
              <span className="flow-index">{step}</span>
              <div>
                <strong>{title}</strong>
                <small>{text}</small>
              </div>
              {index < 3 ? <ArrowRight size={18} weight="bold" className="flow-arrow" /> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectVisual({ type }: { type: (typeof projectCards)[number]["visual"] }) {
  if (type === "alc-site") return <AlcSitePreview />;
  if (type === "mldds") return <MlddsPreview />;
  return <IntelligencePreview />;
}

export default function Page() {
  return (
    <main className="site-shell">
      <PortfolioMotion />

      <header className="site-header">
        <div className="page-container nav-shell">
          <a className="brand" href="#top" aria-label="Voltar ao início">
            <BrandMark />
            <span>Matheus Ferreira Folgado</span>
          </a>

          <nav className="desktop-nav" aria-label="Navegação principal">
            {navItems.map(([label, href]) => (
              <a href={href} key={href}>{label}</a>
            ))}
          </nav>

          <Button asChild className="header-cta">
            <a href="mailto:matheus_frafou@outlook.com">
              Entrar em contato
              <EnvelopeSimple size={18} weight="bold" />
            </a>
          </Button>

          <details className="mobile-menu">
            <summary>Menu</summary>
            <nav className="mobile-panel" aria-label="Menu mobile">
              {navItems.map(([label, href]) => (
                <a href={href} key={href}>{label}</a>
              ))}
            </nav>
          </details>
        </div>
      </header>

      <section id="top" className="hero-section">
        <div className="page-container hero-grid">
          <div className="hero-copy" data-hero-copy>
            <span className="eyebrow">Gestão · Sistemas · Automação</span>
            <h1>
              Administração, sistemas e automação para <em>operações reais.</em>
            </h1>
            <p>
              Transformo processos, dados e tecnologia em soluções que geram eficiência operacional,
              reduzem retrabalho e apoiam decisões melhores.
            </p>
            <div className="hero-actions">
              <Button asChild size="lg">
                <a href="#projetos">
                  Ver projetos
                  <ArrowRight size={19} weight="bold" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="mailto:matheus_frafou@outlook.com">
                  <EnvelopeSimple size={19} />
                  Entrar em contato
                </a>
              </Button>
            </div>
          </div>

          <div className="hero-visual" data-hero-visual>
            <div className="hero-visual-glow" aria-hidden="true" />
            <IntelligencePreview />
            <div className="floating-panel floating-panel-top">
              <span>Regra de negócio</span>
              <strong>Dados → validação → decisão</strong>
            </div>
            <div className="floating-panel floating-panel-side">
              <span>Fluxos</span>
              <small><i className="status-dot status-dot-success" /> Validados</small>
              <small><i className="status-dot status-dot-progress" /> Em análise</small>
              <small><i className="status-dot status-dot-neutral" /> Monitorados</small>
            </div>
          </div>
        </div>
      </section>

      <section id="sobre" className="section section-compact">
        <div className="page-container">
          <Card className="about-card" data-reveal>
            <CardContent className="about-card-content">
              <div className="about-heading">
                <span className="icon-badge"><UserCircle size={26} weight="regular" /></span>
                <div>
                  <span className="section-label">Sobre mim</span>
                  <h2>Perfil</h2>
                </div>
              </div>
              <p>
                Sou Matheus Ferreira Folgado, administrador que atua na interseção entre operação e tecnologia.
                Transformo rotinas, dados e regras de negócio em sistemas e automações que reduzem retrabalho
                e tornam decisões mais claras.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="projetos" className="section">
        <div className="page-container">
          <div className="section-heading" data-reveal>
            <div>
              <span className="section-label">Projetos em destaque</span>
              <h2>Soluções que geram impacto operacional</h2>
            </div>
            <a className="text-link" href="https://github.com/ofmrmatte" target="_blank" rel="noreferrer">
              Ver GitHub
              <ArrowRight size={17} weight="bold" />
            </a>
          </div>

          <div className="projects-grid">
            {projectCards.map((project) => (
              <Card className="project-card" key={project.name} data-reveal data-project-card>
                <div className="project-media">
                  <ProjectVisual type={project.visual} />
                </div>
                <CardContent className="project-content">
                  <span className="project-eyebrow">{project.eyebrow}</span>
                  <div className="project-title-row">
                    <h3>{project.name}</h3>
                    <a href={project.href} target="_blank" rel="noreferrer" aria-label={`${project.action}: ${project.name}`}>
                      <ArrowUpRight size={20} weight="bold" />
                    </a>
                  </div>
                  <p>{project.description}</p>
                  <a className="project-link" href={project.href} target="_blank" rel="noreferrer">
                    {project.action}
                    <ArrowRight size={16} weight="bold" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="competencias" className="section skills-section">
        <div className="page-container">
          <div className="section-heading" data-reveal>
            <div>
              <span className="section-label">Como gero valor</span>
              <h2>Competências que conectam estratégia e execução</h2>
            </div>
          </div>

          <div className="competency-grid">
            {competencies.map(({ title, text, Icon }) => (
              <Card className="competency-card" key={title} data-reveal>
                <CardContent className="competency-content">
                  <span className="icon-badge icon-badge-large">
                    <Icon size={30} weight="regular" />
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="formacao" className="section formation-section">
        <div className="page-container">
          <div className="section-heading formation-heading" data-reveal>
            <div>
              <span className="section-label">Formação</span>
              <h2>Gestão com aprofundamento técnico</h2>
            </div>
          </div>
          <div className="formation-grid">
            <Card className="formation-card" data-reveal>
              <CardContent>
                <span>Gestão e negócios</span>
                <h3>Bacharel em Administração</h3>
                <strong>Centro Universitário FAM</strong>
                <p>Gestão, processos, estratégia, análise operacional e tomada de decisão.</p>
              </CardContent>
            </Card>
            <Card className="formation-card" data-reveal>
              <CardContent>
                <span>Tecnologia e produto digital</span>
                <h3>Pós-Graduação em Desenvolvimento Full Stack</h3>
                <strong>PUC Minas</strong>
                <p>Arquitetura, aplicações, APIs, bancos de dados e integração de sistemas.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer id="contato" className="site-footer">
        <div className="page-container footer-shell">
          <div className="footer-brand">
            <div className="brand">
              <BrandMark />
              <span>Matheus Ferreira Folgado</span>
            </div>
            <p>Transformo processos em soluções e dados em resultados.</p>
          </div>

          <nav className="footer-links" aria-label="Contato e redes">
            <Button asChild variant="outline">
              <a href="https://linkedin.com/in/mrmatte" target="_blank" rel="noreferrer">
                <LinkedinLogo size={18} weight="fill" />
                LinkedIn
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="https://github.com/ofmrmatte" target="_blank" rel="noreferrer">
                <GithubLogo size={18} weight="fill" />
                GitHub
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="mailto:matheus_frafou@outlook.com">
                <EnvelopeSimple size={18} />
                E-mail
              </a>
            </Button>
          </nav>

          <div className="footer-bottom">
            <span>© 2026 Matheus Ferreira Folgado.</span>
            <span>Administração · Sistemas · Automação</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
