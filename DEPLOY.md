# Invoice Dashboard — CI/CD e Deploy no ZimaOS

**Data:** Maio 2026
**Projeto:** Invoice Dashboard (React + Vite + Nginx)

---

## 1. Visão Geral da Arquitetura

```text
GitHub (master)
  ├─ CI (npm ci + build)
  └─ CD (build/push imagem para GHCR)

GHCR (Container Registry)
  └─ invoice-dashboard:latest

ZimaOS (/DATA/Backup/projects/invoice)
  ├── docker-compose.yml
  ├── Frontend (container)
  ├── API (container)
  └── Watchtower (auto update)
```

---

## 2. Tecnologias Utilizadas

* React + Vite
* Nginx (servindo build)
* Docker
* GitHub Actions (CI/CD)
* GHCR (container registry)
* Watchtower (auto deploy)
* Portainer (monitoramento)

---

## 3. GitHub Actions (CI/CD)

### CI — `.github/workflows/ci.yml`

Executa em `push` e `pull_request` na `master`:

* `npm ci`
* `npm run build`

---

### CD — `.github/workflows/cd.yml`

Executa após CI com sucesso:

* login no GHCR
* build da imagem Docker
* push para:

```text
ghcr.io/<owner-do-repo>/invoice-dashboard:latest
```

---

## 4. Estrutura no ZimaOS

Os arquivos ficam em:

```text
/DATA/Backup/projects/invoice
```

> ⚠️ Não usar `~/Documents` ou `AppData` (podem ser apagados em updates)

---

## 5. docker-compose.yml

```yaml
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
      - "3000:80"
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

---

## 6. Deploy no ZimaOS

### Subir containers

```sh
cd /DATA/Backup/projects/invoice

export DOCKER_CONFIG=/tmp
sudo -E docker compose up -d
```

---

### Atualização manual

```sh
export DOCKER_CONFIG=/tmp
sudo -E docker compose pull frontend
sudo -E docker compose up -d frontend
```

---

## 7. Acesso

| Serviço  | URL                    |
| -------- | ---------------------- |
| Frontend | http://IP-DO-ZIMA:3000 |

---

## 8. Comunicação com a API

Atualmente o frontend acessa a API diretamente via URL:

```text
http://IP-DO-ZIMA:7086/api/...
```

> ⚠️ Sem proxy configurado no Nginx, chamadas para `/api` no frontend resultarão em 404.

---

## 9. Auto Deploy (Watchtower)

Fluxo:

1. `git push` na master
2. GitHub Actions executa CI/CD
3. Nova imagem publicada no GHCR
4. Watchtower detecta nova versão
5. Container do frontend é recriado automaticamente

---

### Logs do Watchtower

```sh
sudo docker logs -f invoice-watchtower-1
```

Exemplo:

```text
Found new ghcr.io/.../invoice-dashboard:latest
Stopping container
Creating container
```

---

## 10. Monitoramento com Portainer

Acesso:

```text
http://IP-DO-ZIMA:9000
```

Permite:

* visualizar containers
* acompanhar logs em tempo real
* monitorar atualizações
* reiniciar containers

---

## 11. Verificação

```sh
sudo docker ps
sudo docker logs --tail 100 invoice-frontend-1
sudo docker logs --tail 100 invoice-watchtower-1
```

---

## 12. Problemas Comuns

| Problema                  | Causa              | Solução                   |
| ------------------------- | ------------------ | ------------------------- |
| `/api` retorna 404        | sem proxy no Nginx | usar URL completa da API  |
| frontend não atualiza     | cache do navegador | CTRL + F5                 |
| imagem não atualiza       | GHCR cache         | forçar pull               |
| `/root/.docker` read-only | ZimaOS protegido   | usar `DOCKER_CONFIG=/tmp` |
| containers não sobem      | permissão pasta    | usar `chown`              |

---

## 13. Observações Importantes

* Não é necessário copiar código para o ZimaOS
* O deploy usa imagens Docker prontas (GHCR)
* Estrutura resiliente a perda de arquivos locais
* Watchtower garante atualização automática

---

## 14. Próximos Passos (Melhorias)

* Configurar proxy Nginx (`/api`)
* Usar versionamento de imagem (evitar `latest`)
* Configurar HTTPS (Let's Encrypt)
* Adicionar versão visível no frontend (ex: build version)