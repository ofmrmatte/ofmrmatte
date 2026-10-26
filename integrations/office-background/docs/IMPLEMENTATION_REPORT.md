# Entrega técnica — Atelier / Developer Office

Data: 26/10/2026. Trabalho realizado diretamente na pasta existente. Sem push, deploy ou alterações em outros projetos. Checkpoint: `checkpoint-before-rebuild-20261026-004552/`.

## Resultado

Reconstrução implementada e validada no build de produção. As cinco cenas, ScrollTrigger, progressão externa e CanvasTextures do editor, preview, terminal e telefone continuam funcionais. Capturas reais: `artifacts/final/scene-1.png` até `scene-5.png`, além de mobile e tablet. Evidência estruturada: `artifacts/final/verification.json`.

### Arquitetura e modelagem

- Janela com parede construída ao redor de uma abertura real, profundidade dos perfis, divisões, vedações, puxador, peitoril, vidro com reflexão e persiana com lâminas.
- Céu em shader e volumes externos a 12–40 metros, com fachadas instanciadas e névoa. Não há imagem chapada atrás do vidro.
- Piso em tábuas com comprimentos e juntas desencontradas, variação controlada e instancing; tapete com trama.
- Ripado instanciado com UVs verticais e variação entre ripas.
- Estante com quatro montantes, fixadores, gabinete apoiado no piso, prateleiras, iluminação embutida, capas e páginas dos livros, pilhas horizontais, cerâmicas, escultura e caixa organizadora. Montantes alcançam a prateleira superior.
- Cadeira com encosto deformado e curvo, assento acolchoado, lombar, apoio de cabeça, braços, pistão, base estrelada e cinco conjuntos de rodízios.
- Mesa com tampo de nogueira em escala física, estrutura, niveladores apoiados no tapete, fixadores e calha de cabos. Monitores com traseira e braços conectados atrás das telas; notebook, dobradiça, teclado e trackpad preservados e refinados.
- Periféricos mantidos e ajustados; keycaps usam instancing e receberam legendas. Objetos permanecem estáticos.

### Materiais, luz e renderização

Biblioteca PBR centralizada para nogueira, piso, ripado, grafite escovado, alumínio anodizado, vidro, cerâmica, mineral, tecido da cadeira, tapete, couro, plásticos, folhas, caules e livros. Mapas determinísticos de albedo, roughness e normal; colorSpace sRGB apenas para cor; wrapping e UVs em metros; cache compartilhado e descarte.

Sol com uma única shadow map dinâmica invalidada quando a geometria muda, preenchimento do céu, luz funcional e luz quente da estante. Environment procedural com Lightformers, sem downloads de HDRI. A resolução do cubemap é escolhida pelo perfil inicial e preservada durante resize para evitar realocações PMREM no r169. Luzes de preenchimento e reflexão aproximam iluminação indireta; não constituem GI física.

ACES explícito no pós-processamento, N8AO único, bloom e vinheta discretos. ContactShadows redundante foi removido. Mobile usa renderer com ACES e antialiasing, sem composer pesado. Desktop e tablet têm limites próprios de DPR, sombras, AO e MSAA. Pós-processamento carregado por import dinâmico; chunks separados para Three, React e GSAP.

### Câmera, integração e recursos

Cinco waypoints com curvas centrípetas, parametrização alinhada aos estágios, suavização independente da taxa de quadros e FOV interpolado. Enquadramentos específicos em portrait. A preferência de movimento reduzido é acompanhada em tempo real. A prop externa continua aceita e limitada à faixa 0–1; botões externos emitem `office:request-progress`.

GLB com Suspense, cache do useGLTF, normalização de origem/escala por bounding box e fallback botânico procedural se a carga falhar. Limpeza explícita de geometrias procedurais e buffers do composer/N8AO corrigiu crescimento observado durante resize. React StrictMode continua habilitado.

## Assets e licenças

Único asset externo importado: **Diffuse Transmission Plant**, do [glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/DiffuseTransmissionPlant). Adaptação © 2024 Darmstadt Graphics Group GmbH / Eric Chadwick, **CC BY 4.0**; modelo original © 2021 Rico Cilliers, **CC0 1.0**. As duas contribuições estão identificadas no README específico preservado. A licença da adaptação distribuída não foi tratada como CC0.

GLB com mapas PBR embutidos, obtido exclusivamente pelo GitHub. Foram removidos vagalumes, animações, câmeras, luzes e extensão não suportada pelo Three r169. Créditos, URLs, SHA-256 e modificações: `ASSET_CREDITS.md`, também servido publicamente e acessível pela interface. Fonte original em assets-source; arquivo de runtime em public/models/plant. Nenhuma textura foi baixada fora do GitHub. Nenhum asset ou serviço pago.

Madeira, piso, mineral, tecido, tapete, couro e metais permanecem procedurais. São os candidatos mais úteis para futuras digitalizações PBR licenciadas; a planta pequena também pode receber outro GLB.

## Build e testes efetivos

