# Fundo para portfólio

A página inicial agora abre o fundo, sem marca, título, controles ou área extra de rolagem. `/?tour` mantém o tour completo. `/?progress=0.76` fixa um detalhe; `/?tour&progress=0.76` mostra esse detalhe com a interface original. `/?debug` ativa o HUD e a telemetria. `/?paused` suspende a animação.

## Incorporar em React

Copie `src/office-3d/` para o projeto React e os arquivos de `public/` para o public dele. Instale as dependências de runtime listadas no package.json deste projeto. Em Next.js, use este exemplo dentro de um componente cliente. Os assets usam URLs a partir da raiz; ajuste-as se publicar em um subdiretório.

```tsx
'use client';
import { lazy, Suspense } from 'react';

const OfficeBackground = lazy(() =>
  import('./office-3d/OfficeBackground').then(m => ({ default: m.OfficeBackground }))
);

export function PortfolioHero() {
  return (
    <section className="portfolio-hero">
      <Suspense fallback={null}>
        <OfficeBackground overlayOpacity={0.35} />
      </Suspense>
      <div className="portfolio-content">
        <h1>Seu nome</h1>
        <p>Desenvolvimento e experiências digitais.</p>
        <a href="#projetos">Ver projetos</a>
      </div>
    </section>
  );
}
```

```css
.portfolio-hero { position: relative; min-height: 100svh; display: grid; align-items: center; isolation: isolate; background: #28312d; }
.portfolio-content { position: relative; z-index: 1; width: fit-content; max-width: 100%; display: grid; gap: 16px; padding: clamp(24px, 6vw, 96px); color: #f2eee5; }
/* Reserve espaço no canto inferior direito para o pequeno link de créditos. */
```

Para acompanhar a página inteira, passe `style={{ position: 'fixed', inset: 0 }}` e posicione o conteúdo acima do fundo. Para sincronizar com seu próprio scroll, passe `externalScrollProgress={progresso}` entre 0 e 1. Sem essa prop, a câmera mantém o enquadramento geral com uma deriva de poucos centímetros. `paused={true}` suspende o loop; `overlayOpacity={0}` remove o sombreado. O fundo não captura mouse nem cria listener de scroll.

## Custo de renderização

| Perfil | Limite | DPR máximo | Sombra | Chuva | Camadas de nuvem | Atualizações das telas |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Desktop | 30 fps | 1,25 | 1024 | 650 | 3 | até 10/s |
| Tablet | 30 fps | 1,15 | 1024 | 400 | 2 | até 8/s |
| Mobile | 24 fps | 1 | 512 | 220 | 2 | até 6/s |

O limite é um teto de consumo, não uma garantia de FPS. O fundo usa um único relógio de renderização, sem AO, bloom ou compositor. GSAP, ScrollTrigger e pós-processamento só são carregados no tour. Sombra e ambiente estáticos são reaproveitados; o vidro do fundo usa transparência simples e uma amostra de gotas. Monitores continuam em 1920×1080 e notebook em 1536×960, com fontes e contraste já ajustados.

A decoração estática da estante é agrupada por material. No enquadramento desktop medido, as chamadas de desenho caíram de aproximadamente 395 para 291 por quadro (26%). A amostra curta no navegador automatizado mediu aproximadamente 14 fps; isso valida o teto de consumo e não representa uma promessa de fluidez em todo equipamento. O antialiasing nativo permanece ativo e a resolução adaptativa do fundo não cai abaixo de DPR 1.

O loop pausa quando o componente sai do viewport, a aba fica oculta ou paused está ativa. Na retomada, continua do instante anterior sem saltar a câmera. Com prefers-reduced-motion, câmera e clima ficam estáticos e o canvas atualiza uma vez por segundo para preservar o relógio local e o carregamento de assets. Timers e observadores são removidos no unmount. A planta ainda pesa aproximadamente 5,75 MB, carregada localmente pelo cache do loader; redes lentas podem demorar.

O link de créditos acompanha o componente. Preserve `public/ASSET_CREDITS.md` e a atribuição da planta CC BY 4.0. A integração não foi aplicada a outro repositório nem publicada.

## Verificações

```powershell
npm.cmd run check:background
npm.cmd run check:animation
npm.cmd run check:assets
npm.cmd run build
```

O teste de cadência cobre monitores de 60, 120 e 144 Hz, limites de 1/24/30 fps e retomada sem incluir o intervalo de pausa. Capturas e verificações do navegador ficam em `artifacts/background/`.
