# Fauna de Chile · Álbum Digital

Álbum de **calcomanías coleccionables digitales** de la fauna chilena. Cada usuario
arma su colección abriendo sobres de **5 calcomanías al azar** que reparte el
administrador. Web ahora (Next.js); la app móvil **Flutter** consumirá la misma
API REST (mismo patrón que `perfilando`).

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **Prisma 6** + **SQLite** en local (cambiar el `datasource` a Postgres para producción)
- Auth propia con **JWT** (cookie httpOnly para web · `Authorization: Bearer` para Flutter)

## Puesta en marcha

```bash
npm install          # instala deps y genera el cliente Prisma
npm run db:push      # crea la base SQLite (prisma/dev.db)
npm run db:seed      # carga 18 especies + usuarios de prueba
npm run dev          # http://localhost:3000
```

> ¿Empezar de cero? `npm run db:reset` recrea y vuelve a sembrar la base.

### Cuentas de prueba

| Rol   | Correo            | Clave      |
| ----- | ----------------- | ---------- |
| Admin | `admin@album.cl`  | `admin123` |
| User  | `ana@album.cl`    | `demo1234` |
| User  | `benito@album.cl` | `demo1234` |
| User  | `carla@album.cl`  | `demo1234` |

## Cómo funciona

1. El **admin** entra a `/admin` y pulsa **“Dar calcomanías”** (a todos, o a un
   usuario puntual con “Dar 5”).
2. Cada coleccionista recibe **5 calcomanías distintas** por sobre, sorteadas con
   **probabilidad ponderada por rareza** (Legendaria es la más escasa). Si ya tenía
   una, suma como **repe** (`quantity`).
3. Al entrar a `/album`, el usuario ve la **animación de apertura de sobre** con lo
   nuevo y luego su álbum: progreso de colección, secciones por categoría y cartas
   obtenidas (a color, con glow de rareza) vs. bloqueadas (silueta).

## API REST (lista para Flutter)

Base local: `http://localhost:3000/api`. Enviar el token como cookie (web) o
`Authorization: Bearer <token>` (móvil).

| Método | Ruta                  | Descripción                                   |
| ------ | --------------------- | --------------------------------------------- |
| POST   | `/auth/register`      | Crear cuenta → `{ token, user }`              |
| POST   | `/auth/login`         | Iniciar sesión → `{ token, user }`            |
| POST   | `/auth/logout`        | Cerrar sesión                                 |
| GET    | `/me`                 | Usuario actual + stats                        |
| GET    | `/stickers`           | Álbum del usuario (todas + cuáles posee)      |
| POST   | `/stickers/seen`      | Marca como vistas las calcomanías nuevas      |
| GET    | `/admin/users`        | (admin) Usuarios y su progreso                |
| POST   | `/admin/distribute`   | (admin) Reparte 5 al azar (`{}` = a todos, `{ userId }` = a uno) |

## Estructura

```
app/                 Páginas (/, /login, /register, /album, /admin) + rutas /api
components/          UI (StickerCard, PackOpening, AlbumClient, AdminClient, …)
lib/album.ts         Rarezas, categorías, sorteo ponderado, tipos compartidos
lib/album-data.ts    Lógica de servidor (álbum, repartir, resumen admin)
lib/auth.ts          JWT + hash de contraseñas + sesión
lib/db.ts            Cliente Prisma (singleton)
prisma/schema.prisma Modelos User · Sticker · UserSticker
prisma/seed.ts       18 especies chilenas + usuarios de prueba
```

## Pasar a producción

- Cambiar `datasource db` a `postgresql` y setear `DATABASE_URL` (igual que perfilando).
- Definir un `JWT_SECRET` fuerte y dejar la cookie con `secure: true` (ya configurado por `NODE_ENV`).
- Para ilustraciones reales: subir imágenes y completar `Sticker.imageUrl` (la UI ya está lista para usarlas).
