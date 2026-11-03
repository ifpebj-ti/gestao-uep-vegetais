# =============================================================================
# Frontend Dockerfile — Multi-Stage Build com Nginx
# =============================================================================
# Este Dockerfile utiliza multi-stage build para:
#   1. Instalar dependências e compilar a aplicação frontend
#   2. Servir os arquivos estáticos via Nginx (imagem final leve)
#
# Compatível com: React, Next.js (export estático), Vue, Angular, Vite
# =============================================================================

# ---- Estágio 1: Instalação de dependências ----
FROM node:24-alpine AS deps

WORKDIR /app

# Copie os arquivos de manifesto de dependências
COPY package*.json ./

# Instale todas as dependências ignorando a trava do lockfile
RUN npm install

# ---- Estágio 2: Build da aplicação ----
FROM node:24-alpine AS builder

WORKDIR /app

ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Copie as dependências instaladas
COPY --from=deps /app/node_modules ./node_modules

# Copie o código-fonte
COPY . .

# Execute o build da aplicação
RUN npm run build

# ---- Estágio 3: Servir com Nginx ----
FROM nginx:1.27-alpine AS production

# Atualiza os pacotes da base Alpine para mitigar vulnerabilidades críticas do OpenSSL (CVE-2026-31789)
RUN apk update && apk upgrade --no-cache

# Remova a configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copie configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie os arquivos estáticos gerados pelo build
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponha a porta HTTP padrão
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Nginx roda em foreground
CMD ["nginx", "-g", "daemon off;"]