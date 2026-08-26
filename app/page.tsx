import Image from "next/image";
import type { CSSProperties } from "react";
import { OrbField } from "./components/OrbField";

const navItems = ["Sobre", "Projetos", "Competências", "Formação", "Contato"];

const heroImage = {
  src:
    process.env.NEXT_PUBLIC_HERO_IMAGE_URL ||
    "https://xakeaewgrcieufmxbfvs.supabase.co/storage/v1/object/public/portfolio-assets/matheus/hero.webp",
  width: 1600,
  height: 1066,
  alt: "Matheus Ferreira usando camisa cinza ajustando a gola"
};

const portraitImage = {
  src:
    process.env.NEXT_PUBLIC_PORTRAIT_IMAGE_URL ||
    "https://xakeaewgrcieufmxbfvs.supabase.co/storage/v1/object/public/portfolio-assets/matheus/portrait.webp",
  width: 1394,
  height: 1394,
  alt: "Matheus Ferreira usando camisa branca sorrindo próximo a plantas"
};

const projects = [
  {
    name: "Inteligência ALC",
    description:
      "Sistema web para consolidação e análise de dados operacionais, prevenção de perdas, PNR, pré-faturamento, indicadores, conciliação de IDs e gestão de motoristas.",
    tech: ["Next.js", "React", "TypeScript", "Supabase", "PostgreSQL", "Vercel"],
    colors: ["oklch(46% 0.12 205)", "oklch(61% 0.14 247)"]
  },
  {
    name: "Portal do Motorista",
    description:
      "Plataforma web/mobile/PWA para consulta de pendências, pagamentos, contestações, documentos e gestão administrativa de motoristas com controle de acesso e hierarquia.",
    tech: ["Next.js", "React", "TypeScript", "Supabase", "PWA", "Vercel"],
    colors: ["oklch(42% 0.1 183)", "oklch(67% 0.12 178)"]
  },
  {
    name: "MLDDS",
    description:
      "Automação de processos logísticos integrando aplicação desktop, extensão de navegador, tratamento de dados e regras de negócio.",
    tech: ["C#", ".NET 8", "WPF", "Chrome Extension", "JavaScript"],
    colors: ["oklch(35% 0.09 232)", "oklch(68% 0.105 71)"]
  }
];

const skills = [
  {
    title: "Gestão e Operações",
    items: [
      "Análise Operacional",
      "Gestão de Processos",
      "Prevenção de Perdas",
      "KPIs",
      "Análise de Dados",
      "Relatórios Gerenciais",
      "Pré-faturamento",
      "Melhoria de Processos"
    ]
  },
  {
    title: "Sistemas, Automação e IA",
    items: [
      "Desenvolvimento assistido por IA",
      "Automação de Processos",
      "Levantamento de Requisitos",
      "Regras de Negócio",
      "Testes Funcionais",
      "Validação de Software",
      "Integração de Sistemas",
      "APIs REST",
      "Git/GitHub"
    ]
  },
  {
    title: "Tecnologias em Projetos",
    items: [
      "TypeScript",
      "JavaScript",
      "React",
      "Next.js",
      "Node.js",
      "C#",
      ".NET",
      "SQL",
      "PostgreSQL",
      "Supabase",
      "HTML/CSS",
      "Vercel"
    ]
  }
];

