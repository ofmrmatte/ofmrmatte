# Animações contínuas e nitidez das telas — entrega

Implementado diretamente no projeto existente, sem push/deploy. Checkpoint anterior: `checkpoint-before-animation-20261026-093322/`. Arquitetura, materiais, planta GLB, estações e trajetória de câmera preservados.

## Funcionamento

**Tempo e scroll separados.** OfficeAnimationSystem usa um único useFrame prioritário para atualizar AnimationCoordinator. O tempo de simulação avança por delta, limitado a .25 s após pausas; o scroll só controla câmera/FOV e permanece disponível como informação narrativa. Mudar a câmera não reinicia o projeto. Aba oculta interrompe o render loop; ao voltar, a câmera retoma e o relógio é sincronizado.

**Telas coordenadas.** Cada projeto dura 64 segundos, com quatro projetos em sequência (256 s até repetir): dashboard, administração, automações e agendamento. A máquina de estados percorre IDLE, CODING, AUTOCOMPLETE, COMPILING, TESTING, BUILD_COMPLETE, PREVIEW_LOADING, PREVIEW_REVEAL, PREVIEW_INTERACTIVE e TRANSITIONING. A primeira aplicação surge após a compilação visual, aproximadamente entre 29 e 34 segundos, sem precisar rolar a página.

O editor tem três arquivos por projeto, syntax highlighting por tokens, digitação com pausas, correções por apagamento/reescrita, cursor, autocomplete contextual, seleção e rolagem vertical/horizontal. O notebook complementa a sequência com logs e progresso; o erro de integração da automação é uma ocorrência fictícia seguida de recuperação. Os comandos nunca são executados. Todos os sistemas exibem identificação discreta de demonstração e dados sintéticos.

Os previews são desenhados programaticamente em Canvas: gráficos de linha/área e barras com entrada progressiva, contadores e filtros; tabela administrativa com filtros/menu e relatórios; grafo de sete etapas com conexões/fluxos e estados; calendário com escolha de horário e confirmação. Não são imagens ou vídeos trocados.

**Relógio real.** RealTimeClock deriva cada leitura de Date e Intl.DateTimeFormat sem timeZone fixo. Formata HH:mm em ciclo h23 e data local. Um timer alinhado ao próximo minuto, com verificação adicional a cada 30 s, acompanha alterações do relógio/fuso do sistema. focus e visibilitychange sincronizam imediatamente. O mesmo valor é usado no relógio de bloqueio e na barra superior. As notificações de desenvolvimento são fictícias e não usam dados do visitante.

**Clima.** AnimatedClouds integra densidade fBM em múltiplas altitudes no shader do céu, com vento e camadas. RainParticles usa uma InstancedBufferGeometry, uma malha e um material, com 1800/1000/480 gotas conforme desktop/tablet/mobile. Posição e queda são calculadas na GPU; buffers não são reenviados por gota. As três faixas de profundidade permanecem em x <= -3.24 m, fora do vidro/reveal. WindowRainEffect altera o material das três vidraças existentes, com gotas aderidas, gotas que deslizam em velocidades distintas, trilhas, micro-normais e reflexos. Não há outra vidraça coplanar. A luz exterior foi suavizada/esfriada; a iluminação quente interna permanece.

## Ajuste solicitado de legibilidade

- Monitores: **1920×1080**, desenhados em escala 1.5 sobre coordenadas lógicas 1280×720.
- Notebook: **1536×960**, também com supersampling 1.5.
- Tipografia geral pequena ampliada em 20%; código passou de 17 para 22 px lógicos, com menos linhas visíveis e auto-scroll.
- Contraste e emissão dos painéis aumentados; reflexos reduzidos a envMapIntensity .03. Molduras e demais materiais PBR foram mantidos.
- Anisotropia 16, filtros lineares e nenhuma geração de mipmaps por atualização.
- O enquadramento de detalhe (.58–.84 do scroll) preserva DPR nativo, limitado a 1.5; a redução adaptativa a .8 permanece disponível nas visões gerais.
- A definição é limitada pelo tamanho físico/projetado da tela no enquadramento: os textos ficam melhores para inspeção na cena 4.

## Otimizações e ciclo de vida

Canvas atualiza por conteúdo e por limite de FPS: desktop 15, tablet 15, mobile 10; terminal limitado por seus estados/spinner; telefone normalmente só muda por minuto, evento de sincronização, progresso ou notificação. Partes imóveis não são redesenhadas a cada quadro. Tokenização e trilhas de digitação são cacheadas por arquivo.

A árvore Canvas é memoizada separadamente do HUD, para o scroll não reconfigurar o renderer nem desfazer o DPR adaptativo. O composer acompanha as mudanças de DPR; sua limpeza e a dos quads N8AO permanecem explícitas e compatíveis com StrictMode/HMR. Texturas, canvases, geometrias de chuva, materiais e timers próprios têm descarte. O modelo GLB mantém seu cache compartilhado.

## Validação executada

