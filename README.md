# CRS Docs

Documentación técnica del ecosistema **CRS** (Courier & Logistics Management), construida con
[Astro](https://astro.build) + [Starlight](https://starlight.astro.build).

Cubre los backends y aplicaciones del ecosistema: `crs-backend`, `crs-delivery`, `crs-go` y el
panel/app de motorizados.

## Requisitos

- [Bun](https://bun.sh) 1.3+ (gestor de paquetes y runner del build).

## Desarrollo

```sh
bun install     # instala dependencias
bun run dev     # servidor local en http://localhost:4321
```

| Comando | Acción |
| :-- | :-- |
| `bun install` | Instala dependencias |
| `bun run dev` | Servidor de desarrollo en `localhost:4321` |
| `bun run build` | Build estático de producción en `./dist/` |
| `bun run preview` | Previsualiza el build localmente |

## Estructura

```
src/
├── assets/                 # logos de marca (claro/oscuro)
├── content/docs/           # las páginas de documentación (.md / .mdx)
│   ├── index.mdx           # portada
│   └── backend/            # docs de crs-backend (autenticación, autorización, ...)
├── styles/                 # tema de marca (theme.css) y diagramas (mermaid.css)
└── content.config.ts       # colección de contenido de Starlight
astro.config.mjs            # configuración: site, sidebar, logo, Mermaid
```

## Diagramas (Mermaid)

Los diagramas se escriben como bloques ` ```mermaid ` dentro del Markdown y se renderizan a
**SVG en el build** (vía `@beoe/rehype-mermaid` + Chromium), sin enviar JavaScript al navegador.

> ⚠️ **Evita `erDiagram`**: rompe el build con este plugin (falla al convertir su SVG a inline
> y deja la página vacía). Usa `flowchart`, `sequenceDiagram`, etc.

## Despliegue

El sitio es **estático** y se sirve con **nginx**. El `Dockerfile` (multi-stage) construye con
Bun y renderiza los diagramas con Chromium en la etapa de build; la imagen final solo contiene
nginx + los archivos estáticos.

- **Plataforma:** Dokploy → Build Type `Dockerfile`, puerto del contenedor `80`.
- **Dominio:** `docs.crs-logistics.com` (HTTPS con Let's Encrypt).

```sh
docker build -t crs-docs .
docker run -p 8080:80 crs-docs   # http://localhost:8080
```
