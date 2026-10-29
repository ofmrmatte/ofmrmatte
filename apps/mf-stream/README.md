# MF Stream 4.3.0

## Apresentação de destaques no fundo

- Início com cenário de largura total, dissolvência entre imagens e degradê para a biblioteca. Até oito filmes e séries da própria lista se alternam a cada nove segundos, sem duplicar versões HD/FHD e respeitando o controle parental.
- Imagens horizontais ocupam o cenário. Capas verticais são contidas por inteiro, com uma versão desfocada compondo a atmosfera ao fundo. Falhas de imagem mantêm o título e o fundo neutro, sem imagem quebrada.
- Anterior, próximo, contador e pausar/iniciar. Ao focar os controles ou ações pelo teclado, a rotação para até ser retomada; hover, outra aba, ficha aberta e destaque fora da tela suspendem o temporizador. Movimento reduzido começa pausado e remove a transição.
- A ação principal acompanha o título visível, abrindo a ficha correta do filme ou série. A apresentação usa o proxy autenticado de imagens e não faz consultas extras de metadados.
- Controles baseados nas [orientações de carrosséis da WAI](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/). Validação: 43 testes automatizados, incluindo seleção, bloqueios, rotação e pausa; revisão no navegador com catálogo fictício e layout mobile.


## Mini player persistente

- Clique fora ou use Minimizar para continuar assistindo enquanto navega pelo catálogo e abre outras fichas. O mesmo vídeo permanece montado, inclusive em PiP nativo.
- Restaurar retorna ao player sem recarregar. Fechar encerra a mídia; no mini player preserva a ficha que estiver aberta. Escape minimiza; sair da conta e alterações de proteção continuam encerrando a reprodução.
- Janela redimensionável pelo canto inferior no desktop, com limites da tela; tamanho compacto acima da navegação no celular.
- Fluxo conferido em navegador com vídeo de demonstração: tempo continua avançando ao minimizar, navegar e restaurar.

## Master Admin 4.2

- Painel exclusivo do proprietário em /admin com navegação por visão geral, usuários, conexão e histórico. Layout adaptado ao celular, campos com fonte de 16 px e cartões de contas em telas pequenas.
- Resumo real do banco: contas de espectadores, perfis, contas suspensas e sessões ainda válidas. A conta Master fica fora dos indicadores; sessões válidas não representam pessoas assistindo agora.
- Busca por nome ou e-mail, filtro de status, ordenação e paginação de 15 contas. A lateral de detalhes mostra os perfis e as datas das sessões, sem tokens nem preferências privadas.
- Suspensão, reativação e encerramento de sessões com confirmação. Suspender encerra os logins; os perfis, favoritos e progresso são preservados.
- Teste da conexão já salva, com resposta real do provedor, limite de conexões e validade quando informados. Alterar a lista exige validação e confirmação; senha salva nunca é devolvida pela API.
- Histórico persistente das últimas 50 ações administrativas, iniciado nesta versão. Índices para sessões e data dos eventos em SQLite/PostgreSQL. Nenhuma credencial ou histórico de reprodução é registrado na auditoria.
- Verificação: 40 testes automatizados, incluindo autorização das rotas administrativas, contagem de sessões, persistência da auditoria e preservação da conexão após validação recusada. Fluxos de suspensão/reativação conferidos no navegador com contas fictícias.

## Ficha unificada e reprodução contínua

