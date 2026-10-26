# Atelier — Madeira, luz e código

Escritório 3D em React, Three.js / React Three Fiber e GSAP. Este é o projeto existente reconstruído: janela arquitetônica, ripado de nogueira, piso em tábuas, estante detalhada, cadeira ergonômica, vegetação e estação com telas que respondem ao scroll.

## Executar no Windows

Recomendado: Node.js 22+ e npm. As dependências já estão instaladas nesta pasta.

```powershell
npm.cmd install       # somente se node_modules não estiver disponível
npm.cmd run dev -- --host 127.0.0.1
```

Abra http://127.0.0.1:5173 para o fundo de portfólio. O tour completo fica em `/?tour`: role a página ou selecione um dos cinco números da câmera. Tab e Enter também operam a navegação. O navegador precisa oferecer WebGL2. Movimento reduzido mantém a câmera estática e preserva o relógio das telas.

```powershell
npm.cmd run check:assets
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1
```

O preview de produção fica em http://127.0.0.1:4173. O build gera dist. Não foi feito push nem deploy.

## Integração com scroll externo

Para usar como fundo decorativo, importe `OfficeBackground`, sem área adicional de scroll nem interface do tour. Há pausa automática, limite de renderização e sombreado ajustável. Exemplo completo e parâmetros em [docs/PORTFOLIO_BACKGROUND.md](docs/PORTFOLIO_BACKGROUND.md). `npm.cmd run check:background` valida o relógio de renderização.

`OfficeExperience` continua exportado por `src/office-3d/index.ts`. Passe `externalScrollProgress` entre 0 e 1; valores finitos fora da faixa são limitados. Sem a prop, ScrollTrigger controla uma área de seis alturas de viewport. Com a prop, o componente ocupa uma única altura. Os botões em modo externo emitem `office:request-progress` com o progresso em `event.detail`, para o host atualizar a prop.

Para abrir diretamente um enquadramento: `/?progress=0.76`. `/?debug` habilita o HUD técnico. A telemetria local pode ser consultada por `window.__officeDiagnostics`: posição, FOV, estágio, atualização das telas, FPS amostrado, recursos do renderer e bounding boxes. FPS é uma amostra do navegador, não uma garantia para outros dispositivos.

## Arquivos importantes

- `src/office-3d/config/spatialLayout.ts`: dimensões em metros e posições dos objetos principais.
- `src/office-3d/config/cameraKeyframes.ts`: cinco estágios e interpolação.
- `src/office-3d/config/qualityProfiles.ts`: desktop, tablet e mobile.
- `src/office-3d/materials/pbrLibrary.ts`: cache de materiais e mapas procedurais.
- `src/office-3d/screens/ScreenTextureEngine.ts`: editor, preview, terminal e telefone em CanvasTextures.
- `ASSET_CREDITS.md`: origem, autores, licença específica e adaptações da planta.
- `docs/ARCHVIZ_AUDIT.md`: diagnóstico e build inicial.
- `docs/IMPLEMENTATION_REPORT.md`: entrega, testes efetivos e limitações.
- `artifacts/final/`: capturas reais e relatório JSON do navegador.

`npm.cmd run prepare:plant` reproduz o GLB compatível a partir de assets-source/plant-source.glb. A pasta assets-source contém o original para rastreabilidade e não é copiada para dist. Os arquivos de runtime são locais; nenhum serviço pago ou download externo é necessário para usar a cena.

O checkpoint completo fica em `checkpoint-before-rebuild-20261026-004552/`. Para recuperar, copie seus arquivos para a raiz somente depois de preservar as alterações atuais.

## Animações contínuas

As telas agora animam independentemente do scroll. Quatro projetos demonstrativos percorrem código, compilação, testes simulados e preview: dashboard, administração, automação e agendamento. Cada ciclo dura 64 s; o primeiro preview surge aproximadamente entre 29 e 34 s. O celular mostra a hora e a data locais reais com Date e Intl, sincronizadas por minuto, foco e visibilidade.

O exterior tem nuvens procedurais, chuva na GPU e gotas no material das vidraças existentes. Animações não essenciais pausam com movimento reduzido; aba oculta pausa o render loop. Dados de aplicações e notificações são fictícios e não fazem chamadas de rede.

Os monitores usam texturas 1920×1080, fontes maiores e contraste reforçado. A cena 4 preserva a resolução nativa para ler a estação. Sem query, o scroll continua livre; `/?progress=0.76` fixa o detalhe para inspeção.

`npm.cmd run check:animation` verifica os estados, os exemplos de código e o relógio em diferentes fusos. A entrega e as limitações atuais estão em `docs/ANIMATION_REPORT.md`; capturas reais em `artifacts/animations/`. O checkpoint anterior às animações fica em `checkpoint-before-animation-20261026-093322/`.
