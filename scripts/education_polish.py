from pathlib import Path


def replace_exact(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 occurrence, found {count}")
    return text.replace(old, new)


page_path = Path("app/page.tsx")
page = page_path.read_text(encoding="utf-8")

old = '''      <section id="formacao" className="section">
        <div className="section-inner">
          <div className="section-head">
            <h2>Formação</h2>
            <p>Base em administração e formação técnica voltada à construção de aplicações full stack.</p>
          </div>
          <div className="education-list">
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
          </div>
        </div>
      </section>'''

new = '''      <section id="formacao" className="section">
        <div className="section-inner">
          <div className="section-head">
            <h2>Formação</h2>
            <p>Formação em gestão aliada ao aprofundamento técnico em desenvolvimento de software.</p>
          </div>
          <div className="education-list">
            <article className="education-item">
              <span className="education-label">Gestão e negócios</span>
              <div className="education-copy">
                <strong>Bacharel em Administração</strong>
                <p className="education-school">Centro Universitário FAM</p>
                <p className="education-summary">
                  Base em gestão, processos, estratégia e tomada de decisão, aplicada à análise de operações, melhoria
                  de processos e construção de soluções alinhadas aos objetivos do negócio.
                </p>
              </div>
            </article>
            <article className="education-item">
              <span className="education-label">Tecnologia e produto digital</span>
              <div className="education-copy">
                <strong>Pós-Graduação Lato Sensu em Desenvolvimento Full Stack</strong>
                <p className="education-school">PUC Minas</p>
                <p className="education-summary">
                  Aprofundamento em arquitetura e desenvolvimento de aplicações, APIs, bancos de dados e integração de
                  sistemas, ampliando a capacidade de transformar necessidades operacionais em soluções digitais.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>'''

page = replace_exact(page, old, new, "education section")
page_path.write_text(page, encoding="utf-8")

css_path = Path("app/globals.css")
css = css_path.read_text(encoding="utf-8")

css = replace_exact(
    css,
    '''.section {
  padding: clamp(4rem, 8vw, 8rem) 0;
}''',
    '''.section {
  scroll-margin-top: 7rem;
  padding: clamp(4rem, 8vw, 8rem) 0;
}

.site-footer {
  scroll-margin-top: 7rem;
}''',
    "section anchor offset",
)

old_education_css = '''.education-list {
  display: grid;
  gap: 1rem;
}

.education-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
}

.education-item strong {
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: var(--text-lg);
}

.education-copy {
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
}'''

new_education_css = '''.education-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.education-item {
  display: flex;
  min-height: 250px;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.5rem;
  padding: clamp(1.3rem, 2.4vw, 1.8rem);
  border-color: oklch(72% 0.08 190 / 0.2);
  background:
    linear-gradient(150deg, oklch(17% 0.025 220 / 0.86), oklch(11% 0.018 205 / 0.76)),
    linear-gradient(120deg, oklch(72% 0.14 178 / 0.045), transparent 55%);
}

.education-item:hover {
  transform: translateY(-2px);
}

.education-label {
  width: fit-content;
  color: var(--color-teal);
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.education-item strong {
  max-width: 30ch;
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: clamp(1.2rem, 2vw, 1.45rem);
  line-height: 1.25;
}

.education-copy {
  display: grid;
  gap: 0.5rem;
}

.education-school {
  color: var(--color-light);
  font-size: 0.9rem;
  font-weight: 700;
  opacity: 0.78;
}

.education-summary {
  max-width: 60ch;
  margin-top: 0.6rem;
  color: var(--color-muted);
  font-size: 0.94rem;
  line-height: 1.7;
}'''

css = replace_exact(css, old_education_css, new_education_css, "education styles")

css = replace_exact(
    css,
    '''  .projects-grid,
  .skills-grid {
    grid-template-columns: 1fr;
  }''',
    '''  .projects-grid,
  .skills-grid,
  .education-list {
    grid-template-columns: 1fr;
  }''',
    "tablet education grid",
)

css = replace_exact(
    css,
    '''  .education-item {
    grid-template-columns: 1fr;
  }

  .footer-actions,''',
    '''  .section,
  .site-footer {
    scroll-margin-top: 7.5rem;
  }

  .nav-wrap {
    padding: 0.4rem 0.45rem 0.4rem 0.75rem;
  }

  .brand {
    font-size: 0.9rem;
  }

  .mobile-menu summary {
    font-size: 0.9rem;
    padding: 0.62rem 0.72rem;
  }

  .education-item {
    min-height: 0;
    gap: 1.1rem;
    padding: 1.2rem;
  }

  .education-item strong {
    font-size: 1.18rem;
  }

  .education-summary {
    font-size: 0.92rem;
    line-height: 1.65;
  }

  .footer-actions,''',
    "mobile education/header polish",
)

css_path.write_text(css, encoding="utf-8")
