"use client";

import { Fragment, useEffect, useRef, useState } from "react";

const CHAR_DELAY = 43;
const REST_DURATION = 5400;

/**
 * Text-writing effect for a small number of editorial statements.
 * Text is complete in the server-rendered HTML, remains accessible to
 * screen readers, and stops when offscreen, hidden or motion-reduced.
 */
function Words({ text, start, visible }: {
  text: string;
  start: number;
  visible: number;
}) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, wordIndex) => {
        const begin = start + words.slice(0, wordIndex).reduce((sum, previous) => sum + Array.from(previous).length + 1, 0);
        const letters = Array.from(word);
        return (
          <Fragment key={start + "-" + wordIndex}>
            {wordIndex > 0 ? " " : null}
            <span className="portfolio-typing-word">
              {letters.map((letter, letterIndex) => (
                <span
                  className="portfolio-typing-character"
                  key={letterIndex}
                  style={{ opacity: begin + letterIndex < visible ? 1 : 0 }}
                >
                  {letter}
                </span>
              ))}
            </span>
          </Fragment>
        );
      })}
    </>
  );
}

export function PortfolioTypingText({
  text,
  highlight,
  small = false
}: {
  text: string;
  highlight?: string;
  small?: boolean;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const fullText = highlight ? text + " " + highlight : text;
  const total = Array.from(fullText).length;
  const [visible, setVisible] = useState(total);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = !("IntersectionObserver" in window);
    let running = false;
    let timeout: number | undefined;

    const clear = () => {
      if (timeout !== undefined) window.clearTimeout(timeout);
      timeout = undefined;
    };

    const cycle = () => {
      if (!running) return;
      let step = 0;
      setVisible(0);
      const type = () => {
        if (!running) return;
        step += 1;
        setVisible(Math.min(step, total));
        timeout = window.setTimeout(step < total ? type : cycle, step < total ? CHAR_DELAY : REST_DURATION);
      };
      timeout = window.setTimeout(type, CHAR_DELAY);
    };

    const synchronize = () => {
      const shouldRun = inView && !document.hidden && !reduced.matches;
      if (shouldRun === running) return;
      running = shouldRun;
      clear();
      if (running) cycle();
      else setVisible(total);
    };

    const observer = "IntersectionObserver" in window
      ? new IntersectionObserver(([entry]) => {
          inView = entry.isIntersecting;
          synchronize();
        }, { threshold: 0.2 })
      : undefined;

    observer?.observe(element);
    reduced.addEventListener("change", synchronize);
    document.addEventListener("visibilitychange", synchronize);
    synchronize();

    return () => {
      running = false;
      clear();
      observer?.disconnect();
      reduced.removeEventListener("change", synchronize);
      document.removeEventListener("visibilitychange", synchronize);
    };
  }, [total]);

  return (
    <p ref={ref} className={"portfolio-typing " + (small ? "portfolio-typing-small" : "portfolio-typing-lead")}>
      <span className="sr-only">{fullText}</span>
      <span aria-hidden="true">
        <Words text={text} start={0} visible={visible} />
        {highlight ? (
          <>
            {" "}
            <em>
              <Words text={highlight} start={Array.from(text).length + 1} visible={visible} />
            </em>
          </>
        ) : null}
        <span className="portfolio-typing-caret" />
      </span>
    </p>
  );
}
