-- =====================================================================
-- Raíces del Fogón — Script de creación de la base de datos (DDL)
-- Motor: MySQL 8.x · Almacenamiento: InnoDB · Juego de caracteres: utf8mb4
--
-- El script NO es destructivo: usa CREATE ... IF NOT EXISTS y no borra
-- tablas ni datos existentes. Se puede ejecutar varias veces.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS raices_del_fogon
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_spanish_ci;

USE raices_del_fogon;

-- ---------------------------------------------------------------------
-- categorias: agrupa los platos del menú (Entrada, Plato fuerte, Postre…)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nombre       VARCHAR(50)   NOT NULL,
  descripcion  VARCHAR(255)  NULL,
  creado_en    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_categorias PRIMARY KEY (id),
  CONSTRAINT uq_categorias_nombre UNIQUE (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- ---------------------------------------------------------------------
-- archivos: fotos subidas al servidor (carpeta uploads/platos/).
-- El archivo físico se guarda con un nombre aleatorio (nombre_sistema);
-- aquí queda el registro con su nombre original, ruta, tipo y tamaño.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS archivos (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nombre_original  VARCHAR(255)  NOT NULL,
  nombre_sistema   VARCHAR(100)  NOT NULL,
  ruta             VARCHAR(255)  NOT NULL,
  tipo_mime        VARCHAR(50)   NOT NULL,
  tamano_bytes     INT UNSIGNED  NOT NULL,
  fecha_subida     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_archivos PRIMARY KEY (id),
  CONSTRAINT uq_archivos_nombre_sistema UNIQUE (nombre_sistema),
  CONSTRAINT ck_archivos_tamano CHECK (tamano_bytes > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- ---------------------------------------------------------------------
-- platos: productos que ofrece el restaurante.
-- Relaciones: categorias 1 ─── N platos
--             archivos   1 ─── 0..1 platos (foto subida, opcional)
-- La foto puede ser un archivo subido (archivo_id) o una URL externa
-- (imagen_url); si existen las dos, se muestra el archivo subido.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platos (
  id              INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  categoria_id    INT UNSIGNED   NOT NULL,
  nombre          VARCHAR(100)   NOT NULL,
  descripcion     VARCHAR(500)   NOT NULL,
  precio          DECIMAL(10,2)  NOT NULL,
  imagen_url      VARCHAR(500)   NULL,
  archivo_id      INT UNSIGNED   NULL,
  disponible      TINYINT(1)     NOT NULL DEFAULT 1,
  creado_en       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_platos PRIMARY KEY (id),
  CONSTRAINT uq_platos_nombre UNIQUE (nombre),
  CONSTRAINT ck_platos_precio CHECK (precio > 0),
  CONSTRAINT fk_platos_categoria FOREIGN KEY (categoria_id)
    REFERENCES categorias (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,           -- no se puede borrar una categoría con platos
  CONSTRAINT uq_platos_archivo UNIQUE (archivo_id),  -- cada foto pertenece a un solo plato
  CONSTRAINT fk_platos_archivo FOREIGN KEY (archivo_id)
    REFERENCES archivos (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,           -- si se borra la foto, el plato queda sin foto subida
  INDEX ix_platos_categoria (categoria_id),
  INDEX ix_platos_disponible (disponible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- ---------------------------------------------------------------------
-- usuarios: clientes y administradores del sistema.
-- La contraseña se guarda como hash scrypt (nunca en texto plano).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nombre         VARCHAR(100)  NOT NULL,
  correo         VARCHAR(150)  NOT NULL,
  telefono       VARCHAR(20)   NOT NULL,
  password_hash  VARCHAR(255)  NOT NULL,
  rol            ENUM('cliente','admin') NOT NULL DEFAULT 'cliente',
  creado_en      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_usuarios PRIMARY KEY (id),
  CONSTRAINT uq_usuarios_correo UNIQUE (correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- ---------------------------------------------------------------------
-- pedidos: encabezado de cada orden realizada por un usuario.
-- Relación: usuarios 1 ─── N pedidos
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
  id             INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  usuario_id     INT UNSIGNED   NOT NULL,
  estado         ENUM('pendiente','en_preparacion','entregado','cancelado')
                                NOT NULL DEFAULT 'pendiente',
  total          DECIMAL(10,2)  NOT NULL DEFAULT 0,
  observaciones  VARCHAR(255)   NULL,
  creado_en      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_pedidos PRIMARY KEY (id),
  CONSTRAINT ck_pedidos_total CHECK (total >= 0),
  CONSTRAINT fk_pedidos_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,           -- se conserva el historial de pedidos
  INDEX ix_pedidos_usuario (usuario_id),
  INDEX ix_pedidos_estado (estado),
  INDEX ix_pedidos_fecha (creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- ---------------------------------------------------------------------
-- detalle_pedido: platos incluidos en cada pedido (tabla intermedia).
-- Relaciones: pedidos 1 ─── N detalle_pedido N ─── 1 platos
-- (resuelve la relación muchos a muchos entre pedidos y platos)
-- El precio_unitario se copia del plato en el momento de la compra para
-- que los cambios de precio no alteren pedidos anteriores.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_pedido (
  id               INT UNSIGNED       NOT NULL AUTO_INCREMENT,
  pedido_id        INT UNSIGNED       NOT NULL,
  plato_id         INT UNSIGNED       NOT NULL,
  cantidad         SMALLINT UNSIGNED  NOT NULL,
  precio_unitario  DECIMAL(10,2)      NOT NULL,
  subtotal         DECIMAL(12,2)      AS (cantidad * precio_unitario) STORED,
  CONSTRAINT pk_detalle_pedido PRIMARY KEY (id),
  CONSTRAINT uq_detalle_pedido_plato UNIQUE (pedido_id, plato_id),
  CONSTRAINT ck_detalle_cantidad CHECK (cantidad BETWEEN 1 AND 50),
  CONSTRAINT ck_detalle_precio CHECK (precio_unitario > 0),
  CONSTRAINT fk_detalle_pedido FOREIGN KEY (pedido_id)
    REFERENCES pedidos (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,            -- el detalle depende de su pedido
  CONSTRAINT fk_detalle_plato FOREIGN KEY (plato_id)
    REFERENCES platos (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,           -- no se borra un plato que ya fue vendido
  INDEX ix_detalle_plato (plato_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
