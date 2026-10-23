# Raíces del Fogón

Sistema de información web para un restaurante de comida tradicional colombiana: menú en línea, registro de clientes, pedidos con seguimiento y panel de administración (platos, categorías, pedidos y reportes).

Proyecto formativo del programa **Técnico en Programación de Software** — SENA, Regional Distrito Capital (articulación con el Colegio Parroquial San Luis Gonzaga, ficha 3166425).

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + React Router 7 + Vite 8 (JavaScript) |
| Backend | API REST en PHP 8 (PDO) |
| Base de datos | MySQL 8 (InnoDB, utf8mb4) |

## Documentación

- [Documentación técnica](docs/DOCUMENTACION_TECNICA.md): arquitectura, modelo de datos, diccionario de datos, API, seguridad y pruebas.
- [Manual de usuario](docs/MANUAL_DE_USUARIO.md) (también en [PDF](docs/MANUAL_DE_USUARIO.pdf)).
- [Consultas SQL comentadas](database/consultas.sql): consultas generales, específicas, multitabla, de resumen y ejemplos de DML.

## Requisitos

- **Node.js 20 o superior** (para React y Vite).
- **PHP 8.1 o superior** con las extensiones `pdo_mysql` y `mbstring` activas, y el comando `php` disponible en la terminal.
- **MySQL 8** (por ejemplo, el que incluye Laragon o XAMPP) encendido.

## Instalación

```bash
npm install
```

Copie `.env.example` como `.env` y complete la conexión a MySQL y la contraseña del administrador inicial (`ADMIN_PASSWORD`, mínimo 8 caracteres con letras y números).

```bash
npm run db:setup
```

Crea la base de datos `raices_del_fogon`, sus tablas y relaciones, el menú inicial y el administrador. Para agregar además clientes y pedidos **ficticios** de demostración, use `npm run db:setup:demo`. Los dos comandos se pueden repetir sin borrar datos.

## Uso en desarrollo

Abra dos terminales:

```bash
npm run api
```

```bash
npm run dev
```

Abra http://localhost:5173. Vite reenvía las peticiones `/api` y `/uploads` a la API PHP (http://127.0.0.1:3001).

## Fotos de los platos

El administrador puede subir la foto de cada plato (JPG, PNG o WEBP, máximo 2 MB) desde el formulario del plato. Las fotos se guardan en `uploads/platos/` (la carpeta se crea sola, no se sube a git e importa incluirla en las copias de seguridad) y su registro queda en la tabla `archivos`. El límite de 2 MB coincide con el valor por defecto de PHP, así que no hace falta modificar `php.ini`.

Si ya tenía la base de datos instalada, ejecute `npm run db:setup` una vez: agrega la columna nueva sin borrar datos.

## Uso en producción (una sola terminal)

```bash
npm start
```

Compila React (`dist/`) y lo sirve junto con la API en http://127.0.0.1:3001.

## Scripts

| Comando | Acción |
|---|---|
| `npm run dev` | Frontend React en modo desarrollo |
| `npm run api` | API PHP con el servidor integrado de PHP |
| `npm start` | Compila y sirve todo desde PHP |
| `npm run db:setup` | Instala o actualiza la base de datos (no destructivo) |
| `npm run db:setup:demo` | Igual que el anterior, más datos ficticios de demostración |
| `npm run test:api` | Pruebas automáticas de la API (requiere la API encendida) |
| `npm run lint` | Revisión del código con ESLint |
| `npm run build` | Compilación de producción del frontend |
