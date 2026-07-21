# Pendientes — documentación crs-backoffice / crs-bff-backoffice

Estado al 2026-07-21. Código de referencia: `develop` alineada a `main` en ambos repos
(los dos ya en producción).

## Hecho

- [x] `src/content/docs/bff-backoffice/index.md` — visión general del BFF: por qué existe
      (comparativa antes/después del XSS), topología, rutas, endpoints de `crs-core`
      bloqueados, estructura del repo, tabla de variables de entorno, despliegue.
- [x] `src/content/docs/bff-backoffice/auth-flow.md` — handoff SSO con diagrama de
      secuencia, las tres defensas del handoff, las dos cookies, probe de sesión, refresh
      transparente y su mutex, tabla de fallos, CSRF double-submit, headers que se cortan,
      logout, y `/bff/auth/login` como pieza reservada.
- [x] `astro.config.mjs` — `crs-bff-backoffice` como entrada propia en el sidebar, con sus
      dos sub-páginas.

## Por hacer

### Páginas de docs

- [ ] **Revisar las dos páginas del BFF** y calibrar el nivel de detalle. En concreto: si
      sirve que la doc traslade el porqué de los comentarios `WHY:` del código, o se
      prefiere algo más seco.
- [ ] `backoffice/index` — reescribir. Hoy es el stub de "documentación en camino".
      Debe enlazar a `/bff-backoffice/auth-flow/` en vez de repetir el flujo de auth, y
      cubrir qué implica el BFF para quien trabaja en la SPA (`withCredentials`, no tocar
      tokens, un 401 = sesión muerta).
- [ ] `backoffice/modules` — el patrón de módulo por feature
      (`api/hooks/services/components/interfaces`), con AWBs como ejemplo trabajado.
      Son ~35 módulos homogéneos: documentar el patrón una vez, no módulo por módulo.
- [ ] `backoffice/rbac` — roles y permisos. **Usar los códigos string reales** de
      `src/auth/constants/roles.ts` (`DOCS`, `SALES`, `TREASURY`, `OPS_USA`, `OPS_LIMA`,
      `SUPER_ADMIN`, `SHADOW_ROOT`), no los IDs numéricos. Cubrir `RoleGuard`, `Can`,
      `usePermissions` y que `SHADOW_ROOT` es superusuario implícito.

### Decisiones que faltan tomar

- [ ] **`crs-backoffice/src/auth/docs/role-based-access-control.md` está obsoleto.**
      Documenta los roles como IDs numéricos (1, 2, 3…) cuando `roles.ts` ya usa códigos
      string. Decidir: borrarlo, o dejarlo como puntero a la doc web. No se tocó nada aún.
- [ ] **`TODO(auth)` muerto en `crs-backoffice/.env.example`.** Dice "migrar el login del
      backoffice al BFF", pero eso se resolvió distinto: el login vive en `crs-portal` y
      entra por handoff SSO. Conviene borrarlo o reescribirlo para que no despiste.

### Fuentes a destilar

`crs-core/notes/plans/` tiene las notas de diseño internas, con el razonamiento completo y
las alternativas descartadas. Son la mejor materia prima para las páginas que faltan:

- `bff-architecture.md` — fases del BFF.
- `bff-sso-handoff.md` — el handoff (ya destilado en `auth-flow.md`).
- `awbs-module-refactor.md` — útil para `backoffice/modules`.

## Nota de entorno: mermaid en local

El build local **no sirve para validar páginas con diagramas**. En esta máquina el plugin
mermaid falla y, cuando falla, no rompe el build ni pierde solo el diagrama: **vacía el
cuerpo entero de la página en silencio**. Da una señal falsa de "página vacía".

- En **producción funciona** — el Dockerfile instala Chromium con
  `bunx playwright install --with-deps chromium`.
- `dist/` está en `.gitignore`, así que un build local roto nunca se despliega.
- Para previsualizar con diagramas: construir la imagen Docker.
- Para validar solo la **sintaxis** mermaid sin Docker: pasar los bloques por
  `createMermaidRenderer()` de `mermaid-isomorphic` directamente — eso sí funciona en
  local. Así se validaron los diagramas de las páginas del BFF.

:warning: Si alguna vez se despliega desde un build local en vez de Docker, esas páginas
saldrían vacías sin ningún error visible.

**Sin resolver:** por qué el renderer aislado funciona en local pero el plugin dentro del
build de Astro no. No se persiguió porque producción no está afectada.

## Fuera de alcance (por ahora)

Otros repos siguen con el stub de "documentación en camino": `crs-lastmile`, `crs-portal`,
`crs-business`, `crs-field`.
