# Invoice Dashboard — CI/CD e Deploy no ZimaOS

Data: Abril 2026
Projeto: Invoice Dashboard (React + Vite + Nginx)

## 1. Visão Geral da Arquitetura

```text
GitHub (master)
    |- CI (npm ci + build)
    |- CD (build/push imagem para GHCR)

ZimaOS
    |- docker run da imagem do GHCR
    |- (opcional) Watchtower para auto update
```

Imagem publicada automaticamente:

`ghcr.io/<owner-do-repo-em-lowercase>/invoice-dashboard:latest`

## 2. GitHub Actions (CI/CD)

### CI — .github/workflows/ci.yml

Executa em push e pull_request na branch master:

- npm ci
- npm run build

### CD — .github/workflows/cd.yml

Executa após CI bem-sucedido (workflow_run) na master:

- login no GHCR
- build da imagem via Dockerfile da raiz
- push para GHCR com tag latest

## 3. Arquivos de Pipeline

- .github/workflows/ci.yml
- .github/workflows/cd.yml

## 4. Pré-requisitos no GitHub

- Repositório com Actions habilitado
- Pacote publicado no GHCR (package do repositório)
- Se o pull no ZimaOS for sem autenticação, deixar o pacote Public no GHCR

Observação: o workflow usa GITHUB_TOKEN com permissão packages: write, sem necessidade de criar token manual para o push.

## 5. Comandos de Deploy no ZimaOS

### 5.1 Primeiro setup (rodar uma vez)

```sh
# Evita erro de filesystem read-only no ZimaOS
export DOCKER_CONFIG=/tmp

# Baixar e subir a imagem publicada pelo CD
sudo -E docker pull ghcr.io/<owner-do-repo-em-lowercase>/invoice-dashboard:latest
sudo -E docker run -d \
    --name invoice-dashboard \
    -p 3000:80 \
    --restart unless-stopped \
    ghcr.io/<owner-do-repo-em-lowercase>/invoice-dashboard:latest
```

### 5.2 Atualização manual (sem Watchtower)

```sh
export DOCKER_CONFIG=/tmp
sudo -E docker pull ghcr.io/<owner-do-repo-em-lowercase>/invoice-dashboard:latest
sudo -E docker stop invoice-dashboard
sudo -E docker rm invoice-dashboard
sudo -E docker run -d \
    --name invoice-dashboard \
    -p 3000:80 \
    --restart unless-stopped \
    ghcr.io/<owner-do-repo-em-lowercase>/invoice-dashboard:latest
```

### 5.3 Auto update (opcional) com Watchtower

```sh
export DOCKER_CONFIG=/tmp

sudo -E docker run -d \
    --name watchtower \
    --restart unless-stopped \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -e WATCHTOWER_POLL_INTERVAL=300 \
    -e WATCHTOWER_CLEANUP=true \
    containrrr/watchtower
```

Com isso, quando o CD publicar uma nova imagem latest, o Watchtower detecta e recria o container automaticamente.

### 5.4 Usando docker-compose.yml (API + Frontend + Watchtower)

Se voce estiver usando o compose no ZimaOS, atualize o servico frontend para usar imagem do GHCR (em vez de build local):

```yaml
version: "3"
services:
    api:
        image: ghcr.io/andrericarti/cardledger-api:latest
        ports:
            - "7086:8080"
        volumes:
            - api-data:/app/data
        restart: unless-stopped

    frontend:
        image: ghcr.io/andrericarti/invoice-dashboard:latest
        ports:
            - "3001:80"
        depends_on:
            - api
        restart: unless-stopped

    watchtower:
        image: containrrr/watchtower
        volumes:
            - /var/run/docker.sock:/var/run/docker.sock
        environment:
            - WATCHTOWER_POLL_INTERVAL=300
            - WATCHTOWER_CLEANUP=true
        restart: unless-stopped

volumes:
    api-data:
```

### 5.5 Comandos executados no ZimaOS (compose)

```sh
export DOCKER_CONFIG=/tmp
cd ~/Documents
sudo -E docker compose -f docker-compose.yml pull frontend
sudo -E docker compose -f docker-compose.yml up -d frontend
sudo docker ps
```

Se aparecer `no configuration file provided: not found`, voce esta fora da pasta do arquivo compose.

Use:

```sh
find ~ -name "docker-compose.yml"
sudo -E docker compose -f /caminho/encontrado/docker-compose.yml pull frontend
sudo -E docker compose -f /caminho/encontrado/docker-compose.yml up -d frontend
```

## 6. Verificação

```sh
sudo docker ps
sudo docker logs --tail 100 invoice-dashboard
sudo docker logs --tail 100 watchtower
```

## 7. Acesso

- Frontend: http://IP-DO-ZIMA:3000
- API: ajustar proxy_pass no nginx.conf para o IP/porta corretos da API

## 8. Problemas Comuns

- Erro /root/.docker read-only: usar DOCKER_CONFIG=/tmp e sudo -E
- 502 Bad Gateway: revisar proxy_pass no nginx.conf
- Permission denied no build: manter RUN chmod -R +x node_modules/.bin no Dockerfile
- no configuration file provided: not found: executar o compose na pasta correta ou usar -f com caminho completo