- Build inicial: sucesso, 709 módulos, aproximadamente 11,52 s de build Vite.
- Build final: `npm.cmd run build` **PASSOU**, TypeScript sem erros, 719 módulos, 20,81 s de build Vite. Nenhum import quebrado.
- `npm.cmd run check:assets` **PASSOU**: integridade GLB v2, recursos embutidos, URLs locais e atribuição pública.
- Testes do navegador contra `http://127.0.0.1:4173`, servindo dist: **PASSARAM**. Roteiro preservado em `scripts/verify-browser.js` (função assíncrona para runner Playwright com argumento Page).
- Cinco estágios por scroll e navegação dos botões; IDE, preview e terminal aumentaram suas versões de textura. A navegação usa botões nativos e nomes acessíveis.
- Nenhum erro de console, exceção ou resposta HTTP com falha durante o roteiro normal de produção.
- Desktop 1440×960, tablet 1024×768 e mobile 390×844; sem overflow horizontal no mobile. Capturas inspecionadas e enquadramentos estreitos corrigidos.
- Redução de movimento e progresso externo em .76, sem espaçador de scroll; valor externo 1.5 limitado a 1.
- Bounding boxes dos móveis independentes sem sobreposição. Contatos intencionais entre piso/tapete, livros/prateleiras e partes de um móvel são excluídos dessa comparação. Contatos e enquadramentos também foram inspecionados visualmente.
- Trajetória amostrada em 501 pontos por perfil: sem colisões nas caixas dos móveis e limites de parede/teto verificados. Menores distâncias às caixas: desktop .298 m, tablet .366 m e mobile .418 m. A checagem não equivale a colisão triangular completa do frustum.
- Ciclos de resize estabilizados em **395 geometrias / 73 texturas no desktop** e **389 / 45 no mobile**, repetidos sem crescimento após aquecimento. São contadores do renderer, não bytes de VRAM.
- Teste de falha isolado: GLB bloqueado intencionalmente por interceptação. Fallback procedural apareceu, o canvas continuou ativo e não houve falha global. A falha de rede esperada desse teste não faz parte do roteiro normal sem erros. Captura: `artifacts/final/asset-fallback.png`.

## Desempenho e limites restantes

GPU identificada no navegador: ANGLE / Intel UHD Graphics / Direct3D11. Amostras de aproximadamente um segundo nos cinco enquadramentos desktop: **21.4–31.0 FPS** em 1440×960, DPR 1, com pós-processamento. A meta orientativa de 60 FPS desktop **não foi atingida neste hardware**.

O viewport mobile no mesmo computador registrou aproximadamente 143 FPS, e o tablet emulado 56 FPS. Isso verifica responsividade e carga reduzida; **não constitui medição em telefone ou tablet físico**. Safari, iOS e aparelhos Android físicos não foram testados.

O ambiente continua majoritariamente procedural, com aproximações de iluminação indireta e vidro. Não há ray tracing, GI física, texturas digitalizadas para toda a cena nem garantia de equivalência a um render offline profissional. O asset botânico local tem aproximadamente 5,75 MB e pode ser otimizado adicionalmente para conexões lentas.

## Arquivos criados

- src/office-3d/components/Geometry.tsx
- src/office-3d/components/architecture/Window.tsx
- src/office-3d/components/furniture/Bookshelf.tsx
- src/office-3d/components/decoration/Plants.tsx
- src/office-3d/config/qualityProfiles.ts
- src/office-3d/utils/bounds.ts
- src/office-3d/office.css
- scripts/prepare-plant.mjs
- scripts/check-assets.mjs
- scripts/verify-browser.js
- assets-source/plant-source.glb
- public/models/plant/plant.glb
- public/models/plant/SOURCE.md
- ASSET_CREDITS.md
- public/ASSET_CREDITS.md
- docs/ARCHVIZ_AUDIT.md
- docs/IMPLEMENTATION_REPORT.md
- docs/CHANGE_MANIFEST.json
- artifacts/before.png; capturas intermediárias em artifacts; capturas finais e verification.json em artifacts/final
- checkpoint-before-rebuild-20261026-004552/ (cópia de segurança)

## Arquivos alterados

- index.html
- package.json
- vite.config.ts
- README.md
- src/App.tsx
- src/office-3d/OfficeExperience.tsx
- src/office-3d/types.ts
- src/office-3d/config/spatialLayout.ts
- src/office-3d/config/cameraKeyframes.ts
- src/office-3d/materials/pbrLibrary.ts
- src/office-3d/screens/ScreenTextureEngine.ts
- src/office-3d/components/ArchitecturalLighting.tsx
- src/office-3d/components/ArchitecturalRoom.tsx
- src/office-3d/components/CinematicCameraRig.tsx
- src/office-3d/components/ErgonomicChair.tsx
- src/office-3d/components/Peripherals.tsx
- src/office-3d/components/PostProcessingEffects.tsx
- src/office-3d/components/RealModel.tsx
- src/office-3d/components/WorkstationDesk.tsx

tsconfig.json, package-lock.json, main.tsx e index.ts não precisaram de alteração. Nenhuma dependência foi adicionada ou atualizada. dist foi regenerado pelo build.

## Executar

Na pasta do projeto, use `npm.cmd run dev -- --host 127.0.0.1` e abra http://127.0.0.1:5173. Para conferir a versão compilada: `npm.cmd run build`, seguido de `npm.cmd run preview -- --host 127.0.0.1`, em http://127.0.0.1:4173. Instale com npm.cmd install somente se node_modules não estiver disponível. Node 22+ é recomendado.