- Filmes e séries abrem uma ficha com capa, sinopse, classificação e ações. Em séries, **Assistir · Ver episódios** revela temporadas e episódios dentro da mesma ficha, com uma única rolagem e sem outro popup.
- Abertura a partir do cartão e fechamento com GSAP servido pelo próprio app. Movimento reduzido respeitado. Referências de interação: [Morphing Dialog do 21st](https://21st.dev/@ibelick/components/morphing-dialog), [organização de títulos do Apple TV](https://itunespartner.apple.com/tv-movies/support/5408-apple-tv-app-overview) e navegação de temporadas dos streamers.
- No player personalizado do desktop, **Episódios** abre uma faixa compacta no rodapé, acima dos controles. No celular, a reprodução usa os controles nativos do vídeo e o player de sistema; a seleção de episódios permanece na ficha do aplicativo.
- Aviso no canto inferior nos últimos 15 segundos, com Assistir agora e Cancelar. A reprodução automática segue inclusive para outra temporada; pode ser desligada na lateral do player. A preferência fica separada por perfil e sincroniza com as demais preferências.
- Metadados recebidos agora atualizam a ficha. Links `/title/movie/ID` e `/title/series/ID` restauram o título após conectar. A consulta externa de classificação não atrasa a lista de episódios.
- Classificação complementar usa correspondência de título/ano, rejeita obras ambíguas, identifica país/fonte e mantém cache de resultados confirmados por 24 horas em `APP_DATA_DIR/ratings-cache.json`. Wikidata consulta [ClassInd/P3216](https://www.wikidata.org/wiki/Property:P3216) e MPA/P1657. Onde não há certificado confirmado, o app continua mostrando classificação não confirmada; certificados estrangeiros não são apresentados como brasileiros.
- Verificação: 38 testes automatizados, inclusive persistência do cache e rejeição de classificações ambíguas; fluxo em navegador com fonte fictícia e vídeo CC0, troca de temporada, retomada, passagem automática de T1 E2 para T2 E1 e faixa em tela cheia. Layout conferido em 320×568, 390×844 e 844×390, além do desktop.

## Mobile

- Formulários com fonte de 16 px, áreas de toque maiores, rolagem de teclado baseada na altura visual disponível e respeito aos recortes de tela. O zoom manual continua permitido.
- Biblioteca com cabeçalho alinhado, cartões proporcionais e navegação inferior. Capas da ficha são contidas por inteiro, com fundo desfocado; os episódios usam uma única rolagem.
- No celular, o vídeo usa controles nativos. No iPhone, a API webkitEnterFullscreen entrega o vídeo ao player do sistema; nos demais navegadores compatíveis, requestFullscreen é chamado no elemento de vídeo. O app não força tela cheia do site nem rotação por CSS. Se o sistema exigir novo gesto após carregar a mídia, aparece Abrir no player do aparelho. Veja as [orientações da Apple para vídeo](https://developer.apple.com/documentation/webkit/delivering-video-content-for-safari).
- A navegação de temporadas e episódios e a retomada ficam na ficha. Os controles exibidos no player nativo dependem do sistema operacional. A preferência de reprodução automática permanece por perfil.
- A verificação usou dimensões responsivas no navegador e testes das falhas das APIs de tela cheia/orientação. Não substitui validação em aparelhos físicos Android/iOS.

## Correções 4.1.1

- Removido o preview ao passar o mouse: clicar no cartão abre a ficha.
- Imagens de episódios passam pelo backend autenticado; falhas usam a capa da série e, por último, uma indicação limpa do número do episódio.
- A consulta complementar de classificação não depende do endpoint de detalhes do provedor. O ano decorativo no nome da lista não substitui a data de lançamento. As consultas identificam fila, indisponibilidade ou obra não encontrada; resultados confirmados mostram país e fonte. Não há garantia de certificado disponível para todo título nas fontes gratuitas.

## Contas, perfis e acesso permanente

- A lista é definida por `XTREAM_URL`, `XTREAM_USERNAME` e `XTREAM_PASSWORD` no ambiente do servidor. A instalação local já utiliza um `.env` privado; essas credenciais não fazem parte do repositório nem do JavaScript entregue ao navegador.
- Tela de login sem rolagem, com código de convite opcional no cadastro, sessão persistente de 30 dias e até cinco perfis por conta. Contas e senhas são geridas pelo Better Auth; não existe senha padrão.
- SQLite local em `.data/stream.sqlite` e PostgreSQL opcional por `DATABASE_URL`. Favoritos, histórico e progresso ficam separados por perfil e sincronizam com o servidor. A proteção parental vale para a conta inteira.
- Player Plyr com controles de ±10s, próximo episódio, volume, velocidade e tela cheia dentro do vídeo. HLS continua usando hls.js. Os controles são acessíveis por teclado e toque.
- Busca, título, atualização e ordenação em uma faixa compacta. Os cartões visíveis consultam metadados gradualmente e atualizam a classificação sem precisar abrir a ficha. Onde nenhuma fonte tiver correspondência confiável, aparece um traço com explicação; não são inventadas classificações.
- Testes automatizados cobrem autenticação, sessão após reabrir o banco, cadastro com e sem convite, isolamento de perfis, persistência de preferências e o fluxo Xtream. O login foi conferido em 320×568, 390×844, 844×390, 768×1024 e 1440×900.

Veja [DEPLOY_RAILWAY.md](DEPLOY_RAILWAY.md) para publicação do serviço separado do portfólio, armazenamento persistente e configuração das variáveis.

### Executar a versão 4

Node.js 22.13+ (recomendado 24), `npm ci` e `npm start`. Configure `.env` a partir de `.env.example` em uma instalação nova. Abra `http://localhost:3000`, clique em Criar sua conta e escolha o acesso da aplicação. As seções abaixo documentam também os recursos e o modo Xtream de desenvolvimento das versões anteriores.

## Player e continuidade

- Controles de retroceder/avançar 10 segundos e atalhos ← / → no player. Os limites do vídeo e os intervalos de DVR são respeitados; canais ao vivo sem DVR desabilitam esses controles.
- Botão Próximo episódio, com passagem entre temporadas e desativação no último episódio. A lateral permite escolher a temporada e identifica o episódio atual, os já assistidos e o progresso salvo. No celular, os episódios ficam abaixo do vídeo.
- Progresso salvo a cada três segundos, ao pausar, buscar, fechar o player ou sair da página. O botão Continuar retoma o episódio e o tempo salvo, inclusive após recarregar. Conteúdo com pelo menos 95% assistido é considerado concluído. O progresso fica neste navegador, separado por conta; não é sincronizado com outros dispositivos. A reprodução deve suportar busca por tempo para retomar.
- A classificação agora procura múltiplos campos e estruturas do provedor, incluindo certificados BR. Quando ausente, consulta a [API pública de busca da Apple](https://performance-partners.apple.com/search-api), preferindo o catálogo brasileiro e depois o dos EUA, com correspondência do título e do ano para filmes. Somente o título público e o ano são enviados, sem dados da conta Xtream. Há cache, limite de consultas e tolerância a falhas.
- A origem é exibida: por exemplo, TV-14 · US · Apple TV é uma classificação estrangeira, não uma classificação brasileira. Para o filtro parental, TV-14 usa 14 como referência; PG-13 usa 14 e R/TV-MA/NC-17 usam 18 de forma conservadora. G/PG/TV-PG não são transformados em idade brasileira. O botão Atualizar classificação refaz a consulta; títulos sem correspondência confiável continuam como Não informada.
- Validação: 25 testes automatizados, consulta real da classificação de Classroom of the Elite e teste em navegador com vídeo CC0 cobrindo ±10s, retomada após recarregar, troca de episódio e passagem de temporada.

## Biblioteca e proteção parental

- Navegação compacta, destaque com conteúdo da lista, fileiras de TV, filmes e séries e layout responsivo. Referências visuais: [Apple TV](https://www.apple.com/apple-tv-app/) e [21st](https://21st.dev/community/components). Transições de diálogo com [GSAP](https://gsap.com/docs/v3/), respeitando movimento reduzido; os diálogos funcionam também sem a CDN.
- Ficha do título com sinopse, classificação, gênero, duração, direção e elenco quando fornecidos pela API. Ausência de classificação aparece como NC / Não informada; a nota de avaliação não é usada como idade.
- Abra **Controle parental** no topo para criar um PIN de 4 a 8 dígitos. É possível ocultar +18, definir idade máxima e ocultar títulos sem classificação. As próximas alterações exigem o PIN atual. Cinco erros bloqueiam novas tentativas por cinco minutos; o bloqueio é compartilhado entre sessões da conta no mesmo processo.
- A API filtra os catálogos e bloqueia detalhes, reprodução direta e episódios restritos. Alterações invalidam os links temporários de mídia e encerram transmissões em andamento. A detecção de adulto usa metadados, nomes e categorias e não substitui uma classificação confiável do provedor.
- As preferências e somente o hash/salt do PIN são guardados em `.data/parental.json`, separados por conta. Não há armazenamento da senha Xtream. Mantenha esse diretório protegido e com backup. `PARENTAL_DATA_DIR` permite escolher o diretório; no Docker é `/data`. Em hospedagens como Railway, monte um volume persistente nesse caminho para preservar a proteção entre recriações e publicações. O produto pressupõe uma instância de servidor; múltiplas réplicas exigem armazenamento e limitação de tentativas compartilhados.
- Não existe recuperação automática do PIN nesta versão. A recuperação administrativa exige remover o registro da conta no arquivo de preferências com o servidor parado; proteja o acesso ao servidor.

**Validação 3.0:** testes automatizados cobrem persistência do PIN, limite de tentativas, filtragem de categorias e títulos, metadados, bloqueio de reprodução e propagação entre sessões. A biblioteca, a sinopse real e os diálogos foram conferidos no navegador. A reprodução de vídeo real não foi revalidada nesta atualização.

**Correção de conexão de 28/10/2026:** o callback de DNS agora suporta `all: true`, usado pela seleção automática de IPv4/IPv6 do Node 20 ou superior. Antes, a conexão por domínio podia falhar com `ERR_INVALID_IP_ADDRESS` antes de autenticar. O IP validado e o hostname HTTP/TLS são preservados. O Dockerfile também passou a copiar `lib/`, necessário para iniciar o servidor. Os 16 testes passaram, incluindo conexão por hostname, redirecionamento de domínio, login, catálogos, mídia, interrupção de loops e bloqueio de destinos privados. As portas dos testes agora são alocadas pelo sistema para evitar conflitos.

**Compatibilidade com redirecionamentos:** o app acompanha a mudança de domínio indicada pelo servidor quando o destino mantém o caminho `player_api.php` e todos os parâmetros originais, incluindo usuário, senha e ação. Cada destino passa novamente pela validação de DNS/IP, há limite de quatro redirecionamentos e conexões HTTPS não são rebaixadas para HTTP. Após autenticar, a sessão usa o endereço final para catálogos e mídia. Não é necessário editar a URL original ou adivinhar uma porta: HTTP sem porta utiliza 80 e HTTPS utiliza 443.

**Validação real:** o login com a URL original e as credenciais fornecidas retornou conta ativa no backend corrigido. Também foram carregadas as categorias de TV, filmes e séries e os canais de uma categoria. Nenhuma credencial foi gravada nos arquivos do projeto.

**Atualização de 28/10/2026:** o formulário Xtream agora inclui **Nome da lista** (padrão `iptv`) além de URL, usuário e senha. O nome é apenas uma identificação local: é guardado na sessão do aplicativo, mostrado na tela de conta e **não** é enviado ao provedor Xtream. A conexão agora tenta os endereços IP públicos validados em sequência e espera até 12 segundos por conexão. O cache do PWA foi renovado para evitar manter versões anteriores.

**Limite de validação:** os testes automatizados usam provedor Xtream simulado; o teste real confirmou autenticação, carregamento de dados e interface em navegador. A reprodução de vídeo real não foi revalidada nesta atualização. A existência do campo Nome da lista não influencia a autenticação da API. Nunca envie o relatório com usuário ou senha.

## Sobre o aplicativo

Player web **instalável como aplicativo (PWA)**, com interface para TV ao vivo, filmes e séries. O aplicativo não fornece canais ou catálogos: é necessário utilizar uma conta válida de um serviço autorizado que implemente Xtream Codes API.

## Funcionalidades

- Conexão usando **URL do servidor + usuário + senha** por `player_api.php`.
- Carregamento de categorias e catálogos de **TV ao vivo, filmes e séries**.
- Navegação por categorias, pesquisa, favoritos e histórico de exibição.
- Seleção de temporadas e episódios nas séries.
- Reprodução de vídeos compatíveis com navegador e transmissões HLS (`.m3u8`) via `hls.js`.
- Proxy integrado para streaming e HLS com chaves e segmentos reescritos, sem credenciais nas URLs retornadas ao frontend.
- Interface responsiva, tema escuro e identidade **MF Stream IPTV**.
- Instalação como PWA no Android, no Windows e em navegadores compatíveis; suporte de instalação no iPhone via menu Compartilhar > Adicionar à Tela de Início.
- Testes automatizados da API, normalização de dados, login, diagnósticos, catálogos e encaminhamento de mídia.
- Diagnóstico de conectividade sem transmitir credenciais e mensagens específicas para DNS, porta, timeout, bloqueios de API e incompatibilidade de resposta.

## Executar

Requisitos: Node.js 20 ou superior.

```bash
npm start
```

Abra `http://localhost:3000` no navegador. O servidor Node também é necessário quando usado como PWA instalado, pois faz as requisições da API Xtream. Apenas a interface básica fica disponível offline.

Para testes:

```bash
npm test
```

## Como conectar

1. Clique em **Conectar minha lista** ou **Minha conexão**.
2. Informe a **URL base do servidor** (por exemplo, `http://servidor.exemplo:8080`), sem `/player_api.php`, usuário ou senha na URL.
3. Informe o **usuário** e a **senha** e clique em **Entrar no MF Stream**.
4. Explore TV ao vivo, filmes, séries, categorias e favoritos.

A API deve responder à operação `player_api.php?username=...&password=...`. Os dados são obtidos da conta fornecida, sem listas pré-configuradas.

## Diagnosticar falha de acesso

Se o login não funcionar, clique em **Diagnosticar servidor**. O diagnóstico verifica o DNS, a porta e a resposta HTTP do endpoint `player_api.php` sem enviar usuário nem senha. O resultado não comprova que a conta é válida — isso só acontece após a autenticação.

- **DNS não encontrado:** domínio incorreto, removido ou temporariamente indisponível. Confirme com o provedor.
- **Conexão recusada:** host existe, mas serviço/porta não está aceitando conexões. Confirme se a URL deveria incluir `:PORTA`.
- **Tempo esgotado:** possível indisponibilidade, restrição de rede ou porta incorreta.
- **HTTP 401/403/404:** o servidor respondeu, mas pode estar bloqueando a API ou o caminho `player_api.php` não está disponível.
- **Resposta JSON inválida:** pode ser página HTML, painel ou portal que não implementa a API esperada.
- **Credenciais rejeitadas:** o painel respondeu explicitamente que o usuário e/ou senha não foram aceitos.

Este aplicativo **não tenta portas aleatórias** nem contorna bloqueios do provedor. Redirecionamentos compatíveis da própria API são seguidos automaticamente. Se o diagnóstico indicar DNS, conexão recusada ou serviço indisponível, confirme a URL com o provedor. O app permite conexões HTTP, mas nesses casos o trecho entre este servidor intermediário e o provedor não está criptografado. Prefira HTTPS quando oferecido pelo provedor.

## Instalar como app (PWA)

- **Android:** abra no Chrome, use o menu `⋮` > `Instalar aplicativo` ou o botão de instalação que o navegador oferecer.
- **Computador:** Chrome/Edge > botão de instalar aplicativo na barra de endereços ou menu de aplicativos.
- **iPhone:** Safari > Compartilhar > `Adicionar à Tela de Início`.

Para instalação fora de `localhost`, **é obrigatório publicar em HTTPS** e acessar pelo endereço seguro do aplicativo. O PWA é um aplicativo instalável com aparência de app, **não um APK ou um aplicativo nativo para Smart TV**.

## Publicar no Railway

O `Dockerfile` e o arquivo `railway.json` já estão preparados. Crie um projeto Railway vinculado ao repositório do MF Stream IPTV e use o domínio HTTPS gerado pela plataforma. `PORT` é definido automaticamente pelo Railway. A senha Xtream não deve ser adicionada como variável de ambiente; cada usuário informa suas credenciais no login.

Não configure `ALLOW_PRIVATE_XTREAM_HOSTS=1` em produção. Esse modo é exclusivamente para testes locais com um provedor fictício na rede privada.

## Segurança e privacidade

- O servidor **mantém as credenciais apenas na memória da sessão**, não em arquivos ou banco de dados. Reiniciar o processo encerra as sessões.
- O navegador armazena **somente o token de sessão em `sessionStorage`**; não salva a senha em `localStorage`.
- Favoritos e histórico são armazenados localmente e separados por conta e servidor.
- As transmissões são encaminhadas pelo backend por rotas temporárias. Evite compartilhar essas URLs: elas contêm o token de sessão, não a senha.
- O proxy recusa, por padrão, destinos DNS resolvidos para IPs locais ou reservados, para reduzir riscos de SSRF.
- O service worker não armazena nem intercepta dados da API, credenciais ou conteúdo de streaming.
- Recomendado usar um servidor Xtream via HTTPS quando disponível e **sempre hospedar o próprio app em HTTPS**.
- O produto não implementa autenticação de usuário própria ou permissões multiusuário; cada sessão Xtream corresponde ao usuário que se conectou.

## Limitações conhecidas

- A disponibilidade, legalidade e estabilidade dos streams dependem do serviço do usuário.
- Reprodução HLS depende de `hls.js` carregado da CDN ou do suporte nativo do navegador. O modo offline não reproduz vídeos.
- Arquivos MKV, AVI, DTS ou codecs incompatíveis com o navegador podem não reproduzir. EPG, Chromecast, controles remotos de Smart TV e APK Android nativo não estão implementados.
- Algumas listas exigem formato TS ou personalizações de rede e podem não ser compatíveis com HLS. A reprodução deve ser validada com uma conta Xtream legítima.
- A autenticação e os catálogos também foram verificados com uma conta real. Ainda é necessário validar a reprodução real e a experiência visual em dispositivos reais.

**Créditos:** MF Stream IPTV — Design e desenvolvimento por Matheus Ferreira.

## Versão 2.2 — correção do fluxo de conexão

- Diagnóstico detalhado de HTTP/HTTPS no mesmo domínio, com relatório copiável sem credenciais.
- Login apresenta diagnóstico automático se houver falha (não envia usuário nem senha durante o diagnóstico).
- DNS: usa resolução normal do sistema e, em caso de falha, tenta consulta DNS-over-HTTPS como contingência.
- A proteção de redirecionamentos foi atualizada na versão 2.3.2 para permitir mudanças de domínio que preservam a consulta Xtream. O bloqueio de downgrade de HTTPS para HTTP permanece.
- Se a URL original for HTTP sem porta e falhar por rede ou resposta inválida, verifica primeiro o endpoint HTTPS sem credenciais; somente se responder tenta autenticar por HTTPS.
- Service worker network-first para corrigir versões antigas presas no cache; janela de login com rolagem em telas menores.

**Limite externo:** nenhum software pode garantir a autenticação quando o domínio do provedor não resolve, a porta está fechada ou a API está desligada. Solicite ao provedor o hostname e a porta Xtream atuais se o relatório indicar erro de rede. O diagnóstico não testa portas arbitrárias nem tenta contornar restrições.

**Instalação de atualização:** atualize os arquivos do aplicativo, reinicie `npm start` e atualize o navegador com Ctrl+Shift+R. Para versões hospedadas, publique novamente o projeto. Os testes (`npm test`) usam um serviço Xtream simulado; o login e os catálogos da conta real também foram verificados nesta correção.
