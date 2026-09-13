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
FROM node:20-alpine AS deps

WORKDIR /app

# Copie os arquivos de manifesto de dependências
COPY package*.json ./

# Instale todas as dependências (incluindo devDependencies para o build)
RUN npm ci

# ---- Estágio 2: Build da aplicação ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copie as dependências instaladas
COPY --from=deps /app/node_modules ./node_modules

# Copie o código-fonte
COPY . .

# Defina variáveis de ambiente para o build (ajuste conforme necessário)
# ENV NEXT_PUBLIC_API_URL=http://localhost:8080
# ENV VITE_API_URL=http://localhost:8080

# Execute o build da aplicação
# Para React (CRA):   npm run build  → gera /app/build
# Para Next.js:       npm run build  → gera /app/.next ou /app/out (com export)
# Para Vite:          npm run build  → gera /app/dist
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
# Ajuste o caminho de origem conforme o framework utilizado:
#   React (CRA):  --from=builder /app/build
#   Next.js:      --from=builder /app/out
#   Vite:         --from=builder /app/dist
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponha a porta HTTP padrão
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Nginx roda em foreground
CMD ["nginx", "-g", "daemon off;"]