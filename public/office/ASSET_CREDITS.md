# Créditos dos assets — Atelier / Developer Office

## Planta em vaso (modelo e texturas PBR embutidas)

- Asset específico: **Diffuse Transmission Plant**.
- Origem do arquivo utilizado: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/DiffuseTransmissionPlant
- Download original, exclusivamente pelo GitHub: https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DiffuseTransmissionPlant/glTF-Binary/DiffuseTransmissionPlant.glb
- Licença da adaptação distribuída pelo Khronos: **Creative Commons Attribution 4.0 International (CC BY 4.0)** — https://creativecommons.org/licenses/by/4.0/
- © 2024 Darmstadt Graphics Group GmbH. **Eric Chadwick**: materiais e animação.
- Modelo original: **Rico Cilliers**, © 2021, **CC0 1.0** — https://creativecommons.org/publicdomain/zero/1.0/
- O README específico do asset identifica essas duas contribuições e licenças. Uma cópia foi preservada em `public/models/plant/SOURCE.md`.
- Arquivo original preservado: `assets-source/plant-source.glb`.
- SHA-256 original: `1748be8847e24bdd5cb6c5ac2bfd0afe8f11efc4f85091148550555e47c7ee83`.
- Arquivo importado pela cena: `public/models/plant/plant.glb` (aproximadamente 5,75 MB).
- Modificações locais: remoção das animações, câmeras, luzes e nós de vagalumes; preservação de vaso, folhas e substrato; remoção de `KHR_materials_diffuse_transmission`, não suportada pelo Three.js r169 instalado; mapas PBR de base preservados; escala e origem ajustadas em runtime. Script reproduzível: `scripts/prepare-plant.mjs`.
- Nenhum endosso dos autores ao projeto é sugerido.

As texturas dessa planta foram obtidas **embutidas no GLB hospedado no GitHub**. Nenhuma textura foi baixada de outros sites.

## Conteúdo procedural criado neste projeto

Arquitetura, caixilhos, vidro, persiana, skyline 3D, mesa, braços dos monitores, cadeira, estante, livros, cerâmicas, escultura, acessórios e planta de fallback são modelados por código. Madeira, normal maps, roughness, reboco mineral, tecido, couro, metal escovado, páginas e folhas são gerados localmente. Não há fotografias externas, HDRIs remotos, serviços pagos ou fontes web remotas.

Os materiais procedurais de madeira, piso, tecido e reboco permanecem candidatos à substituição por digitalizações PBR licenciadas. A vegetação pequena também pode receber outro GLB com licença adequada.

## Fontes pesquisadas

- https://github.com/KhronosGroup/glTF-Sample-Assets — licenças individuais verificadas no README do modelo importado; a licença geral do repositório não foi usada como licença de todos os assets.
- https://github.com/Poly-Haven/Public-API — consultado como solicitado. O repositório contém o serviço da API; nenhum código AGPL ou arquivo de textura desse serviço foi incorporado. Não foram usados downloads de texturas por URLs fora do GitHub.

As bibliotecas npm mantêm suas licenças originais nos respectivos pacotes. Este documento não altera a licença do código preexistente do projeto.