- `npm.cmd run build`: **PASSOU**. TypeScript e Vite, 732 módulos, 21.88 s no último build. Nenhuma dependência adicionada.
- `npm.cmd run check:assets`: **PASSOU**, recursos locais e atribuição preservados.
- `npm.cmd run check:animation`: **PASSOU**: 40 combinações de estado/projeto; sintaxe de 12 arquivos demonstrativos; ciclo completo; independência do scroll; clamp de delta; pausa por aba oculta/movimento reduzido; foco/visibilidade e remoção dos listeners.
- Relógio testado em processos com America/Sao_Paulo, Asia/Tokyo e America/New_York. Para a mesma data de teste, Tóquio apresentou 00:05 no dia seguinte; nenhuma zona está fixa na implementação.
- Renderizadores testados no navegador por diferenças de pixels em estados parciais, revelados e interativos. Quatro previews, editor e terminal produziram saídas diferentes. Capturas em `artifacts/animations/preview-*.png`.
- Fluxo ao vivo em build de produção: digitação e terminal avançaram com scroll imóvel em .76; depois o dashboard correto apareceu após compilação/testes simulados. Cap de atualização respeitado; não é um compromisso de atingir o limite em hardware lento.
- Cinco estágios da câmera e bounding boxes de móveis independentes verificados novamente.
- Desktop e viewport mobile verificados; mobile usa 480 partículas. Capturas `live-coding.png`, `live-dashboard.png`, `live-rainy-office.png` e `live-mobile.png`.
- Movimento reduzido congelou animações não essenciais; relógio continuou sincronizável.
- Mudança controlada de Date seguida de foco atualizou o relógio com as animações pausadas; Date original foi restaurado no teste.
- Evento de visibilidade com document.hidden controlado pausou e retomou o render loop. É teste de integração do evento; não é certificação de todas as condições de suspensão do sistema operacional.
- Recursos estabilizados após alternância de qualidade: desktop aproximadamente **396 geometrias / 73 texturas**; mobile **390 / 45**. Alguns buffers do composer só aparecem após seu primeiro render, portanto há amostras transitórias menores. Não houve crescimento entre ciclos comparáveis.
- Teste direto de dispose: quatro eventos de descarte de textura, quatro canvases reduzidos a 1×1 e atualizações interrompidas.
- **Zero erros de console e zero respostas HTTP com falha** no roteiro final de produção. Há um aviso de compilação do driver Intel/D3D sobre derivadas em loop no N8AO, já observado no projeto anterior; não foi tratado como erro nem ocultado.
- Dados completos do navegador: `artifacts/animations/browser-tests.json`. Roteiros: `scripts/verify-animation-browser.js` e `scripts/verify-animation-renderers.js`, funções para runner Playwright com Page.

## Limitações

A cena continua exigente na GPU integrada, sobretudo no detalhe com DPR nativo e uploads de textura em resolução maior. Não há certificação de 60 FPS. Amostras de FPS nos cinco enquadramentos deste roteiro: **8.9, 7.5, 5.3, 4.8, 8.1**; são observações de uma execução, sujeitas a compilação inicial, outras janelas e throttling do navegador. Não são benchmarks de aparelhos físicos.

A chuva e as nuvens são aproximações procedurais em WebGL. O vidro usa micro-normais/reflexos e transparência para sugerir lentes de água; **não há refração completa do framebuffer nem volumetria física/GI**. Não há relâmpagos. Safari/iOS e Android físicos não foram testados. Os testes de múltiplos fusos foram feitos em Node; o navegador foi testado em seu fuso local.

## Arquivos criados

- src/office-3d/animations/AnimationCoordinator.ts
- src/office-3d/animations/DevelopmentTimeline.ts
- src/office-3d/animations/OfficeAnimationSystem.tsx
- src/office-3d/screens/RealTimeClock.ts
- src/office-3d/screens/canvasUI.ts
- src/office-3d/screens/CodeEditorRenderer.ts
- src/office-3d/screens/ApplicationPreviews.ts
- src/office-3d/screens/TerminalRenderer.ts
- src/office-3d/screens/PhoneRenderer.ts
- src/office-3d/weather/WeatherConfig.ts
- src/office-3d/weather/AnimatedClouds.tsx
- src/office-3d/weather/RainParticles.tsx
- src/office-3d/weather/WindowRainEffect.ts
- scripts/check-animation.mjs
- scripts/verify-animation-renderers.js
- scripts/verify-animation-browser.js
- docs/ANIMATION_REPORT.md
- artifacts/animations/ (capturas e resultados)

## Arquivos modificados

- src/office-3d/screens/ScreenTextureEngine.ts
- src/office-3d/OfficeExperience.tsx
- src/office-3d/components/CinematicCameraRig.tsx
- src/office-3d/components/ArchitecturalLighting.tsx
- src/office-3d/components/ArchitecturalRoom.tsx
- src/office-3d/components/architecture/Window.tsx
- src/office-3d/components/PostProcessingEffects.tsx
- src/office-3d/components/WorkstationDesk.tsx
- src/office-3d/config/qualityProfiles.ts
- src/office-3d/types.ts
- package.json
- README.md

## Executar

`npm.cmd run dev`, na pasta existente, e http://localhost:5173. A cena 4 aproxima a estação. Um endereço com `?progress=0.76` fixa a câmera nesse detalhe para inspeção; sem a query, o scroll controla as cinco cenas normalmente. Para produção local: `npm.cmd run build` e `npm.cmd run preview`.
