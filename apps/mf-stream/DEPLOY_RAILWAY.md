# MF Stream no Railway

O aplicativo é um serviço independente do site do portfólio. No repositório `ofmrmatte/ofmrmatte`, seu código fica em `apps/mf-stream/`. Não substitua o serviço `ofmrmatte` existente.

## Serviço

1. O serviço **mf-stream** está preparado no projeto **Portfólio**, a partir de `ofmrmatte/ofmrmatte`, branch `mf-stream-deploy`. Esse ramo contém a exportação independente do aplicativo na raiz, com seu próprio `railway.json` e Dockerfile.
2. Deixe **Root Directory** na raiz nesse ramo. O Dockerfile usa Node 24 e instala pelo lockfile. O código de desenvolvimento continua em `main/apps/mf-stream`; ao publicar uma nova versão, atualize também a exportação no ramo de deploy. Alternativamente, após existir uma instância do serviço, é possível apontá-lo para `main` com Root Directory `/apps/mf-stream` e Config File `/apps/mf-stream/railway.json`.
3. Monte um volume persistente em `/data`. O app usa SQLite automaticamente para contas, sessões, perfis e preferências; os dados permanecem no volume.
4. Configure as variáveis abaixo, antes de publicar. O endpoint de saúde é `/healthz`; `PORT` é fornecido pelo Railway. Gere o domínio HTTPS do novo serviço.

| Variável | Valor |
| --- | --- |
| APP_AUTH_ENABLED | `1` |
| XTREAM_URL | URL da lista, configurada apenas no servidor |
| XTREAM_USERNAME | Usuário do provedor |
| XTREAM_PASSWORD | Senha do provedor |
| BETTER_AUTH_SECRET | Segredo aleatório de pelo menos 32 caracteres, estável entre deploys |
| REGISTRATION_CODE | Código aleatório privado para criar contas por convite |
| APP_DATA_DIR | `/data` |
| PARENTAL_DATA_DIR | `/data` |
| NODE_ENV | `production` |
| BETTER_AUTH_URL | Domínio HTTPS do serviço; pode ser omitido se `RAILWAY_PUBLIC_DOMAIN` estiver disponível |

O código e `.env.example` são públicos. `.env`, os bancos, segredos e relatórios locais não são publicados no Git.

## PostgreSQL opcional

Railway hospeda PostgreSQL; a autenticação dos espectadores é feita pelo **Better Auth dentro deste aplicativo**. Para usar Postgres em lugar de SQLite, adicione um serviço Postgres e configure `DATABASE_URL=${{Postgres.DATABASE_URL}}`. As tabelas são migradas automaticamente ao iniciar. Mantenha o volume `/data` para as preferências parentais. A troca não importa automaticamente contas de um SQLite existente: faça backup e uma migração de dados antes de trocar o banco de uma instalação em uso.

## Primeiro acesso

- Localmente, `http://localhost:3000` permite criar o primeiro acesso sem convite. Escolha seu e-mail e uma senha de pelo menos dez caracteres.
- Na hospedagem, clique em **Criar acesso** e use o valor privado de `REGISTRATION_CODE` configurado no Railway. O primeiro usuário é administrador. Não há cadastro público aberto nem senha padrão.
- Cada conta pode criar até cinco perfis. Favoritos, episódio selecionado e progresso são salvos por perfil no banco. O login usa cookie HttpOnly com sessão de 30 dias.
- A proteção parental pertence à conta e vale para todos os seus perfis. Perfis não são contas de autenticação separadas.
- SMTP e recuperação de senha por e-mail não estão configurados nesta versão. Proteja o acesso administrativo ao banco e mantenha backups.

## Publicação e conferência

`npm ci`, `npm test`, iniciar o serviço e conferir `/healthz`. Abra o domínio HTTPS, crie o acesso por convite e escolha um perfil. Reinicie a implantação e confirme que a sessão e o progresso continuam disponíveis. O servidor de streaming precisa permitir requisições originadas da região do Railway; testes locais não garantem a disponibilidade do provedor a partir da nuvem.

Use uma réplica enquanto a proteção parental e os limites de consultas estiverem no processo/volume. Os streams usam o backend como proxy: CPU, tráfego e limites de conexões do provedor continuam se aplicando.
