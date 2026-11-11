# Consumo por Convicção

MVP full-stack, responsivo, em português do Brasil, com diretório por cidade/UF e publicação exclusivamente após moderação de fontes institucionais.

## Funcionalidades

- Diretório público por nome, cidade, estado, categoria e classificação de pauta progressista **somente após verificação humana**.
- Envio anônimo de estabelecimento com fonte HTTPS pública, protocolo, deduplicação, validação de dados e limite de 5 envios por hora por IP (hash HMAC).
- Contestação anônima e solicitação de correção/remoção.
- Administração com login privado, senha forte armazenada com PBKDF2, gestão de envios, revisão, edição, arquivamento e log de auditoria.
- Base vazia por padrão; dados privados de envios e contestações nunca aparecem no diretório.
- Proteção CSRF nos formulários e cookies de sessão HttpOnly/SameSite. Em produção, cookies Secure.

## Execução local

Requer Python 3.10+.

```bash
python -m venv .venv
# Linux/Mac: source .venv/bin/activate
# Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
python app.py init-db
python app.py create-admin admin@seudominio.com
uvicorn app:app --host 0.0.0.0 --port 8000
```

Acesse `http://localhost:8000`. Área de moderação: `http://localhost:8000/admin`. **Não há login ou senha padrão.**

## Hospedagem em Railway (Docker)

1. Suba esta pasta para um repositório Git. Configure a Railway para construir pelo Dockerfile.
2. Crie as variáveis `APP_ENV=production`, `SECRET_KEY=<token-aleatorio-hex-com-64-caracteres>` e `DATABASE_PATH=/data/site.sqlite`.
3. Monte um volume persistente no caminho `/data` (sem volume, os cadastros se perdem no redeploy).
4. Publique a aplicação e faça `python app.py create-admin contato@seudominio.com` em um terminal seguro no ambiente Railway. Nunca coloque a senha em código nem em commit.
5. Aponte domínio próprio, habilite HTTPS e revise política de privacidade, monitoramento e backups antes da operação pública.

## Limitações e próximos passos para produção pública

Este é um **MVP**, não um sistema com auditoria completa de produção. É necessário testar o deploy HTTPS e executar análise de segurança, reforçar antifraude com CAPTCHA, criar trilha de evidências para moderação, implementar verificação de cidades pela base do IBGE, configurar responsável de LGPD, política de retenção de dados e backup externo. SQLite requer volume persistente e uma única instância de escrita; para escalar, migrar para PostgreSQL.

A classificação editorial nunca deve inferir ideologia de pessoas físicas. Somente manifestações públicas oficiais das próprias empresas podem servir de fonte.

## GitHub e integração contínua

O projeto é independente e não requer ferramentas de criação de sites de terceiros para desenvolver, testar ou executar.

A pasta `.github/workflows/tests.yml` executa validação Python e testes automatizados a cada push ou pull request. O banco SQLite, as senhas e os dados locais estão excluídos pelo `.gitignore`.

Para publicar no GitHub, envie o conteúdo desta pasta à raiz de um repositório dedicado ao projeto. Não misture os arquivos com repositórios de aplicações diferentes.

## Organização dentro do monorepo AUREON

Este aplicativo está isolado em `apps/consumo-por-conviccao/` no repositório `ofmrmatte/AUREON`. A inclusão no monorepo **não altera** `apps/aureon-site/`, `apps/api/` ou seus serviços e builds existentes.

Para executar diretamente da raiz do repositório:

```bash
cd apps/consumo-por-conviccao
python -m venv .venv
source .venv/bin/activate # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt pytest httpx
python -m pytest -q
python app.py init-db
python app.py create-admin admin@seudominio.com
uvicorn app:app --host 127.0.0.1 --port 8000
```

Na Railway, crie **um serviço independente** usando o mesmo repositório/branch. Defina o `Root Directory` como `apps/consumo-por-conviccao`, com seu próprio Dockerfile, variáveis de ambiente, volume e domínio. Não altere o diretório raiz nem o Dockerfile dos serviços já existentes. A inclusão neste repositório **não publica** o aplicativo automaticamente no serviço do portfólio.

Os testes da aplicação rodam pela workflow `.github/workflows/consumo-por-conviccao.yml` na raiz do monorepo.
