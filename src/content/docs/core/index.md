---
title: crs-core
description: Backend núcleo del ecosistema CRS — logística internacional y finanzas.
---

**crs-core** es el backend principal: identidad, casilleros,
paquetes, aduanas, bodega, manifiestos y **finanzas**. Es quien **emite los tokens
ES256** que el resto del ecosistema reutiliza.

**Stack:** NestJS 11 · TypeORM · MySQL.

## Documentación disponible

- [Autenticación](/core/authentication/) — login, tokens ES256, sesiones.
- [Autorización](/core/authorization/) — roles y permisos.