function anchor(label: string) {
  return `#${label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
}

export default function Page() {
  return (
    <main className="site-shell">
      <OrbField />
      <header className="site-header">
        <div className="nav-wrap">
          <a className="brand" href="#top" aria-label="Ir para o início">
            <span>Matheus Ferreira Folgado</span>
          </a>
          <nav className="desktop-nav" aria-label="Seções principais">
            {navItems.map((item) => (
              <a href={anchor(item)} key={item}>
                {item}
              </a>
            ))}
          </nav>
          <nav className="social-nav" aria-label="Links externos">
            <a href="https://github.com/ofmrmatte" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href="https://linkedin.com/in/mrmatte" target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          </nav>
          <details className="mobile-menu">
            <summary>Menu</summary>
            <nav className="mobile-panel" aria-label="Menu mobile">
              {navItems.map((item) => (
                <a href={anchor(item)} key={item}>
                  {item}
                </a>
              ))}
              <a href="https://github.com/ofmrmatte" target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a href="https://linkedin.com/in/mrmatte" target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            </nav>
          </details>
        </div>
      </header>

      <section id="top" className="hero">
        <div className="section-inner hero-grid">
          <div className="hero-copy">
            <h1>Matheus Ferreira Folgado</h1>
            <div className="actions">
              <a className="btn btn-primary" href="#projetos">
                Ver projetos
              </a>
              <a className="btn btn-secondary" href="https://github.com/ofmrmatte" target="_blank" rel="noreferrer">
                GitHub
              </a>
            </div>
            <div className="signal-panel" aria-label="Fluxo de atuação">
              <span>$ mapear_operacao --dados --processos</span>
              <span>$ validar_regras --falhas --evidencias</span>
              <span>$ automatizar_rotina --controle --escala</span>
            </div>
          </div>
          <div className="hero-photo-wrap">
            <figure className="hero-photo">
              <Image src={heroImage.src} alt={heroImage.alt} width={heroImage.width} height={heroImage.height} preload sizes="(max-width: 980px) 100vw, 45vw" />
            </figure>
          </div>
        </div>
      </section>

      <section id="sobre" className="section">
        <div className="section-inner about-grid">
          <figure className="portrait-photo">
            <Image src={portraitImage.src} alt={portraitImage.alt} width={portraitImage.width} height={portraitImage.height} sizes="(max-width: 980px) 100vw, 35vw" />
          </figure>
          <div className="hero-copy">
            <span className="kicker">Sobre</span>
            <h2>Negócio primeiro. Tecnologia onde faz sentido.</h2>
            <p>
              Minha atuação conecta processos, análise operacional, tecnologia, automação, desenvolvimento de sistemas e
              melhoria contínua. O foco é transformar rotina administrativa e logística em fluxos mais claros,
              rastreáveis e fáceis de validar.
            </p>
            <div className="pill-row">
              <span className="pill">Gestão</span>
              <span className="pill">Sistemas</span>
              <span className="pill">Automação</span>
            </div>
          </div>
        </div>
      </section>

      <section id="projetos" className="section">
        <div className="section-inner">
          <div className="section-head">
            <h2>Projetos principais</h2>
            <p>
              Sistemas e automações com foco em operação, dados, controle administrativo e validação de regras de negócio.
            </p>
          </div>
          <div className="projects-grid">
            {projects.map((project) => (
              <article className="project-card" key={project.name}>
                <div
                  className="project-visual"
                  style={{
                    "--project-a": project.colors[0],
                    "--project-b": project.colors[1]
                  } as CSSProperties}
                  aria-hidden="true"
                >
                  <div className="project-lines">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
                <h3>{project.name}</h3>
                <p>{project.description}</p>
                <div className="tag-list" aria-label={`Tecnologias do projeto ${project.name}`}>
                  {project.tech.map((tech) => (
                    <span className="tag" key={tech}>
                      {tech}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="competencias" className="section">
        <div className="section-inner">
          <div className="section-head">
            <h2>Competências</h2>
            <p>Organizadas por aplicação prática, sem percentuais artificiais ou níveis inventados.</p>
          </div>
          <div className="skills-grid">
            {skills.map((group) => (
              <article className="skill-group" key={group.title}>
                <h3>{group.title}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="formacao" className="section">
        <div className="section-inner">
          <div className="section-head">
            <h2>Formação</h2>
            <p>Base em administração e formação técnica voltada à construção de aplicações full stack.</p>
          </div>
          <div className="education-list">
            <article className="education-item">
              <div>
                <strong>Bacharel em Administração</strong>
                <p>Centro Universitário FAM</p>
                <span>02/2022 – 06/2026</span>
              </div>
              <span className="status">Concluído</span>
            </article>
            <article className="education-item">
              <div>
                <strong>Pós-Graduação Lato Sensu em Desenvolvimento Full Stack</strong>
                <p>PUC Minas</p>
                <span>Início previsto: 09/2026</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="contato" className="section">
        <div className="section-inner">
          <div className="contact-panel">
            <div>
              <span className="kicker">Contato</span>
              <h2>Vamos conectar operação, dados e automação.</h2>
              <div className="contact-links">
                <a href="https://linkedin.com/in/mrmatte" target="_blank" rel="noreferrer">
                  LinkedIn <span>linkedin.com/in/mrmatte</span>
                </a>
                <a href="https://github.com/ofmrmatte" target="_blank" rel="noreferrer">
                  GitHub <span>github.com/ofmrmatte</span>
                </a>
                <a href="mailto:matheus_frafou@outlook.com">
                  E-mail <span>matheus_frafou@outlook.com</span>
                </a>
              </div>
            </div>
            <figure className="portrait-photo">
              <Image src={portraitImage.src} alt={portraitImage.alt} width={portraitImage.width} height={portraitImage.height} sizes="(max-width: 980px) 100vw, 28vw" />
            </figure>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="section-inner">© 2026 Matheus Ferreira Folgado. Administração, sistemas e automação.</div>
      </footer>
    </main>
  );
}
