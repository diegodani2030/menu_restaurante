-- =====================================================================
-- Raíces del Fogón — Consultas de la base de datos (para la sustentación)
-- Se pueden ejecutar en phpMyAdmin, MySQL Workbench o la consola `mysql`.
-- Todas usan el esquema real (database/schema.sql).
-- Las mismas consultas están integradas en la API (api/rutas/*.php).
-- =====================================================================

USE raices_del_fogon;

-- ---------------------------------------------------------------------
-- 1. CONSULTAS GENERALES
-- ---------------------------------------------------------------------

-- 1.1 Listar todas las categorías
SELECT id, nombre, descripcion FROM categorias ORDER BY id;

-- 1.2 Listar todos los platos ordenados por nombre
SELECT id, nombre, precio, disponible FROM platos ORDER BY nombre ASC;

-- 1.3 Consultar un plato por su identificador (API: GET /api/platos/{id})
SELECT * FROM platos WHERE id = 5;

-- 1.4 Platos ordenados del más caro al más barato
SELECT nombre, precio FROM platos ORDER BY precio DESC;

-- ---------------------------------------------------------------------
-- 2. CONSULTAS ESPECÍFICAS (filtros)
-- ---------------------------------------------------------------------

-- 2.1 Buscar platos por texto en el nombre o la descripción
--     (API: GET /api/platos?buscar=leche)
SELECT nombre, descripcion FROM platos
WHERE nombre LIKE '%leche%' OR descripcion LIKE '%leche%';

-- 2.2 Platos de una categoría (API: GET /api/platos?categoria_id=3)
SELECT nombre, precio FROM platos WHERE categoria_id = 3;

-- 2.3 Filtros combinados: platos disponibles con precio entre $5.000 y $10.000
--     (API: GET /api/platos?precio_min=5000&precio_max=10000)
SELECT nombre, precio FROM platos
WHERE disponible = 1 AND precio BETWEEN 5000 AND 10000
ORDER BY precio;

-- 2.4 Pedidos en un estado determinado (API: GET /api/pedidos?estado=pendiente)
SELECT id, usuario_id, total, creado_en FROM pedidos WHERE estado = 'pendiente';

-- 2.5 Pedidos en un rango de fechas (API: GET /api/pedidos?desde=...&hasta=...)
SELECT id, estado, total, creado_en FROM pedidos
WHERE creado_en BETWEEN '2026-01-01 00:00:00' AND '2026-12-31 23:59:59';

-- ---------------------------------------------------------------------
-- 3. CONSULTAS MULTITABLA (JOIN)
-- ---------------------------------------------------------------------

-- 3.1 Platos con el nombre de su categoría (INNER JOIN platos–categorias)
--     Es la consulta que alimenta el menú (API: GET /api/platos)
SELECT p.id, p.nombre, c.nombre AS categoria, p.precio
FROM platos p
INNER JOIN categorias c ON c.id = p.categoria_id
ORDER BY c.id, p.nombre;

-- 3.2 Categorías con su cantidad de platos (LEFT JOIN: incluye categorías vacías)
--     (API: GET /api/categorias)
SELECT c.nombre AS categoria, COUNT(p.id) AS total_platos
FROM categorias c
LEFT JOIN platos p ON p.categoria_id = c.id
GROUP BY c.id, c.nombre;

-- 3.3 Pedidos con los datos del cliente que los hizo (pedidos–usuarios)
--     (API: GET /api/pedidos)
SELECT pe.id AS pedido, u.nombre AS cliente, u.correo, pe.estado, pe.total, pe.creado_en
FROM pedidos pe
INNER JOIN usuarios u ON u.id = pe.usuario_id
ORDER BY pe.creado_en DESC;

-- 3.4 Detalle completo de un pedido: 5 tablas relacionadas
--     pedidos – usuarios – detalle_pedido – platos – categorias
--     (API: GET /api/pedidos/{id})
SELECT pe.id AS pedido, u.nombre AS cliente, pl.nombre AS plato,
       c.nombre AS categoria, d.cantidad, d.precio_unitario, d.subtotal
FROM pedidos pe
INNER JOIN usuarios u        ON u.id = pe.usuario_id
INNER JOIN detalle_pedido d  ON d.pedido_id = pe.id
INNER JOIN platos pl         ON pl.id = d.plato_id
INNER JOIN categorias c      ON c.id = pl.categoria_id
WHERE pe.id = 1;

-- 3.5 Platos con su foto subida (LEFT JOIN: incluye los platos sin foto subida)
--     La columna "imagen" es la que muestra el menú: la foto subida o, si no hay, la URL externa.
SELECT p.nombre AS plato, a.nombre_original AS foto_subida, a.tamano_bytes,
       COALESCE(CONCAT('/', a.ruta), p.imagen_url) AS imagen
FROM platos p
LEFT JOIN archivos a ON a.id = p.archivo_id
ORDER BY p.nombre;

-- 3.6 Historial de pedidos de un cliente por su correo
SELECT pe.id, pe.estado, pe.total, pe.creado_en
FROM pedidos pe
INNER JOIN usuarios u ON u.id = pe.usuario_id
WHERE u.correo = 'cliente1@demo.test';

-- ---------------------------------------------------------------------
-- 4. CONSULTAS DE RESUMEN (conteos, totales, promedios)
--    (API: GET /api/reportes/resumen — página "Reportes")
-- ---------------------------------------------------------------------

-- 4.1 Total de pedidos, ventas y ticket promedio (sin cancelados)
SELECT COUNT(*) AS pedidos, SUM(total) AS ventas, ROUND(AVG(total)) AS ticket_promedio
FROM pedidos
WHERE estado <> 'cancelado';

-- 4.2 Cantidad de pedidos y valor por estado
SELECT estado, COUNT(*) AS pedidos, SUM(total) AS total
FROM pedidos GROUP BY estado;

-- 4.3 Precio promedio, mínimo y máximo por categoría
SELECT c.nombre AS categoria, ROUND(AVG(p.precio)) AS promedio,
       MIN(p.precio) AS minimo, MAX(p.precio) AS maximo
FROM categorias c
INNER JOIN platos p ON p.categoria_id = c.id
GROUP BY c.id, c.nombre;

-- 4.4 Los 5 platos más vendidos (unidades e ingresos)
SELECT pl.nombre AS plato, SUM(d.cantidad) AS unidades, SUM(d.subtotal) AS ingresos
FROM detalle_pedido d
INNER JOIN pedidos pe ON pe.id = d.pedido_id
INNER JOIN platos pl  ON pl.id = d.plato_id
WHERE pe.estado <> 'cancelado'
GROUP BY pl.id, pl.nombre
ORDER BY unidades DESC
LIMIT 5;

-- 4.5 Clientes que más han comprado
SELECT u.nombre, COUNT(pe.id) AS pedidos, SUM(pe.total) AS total_comprado
FROM usuarios u
INNER JOIN pedidos pe ON pe.usuario_id = u.id
WHERE pe.estado <> 'cancelado'
GROUP BY u.id, u.nombre
ORDER BY total_comprado DESC;

-- 4.6 Fotos subidas por tipo de archivo y espacio que ocupan
SELECT tipo_mime, COUNT(*) AS fotos, ROUND(SUM(tamano_bytes) / 1024, 1) AS total_kb
FROM archivos
GROUP BY tipo_mime;

-- ---------------------------------------------------------------------
-- 5. EJEMPLOS DE DML (INSERT, UPDATE, DELETE)
--    Están dentro de una transacción que se deshace al final (ROLLBACK),
--    así se pueden demostrar sin modificar los datos reales.
-- ---------------------------------------------------------------------

START TRANSACTION;

-- 5.1 INSERT: crear un plato de demostración
INSERT INTO platos (categoria_id, nombre, descripcion, precio)
VALUES (2, 'Plato de demostración', 'Registro temporal para la sustentación', 15000);

-- 5.2 UPDATE: cambiar su precio y ocultarlo del menú
UPDATE platos SET precio = 16000, disponible = 0 WHERE nombre = 'Plato de demostración';
SELECT nombre, precio, disponible FROM platos WHERE nombre = 'Plato de demostración';

-- 5.3 DELETE: eliminarlo
DELETE FROM platos WHERE nombre = 'Plato de demostración';

ROLLBACK;

-- ---------------------------------------------------------------------
-- 6. DEMOSTRACIÓN DE LAS RELACIONES (llaves foráneas)
--    Cada sentencia debe FALLAR: así se comprueba que las relaciones
--    protegen la integridad de los datos. Ejecútelas una por una.
-- ---------------------------------------------------------------------

-- 6.1 Plato con una categoría inexistente → Error 1452 (fk_platos_categoria)
-- INSERT INTO platos (categoria_id, nombre, descripcion, precio)
-- VALUES (999, 'Plato huérfano', 'Categoría que no existe', 10000);

-- 6.2 Borrar una categoría que tiene platos → Error 1451 (ON DELETE RESTRICT)
-- DELETE FROM categorias WHERE id = 1;

-- 6.3 Borrar un plato que ya fue vendido → Error 1451 (fk_detalle_plato)
-- DELETE FROM platos WHERE id = (SELECT plato_id FROM (SELECT plato_id FROM detalle_pedido LIMIT 1) AS t);

-- 6.4 Cantidad fuera de rango → Error 3819 en MySQL / 4025 en MariaDB (ck_detalle_cantidad)
-- INSERT INTO detalle_pedido (pedido_id, plato_id, cantidad, precio_unitario) VALUES (1, 1, 0, 8000);

-- 6.5 Ver todas las llaves foráneas del esquema
SELECT CONSTRAINT_NAME AS llave, TABLE_NAME AS tabla, REFERENCED_TABLE_NAME AS referencia,
       UPDATE_RULE AS al_actualizar, DELETE_RULE AS al_eliminar
FROM information_schema.REFERENTIAL_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = 'raices_del_fogon';
