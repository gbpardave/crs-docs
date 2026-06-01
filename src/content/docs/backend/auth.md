---
title: Autenticación y autorización
description: Cómo funciona el módulo de auth de crs-backend — JWT ES256, roles de cliente y empleado, guards y la integración cross-backend con crs-delivery.
---

El módulo `auth` de **crs-backend** centraliza la identidad de todo el sistema: registro y login de clientes, gestión de empleados/administradores, autorización por roles y la verificación de tokens emitidos por otros backends del ecosistema (crs-delivery).

:::note[Stack]
NestJS 11 · TypeORM · Passport (`passport-jwt`) · JWT **ES256** (ECDSA P-256, asimétrico).
:::

## Visión general

La autenticación se basa en **JWT firmados con ES256** (criptografía asimétrica de curva elíptica). El backend firma los tokens con su llave privada (`JWT_PRIVATE_KEY`) y cualquiera puede verificarlos con la llave pública (`JWT_PUBLIC_KEY`). No hay secretos compartidos.

Sobre la autenticación se monta una capa de **autorización por roles**, donde un mismo usuario puede ser **cliente** o **empleado**, y su rol efectivo se deriva del tipo correspondiente.

## Modelo de identidad

Un `User` es la entidad central. Al validar un token, la estrategia carga el usuario con sus relaciones:

```
User
├── role          (Role)
├── employee      (Employee → EmployeeType)   ← si es personal interno
└── client        (Client  → ClientType)      ← si es cliente
```

Un usuario es **cliente o empleado**, no ambos. El rol efectivo para autorizar se toma de `employee.employeeType.code` o, en su defecto, de `client.clientType.code`.

## Roles disponibles

Los roles válidos se definen en el enum `ValidRoles`. El **valor** del enum es el `code` que se guarda en base de datos y contra el que se autoriza:

| Categoría | Rol (enum) | Código en BD |
| --- | --- | --- |
| Cliente | `Normal` | `NORMAL` |
| Cliente | `Marketplace` | `MARKETPLACE` |
| Cliente | `Reseller` | `RESELLER` |
| Empleado | `VendedorCRS` | `SALES` |
| Empleado | `TesoreriaCRS` | `TREASURY` |
| Empleado | `OperacionesUSA` | `OPS_USA` |
| Empleado | `OperacionesLima` | `OPS_LIMA` |
| Empleado | `Administrador` | `ADMIN` |
| Empleado | `SuperAdministrador` | `SUPER_ADMIN` |
| Empleado | `ShadowRoot` | `SHADOW_ROOT` |

## Tokens JWT

Cada autenticación emite un **par de tokens** firmados con ES256:

- **access token** (`type: 'access'`) — se envía en cada petición como `Authorization: Bearer <token>`.
- **refresh token** (`type: 'refresh'`) — sirve para renovar el par sin volver a loguearse. Se **rota** en cada uso (el anterior queda invalidado).

El payload tiene esta forma:

```ts
interface JwtPayload {
  sub: number;      // id del usuario
  email: string;
  role: string;     // código del rol
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}
```

La `JwtStrategy` (Passport) extrae el Bearer token, lo verifica con la llave pública y el algoritmo `ES256`, **rechaza los tokens que no sean de tipo `access`**, y carga el `User` con sus relaciones de rol/empleado/cliente.

## Cómo se protege un endpoint

La protección se aplica con el decorador `@Auth()`, que combina autenticación (Passport JWT) y autorización por roles:

```ts
// Solo requiere estar autenticado (cualquier rol):
@Auth()
@Get('me')
getMe(@GetUser() user: User) { ... }

// Requiere autenticación + uno de los roles indicados:
@Auth(ValidRoles.Administrador, ValidRoles.SuperAdministrador)
@Get('list')
listAdmins() { ... }
```

Internamente `@Auth(...roles)` aplica dos cosas:

1. `RoleProtected(...roles)` → guarda los roles permitidos como metadata (`SetMetadata('roles', ...)`).
2. `UseGuards(AuthGuard(), UserRoleGuard)` → primero valida el JWT, luego los roles.

El **`UserRoleGuard`** decide así:

- Si el endpoint no declara roles → basta con estar autenticado.
- Si el usuario es **empleado** → valida contra `employee.employeeType.code`.
- Si el usuario es **cliente** → valida contra `client.clientType.code`.
- Si el rol no está en la lista permitida → `403 Forbidden`.

Para leer el usuario autenticado dentro del handler se usa el decorador `@GetUser()`.

## Endpoints de autenticación

Todos cuelgan de `/auth`:

