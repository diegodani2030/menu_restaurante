-- =====================================================================
-- Raíces del Fogón — Datos iniciales del menú (DML)
-- Son los mismos platos que tenía la versión anterior en src/platos.js.
-- INSERT IGNORE evita duplicados si el script se ejecuta varias veces.
-- Los usuarios NO se insertan aquí: sus contraseñas deben guardarse como
-- hash, por eso los crea el script database/instalar.php.
-- =====================================================================

USE raices_del_fogon;

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
