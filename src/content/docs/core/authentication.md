---
title: Autenticación
description: Cómo crs-core autentica usuarios — JWT ES256, par de tokens access/refresh con rotación, login, registro, Google OAuth y recuperación de contraseña.
---

:::tip[TL;DR]
- **JWT ES256** asimétrico: privada firma, pública verifica (sin secretos compartidos).
- Login → **access (15 min)** + **refresh (60 días)**.
- En cada request: `Authorization: Bearer <access>`.
- El refresh **se rota** en cada uso; reusar el anterior → `401`.
- Login exige **email verificado** (`state = 1`).
:::

El módulo `auth` de **crs-core** centraliza la identidad del sistema: registro y login de usuarios, emisión de tokens, login con Google y recuperación de contraseña. Esta página cubre **cómo se autentica** un usuario. Para qué puede hacer cada uno una vez autenticado, ver [Autorización](/core/authorization/).

:::note[Stack]
NestJS 11 · TypeORM · Passport (`passport-jwt`) · JWT **ES256** (ECDSA P-256, asimétrico) · bcrypt.
:::

## JWT con firma asimétrica (ES256)

Los tokens se firman con **ES256** (curva elíptica P-256). crs-core firma con su **llave privada** (`JWT_PRIVATE_KEY`) y verifica con su **llave pública** (`JWT_PUBLIC_KEY`). No hay secretos compartidos.

```ts title="src/auth/config/jwt.config.ts"
export interface JwtConfig {
  privateKey: string; // JWT_PRIVATE_KEY — firma
  publicKey: string;  // JWT_PUBLIC_KEY  — verificación
}
```

El payload de cada token tiene esta forma:

```ts title="src/auth/interfaces/auth/jwt-payload.interface.ts"
export type TokenType = 'access' | 'refresh';

export interface JwtPayload {
  sub: number;    // id del usuario
  email: string;
  role: string;   // código del rol efectivo (ver Autorización)
  type: TokenType;
  iat?: number;
  exp?: number;
}
```

## Par de tokens: access + refresh

Cada autenticación emite **dos tokens** (`issueTokenPair`):

| Token | `type` | Vigencia | Uso |
| --- | --- | --- | --- |
| **access token** | `access` | **15 minutos** | Se envía en cada petición: `Authorization: Bearer <token>`. |
| **refresh token** | `refresh` | **60 días** | Renueva el par sin volver a loguearse. Se **rota** en cada uso. |

### Rotación del refresh token

El refresh token **no se guarda en claro**. Al emitirlo, se guarda su `sha256` en `user.refresh_token_hash`. Cuando se usa en `POST /auth/refresh`:

1. Se verifica la firma (ES256, llave pública) y que `type === 'refresh'`.
2. Se compara `sha256(token entrante)` contra el hash guardado.
   - Si no coincide → **`Refresh token ya utilizado`** (el token anterior quedó invalidado al rotar).
3. Se emite un **par nuevo** y se reemplaza el hash (rotación).

`POST /auth/logout` pone `refresh_token_hash = null`, invalidando la sesión activa.

```mermaid
sequenceDiagram
    actor U as Usuario
    participant API as crs-core
    participant DB as Base de datos
    U->>API: POST /auth/login (email, password)
    API->>DB: busca usuario, exige state = 1 (email verificado)
    API->>API: bcrypt.compare(password)
    API->>API: firma access (15m) + refresh (60d) con ES256
    API->>DB: guarda sha256(refresh) en refresh_token_hash
    API-->>U: { access_token, refresh_token, user }
    Note over U,API: En cada petición protegida
    U->>API: GET /auth/me — Authorization: Bearer access
    API->>API: JwtStrategy verifica firma (llave pública) y type = access
    API-->>U: perfil del usuario
```

## Verificación en cada petición: `JwtStrategy`

La estrategia de Passport extrae el Bearer token, lo verifica con la **llave pública** y el algoritmo `ES256`, **rechaza los tokens que no sean de tipo `access`**, y carga el `User` con sus relaciones de rol/empleado/cliente.

```ts title="src/auth/strategies/jwt.strategy.ts"
super({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  ignoreExpiration: false,
  secretOrKey: jwtConfigValues.publicKey,
  algorithms: ['ES256'],
});

async validate(payload: JwtPayload): Promise<User> {
  if (payload.type !== 'access') {
    throw new UnauthorizedException('Token de acceso requerido');
  }
  // carga User con role, employee.employeeType y client.clientType
}
```

El `User` resultante queda disponible en `request.user` y se obtiene en los controladores con el decorador `@GetUser()`.

## Flujos de autenticación

### Registro

`POST /auth/register` crea la cuenta con email y contraseña (hasheada con `bcrypt`, 10 rondas). El usuario queda **sin verificar** (`state ≠ 1`) y se le envía un correo de verificación. No puede iniciar sesión hasta verificarlo.

### Verificación de correo

`GET /auth/verify-email?token=<token>` activa la cuenta (`state = 1`) usando el token enviado en el correo de registro.

### Login

`POST /auth/login` con email y contraseña:

1. Exige que el correo esté verificado (`state === 1`), si no → `401`.
2. Compara la contraseña con `bcrypt.compare`.
3. Emite el par de tokens y retorna `{ access_token, refresh_token, user }`.

### Login con Google

`POST /auth/google` recibe un access token de Google, valida la identidad contra la API de Google y **crea la cuenta si no existe** o inicia sesión si ya existe. Los usuarios de Google completan luego su perfil con `PATCH /auth/me/complete-profile`.

### Recuperación de contraseña

- `POST /auth/lost-password` envía un correo con un enlace de recuperación, válido por **1 hora**.
- `POST /auth/reset-password` actualiza la contraseña con el token recibido. El token se invalida tras usarse.

## Endpoints

| Método | Ruta | Protegido | Descripción |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | — | Registra un usuario y envía correo de verificación. |
| `GET`  | `/auth/verify-email` | — | Verifica el correo con el token recibido. |
| `POST` | `/auth/login` | — | Login con email y contraseña. |
| `POST` | `/auth/google` | — | Login/registro con Google OAuth. |
| `POST` | `/auth/refresh` | — | Renueva el par de tokens (rota el refresh). |
| `POST` | `/auth/lost-password` | — | Solicita recuperación de contraseña. |
| `POST` | `/auth/reset-password` | — | Confirma el cambio de contraseña. |
| `POST` | `/auth/logout` | `@Auth()` | Invalida el refresh token activo. |
| `GET`  | `/auth/me` | `@Auth()` | Perfil del usuario autenticado. |
| `PATCH` | `/auth/me/complete-profile` | `@Auth()` | Completa el perfil (principalmente usuarios de Google). |

> El control de **quién** puede acceder a cada endpoint protegido se hace con el decorador `@Auth(...roles)`. Eso se explica en [Autorización](/core/authorization/).
