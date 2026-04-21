# Deploy — Invoice Dashboard no ZimaOS

## Visão Geral

O frontend React é empacotado em um container Docker com Nginx, servido na porta 3000 do ZimaOS. A API .NET roda separadamente no ZimaOS na porta 7086, e o Nginx faz proxy reverso das chamadas `/api/` para ela.

## Arquivos de Deploy

### Dockerfile

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN chmod -R +x node_modules/.bin
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

- `chmod -R +x node_modules/.bin` é necessário porque arquivos vindos do Windows perdem permissão de execução.

### nginx.conf

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://192.168.3.67:7086;
    }
}
```

> Ajuste o IP em `proxy_pass` se o endereço do ZimaOS mudar.

## Estrutura no ZimaOS

```
~/Documents/invoice-dashboard/
├── Dockerfile
├── nginx.conf
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── index.html
└── src/
    └── ...
```

Os arquivos são enviados via gerenciador de arquivos web do ZimaOS (Files) para a pasta `Documents`.

## Comandos de Deploy

### Pré-requisito (filesystem read-only do ZimaOS)

```bash
export DOCKER_CONFIG=/DATA/.docker
```

O ZimaOS tem o sistema de arquivos root como read-only. Essa variável redireciona a config do Docker para um local gravável. Use `sudo -E` para preservá-la.

### Primeiro deploy

```bash
cd ~/Documents/invoice-dashboard

# Construir a imagem
sudo -E docker build -t invoice-dashboard .

# Iniciar o container
sudo -E docker run -d -p 3000:80 --restart unless-stopped --name invoice-dashboard invoice-dashboard
```

### Atualizar após mudanças

```bash
cd ~/Documents/invoice-dashboard

# Parar e remover o container antigo
sudo -E docker stop invoice-dashboard
sudo -E docker rm invoice-dashboard

# Reconstruir a imagem
sudo -E docker build -t invoice-dashboard .

# Iniciar o novo container
sudo -E docker run -d -p 3000:80 --restart unless-stopped --name invoice-dashboard invoice-dashboard
```

### Comandos úteis

```bash
# Ver containers rodando
sudo docker ps

# Ver logs do container
sudo docker logs invoice-dashboard

# Parar o container
sudo docker stop invoice-dashboard

# Iniciar container parado
sudo docker start invoice-dashboard

# Remover container
sudo docker rm invoice-dashboard

# Remover imagem
sudo docker rmi invoice-dashboard
```

## Acesso

| Serviço   | URL                          |
| --------- | ---------------------------- |
| Frontend  | http://192.168.3.67:3000     |
| API .NET  | http://192.168.3.67:7086     |

## Problemas Encontrados e Soluções

| Problema | Solução |
| -------- | ------- |
| `unknown shorthand flag: 't' in -t` | Usar `sudo` antes do comando Docker |
| `mkdir /root/.docker: read-only file system` | Exportar `DOCKER_CONFIG=/DATA/.docker` e usar `sudo -E` |
| `sh: tsc: Permission denied` | Adicionar `RUN chmod -R +x node_modules/.bin` no Dockerfile |
| `502 Bad Gateway` | Alterar `proxy_pass` no nginx.conf de `localhost` para o IP real da API |
| `Dockerfile: no such file or directory` | Navegar para a pasta correta com `cd ~/Documents/invoice-dashboard` |

## Observações

- O `--restart unless-stopped` garante que o container reinicie automaticamente com o ZimaOS.
- Se a API .NET também for movida para Docker no futuro, usar `docker-compose` e trocar o `proxy_pass` para `http://api:8080`.
