import Image from "next/image";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Brain,
  Briefcase,
  CheckCircle,
  Code,
  Database,
  EnvelopeSimple,
  GithubLogo,
  GitBranch,
  GraduationCap,
  LinkedinLogo,
  Robot,
  ShieldCheck,
  Stack
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { archiSubsystems, portfolioProjects } from "../lib/portfolio-data";
import { Reveal, ScrollProgress, SpotlightGrid } from "./components/ImmersiveEffects";
import { AtmosphericField } from "./components/AtmosphericField";

const navItems = [
  { href: "#sobre", label: "Sobre" },
  { href: "#projetos", label: "Projetos" },
  { href: "#competencias", label: "Competências" },
  { href: "#formacao", label: "Formação" }
] as const;

const projectByName = (name: string) => {
  const project = portfolioProjects.find((item) => item.name === name);
  if (!project) throw new Error("Projeto não configurado: " + name);
  return project;
};

const archi = projectByName("ALC ARCHI");
const mldds = projectByName("MLDDS");
const alcSite = projectByName("Site ALC & Pereira Filho");

const capabilities = [
  {
    number: "01",
    icon: Briefcase,
    title: "Processos & requisitos",
    description: "Entender a operação, modelar regras de negócio e traduzir necessidades em escopos claros e verificáveis.",
    tags: ["Discovery", "Regras de negócio", "Processos"]
  },
  {
    number: "02",
    icon: Database,
    title: "Sistemas & integrações",
    description: "Conectar fluxos, dados, APIs e interfaces para construir ferramentas aderentes à realidade de quem opera.",
    tags: ["APIs", "PostgreSQL", "Integrações"]
  },
  {
    number: "03",
    icon: Robot,
    title: "Automação & IA",
    description: "Aplicar automação e IA no desenvolvimento e na melhoria de processos, com validação humana e foco em qualidade.",
    tags: ["Automação", "IA aplicada", "Qualidade"]
  }
] as const;

const education = [
  {
    type: "Graduação",
    degree: "Administração",
    place: "Centro Universitário FAM",
    detail: "Visão de negócio, estratégia, operações e melhoria contínua.",
    Icon: GraduationCap
  },
  {
    type: "Pós-graduação",
    degree: "Engenharia de Software",
    place: "Universidade de Uberaba · Uniube",
    detail: "Requisitos, arquitetura, processos, testes e qualidade de software.",
    Icon: Code
  },
  {
    type: "Pós-graduação",
    degree: "Inteligência Artificial para Devs",
    place: "Faculdade Unyleya",
    detail: "Machine Learning, NLP, engenharia de dados, GenAI e LLMs.",
    Icon: Brain
  }
] as const;

function Monogram() {
  return (
    <span className="monogram monogram-photo" aria-hidden="true">
      <Image
        src="https://avatars.githubusercontent.com/u/279118945?v=4&s=800"
        alt=""
        width={80}
        height={80}
        unoptimized
        className="monogram-avatar"
      />
      <i />
    </span>
  );
}

function SectionHeading({
  index,
  label,
  title,
  description
}: {
  index: string;
  label: string;
  title: string;
  description?: string;
}) {
  return (
    <Reveal className="section-heading">
      <div className="section-heading-copy">
        <div className="section-tag"><span>{index} /</span> {label}</div>
        <h2>{title}</h2>
      </div>
      {description ? <p>{description}</p> : null}
    </Reveal>
  );
}

function ArchitectureDisplay() {
  return (
    <div className="architecture-visual" role="img" aria-label="Diagrama conceitual do ARCHI conectando os subsistemas da ALC">
      <div className="architecture-grid" aria-hidden="true" />
      <div className="architecture-ring ring-outer" aria-hidden="true" />
      <div className="architecture-ring ring-middle" aria-hidden="true" />
      <div className="architecture-ring ring-inner" aria-hidden="true" />
      <span className="architecture-small-label">ECOSSISTEMA ALC / VISTA CONCEITUAL</span>
      <div className="architecture-line architecture-line-one" aria-hidden="true" />
      <div className="architecture-line architecture-line-two" aria-hidden="true" />
      <div className="architecture-line architecture-line-three" aria-hidden="true" />
      <div className="architecture-line architecture-line-four" aria-hidden="true" />
      <div className="architecture-core">
        <div className="core-icon"><Stack size={25} weight="duotone" /></div>
        <strong>ARCHI</strong>
        <span>CENTRAL ALC</span>
      </div>
      <span className="architecture-node architecture-node-top"><i /> Administrativo</span>
      <span className="architecture-node architecture-node-right"><i /> Financeiro</span>
      <span className="architecture-node architecture-node-left"><i /> Prevenção</span>
      <span className="architecture-node architecture-node-bottom"><i /> Atendimento</span>
      <span className="architecture-footnote">IDENTIDADE • SETORES • INTEGRAÇÕES</span>
    </div>
  );
}

