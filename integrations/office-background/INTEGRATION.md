# Cena do ZIP no portfólio

O código deste diretório foi extraído de `archviz-dev-office.zip`, fornecido em 26/10/2026. Dependências, checkpoints, logs, capturas e builds antigos foram omitidos. Os arquivos-fonte, lockfile, assets locais, créditos e scripts foram preservados.

SHA-256 do ZIP de origem: `BDAB47F5DE27D14C88196362F235FF9AD88E8F2D7851C4E80946C3326C19FFCF`.

O portfólio usa Next.js 16 e React 19. A cena usa React 18 / React Three Fiber 8. Ela é compilada separadamente e servida pelo próprio Next em `/office/index.html`. O iframe decorativo em `app/components/PortfolioDepthExperience.tsx` mantém os runtimes isolados, sem sobrepor um segundo renderizador ao canvas antigo.

- A entrada espera um período ocioso do navegador (até 1,2 s) para preservar a primeira renderização do conteúdo.
- O iframe é inerte, oculto para tecnologias assistivas e não captura cliques ou rolagem.
- Mensagens de pausa e progresso aceitam somente o pai e a mesma origem. O pai retransmite visibilidade e `office:scroll`, com valores limitados de 0 a 1; o filho mantém sua pausa e preferência de movimento reduzido.
- Uma única timeline `office-cinematic-scroll` mantém a câmera em 0 até 50% do documento e percorre os cinco pontos até a entrada de `#escritorio`. O FOV permanece constante no fundo: a aproximação é um deslocamento físico. A interpolação usa curvas de posição/alvo e quaternions, sem deriva automática.
- Após o contato, `#imersao` reserva um trecho transparente de navegação para a aproximação ficar visível sem cartões sobre os monitores. A seção final transparente ocupa 160svh e estabiliza o enquadramento em 1. Sombreado, cabeçalho e barra de leitura desaparecem antes da imersão; só uma assinatura discreta aparece no fim.
- O scroll inverso refaz a trajetória. ResizeObserver, refresh do ScrollTrigger e resolução da viewport recalculam a duração e os enquadramentos. Com movimento reduzido há duas composições estáticas e um corte para a composição final, sem aproximação animada.
- A cena continua a 30 fps no máximo no desktop e 24 no mobile, sem compositor pesado; esses valores são limites, não garantias de desempenho.
- Os créditos da planta estão em `/office/ASSET_CREDITS.md`, vinculados no rodapé do site. O crédito interno fica oculto apenas no modo incorporado.

## Atualizar o build

Na raiz do repositório:

```sh
npm run build:office
npm run lint
npm run build
```

`build:office` instala as dependências com o lockfile deste diretório, compila e substitui somente a saída marcada em `public/office/`. Versione os fontes e a saída atualizada juntos. O deploy Railway continua usando `npm run build` na raiz, sem precisar instalar o runtime da cena durante a publicação.

O subprojeto é excluído da checagem de tipos do Next e do ESLint da raiz, pois tem seu próprio compilador e suas próprias versões de React/Three. Seus testes são executados no diretório desta integração:

```sh
npm run check:assets
npm run check:animation
npm run check:background
```

Para ver o tour completo sem incorporar: `/office/index.html?tour`. O fundo isolado continua em `/office/index.html`. O modo incorporado utiliza `?embed`.