| Método | Ruta | Descripción | Protegido |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Registro con email/contraseña. Envía correo de verificación. Opcionalmente crea un consignatario con documentos adjuntos. | No |
| `POST` | `/auth/login` | Login con email/contraseña (requiere email verificado). Devuelve el par de tokens. | No |
| `POST` | `/auth/google` | Login/registro automático vía Google OAuth. | No |
| `POST` | `/auth/refresh` | Renueva el par de tokens (con rotación). | No |
| `POST` | `/auth/logout` | Invalida el refresh token activo. | Sí |
| `POST` | `/auth/lost-password` | Envía correo de recuperación (válido 1 h). | No |
| `POST` | `/auth/reset-password` | Restablece la contraseña con el token del correo. | No |
| `GET` | `/auth/verify-email` | Activa la cuenta con el token enviado al registrarse. | No |
| `GET` | `/auth/me` | Devuelve el perfil del usuario autenticado. | Sí |
| `PATCH` | `/auth/me/complete-profile` | Completa documento/teléfono (típico tras login con Google). Verifica el documento contra RENIEC/SUNAT/Migraciones. | Sí |

## Flujos principales

### Registro y verificación de correo

1. `POST /auth/register` crea la cuenta (inactiva) y envía un correo con un token de verificación.
2. El usuario abre el enlace → `GET /auth/verify-email?token=…` activa la cuenta.
3. Recién entonces puede hacer `POST /auth/login`.

### Login con Google

1. El front obtiene un *access token* de Google y lo manda a `POST /auth/google`.
2. Si el usuario no existe, se crea automáticamente con los datos de Google.
3. Como Google no aporta documento ni teléfono, el usuario suele completar su perfil después con `PATCH /auth/me/complete-profile` (que valida el documento contra RENIEC/SUNAT/Migraciones).

### Recuperación de contraseña

1. `POST /auth/lost-password` envía un enlace válido por 1 hora. Por seguridad **siempre responde éxito**, exista o no el email.
2. `POST /auth/reset-password` aplica la nueva contraseña con el token; el token queda invalidado tras usarse.

### Renovación de sesión

`POST /auth/refresh` recibe el `refresh_token`, emite un par nuevo e invalida el anterior (rotación). `POST /auth/logout` revoca el refresh token activo.

## Gestión administrativa

El `admin.controller` (`/auth/admin/...`) agrupa la operación de personal y clientes — requiere roles de empleado. Incluye, entre otros:

- Listar/obtener administradores y sus tipos · actualizar administrador · cambiar contraseña.
- Obtener vendedores y **asignar un vendedor a un cliente**.
- **Promover un cliente a empleado**.
- Cambiar el **tipo de cliente** o el **tipo de empleado**.
- Listar empleados y clientes.

## Integración cross-backend con crs-delivery

crs-backend puede aceptar tokens **emitidos por crs-delivery** (por ejemplo, los de motorizados). Para eso existe el `JwtDeliveryGuard`, que verifica el token con la llave pública de delivery (`CRS_DELIVERY_PUBLIC_KEY`) usando ES256, exige `type: 'access'` y expone los datos en `request.deliveryUser`.

:::tip[Por qué ES256 entre backends]
Cada backend firma con **su** llave privada y publica **su** llave pública. crs-backend verifica los tokens de delivery con la pública de delivery, y viceversa. Así ningún backend necesita conocer el secreto del otro. Ver el detalle de esta arquitectura en la documentación de auth de crs-delivery.
:::

## Inbound API Keys (integraciones externas)

Para las llamadas entrantes de terceros (marketplaces como **Falabella**, etc.) no se usa JWT sino **API keys** con prefijo `crs_`:

- `POST /auth/admin/inbound-keys/:provider/generate` genera una key para la integración indicada. **Solo `ShadowRoot`**.
- La key se copia manualmente a la variable de entorno correspondiente (p. ej. `FALABELLA_INBOUND_API_KEY`) y se reinicia el servidor.
- Los endpoints que reciben estas llamadas se protegen con el guard de API key inbound en vez de `@Auth()`.

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `JWT_PRIVATE_KEY` | Llave privada EC para **firmar** los tokens de crs-backend. |
| `JWT_PUBLIC_KEY` | Llave pública EC para **verificar** los tokens propios. |
| `CRS_DELIVERY_PUBLIC_KEY` | Llave pública de crs-delivery para verificar **sus** tokens. |
| `<PROVIDER>_INBOUND_API_KEY` | API key de cada integración inbound (ej. `FALABELLA_INBOUND_API_KEY`). |

:::caution[Manejo de llaves]
Las llaves EC se cargan desde variables de entorno (con `\n` escapados que el config convierte a saltos de línea reales). Nunca se versionan en el repositorio.
:::
