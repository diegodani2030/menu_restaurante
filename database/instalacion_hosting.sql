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

INSERT IGNORE INTO categorias (nombre, descripcion) VALUES
  ('Entrada',      'Preparaciones ligeras para abrir el apetito'),
  ('Plato fuerte', 'Platos principales de la cocina tradicional colombiana'),
  ('Postre',       'Dulces tradicionales para cerrar la comida');

INSERT IGNORE INTO platos (categoria_id, nombre, descripcion, precio, imagen_url)
SELECT c.id, p.nombre, p.descripcion, p.precio, p.imagen_url
FROM (
  SELECT 'Entrada' AS categoria, 'Patacones fritos' AS nombre,
         'Plátano verde cortado en rodajas y frito' AS descripcion, 8000 AS precio,
         'https://www.recetasnestle.com.ec/sites/default/files/styles/recipe_detail_desktop_new/public/srh_recipes/1948727e80f74a1ca254452d482f639c.png?itok=9UinGLCu' AS imagen_url
  UNION ALL SELECT 'Entrada', 'Empanadas', 'Empanadas de carne crujientes', 5000,
         'https://comedera.com/wp-content/uploads/sites/9/2021/12/empanadas-colombianas1.jpg'
  UNION ALL SELECT 'Entrada', 'Arepa de choclo con queso', 'Arepa dulce de choclo con queso derretido', 7000,
         'https://cloudfront-us-east-1.images.arcpublishing.com/elespectador/3DY5P2KU5ZEZVCELFKFJHCV2UE.jpg'
  UNION ALL SELECT 'Plato fuerte', 'Sancocho de gallina', 'Sopa tradicional colombiana con gallina', 22000,
         'https://mojo.generalmills.com/api/public/content/geavWbc7i0eptb2tGb-CyA_gmi_hi_res_jpeg.jpeg?v=5f30c0a4&t=16e3ce250f244648bef28c5949fb99ff'
  UNION ALL SELECT 'Plato fuerte', 'Bandeja paisa', 'Plato típico con fríjoles, chicharrón, chorizo, carne, huevo y arroz', 28000,
         'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Bandeja_paisa%2C_plato_Colombiano.jpg/1280px-Bandeja_paisa%2C_plato_Colombiano.jpg'
  UNION ALL SELECT 'Plato fuerte', 'Churrasco con papas', 'Churrasco a la plancha con papas fritas y chimichurri', 35000,
         'https://polloandino.com/cdn/shop/articles/Churrasco_de_Pollo_Andino_con_chimichurri_10dce469-fce7-4efd-9305-4eb8a9296617.png?v=1745439340'
  UNION ALL SELECT 'Postre', 'Arroz con leche', 'Postre tradicional de arroz con leche y canela', 6000,
         'https://www.hola.com/horizon/landscape/fda7250a1a13-adobestock656385451.jpg'
  UNION ALL SELECT 'Postre', 'Tres leches', 'Bizcocho empapado en tres tipos de leche', 9000,
         'https://rms-media-prod.generalmills.com/81a71e1c-cd25-4cb4-85c0-ff21ff7668ec.jpg'
  UNION ALL SELECT 'Postre', 'Churros con chocolate', 'Churros crujientes con salsa de chocolate caliente', 11000,
         'https://delishglobe.com/wp-content/uploads/2024/10/Churros-con-Chocolate-Recipe.png'
) AS p
JOIN categorias c ON c.nombre = p.categoria;
