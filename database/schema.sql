CREATE DATABASE IF NOT EXISTS raices_del_fogon
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_spanish_ci;

USE raices_del_fogon;

CREATE TABLE IF NOT EXISTS categorias (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nombre       VARCHAR(50)   NOT NULL,
  descripcion  VARCHAR(255)  NULL,
  creado_en    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_categorias PRIMARY KEY (id),
  CONSTRAINT uq_categorias_nombre UNIQUE (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

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
    ON DELETE RESTRICT,
  CONSTRAINT uq_platos_archivo UNIQUE (archivo_id),
  CONSTRAINT fk_platos_archivo FOREIGN KEY (archivo_id)
    REFERENCES archivos (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  INDEX ix_platos_categoria (categoria_id),
  INDEX ix_platos_disponible (disponible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

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

CREATE TABLE IF NOT EXISTS intentos_login (
  id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  correo     VARCHAR(150)  NOT NULL,
  ip         VARCHAR(45)   NOT NULL,
  creado_en  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_intentos_login PRIMARY KEY (id),
  INDEX ix_intentos_correo (correo, creado_en),
  INDEX ix_intentos_ip (ip, creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

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
    ON DELETE RESTRICT,
  INDEX ix_pedidos_usuario (usuario_id),
  INDEX ix_pedidos_estado (estado),
  INDEX ix_pedidos_fecha (creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

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
    ON DELETE CASCADE,
  CONSTRAINT fk_detalle_plato FOREIGN KEY (plato_id)
    REFERENCES platos (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  INDEX ix_detalle_plato (plato_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
