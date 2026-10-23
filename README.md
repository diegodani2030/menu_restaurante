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

## Uso con XAMPP (Apache + MySQL/MariaDB)

Probado con XAMPP 8.2.12. La aplicación debe estar en la raíz del sitio, por eso se publica en un puerto propio:

1. Encienda **MySQL** en el panel de XAMPP. En `.env` use `DB_USER=root` y `DB_PASSWORD=` (vacío).
2. Instale la base de datos y compile React:
   ```bash
   C:\xampp\php\php.exe database\instalar.php --demo
   ```
   ```bash
   npm run build
   ```
3. Agregue al final de `C:\xampp\apache\conf\extra\httpd-vhosts.conf` (cambie la ruta por la carpeta del proyecto):
   ```apache
   Listen 8080
   <VirtualHost *:8080>
       DocumentRoot "C:/ruta/al/proyecto/menu_restaurante"
       <Directory "C:/ruta/al/proyecto/menu_restaurante">
           AllowOverride All
           Require local
       </Directory>
   </VirtualHost>
   ```
4. Encienda (o reinicie) **Apache** y abra http://localhost:8080. Las tablas se ven en http://localhost/phpmyadmin.

Después de cambiar el código de React, ejecute `npm run build` de nuevo.

## Publicar en internet (hosting con PHP y MySQL, por ejemplo InfinityFree)

Netlify, Vercel y similares no sirven: solo publican páginas estáticas, sin PHP ni MySQL.

Se necesitan dos archivos, que se generan en la carpeta `despliegue/` (no se sube a git):

- `raices-del-fogon-hosting.zip`: la página compilada (`dist/`), la API (`api/`), `.htaccess` y `.env.example`.
- `instalacion_hosting.sql`: las tablas y el menú inicial, sin `CREATE DATABASE` ni `USE`, porque en un hosting la base de datos la crea el panel (también está en `database/instalacion_hosting.sql`).

Pasos en InfinityFree:

1. Cree la cuenta en https://www.infinityfree.com y un sitio con un subdominio gratuito (por ejemplo `raicesdelfogon.infinityfreeapp.com`). El sitio nuevo puede tardar unos minutos en estar disponible.
2. En el panel, abra **MySQL Databases** y cree una base de datos. Anote el **servidor** (`sqlXXX.infinityfree.com`), el **usuario** (`if0_…`), el **nombre de la base** (`if0_…_algo`) y la **contraseña** (la de la cuenta de hosting, en **Account Details**).
3. Pulse **phpMyAdmin** junto a esa base → pestaña **Importar** → elija `instalacion_hosting.sql` → **Continuar**.
4. Abra el **File Manager** → carpeta `htdocs`. Borre los archivos de ejemplo que traiga, suba el ZIP y descomprímalo ahí, de modo que `htdocs` quede con `api/`, `dist/`, `.htaccess` y `.env.example`. Si el administrador no permite descomprimir, descomprima en su PC y suba el contenido con FileZilla (los datos FTP están en el panel).
5. En `htdocs`, cree el archivo `.env` (copie `.env.example`) con los datos del paso 2:
   ```
   DB_HOST=sqlXXX.infinityfree.com
   DB_PORT=3306
   DB_USER=if0_XXXXXXXX
   DB_PASSWORD=la contraseña de la cuenta de hosting
   DB_NAME=if0_XXXXXXXX_raices
   ```
6. Abra la dirección del sitio: deben aparecer el menú y los filtros.
7. Para tener un administrador: regístrese en la página con su correo y, en phpMyAdmin → pestaña **SQL**, ejecute (con su correo):
   ```sql
   UPDATE usuarios SET rol = 'admin' WHERE correo = 'su-correo@ejemplo.com';
   ```
   Cierre sesión y vuelva a entrar.

Si aparece "La base de datos no está disponible", revise los datos del `.env`. Si la página sale en blanco o con "Not Found", falta el `.htaccess` (en el File Manager active la opción para ver archivos ocultos). Las fotos subidas en XAMPP no se pasan solas: copie la carpeta `uploads/` si las quiere en el hosting.

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
