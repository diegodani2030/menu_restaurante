<?php

const SQL_CATEGORIAS = '
  SELECT c.id, c.nombre, c.descripcion, c.creado_en,
         COUNT(p.id) AS total_platos,
         COALESCE(SUM(p.disponible = 1), 0) AS platos_disponibles
  FROM categorias c
  LEFT JOIN platos p ON p.categoria_id = c.id';

function formatoCategoria(array $c): array
{
    $c['total_platos'] = (int) $c['total_platos'];
    $c['platos_disponibles'] = (int) $c['platos_disponibles'];
    return $c;
}

ruta('GET', '/categorias', function () {
    $categorias = consultar(SQL_CATEGORIAS . ' GROUP BY c.id ORDER BY c.id');
    responder(array_map('formatoCategoria', $categorias));
});

ruta('GET', '/categorias/{id}', function (string $id) {
    $categoria = consultarUno(SQL_CATEGORIAS . ' WHERE c.id = ? GROUP BY c.id', [idValido($id)]);
    if (!$categoria) {
        throw new ErrorApi(404, 'La categoría no existe.');
    }
    responder(formatoCategoria($categoria));
});

ruta('POST', '/categorias', function () {
    requiereAdmin();
    $datos = validar('validarCategoria', cuerpo());
    ejecutar('INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)', [$datos['nombre'], $datos['descripcion']]);
    responder(['id' => ultimoId()] + $datos, 201);
});

ruta('PUT', '/categorias/{id}', function (string $id) {
    requiereAdmin();
    $id = idValido($id);
    $datos = validar('validarCategoria', cuerpo());
    if (!consultarUno('SELECT id FROM categorias WHERE id = ?', [$id])) {
        throw new ErrorApi(404, 'La categoría no existe.');
    }
    ejecutar('UPDATE categorias SET nombre = ?, descripcion = ? WHERE id = ?', [$datos['nombre'], $datos['descripcion'], $id]);
    responder(['id' => $id] + $datos);
});

ruta('DELETE', '/categorias/{id}', function (string $id) {
    requiereAdmin();
    $id = idValido($id);
    $uso = consultarUno('SELECT COUNT(*) AS total FROM platos WHERE categoria_id = ?', [$id]);
    if ($uso['total'] > 0) {
        throw new ErrorApi(409, "No se puede eliminar: la categoría tiene {$uso['total']} plato(s). Muévalos o elimínelos primero.");
    }
    if (ejecutar('DELETE FROM categorias WHERE id = ?', [$id]) === 0) {
        throw new ErrorApi(404, 'La categoría no existe.');
    }
    responder(['mensaje' => 'Categoría eliminada.']);
});
