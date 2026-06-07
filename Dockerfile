# ---- Build stage: compila el sitio estático con Astro/Starlight ----
# Imagen oficial de bun (Debian) — necesaria para que `playwright --with-deps`
# pueda instalar las librerías de sistema de Chromium vía apt.
FROM oven/bun:1 AS build
WORKDIR /app

# Instala dependencias con la lockfile. Los scripts de esbuild/sharp se ejecutan
# porque están en "trustedDependencies" de package.json.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Chromium para renderizar los diagramas Mermaid a SVG durante el build.
# --with-deps instala también las librerías de sistema que Chromium necesita.
# Solo vive en esta etapa de build: la imagen final (nginx) NO lo incluye.
RUN bunx playwright install --with-deps chromium

# Copia el resto y genera el build estático en /app/dist
# (Mermaid se renderiza aquí; el HTML resultante ya lleva los SVG embebidos)
COPY . .
RUN bun run build

# ---- Runtime stage: sirve /app/dist con nginx ----
FROM nginx:alpine AS runtime

# Config propia (rutas multi-página de Starlight)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# El build estático va al docroot de nginx
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
