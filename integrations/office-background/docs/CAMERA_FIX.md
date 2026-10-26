# Câmera, encerramento e logo do portfólio

A câmera fica completamente estática nos primeiros 50% da rolagem. Na segunda metade, a timeline aproxima a estação por deslocamento espacial real e termina em uma composição ampla centralizada. A logo do Hero usa novamente o SVG original em 440 px no desktop, 290 px no tablet e 230 px no celular, sem animação de subida.

## Arquivos

| Arquivo | Comportamento |
| --- | --- |
| `app/components/PortfolioDepthExperience.tsx` | Timeline principal `office-cinematic-scroll`, scrub, sincronização com o iframe, recálculo responsivo e retirada da máscara/interface. |
| `app/page.tsx` | Trecho `#imersao` após o contato e encerramento `#escritorio`, sem cartões sobre a cena. |
| `app/office-studio.css` | Dimensões originais da logo e seções transparentes, com assinatura institucional discreta. |
| `integrations/office-background/src/App.tsx` | Recebe `office:scroll` apenas do pai e da mesma origem; limita os valores a 0–1. |
| `src/office-3d/components/CinematicCameraRig.tsx` da integração | Curvas de posição/alvo, rotação por quaternion, FOV fixo e câmera sem deriva autônoma. |
| `src/office-3d/OfficeExperience.tsx` da integração | Evita atualizações do HUD invisível durante a rolagem. |
| `public/office/` | Build do runtime isolado React 18 / Three.js. |

## Percurso

Até a metade do documento, o progresso da câmera é 0. Da metade até o início de `#escritorio`, o progresso percorre os cinco pontos da curva. A passagem `#imersao` permite ver a estação de perto depois que os cartões e o contato saem da viewport. O enquadramento final chega em progresso 1 e permanece estabilizado durante os 160svh finais. Subir a página reproduz o mesmo caminho ao contrário.

Desktop: `[2.6, 1.78, 3.7]` → `[0.28, 1.55, 0.92]` → `[0, 1.82, 4.5]`, FOV 48°. Mobile: `[1.6, 1.65, 4.7]` → `[0.52, 1.65, 0.85]` → `[0, 1.66, 5.2]`, FOV 54°. A aproximação não usa escala CSS nem alteração de FOV. Com movimento reduzido, são usadas composições estáticas e um corte para a composição final.

## Assets e iluminação

Nesta correção foram preservados o mobiliário, os materiais e a iluminação já presentes na cena. A planta GLB deriva de DiffuseTransmissionPlant, da coleção Khronos, com escala física normalizada e atribuição em `ASSET_CREDITS.md`. Mesa, cadeira, livros e periféricos mantêm suas geometrias detalhadas existentes e os mapas PBR de cor, rugosidade e normais; não foram adicionados novos assets externos.

Permanecem o ambiente de reflexão estático gerado com Lightformers, preenchimento hemisférico, luz direcional, area lights, sombras reaproveitadas, tone mapping ACES e saída sRGB. Os monitores continuam em 1920×1080, o notebook em 1536×960, e as animações das telas continuam independentes do tempo de navegação. O orçamento do fundo permanece limitado a 30 fps no desktop e 24 no celular, sem garantia de desempenho igual em todos os dispositivos.

## Verificação

`CAMERA_BROWSER_TESTS.json` registra 13 amostras por perfil, desktop 1440×900 e mobile 390×844: Hero, primeiras seções, metade, início de movimento, aproximação, entrada, foco nos monitores, revelação, chegada final, pausa final e percurso inverso. Foram verificados posição física, FOV constante, ausência de deriva, logo responsiva, visibilidade dos monitores sem contato/máscara sobrepostos, cena final sem cabeçalho/rodapé, navegação e movimento reduzido.

As caixas dos móveis principais não interceptam os pontos de câmera amostrados; isso complementa a inspeção visual e não representa uma prova de colisão por triângulo de toda a cena. O relatório registra zero erros de console e zero falhas de carregamento. Capturas reais foram feitas no navegador, inclusive no detalhe dos monitores e no encerramento.
