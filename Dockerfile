# ---- Build stage: compila el sitio estático con Astro/Starlight ----
FROM node:24-slim AS build
WORKDIR /app

# pnpm (misma major que en local)
RUN npm install -g pnpm

# Instala dependencias con la lockfile (incluye pnpm-workspace.yaml que aprueba
# los build scripts de esbuild/sharp)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Chromium para renderizar los diagramas Mermaid a SVG durante el build.
# --with-deps instala también las librerías de sistema que Chromium necesita.
# Solo vive en esta etapa de build: la imagen final (nginx) NO lo incluye.
RUN pnpm exec playwright install --with-deps chromium

# Copia el resto y genera el build estático en /app/dist
# (Mermaid se renderiza aquí; el HTML resultante ya lleva los SVG embebidos)
COPY . .
RUN pnpm build

# ---- Runtime stage: sirve /app/dist con nginx ----
FROM nginx:alpine AS runtime

# Config propia (rutas multi-página de Starlight)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# El build estático va al docroot de nginx
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
