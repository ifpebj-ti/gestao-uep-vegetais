# =============================================================================
# Backend Dockerfile — Multi-Stage Build Template
# =============================================================================
# Este Dockerfile utiliza multi-stage build para otimizar o tamanho da imagem
# final. Adapte os estágios conforme a tecnologia escolhida para o backend.
#
# Opções de stack suportadas (descomente a seção desejada):
#   - Node.js (Express / NestJS / Fastify)
#   - Python (Flask / FastAPI / Django)
#   - Java (Spring Boot / Quarkus)
# =============================================================================

# ---------------------------------------------------------------------------
# Opção 1: Node.js (padrão ativo)
# ---------------------------------------------------------------------------

# ---- Estágio 1: Instalação de dependências ----
FROM node:20-alpine AS deps

WORKDIR /app

# Copie os arquivos de manifesto de dependências
COPY package*.json ./

# Instale apenas dependências de produção
RUN npm ci --only=production

# ---- Estágio 2: Build da aplicação ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copie o código-fonte
COPY . .

# Execute o build
RUN npm run build

# ---- Estágio 3: Imagem final de produção ----
FROM node:20-alpine AS production

WORKDIR /app

# Atualiza pacotes do sistema e o npm para mitigar vulnerabilidades críticas do Trivy
RUN apk update && apk upgrade --no-cache && rm -rf /usr/local/lib/node_modules/npm

# Crie um usuário não-root para segurança
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copie dependências de produção do estágio 'deps'
COPY --from=deps /app/node_modules ./node_modules

# Copie o código/build do estágio 'builder'
COPY --from=builder /app .

# Altere para o usuário não-root
USER appuser

# Exponha a porta da API
EXPOSE 8080

# Health check básico
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Comando de inicialização
CMD ["node", "dist/server.js"]

# ---------------------------------------------------------------------------
# Opção 2: Python (Flask / FastAPI / Django) — DESCOMENTE ABAIXO
# ---------------------------------------------------------------------------
# FROM python:3.12-slim AS builder
# WORKDIR /app
# COPY requirements.txt .
# RUN pip install --no-cache-dir --prefix=/install -r requirements.txt
#
# FROM python:3.12-slim AS production
# WORKDIR /app
# RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
# COPY --from=builder /install /usr/local
# COPY . .
# USER appuser
# EXPOSE 8080
# HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
#   CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/health')" || exit 1
# CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]

# ---------------------------------------------------------------------------
# Opção 3: Java / Spring Boot — DESCOMENTE ABAIXO
# ---------------------------------------------------------------------------
# FROM maven:3.9-eclipse-temurin-21 AS builder
# WORKDIR /app
# COPY pom.xml .
# RUN mvn dependency:go-offline -B
# COPY src ./src
# RUN mvn package -DskipTests -B
#
# FROM eclipse-temurin:21-jre-alpine AS production
# WORKDIR /app
# RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# COPY --from=builder /app/target/*.jar app.jar
# USER appuser
# EXPOSE 8080
# HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
#   CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1
# CMD ["java", "-jar", "app.jar"]