function SystemPreview() {
  return (
    <div className="system-preview system-preview-real">
      <Image
        src="/projects/mldds.png"
        alt="Captura da interface real do sistema desktop de roteirização MLDDS"
        fill
        sizes="(max-width: 650px) 100vw, 50vw"
        className="mldds-real-screenshot"
      />
      <div className="mldds-image-shade" aria-hidden="true" />
      <span className="actual-screenshot-tag"><span /> INTERFACE REAL / MLDDS</span>
    </div>
  );
}

function StackTags({ items }: { items: readonly string[] }) {
  return <div className="stack-tags">{items.map((item) => <span key={item}>{item}</span>)}</div>;
}

export default function Page() {
  return (
    <main id="top" className="site-shell">
      <AtmosphericField />
      <ScrollProgress />

      <header className="site-header">
        <div className="container navbar">
          <a href="#top" className="brand" aria-label="Matheus Ferreira Folgado — voltar ao início">
            <Monogram />
            <span className="brand-label"><strong>Matheus Ferreira</strong><small>FOLGADO / PORTFÓLIO</small></span>
          </a>
          <nav className="desktop-nav" aria-label="Navegação principal">
            {navItems.map(({ href, label }) => <a href={href} key={href}>{label}</a>)}
          </nav>
          <Button asChild className="nav-cta" size="default">
            <a href="mailto:matheus_frafou@outlook.com">Vamos conversar <ArrowUpRight size={17} /></a>
          </Button>
          <details className="mobile-nav">
            <summary aria-label="Abrir menu de navegação"><span /><span /><span /></summary>
            <nav aria-label="Navegação mobile">
              {navItems.map(({ href, label }) => <a href={href} key={href}>{label}</a>)}
              <a href="mailto:matheus_frafou@outlook.com">Entrar em contato</a>
            </nav>
          </details>
        </div>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero-inner">
          <div className="hero-content">
            <div className="hero-kicker"><span className="pulse-dot" /> SISTEMAS / PROCESSOS / IA APLICADA</div>
            <div className="hero-eyebrow-hint"><span>✦</span> FUNDO VIVO · PROFUNDIDADE INTERATIVA</div>
            <h1 id="hero-title">Tecnologia com <span className="hero-italic">visão de negócio.</span><br />Resultado com <span className="hero-highlight">propósito.</span></h1>
            <p className="hero-description">Transformo necessidades operacionais em sistemas, automações e experiências digitais. Da regra de negócio à validação da solução — conectando processos, dados e engenharia de software.</p>
            <div className="hero-actions">
              <Button asChild size="lg" className="btn-primary"><a href="#projetos">Explorar projetos <ArrowUpRight size={19} weight="bold" /></a></Button>
              <Button asChild size="lg" variant="outline" className="btn-secondary"><a href="#sobre">Conheça minha atuação <ArrowDown size={19} /></a></Button>
            </div>
            <div className="hero-credibility">
              <span className="micro-line" />
              <span>REQUISITOS</span><i /><span>SOFTWARE</span><i /><span>AUTOMAÇÃO</span><i /><span>IA</span>
            </div>
          </div>

          <div className="hero-art hero-portrait-art" aria-label="Retrato profissional e representação visual da atuação">
            <div className="portrait-light-trail" aria-hidden="true" />
            <div className="portrait-orbit portrait-orbit-one" aria-hidden="true" />
            <div className="portrait-orbit portrait-orbit-two" aria-hidden="true" />
            <div className="hero-portrait-frame">
              <div className="photo-fallback" aria-hidden="true">MF</div>
              <Image
                src="https://avatars.githubusercontent.com/u/279118945?v=4&s=800"
                alt="Foto de perfil de Matheus Ferreira Folgado"
                fill
                priority
                unoptimized
                sizes="(max-width: 900px) 76vw, 400px"
                className="hero-portrait-image"
              />
              <div className="hero-portrait-shade" />
              <div className="hero-portrait-top"><span className="portrait-live-dot" /> PERFIL / ENGENHARIA & IA</div>
              <div className="hero-portrait-text">
                <span>ENTRE PROCESSOS E TECNOLOGIA</span>
                <strong>Matheus Ferreira<br />Folgado.</strong>
                <div className="portrait-bottom-line"><span>PRODUTO · REQUISITOS · AUTOMAÇÃO</span><ArrowUpRight size={20} /></div>
              </div>
            </div>
            <div className="hero-stage-card portrait-workflow-panel">
              <div className="hero-stage-topline"><span className="stage-led" /> DO CONTEXTO À SOLUÇÃO <GitBranch size={17} /></div>
              <div className="portrait-workflow-headline">Entender. Construir. <em>Validar.</em></div>
              <div className="portrait-workflow-stages">
                <span>01 <strong>REQUISITOS</strong></span>
                <ArrowRight size={14} />
                <span>02 <strong>SOFTWARE</strong></span>
                <ArrowRight size={14} />
                <span>03 <strong>QUALIDADE</strong></span>
              </div>
            </div>
            <div className="float-note float-note-b"><span className="float-icon"><Code size={17} /></span><div><small>ATUAÇÃO</small><strong>Sistemas & IA aplicada</strong></div></div>
          </div>
        </div>
        <div className="container hero-bottom"><span>ESTRATÉGIA ENCONTRA EXECUÇÃO</span><a href="#projetos" aria-label="Rolar para projetos"><span>ROLE PARA EXPLORAR</span><ArrowDown size={16} /></a></div>
      </section>

      <div className="container"><div className="horizon-divider" aria-hidden="true"><i /><span>01 · MEU CAMPO DE ATUAÇÃO</span><i /></div></div>

      <section id="sobre" className="section section-about">
        <div className="container about-layout">
          <Reveal className="about-heading">
            <div className="section-tag"><span>01 /</span> QUEM SOU</div>
            <h2>Visão de operação.<br /><em>Mentalidade de produto.</em></h2>
            <div className="about-portrait-signature">
              <div className="about-portrait-mini">
                <Image
                  src="https://avatars.githubusercontent.com/u/279118945?v=4&s=800"
                  alt="Foto de Matheus Ferreira Folgado"
                  fill
                  sizes="96px"
                  unoptimized
                />
              </div>
              <div><strong>Matheus Ferreira Folgado</strong><span>NEGÓCIO + DESENVOLVIMENTO + IA</span></div>
            </div>
          </Reveal>
          <Reveal className="about-right" delay={0.1}>
            <div className="about-overline"><span className="dot-square" /> SOBRE MINHA ATUAÇÃO</div>
            <p>Sou <strong>Matheus Ferreira Folgado</strong>, administrador com atuação em sistemas e automação e formação continuada em Engenharia de Software e Inteligência Artificial.</p>
            <p>Meu trabalho conecta o entendimento de processos reais à definição de requisitos, regras de negócio, desenho de fluxos, testes e evolução de produtos digitais. Utilizo IA como apoio técnico ao desenvolvimento, sempre com revisão e validação das entregas.</p>
            <div className="about-pill-row"><span>Operações</span><span>Engenharia de Software</span><span>IA aplicada</span></div>
          </Reveal>
        </div>
      </section>

      <section id="projetos" className="section section-projects">
        <div className="container">
          <SectionHeading index="02" label="TRABALHOS SELECIONADOS" title="Projetos que saíram do contexto e viraram solução." description="Sistemas concebidos para operações e necessidades concretas. Explore a arquitetura, os fluxos e as tecnologias envolvidas." />
          <SpotlightGrid className="showcase-grid">
            <Reveal className="showcase-feature">
              <Card className="showcase-card showcase-archi" data-spotlight-card>
                <div className="showcase-feature-upper">
                  <CardContent className="showcase-copy">
                    <div className="showcase-number"><span>PROJETO 01</span><span className="project-kind"><i /> PLATAFORMA CORPORATIVA</span></div>
                    <span className="showcase-small-kicker">SISTEMA / GOVERNANÇA / INTEGRAÇÕES</span>
                    <h3>ALC <em>ARCHI</em></h3>
                    <p>{archi.description}</p>
                    <div className="showcase-detail"><Stack size={19} /><span>Ecossistema corporativo com <strong>{archiSubsystems.length} áreas e subsistemas</strong>.</span></div>
                    <StackTags items={archi.stack} />
                  </CardContent>
                  <ArchitectureDisplay />
                </div>
                <details className="archi-more">
                  <summary><span><span className="archi-summary-icon">+</span> Ver mais sobre os subsistemas do ARCHI</span><ArrowDown size={19} weight="bold" /></summary>
                  <div className="archi-expanded">
                    <div className="archi-expanded-intro"><span>ARQUITETURA / ECOSSISTEMA ALC</span><p>Prevenção de Perdas e Atendimento fazem parte dos subsistemas do ARCHI, embora preservem serviços próprios. A centralização do acesso está sendo homologada. Os demais módulos também apresentam diferentes estágios de implantação.</p></div>
                    <div className="archi-modules">
                      {archiSubsystems.map((subsystem, index) => (
                        <article className="archi-module" key={subsystem.name}>
                          <div className="archi-module-index">{String(index + 1).padStart(2, "0")} <span>·</span> {subsystem.status}</div>
                          <h4>{subsystem.name}</h4>
                          <p>{subsystem.description}</p>
                        </article>
                      ))}
                    </div>
                  </div>
                </details>
              </Card>
            </Reveal>

            <Reveal className="showcase-half" delay={0.06}>
              <Card className="showcase-card showcase-secondary" data-spotlight-card>
                <SystemPreview />
                <CardContent className="showcase-secondary-copy">
                  <div className="showcase-number"><span>PROJETO 02</span><span>DESKTOP / LOGÍSTICA</span></div>
                  <h3>MLDDS</h3>
                  <p>{mldds.description}</p>
                  <StackTags items={mldds.stack} />
                </CardContent>
              </Card>
            </Reveal>
            <Reveal className="showcase-half" delay={0.12}>
              <Card className="showcase-card showcase-secondary" data-spotlight-card>
                <div className="alc-preview">
                  <Image
                    src="https://raw.githubusercontent.com/ofmrmatte/ALC-Pereira-Filho-Transportes/main/assets/images/frota/alc-frota-operacao.jpg"
                    alt="Frota da ALC & Pereira Filho Transportes em operação"
                    fill
                    sizes="(max-width: 850px) 100vw, 50vw"
                  />
                  <div className="alc-photo-shade" />
                  <div className="alc-preview-label"><span>ALC & PEREIRA FILHO</span><strong>Logística em movimento.</strong></div>
                </div>
                <CardContent className="showcase-secondary-copy">
                  <div className="showcase-number"><span>PROJETO 03</span><span>WEB / INSTITUCIONAL</span></div>
                  <h3>ALC & Pereira Filho</h3>
                  <p>{alcSite.description}</p>
                  <StackTags items={alcSite.stack} />
                </CardContent>
              </Card>
            </Reveal>
          </SpotlightGrid>
        </div>
      </section>

      <section id="competencias" className="section section-expertise">
        <div className="container">
          <SectionHeading index="03" label="COMPETÊNCIAS" title="Tecnologia é meio. Resolver é o objetivo." description="Minha atuação percorre o problema, a solução e a validação — com entendimento das restrições e da rotina operacional." />
          <SpotlightGrid className="expertise-grid">
            {capabilities.map(({ number, icon: Icon, title, description, tags }, index) => (
              <Reveal key={title} delay={index * 0.08}>
                <Card className="expertise-card" data-spotlight-card>
                  <CardContent>
                    <div className="expertise-top"><span>{number}</span><span className="expertise-icon"><Icon size={25} weight="duotone" /></span></div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                    <div className="expertise-tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                    <div className="expertise-bottom"><span>ATUAÇÃO</span><span className="expertise-rule" /></div>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </SpotlightGrid>
        </div>
      </section>

      <section id="formacao" className="section section-education">
        <div className="container">
          <SectionHeading index="04" label="JORNADA ACADÊMICA" title="Uma base de gestão. Uma direção em tecnologia." description="Formações complementares que aproximam estratégia, engenharia de software e inteligência artificial aplicada." />
          <div className="education-grid">
            {education.map(({ type, degree, place, detail, Icon }, index) => (
              <Reveal key={degree} delay={index * 0.08}>
                <div className="education-card">
                  <div className="education-top"><span>0{index + 1} / {type.toUpperCase()}</span><Icon size={24} weight="duotone" /></div>
                  <div><h3>{degree}</h3><strong>{place}</strong><p>{detail}</p></div>
                  <span className="education-bottom">FORMAÇÃO CONTINUADA <span>↗</span></span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <footer id="contato" className="footer">
        <div className="container">
          <Reveal className="footer-cta">
            <div className="section-tag"><span>05 /</span> CONTATO</div>
            <h2>Tem um desafio<br />para <em>resolver?</em></h2>
            <p>Vamos conversar sobre sistemas, automações ou soluções que facilitem a rotina de uma operação.</p>
            <Button asChild size="lg" className="btn-primary btn-footer"><a href="mailto:matheus_frafou@outlook.com">Entre em contato <ArrowUpRight size={20} weight="bold" /></a></Button>
            <div className="footer-graphic" aria-hidden="true"><span /><span /><span /></div>
          </Reveal>
          <div className="footer-bottom">
            <a href="#top" className="footer-brand"><Monogram /><span><strong>Matheus Ferreira Folgado</strong><small>PROCESSOS. SOFTWARE. PROPÓSITO.</small></span></a>
            <div className="social-links">
              <a href="https://linkedin.com/in/mrmatte" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><LinkedinLogo size={20} /></a>
              <a href="https://github.com/ofmrmatte" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><GithubLogo size={20} /></a>
              <a href="mailto:matheus_frafou@outlook.com" aria-label="Enviar e-mail"><EnvelopeSimple size={20} /></a>
            </div>
            <small>© 2026 · Desenvolvido com foco em experiência e clareza.</small>
          </div>
        </div>
      </footer>
    </main>
  );
}
