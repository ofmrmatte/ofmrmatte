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
  Stack
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { archiSubsystems, portfolioProjects } from "../lib/portfolio-data";
import { Reveal, ScrollProgress, SpotlightGrid } from "./components/ImmersiveEffects";
import { KineticEmphasisTitle, KineticHeroTitle, KineticSectionTitle, ScrollSignature } from "./components/CinematicTypography";
import { PortfolioTypingText } from "./components/PortfolioTypingText";

const navItems = [
  { href: "#sobre", label: "Sobre" },
  { href: "#projetos", label: "Projetos" },
  { href: "#entregas", label: "Entregas" },
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
    description: "Explorar automações e IA no desenvolvimento e na melhoria de processos, com validação humana e critérios de qualidade.",
    tags: ["Automação", "IA aplicada", "Qualidade"]
  },
  {
    number: "04",
    icon: GitBranch,
    title: "Dados & integração",
    description: "Identificar informações necessárias, acompanhar integrações e apoiar a consistência dos dados que sustentam a operação.",
    tags: ["Fluxos de dados", "APIs", "Rastreabilidade"]
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

const archiGroups = [
  {
    name: "Núcleo e gestão",
    subtitle: "Identidade, governança e administração da operação",
    systems: ["Identidade e acessos", "Administrativo", "Recursos Humanos (RH)", "Financeiro", "Fiscal"]
  },
  {
    name: "Operação e controle",
    subtitle: "Áreas setoriais com implantação gradual",
    systems: ["Frotas", "Gerenciamento de Risco (GR)", "Monitoramento", "Operação", "Captação"]
  },
  {
    name: "Subsistemas conectados",
    subtitle: "Aplicações existentes com integração central em homologação",
    systems: ["Prevenção de Perdas", "Atendimento"]
  }
] as const;

const deliveryStages = [
  { number: "01", title: "Investigar", detail: "Escuta da operação e definição do problema" },
  { number: "02", title: "Estruturar", detail: "Fluxos, requisitos e regras de negócio" },
  { number: "03", title: "Implementar", detail: "Sistemas, integrações e automações" },
  { number: "04", title: "Validar", detail: "Testes, correções e melhoria contínua" }
] as const;

function Monogram() {
  return (
    <span className="monogram monogram-temporary" aria-hidden="true">
      <span className="monogram-temporary__letters">MF</span>
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
        <KineticSectionTitle text={title} />
      </div>
      {description ? <p>{description}</p> : null}
    </Reveal>
  );
}

function ArchiSymbol({ size = 52 }: { size?: number }) {
  return (
    <svg className="archi-symbol" width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="archi-symbol-gradient" x1="14" y1="16" x2="88" y2="90">
          <stop stopColor="#DAFFF1" />
          <stop offset="0.54" stopColor="#98F4DD" />
          <stop offset="1" stopColor="#6BACC9" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="40" stroke="url(#archi-symbol-gradient)" strokeOpacity=".32" strokeWidth="1.4" />
      <path d="M14 51a36 36 0 0 1 70-6" stroke="url(#archi-symbol-gradient)" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 77L49.5 23L75 77M36 58H63" stroke="url(#archi-symbol-gradient)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="83" cy="43" r="5.5" fill="#B5FFE7" />
      <circle cx="18" cy="70" r="3" fill="#6AD5CE" />
    </svg>
  );
}

function ArchitectureDisplay() {
  return (
    <div className="architecture-visual" role="img" aria-label="Diagrama conceitual do ARCHI conectando os subsistemas da ALC">
      <div className="architecture-ring ring-outer" aria-hidden="true" />
      <div className="architecture-ring ring-middle" aria-hidden="true" />
      <div className="architecture-ring ring-inner" aria-hidden="true" />
      <span className="architecture-small-label">ECOSSISTEMA ALC / VISTA CONCEITUAL</span>
      <div className="architecture-line architecture-line-one" aria-hidden="true" />
      <div className="architecture-line architecture-line-two" aria-hidden="true" />
      <div className="architecture-line architecture-line-three" aria-hidden="true" />
      <div className="architecture-line architecture-line-four" aria-hidden="true" />
      <div className="architecture-core">
        <div className="core-icon"><ArchiSymbol size={72} /></div>
        <strong>ARCHI</strong>
        <span>CENTRAL ALC</span>
      </div>
      <span className="architecture-node architecture-node-top"><i /> Administrativo</span>
      <span className="architecture-node architecture-node-right"><i /> Financeiro</span>
      <span className="architecture-node architecture-node-left"><i /> Prevenção</span>
      <span className="architecture-node architecture-node-bottom"><i /> Atendimento</span>
      <span className="architecture-footnote">GOVERNANÇA • MODULARIDADE • ACESSO</span>
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
      <ScrollProgress />

      <header className="site-header">
        <div className="container navbar">
          <a href="#top" className="brand" aria-label="Matheus Ferreira Folgado — voltar ao início">
            <Monogram />
            <span className="brand-label"><strong>Matheus Ferreira Folgado</strong><small>PORTFÓLIO / SISTEMAS & IA</small></span>
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
            <div className="hero-eyebrow-hint"><span>✦</span> PROJETOS REAIS · SOLUÇÕES DIGITAIS</div>
            <KineticHeroTitle />
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

          <div className="hero-editorial" aria-hidden="true">
            <div className="hero-editorial__eyebrow">
              <span>PORTFÓLIO PESSOAL</span>
              <span>2026 / 01</span>
            </div>
            <div className="hero-editorial__light-veil" />
            <div className="hero-editorial__monogram">MF<span className="hero-editorial__period">.</span></div>
            <div className="hero-editorial__line" />
            <div className="hero-editorial__foot">
              <span>GESTÃO &amp; SOFTWARE</span>
              <span>PROCESSOS · AUTOMAÇÃO · IA</span>
            </div>
          </div>
        </div>
        <div className="container hero-bottom"><span>ESTRATÉGIA ENCONTRA EXECUÇÃO</span><a href="#projetos" aria-label="Rolar para projetos"><span>ROLE PARA EXPLORAR</span><ArrowDown size={16} /></a></div>
      </section>

      <ScrollSignature />
      <div className="container"><div className="horizon-divider" aria-hidden="true"><i /><span>01 · MEU CAMPO DE ATUAÇÃO</span><i /></div></div>

      <section id="sobre" className="section section-about">
        <div className="container about-layout">
          <Reveal className="about-heading">
            <div className="section-tag"><span>01 /</span> QUEM SOU</div>
            <KineticEmphasisTitle first="Visão de operação." second="Mentalidade de produto." />
            <div className="about-portrait-signature">
              <div className="about-portrait-mini" aria-hidden="true">
                <span className="about-portrait-mini__letters">MF</span>
              </div>
              <div><strong>Matheus Ferreira Folgado</strong><span>ADMINISTRAÇÃO · SOFTWARE · AUTOMAÇÃO</span></div>
            </div>
            <div className="about-credential">
              <span>BACHAREL EM ADMINISTRAÇÃO</span>
              <strong>Centro Universitário FAM · 2026</strong>
            </div>
          </Reveal>
          <Reveal className="about-right" delay={0.1}>
            <div className="about-overline"><span className="dot-square" /> PERFIL PROFISSIONAL</div>
            <PortfolioTypingText text="Entender a operação." highlight="Construir a solução." />
            <p className="about-lead">Sou <strong>administrador formado pela FAM</strong>, com experiência em gestão administrativa, atendimento, operações logísticas e desenvolvimento de soluções digitais. Minha atuação combina conhecimento dos processos reais com requisitos, automação e engenharia de software.</p>
            <p>Atualmente trabalho na <strong>ALC &amp; Pereira Filho Transportes</strong>, em administração e operações: prevenção de perdas, PNRs, pré-faturamento, rotas, motoristas e indicadores. Também participo da criação e evolução de sistemas internos, dashboards e integrações que apoiam essas rotinas.</p>
            <p>Desenvolvo com <strong>React, Next.js, TypeScript, Node.js, C#/.NET e PostgreSQL</strong>, utilizando IA como apoio ao desenvolvimento, à revisão e aos testes. Sigo em formação continuada nas áreas de Engenharia de Software e Inteligência Artificial para Devs.</p>
            <div className="about-pill-row" aria-label="Áreas de atuação"><span>Processos &amp; requisitos</span><span>Sistemas &amp; integrações</span><span>Automação &amp; IA</span></div>
          </Reveal>
        </div>
        <div className="container">
          <Reveal className="about-career">
            <div className="about-career-intro">
              <span className="section-tag"><span>01.1 /</span> EXPERIÊNCIA</span>
              <h3>Uma trajetória entre atendimento, operação e tecnologia.</h3>
            </div>
            <div className="about-career-list">
              <div className="about-career-row">
                <span className="about-career-date">02/2026 — ATUAL</span>
                <div><strong>ALC &amp; Pereira Filho Transportes</strong><span>Auxiliar Administrativo I · Sistemas, Automação e Operações</span></div>
              </div>
              <div className="about-career-row">
                <span className="about-career-date">06/2025 — 01/2026</span>
                <div><strong>Área Azul</strong><span>Assistente de Atendimento</span></div>
              </div>
              <div className="about-career-row">
                <span className="about-career-date">10/2022 — 10/2024</span>
                <div><strong>Prefeitura de São Sebastião</strong><span>Estágio Administrativo</span></div>
              </div>
            </div>
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
                    <h3 className="archi-project-heading"><ArchiSymbol size={50} /> ALC <em>ARCHI</em></h3>
                    <p>{archi.description}</p>
                    <div className="showcase-detail"><ArchiSymbol size={23} /><span>Um ecossistema, <strong>{archiSubsystems.length} áreas e subsistemas</strong> com papéis independentes.</span></div>
                    <StackTags items={archi.stack} />
                  </CardContent>
                  <ArchitectureDisplay />
                </div>
                <details className="archi-more">
                  <summary><span><span className="archi-summary-icon">+</span> Ver mais sobre os subsistemas do ARCHI</span><ArrowDown size={19} weight="bold" /></summary>
                  <div className="archi-expanded">
                    <div className="archi-expanded-intro">
                      <span>ARQUITETURA / ECOSSISTEMA ALC</span>
                      <p>O ARCHI é a porta de entrada e camada de identidade do ecossistema. Cada área tem responsabilidades próprias: algumas estão operacionais, outras em implantação ou homologação. Prevenção de Perdas e Atendimento são subsistemas, não projetos independentes deste portfólio.</p>
                    </div>
                    {archiGroups.map((group, groupIndex) => (
                      <div className="archi-group" key={group.name}>
                        <div className="archi-group-heading">
                          <span>0{groupIndex + 1} / ÁREAS DO ECOSSISTEMA</span>
                          <h4>{group.name}</h4>
                          <p>{group.subtitle}</p>
                        </div>
                        <div className="archi-modules">
                          {archiSubsystems.filter((subsystem) => (group.systems as readonly string[]).includes(subsystem.name)).map((subsystem) => (
                            <article className="archi-module" key={subsystem.name}>
                              <span className="archi-module-index">{subsystem.status}</span>
                              <h5>{subsystem.name}</h5>
                              <p>{subsystem.description}</p>
                            </article>
                          ))}
                        </div>
                      </div>
                    ))}
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

      <section id="entregas" className="section section-delivery">
        <div className="container">
          <SectionHeading
            index="03"
            label="COMO TRANSFORMO PROCESSOS"
            title="Do problema operacional à solução validada."
            description="Não se trata de prometer números sem evidências. O valor está no método: compreender o contexto, construir com critério e acompanhar o resultado."
          />
          <Reveal className="delivery-intro">
            <div className="delivery-proof">
              <div className="delivery-proof-mark"><CheckCircle size={27} weight="duotone" /></div>
              <div><strong>Experiência aplicada à operação real</strong><p>Fluxos de PNR, roteirização, controles internos e comunicação operacional orientam as soluções apresentadas neste portfólio.</p></div>
            </div>
            <span className="delivery-proof-end">PROCESSOS → SISTEMAS → VALIDAÇÃO</span>
          </Reveal>
          <div className="delivery-track">
            {deliveryStages.map((stage, index) => (
              <Reveal key={stage.number} className="delivery-stage" delay={index * 0.07}>
                <div className="delivery-stage-heading"><span>{stage.number}</span>{index < deliveryStages.length - 1 ? <ArrowRight size={18} aria-hidden="true" /> : <CheckCircle size={18} weight="fill" aria-hidden="true" />}</div>
                <h3>{stage.title}</h3>
                <p>{stage.detail}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="competencias" className="section section-expertise">
        <div className="container">
          <SectionHeading index="04" label="COMPETÊNCIAS" title="Tecnologia é meio. Resolver é o objetivo." description="Minha atuação percorre o problema, a solução e a validação — com entendimento das restrições e da rotina operacional." />
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
          <SectionHeading index="05" label="JORNADA ACADÊMICA" title="Uma base de gestão. Uma direção em tecnologia." description="Formações complementares que aproximam estratégia, engenharia de software e inteligência artificial aplicada." />
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
            <div className="footer-cta-copy">
              <div className="section-tag"><span>06 /</span> CONTATO</div>
              <PortfolioTypingText small text="Projetos começam com um problema." highlight="Evoluem com método." />
              <KineticEmphasisTitle footer first="Seu desafio merece" second="uma solução à altura." />
              <p>Um processo difícil de executar ou uma ideia que precisa sair do papel? Posso contribuir com o entendimento da operação, estruturação de requisitos, automação e evolução de sistemas.</p>
              <div className="footer-actions">
                <Button asChild size="lg" className="btn-primary btn-footer"><a href="mailto:matheus_frafou@outlook.com?subject=Conversa%20sobre%20projeto">Vamos conversar <ArrowUpRight size={20} weight="bold" /></a></Button>
                <a className="footer-secondary-link" href="https://linkedin.com/in/mrmatte" target="_blank" rel="noopener noreferrer">Conheça meu LinkedIn <ArrowUpRight size={17} /></a>
              </div>
            </div>
            <div className="footer-editorial" aria-hidden="true">
              <span className="footer-editorial-eyebrow">VISÃO · EXECUÇÃO · VALIDAÇÃO</span>
              <strong>Digital<br />com visão<br /><em>de negócio.</em></strong>
              <span className="footer-editorial-rule" />
              <small>ENTRE O PROCESSO E A TECNOLOGIA</small>
            </div>
          </Reveal>
          <div className="footer-bottom">
            <a href="#top" className="footer-brand"><Monogram /><span><strong>Matheus Ferreira Folgado</strong><small>PORTFÓLIO · SISTEMAS & IA</small></span></a>
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
