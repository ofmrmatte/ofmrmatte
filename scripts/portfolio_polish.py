from pathlib import Path


def replace_exact(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 occurrence, found {count}")
    return text.replace(old, new)


page_path = Path("app/page.tsx")
page = page_path.read_text(encoding="utf-8")

old_education = '''          <div className="education-list">
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
          </div>'''
new_education = '''          <div className="education-list">
            <article className="education-item">
              <div className="education-copy">
                <strong>Bacharel em Administração</strong>
                <p className="education-school">Centro Universitário FAM</p>
                <p className="education-summary">
                  Formação em gestão, processos, estratégia e tomada de decisão, aplicada à leitura de operações e à
                  estruturação de soluções de negócio.
                </p>
              </div>
              <span className="status">Concluído</span>
            </article>
            <article className="education-item">
              <div className="education-copy">
                <strong>Pós-Graduação Lato Sensu em Desenvolvimento Full Stack</strong>
                <p className="education-school">PUC Minas</p>
                <p className="education-summary">
                  Aprofundamento em aplicações full stack, arquitetura, front-end, back-end, bancos de dados, APIs e
                  integração de sistemas para construção de soluções completas.
                </p>
              </div>
            </article>
          </div>'''
page = replace_exact(page, old_education, new_education, "education block")

old_contact = '''      <section id="contato" className="section">
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
      </footer>'''
new_contact = '''      <footer id="contato" className="site-footer">
        <div className="section-inner footer-shell">
          <div className="footer-copy">
            <span className="kicker">Contato</span>
            <h2>Vamos conectar operação, dados e automação.</h2>
            <p>Projetos, tecnologia aplicada ao negócio, automação e melhoria de processos.</p>
          </div>
          <nav className="footer-actions" aria-label="Links de contato">
            <a className="footer-link footer-link-primary" href="https://linkedin.com/in/mrmatte" target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <a className="footer-link" href="https://github.com/ofmrmatte" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a className="footer-link" href="mailto:matheus_frafou@outlook.com">
              E-mail
            </a>
          </nav>
          <div className="footer-meta">
            <span>© 2026 Matheus Ferreira Folgado</span>
            <span>Administração · Sistemas · Automação</span>
          </div>
        </div>
      </footer>'''
page = replace_exact(page, old_contact, new_contact, "contact/footer block")
page_path.write_text(page, encoding="utf-8")

css_path = Path("app/globals.css")
css = css_path.read_text(encoding="utf-8")
css = replace_exact(css, ".project-card,\n.skill-group,\n.education-item,\n.contact-panel {", ".project-card,\n.skill-group,\n.education-item {", "shared card selector")
css = replace_exact(css, ".project-card::before,\n.skill-group::before,\n.education-item::before,\n.contact-panel::before {", ".project-card::before,\n.skill-group::before,\n.education-item::before {", "shared card before selector")
css = replace_exact(css, ".project-card:hover,\n.skill-group:hover,\n.education-item:hover,\n.contact-panel:hover {", ".project-card:hover,\n.skill-group:hover,\n.education-item:hover {", "shared card hover selector")
css = replace_exact(css, ".project-card:hover::before,\n.skill-group:hover::before,\n.education-item:hover::before,\n.contact-panel:hover::before {", ".project-card:hover::before,\n.skill-group:hover::before,\n.education-item:hover::before {", "shared card hover before selector")
css = replace_exact(css, ".skill-group,\n.education-item,\n.contact-panel {\n  padding: clamp(1rem, 2vw, 1.5rem);\n}", ".skill-group,\n.education-item {\n  padding: clamp(1rem, 2vw, 1.5rem);\n}", "shared card padding")

old_tail = '''.education-item span {
  color: var(--color-muted);
}

.status {
  align-self: start;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--color-teal), var(--color-warm));
  color: oklch(9% 0.02 240);
  font-size: 0.82rem;
  font-weight: 900;
  padding: 0.45rem 0.7rem;
  white-space: nowrap;
}

.contact-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 0.42fr);
  align-items: center;
  gap: clamp(1.5rem, 4vw, 3rem);
  background: linear-gradient(135deg, oklch(18% 0.034 220 / 0.9), oklch(14% 0.044 178 / 0.8));
}

.contact-links {
  display: grid;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.contact-links a {
  display: flex;
  min-height: 48px;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--color-line);
  color: var(--color-light);
  font-weight: 900;
}

.contact-links span {
  color: var(--color-muted);
  font-weight: 700;
  text-align: right;
  overflow-wrap: anywhere;
}

.site-footer {
  padding: 2rem 0 max(2rem, env(safe-area-inset-bottom));
  color: var(--color-muted);
}'''
new_tail = '''.education-copy {
  display: grid;
  gap: 0.35rem;
}

.education-school {
  color: var(--color-teal);
  font-size: 0.95rem;
  font-weight: 800;
}

.education-summary {
  max-width: 78ch;
  margin-top: 0.35rem;
  color: var(--color-muted);
  font-size: 0.98rem;
  line-height: 1.65;
}

.status {
  align-self: start;
  border: 1px solid oklch(72% 0.14 178 / 0.28);
  border-radius: 999px;
  background: oklch(72% 0.14 178 / 0.12);
  color: var(--color-light);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  padding: 0.45rem 0.7rem;
  white-space: nowrap;
}

.site-footer {
  position: relative;
  padding: clamp(2.5rem, 5vw, 4rem) 0 max(2rem, env(safe-area-inset-bottom));
  color: var(--color-muted);
}

.site-footer::before {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  width: min(1180px, calc(100% - 2rem));
  height: 1px;
  transform: translateX(-50%);
  background: linear-gradient(90deg, transparent, var(--color-line), oklch(72% 0.14 178 / 0.5), var(--color-line), transparent);
}

.footer-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 2rem clamp(2rem, 6vw, 5rem);
}

.footer-copy {
  display: grid;
  gap: 0.8rem;
}

.footer-copy h2 {
  max-width: 18ch;
  font-size: clamp(2rem, 4vw, 3.5rem);
}

.footer-copy p {
  max-width: 58ch;
  font-size: 0.98rem;
}

.footer-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.65rem;
}

.footer-link {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-line);
  border-radius: 999px;
  background: oklch(18% 0.028 220 / 0.68);
  color: var(--color-ink);
  font-size: 0.9rem;
  font-weight: 850;
  padding: 0.72rem 1rem;
  transition: transform var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
}

.footer-link:hover {
  transform: translateY(-2px);
  border-color: oklch(72% 0.14 190 / 0.5);
  background: oklch(24% 0.05 210 / 0.84);
}

.footer-link-primary {
  border-color: transparent;
  background: linear-gradient(135deg, var(--color-blue), var(--color-teal));
  color: oklch(9% 0.02 240);
}

.footer-meta {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border-top: 1px solid oklch(45% 0.055 220 / 0.28);
  padding-top: 1rem;
  font-size: 0.82rem;
}'''
css = replace_exact(css, old_tail, new_tail, "education/contact CSS")

old_tablet = '''  .hero-grid,
  .about-grid,
  .contact-panel,
  .section-head {
    grid-template-columns: 1fr;
  }'''
new_tablet = '''  .hero-grid,
  .about-grid,
  .section-head,
  .footer-shell {
    grid-template-columns: 1fr;
  }

  .footer-actions {
    justify-content: flex-start;
  }'''
css = replace_exact(css, old_tablet, new_tablet, "tablet layout")

old_mobile = '''  .education-item {
    grid-template-columns: 1fr;
  }

  .field-trace:nth-child(n + 5) {'''
new_mobile = '''  .education-item {
    grid-template-columns: 1fr;
  }

  .footer-actions,
  .footer-link {
    width: 100%;
  }

  .footer-meta {
    flex-direction: column;
  }

  .field-trace:nth-child(n + 5) {'''
css = replace_exact(css, old_mobile, new_mobile, "mobile footer layout")
css_path.write_text(css, encoding="utf-8")
