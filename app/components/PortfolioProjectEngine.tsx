"use client";

import { useEffect, useRef, useState } from "react";

type Phase = "preview" | "code" | "processing";
const examples = [
  {
    id: "archi",
    title: "ARCHI",
    type: "ARQUITETURA CORPORATIVA",
    subtitle: "Identidade, governança e módulos",
    values: ["IDENTIDADE", "SETOR", "PERMISSÕES"],
    snippet: ["const sistema = 'ARCHI';", "definirRegras(operacao);", "validarFluxos(modulos);"]
  },
  {
    id: "mldds",
    title: "MLDDS",
    type: "AUTOMAÇÃO LOGÍSTICA",
    subtitle: "Processos, roteirização e validação",
    values: ["REGRAS", "ROTAS", "ANÁLISE"],
    snippet: ["const projeto = 'MLDDS';", "mapearRegras(rotas);", "validarExecucao(fluxo);"]
  },
  {
    id: "alc",
    title: "ALC & Pereira Filho",
    type: "EXPERIÊNCIA DIGITAL",
    subtitle: "Interfaces, conteúdo e performance",
    values: ["INTERFACE", "CONTEÚDO", "WEB"],
    snippet: ["const projeto = 'Site ALC';", "estruturarNavegacao();", "validarExperiencia();"]
  }
] as const;

/** Conceptual visual sequence. Not a source-code editor or live build. */
export function PortfolioProjectEngine() {
  const ref = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
  const [phase, setPhase] = useState<Phase>("preview");

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = typeof IntersectionObserver === "undefined";
    let playing = false;
    let timer: number | undefined;
    let index = 0;
    let step: Phase = "preview";
    const clear = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = undefined;
    };
    const advance = () => {
      if (!playing) return;
      timer = window.setTimeout(() => {
        if (!playing) return;
        if (step === "preview") {
          index = (index + 1) % examples.length;
          setSelected(index);
          step = "code";
        } else if (step === "code") {
          step = "processing";
        } else {
          step = "preview";
        }
        setPhase(step);
        advance();
      }, step === "preview" ? 4600 : step === "code" ? 1800 : 700);
    };
    const sync = () => {
      const canPlay = visible && !media.matches && !document.hidden;
      if (canPlay === playing) return;
      playing = canPlay;
      clear();
      if (playing) {
        step = "preview";
        setPhase("preview");
        advance();
      } else {
        setPhase("preview");
      }
    };
    const observer = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          sync();
        }, { threshold: .15 })
      : undefined;
    observer?.observe(element);
    media.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      playing = false;
      clear();
      observer?.disconnect();
      media.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const item = examples[selected];
  return (
    <div ref={ref} className="hero-stage-card portrait-workflow-panel portfolio-engine" aria-label="Prévia visual dos projetos ARCHI, MLDDS e Site ALC">
      <div className="portfolio-engine-head">
        <div className="portfolio-engine-dots" aria-hidden="true"><i /><i /><i /></div>
        <span>MF / ENGINEERING VIEW</span>
        <span>0{selected + 1}/03</span>
      </div>
      <div className="portfolio-engine-viewport" data-phase={phase} key={item.id + "-" + phase}>
        {phase === "code" ? (
          <div className="portfolio-engine-code">
            {item.snippet.map((line, i) => <div key={line}><span>{String(i + 1).padStart(2, "0")}</span><code>{line}</code></div>)}
          </div>
        ) : phase === "processing" ? (
          <div className="portfolio-engine-processing"><span className="portfolio-engine-spinner" /> ORGANIZANDO A SOLUÇÃO</div>
        ) : (
          <div className="portfolio-engine-result">
            <span className="portfolio-engine-kind">{item.type}</span>
            <strong>{item.title}</strong>
            <small>{item.subtitle}</small>
            <div className="portfolio-engine-steps">
              {item.values.map((value, i) => <span key={value}><b>0{i + 1}</b>{value}</span>)}
            </div>
          </div>
        )}
      </div>
      <div className="portfolio-engine-bottom">
        <span className="portfolio-engine-status"><i />{phase === "preview" ? "VISUALIZAÇÃO CONCEITUAL" : phase === "code" ? "MODELANDO FLUXO" : "VALIDAÇÃO"}</span>
        <div className="portfolio-engine-pagination" aria-hidden="true">{examples.map((example, index) => <i key={example.id} className={index === selected ? "active" : ""} />)}</div>
      </div>
    </div>
  );
}
