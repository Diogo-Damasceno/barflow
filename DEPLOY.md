# Guia de Implantação — BarFlow

Documento para quem vai **hospedar** o BarFlow (você ou o cliente). Para o uso
do dia a dia, veja `GUIA_CLIENTE.md`.

---

## Pré-requisitos

- Docker + Docker Compose instalados (Linux, macOS ou Windows com WSL2).
- Uma porta livre para cada serviço: `3000` (site), `3001` (api), `5432` (banco).
  Se alguma estiver em uso, mude no `docker-compose.yml` (campo `ports`).
- (Recomendado) um domínio e proxy reverso (Nginx/Caddy) com HTTPS para expor
  o site ao cliente. Em localhost não precisa.

---

## 1. Subir tudo (um comando)

```bash
# na pasta do projeto (onde está o docker-compose.yml)
docker compose up -d --build
```

Isso sobe 3 containers:
- `barflow-pg` — banco Postgres (já cria o banco e aplica as tabelas)
- `barflow-api` — API NestJS (aplica migrations + popula dados demo + sobe)
- `barflow-web` — site Next.js (interface do usuário)

Primeira subida demora mais (baixa imagens e compila). As próximas são rápidas.

---

## 2. Verificar que está no ar

```bash
docker compose ps          # os 3 serviços devem estar "healthy"/"Up"
curl -s localhost:3001/docs >/dev/null && echo "API ok"
curl -s localhost:3000      >/dev/null && echo "Site ok"
```

Acesse no navegador: **http://localhost:3000**

Login de demonstração (já criado pelo seed):
- **E-mail:** `dono@barflow.dev`
- **Senha:** `SenhaForte@123`

> Troque essa senha assim que possível (ver seção "Segurança" abaixo).

---

## 3. Parar e reiniciar

```bash
docker compose stop              # pausa
docker compose up -d             # volta (sem rebuild)
docker compose down              # remove os containers (dados persistem no volume)
docker compose down -v           # remove TUDO, inclusive o banco (apaga dados!)
```

Os dados do banco ficam no volume `barflow_pg` e **não** somem ao parar.

---

## 4. Atualizar para uma nova versão

```bash
git pull
docker compose up -d --build
```

---

## 5. Segurança (antes de expor na internet)

Edite um arquivo `.env` na pasta (não versionado) com ao menos:

```env
JWT_SECRET=sua-frase-secreta-de-ao-menos-32-caracteres-aqui
JWT_REFRESH_SECRET=outra-frase-secreta-diferente-de-ao-menos-32
CORS_ORIGIN=https://seu-dominio.com
HTTPS=true
```

E altere a senha do usuário `dono@barflow.dev` pela tela de "trocar senha"
ou direto no banco. Nunca deixe `JWT_SECRET` em `change-me-...` em produção.

Recomendações:
- Expor apenas a porta 3000 (site) na internet; 3001 e 5432 ficam internas.
- Usar proxy reverso com TLS (HTTPS) na frente do site.
- Fazer backup periódico do volume `barflow_pg`.

---

## 6. Estrutura

```
barflow/
├── docker-compose.yml   # orquestra os 3 serviços
├── Dockerfile           # imagem da API
├── prisma/              # schema + migrations + seed
├── src/                 # código da API (NestJS)
└── web/                 # site (Next.js)
    ├── Dockerfile
    └── src/app/...      # telas (login, dashboard, produtos, receitas)
```

---

## 7. Logs e troubleshooting

```bash
docker compose logs -f api     # ver erros da API
docker compose logs -f web     # ver erros do site
docker compose restart api     # reinicia só a API
```

Erros comuns:
- **Porta em uso**: outra aplicação já usa 3000/3001/5432. Mude em `ports:`.
- **Banco não sobe**: apague o volume (`docker compose down -v`) e suba de novo.
- **Site não loga**: confirme que a API está em `http://api:3001` dentro da rede
  (já é o padrão do compose). Se rodar o site fora do Docker, ajuste
  `NEXT_PUBLIC_API_URL` no `web/.env.local`.
