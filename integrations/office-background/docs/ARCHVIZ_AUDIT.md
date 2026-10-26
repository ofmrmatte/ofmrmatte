# Auditoria inicial — 26/10/2026

Inspecionados: package.json, vite.config.ts, tsconfig.json, todos os arquivos de src/office-3d (componentes, materiais, configuração e ScreenTextureEngine), App, main e index.html. public/models e public/hdri continham apenas .gitkeep; public/textures não existia. Não foram encontradas instruções AGENTS.md aplicáveis ao projeto. A pasta não é um repositório Git.

Checkpoint anterior às alterações: `checkpoint-before-rebuild-20261026-004552/`, com src, public, manifestos e configurações originais. O backup preexistente também foi preservado.

## Build inicial

`npm.cmd run build`: sucesso; TypeScript sem erros, 709 módulos, aproximadamente 11,52 s de build Vite. Bundle JS de 1.414,88 kB, gzip 446,05 kB. Dependências já instaladas e resolvidas por npm ls; nenhuma instalação foi necessária.

Versões efetivamente instaladas: React 18.3.1, Three 0.169.0, Fiber 8.18.0, Drei 9.122.0, react-postprocessing 2.19.1, postprocessing 6.39.5, GSAP 3.15.0, Vite 5.4.21, TypeScript 5.9.3. APIs foram conferidas na documentação primária e no código dessas versões.

## Construção e problemas identificados

| Área | Estado original | Consequência |
| --- | --- | --- |
| Arquitetura | Um componente extenso com piso, janela, skyline em Canvas, ripado, estante e plantas | Coordenadas e recursos duplicados; difícil validar o espaço |
| Geometria | Boxes, RoundedBox, cilindros, toros e folhas por malha customizada | Cadeira com encosto plano, livros inteiriços, montantes e encaixes pouco convincentes |
| Materiais | Faixas de madeira aleatórias em Canvas 2K e micro-noise independente | Veios uniformes e escala UV inconsistente; geração não determinística |
| Janela | Plano de skyline a 29 cm do caixilho | Exterior sem paralaxe nem profundidade real; ausência de parede lateral arquitetônica completa |
| Estante | Quatro fileiras praticamente iguais de 11 livros e mesmo ornamento | Repetição evidente; gabinete inferior centrado em y=.07 com altura .53 penetrava o piso |
| Plantas | Folhas já tinham geometria própria, mas orientação repetitiva e materiais planos | Silhueta artificial; vaso sem parede interna ou borda apropriada |
| Câmera | Curvas Catmull-Rom consultadas por comprimento de arco e rótulos por intervalos independentes | Estágios e waypoints não coincidiam; câmera próxima de y=1.05,z=.36 podia atravessar a cadeira |
| Scroll | ScrollTrigger atualiza uma ref; useFrame interpola câmera e atualiza telas | Integração reutilizável; valor externo sem clamp na origem e HUD externo sem atualização |
| Telas | Quatro CanvasTextures, quantizadas em 91 estados, atualizadas por scroll | Preservar mecanismo; logs e métricas ilustrativos incluíam afirmações fictícias de FPS/testes |
| Luz | Hemisphere 1.45, ambiente adicional, sol de intensidade 3 e sombras 4096, vários pontos e spots | Sombras duras, superfícies escuras e pouco equilíbrio entre reflexão e preenchimento |
| Pós | N8AO + ContactShadows, bloom e vignette; ACES apenas no renderer | AO redundante; EffectComposer desta versão força NoToneMapping, exigindo efeito explícito |
| Recursos | Materiais globais sem descarte; texturas locais e geometrias próprias sem gestão consistente | Risco de acumulação ao remontar ou alternar perfis |
| Interface | HUD com texto corrompido; favicon inexistente | Erro 404 inicial e apresentação de depuração dominante |

Captura anterior: `artifacts/before.png`. O console original apresentou favicon 404 e um aviso de shader do driver D3D relativo a derivadas dentro de loops.

## Decisões de implementação

Manter o projeto Vite e a API OfficeExperience; reconstruir componentes existentes e extrair somente módulos úteis. Preservar ScrollTrigger, React Three Fiber e texturas dinâmicas. Usar uma planta com licença individual verificada e texturas embutidas no GitHub. Gerar os outros materiais localmente e usar exterior 3D e Lightformers, sem depender de HDRIs remotos ou texturas obtidas fora do GitHub.
