---
title: crs-lastmile
description: Backend de entregas de última milla del ecosistema CRS.
---

:::caution[Documentación en camino]
**crs-lastmile** está en construcción.
:::

Backend de **última milla**: asignación de couriers, ciclo de vida de los despachos y
envíos, e ingesta de paquetes (`POST /inbound/shipments`). Valida los tokens con la
llave pública de `crs-core` (no los emite) y es consumido por la app móvil `crs-field`.

**Stack:** NestJS 11 · Prisma · BullMQ · S3.

Aquí se documentará: modelo de datos (guía por ítem), flujo de despacho/entrega,
colas BullMQ para notificaciones salientes, y la API de ingesta.
