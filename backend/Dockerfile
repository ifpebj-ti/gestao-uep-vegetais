# =============================================================================
# Backend Dockerfile — Java / Spring Boot (Multi-Stage Build)
# =============================================================================
# Estágio 1: Build Maven com cache de dependências
# Estágio 2: Imagem final JRE 21 Alpine (mínima)
# =============================================================================

# ---- Estágio 1: Build da aplicação com Maven ----
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

# Copia apenas o pom.xml primeiro para cachear download de dependências
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copia o código-fonte e empacota o JAR
COPY src ./src
RUN mvn package -DskipTests -B

# ---- Estágio 2: Imagem final de produção ----
FROM eclipse-temurin:21-jre-alpine AS production

WORKDIR /app

# Crie um usuário não-root para segurança
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copie o JAR do estágio builder
COPY --from=builder /app/target/*.jar app.jar

# Altere para o usuário não-root
USER appuser

# Exponha a porta da API
EXPOSE 8080

# Health check via Spring Boot Actuator
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Comando de inicialização
CMD ["java", "-jar", "app.jar"]