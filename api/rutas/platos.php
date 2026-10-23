<?php

const ORDENES_PLATOS = [
    'nombre' => 'p.nombre',
    'precio' => 'p.precio',
    'categoria' => 'c.nombre',
    'fecha' => 'p.creado_en',
];

const SQL_PLATOS = "
  SELECT p.id, p.nombre, p.descripcion, p.precio, p.imagen_url, p.disponible,
         p.categoria_id, c.nombre AS categoria, p.creado_en, p.actualizado_en,
         p.archivo_id, a.nombre_original AS archivo_nombre,
         COALESCE(CONCAT('/', a.ruta), p.imagen_url) AS imagen
  FROM platos p
  INNER JOIN categorias c ON c.id = p.categoria_id
  LEFT JOIN archivos a ON a.id = p.archivo_id";

function formatoPlato(array $p): array
{
    $p['precio'] = numero($p['precio']);
    $p['disponible'] = (bool) $p['disponible'];
    return $p;
}

function buscarPlato(int $id): ?array
{
    $plato = consultarUno(SQL_PLATOS . ' WHERE p.id = ?', [$id]);
    return $plato ? formatoPlato($plato) : null;
}

ruta('GET', '/platos', function () {
    $condiciones = [];
    $parametros = [];

    $buscar = mb_substr(trim((string) ($_GET['buscar'] ?? '')), 0, 100);
    if ($buscar !== '') {
        $condiciones[] = '(p.nombre LIKE ? OR p.descripcion LIKE ?)';
        array_push($parametros, "%$buscar%", "%$buscar%");
    }
    $categoriaId = enteroPositivo($_GET['categoria_id'] ?? null);
    if ($categoriaId) {
        $condiciones[] = 'p.categoria_id = ?';
        $parametros[] = $categoriaId;
    }
    $disponible = $_GET['disponible'] ?? '';
    if (!esAdmin()) {
        $condiciones[] = 'p.disponible = 1';
    } elseif ($disponible === '1' || $disponible === '0') {
        $condiciones[] = 'p.disponible = ?';
        $parametros[] = (int) $disponible;
    }
    if (is_numeric($_GET['precio_min'] ?? null)) {
        $condiciones[] = 'p.precio >= ?';
        $parametros[] = (float) $_GET['precio_min'];
    }
    if (is_numeric($_GET['precio_max'] ?? null)) {
        $condiciones[] = 'p.precio <= ?';
        $parametros[] = (float) $_GET['precio_max'];
    }

    $orden = ORDENES_PLATOS[$_GET['orden'] ?? ''] ?? 'c.id, p.id';
    $direccion = ($_GET['dir'] ?? '') === 'desc' ? 'DESC' : 'ASC';
    $where = $condiciones ? 'WHERE ' . implode(' AND ', $condiciones) : '';

    $platos = consultar(SQL_PLATOS . " $where ORDER BY $orden $direccion", $parametros);
    responder(array_map('formatoPlato', $platos));
});

ruta('GET', '/platos/{id}', function (string $id) {
    $plato = buscarPlato(idValido($id));
    if (!$plato || (!$plato['disponible'] && !esAdmin())) {
        throw new ErrorApi(404, 'El plato no existe.');
    }
    $ventas = consultarUno(
        "SELECT COUNT(DISTINCT d.pedido_id) AS pedidos, COALESCE(SUM(d.cantidad), 0) AS unidades
         FROM detalle_pedido d
         INNER JOIN pedidos pe ON pe.id = d.pedido_id AND pe.estado <> 'cancelado'
         WHERE d.plato_id = ?",
        [$plato['id']]
    );
    $plato['ventas'] = ['pedidos' => (int) $ventas['pedidos'], 'unidades' => (int) $ventas['unidades']];
    responder($plato);
});

ruta('POST', '/platos', function () {
    requiereAdmin();
    $d = validar('validarPlato', cuerpo());
    ejecutar(
        'INSERT INTO platos (categoria_id, nombre, descripcion, precio, imagen_url, disponible) VALUES (?, ?, ?, ?, ?, ?)',
        [$d['categoria_id'], $d['nombre'], $d['descripcion'], $d['precio'], $d['imagen_url'], $d['disponible'] ? 1 : 0]
    );
    responder(buscarPlato(ultimoId()), 201);
});

ruta('PUT', '/platos/{id}', function (string $id) {
    requiereAdmin();
    $id = idValido($id);
    $d = validar('validarPlato', cuerpo());
    if (!buscarPlato($id)) {
        throw new ErrorApi(404, 'El plato no existe.');
    }
    ejecutar(
        'UPDATE platos SET categoria_id = ?, nombre = ?, descripcion = ?, precio = ?, imagen_url = ?, disponible = ? WHERE id = ?',
        [$d['categoria_id'], $d['nombre'], $d['descripcion'], $d['precio'], $d['imagen_url'], $d['disponible'] ? 1 : 0, $id]
    );
    responder(buscarPlato($id));
});

ruta('DELETE', '/platos/{id}', function (string $id) {
    requiereAdmin();
    $id = idValido($id);
    $uso = consultarUno('SELECT COUNT(*) AS total FROM detalle_pedido WHERE plato_id = ?', [$id]);
    if ($uso['total'] > 0) {
        throw new ErrorApi(409, 'Este plato ya aparece en pedidos, por eso no se puede eliminar. Márquelo como "no disponible" para ocultarlo del menú.');
    }
    $foto = transaccion(function () use ($id) {
        $foto = consultarUno(
            'SELECT a.id, a.ruta FROM platos p INNER JOIN archivos a ON a.id = p.archivo_id WHERE p.id = ?',
            [$id]
        );
        if (ejecutar('DELETE FROM platos WHERE id = ?', [$id]) === 0) {
            throw new ErrorApi(404, 'El plato no existe.');
        }
        if ($foto) {
            ejecutar('DELETE FROM archivos WHERE id = ?', [$foto['id']]);
        }
        return $foto;
    });
    if ($foto) {
        borrarArchivoFisico($foto['ruta']);
    }
    responder(['mensaje' => 'Plato eliminado.']);
});

ruta('POST', '/platos/{id}/imagen', function (string $id) {
    requiereAdmin();
    $id = idValido($id);
    if (!buscarPlato($id)) {
        throw new ErrorApi(404, 'El plato no existe.');
    }

    $nueva = recibirImagen('imagen');
    try {
        $anterior = transaccion(function () use ($id, $nueva) {
            $anterior = consultarUno(
                'SELECT a.id, a.ruta FROM platos p INNER JOIN archivos a ON a.id = p.archivo_id WHERE p.id = ? FOR UPDATE',
                [$id]
            );
            ejecutar(
                'INSERT INTO archivos (nombre_original, nombre_sistema, ruta, tipo_mime, tamano_bytes) VALUES (?, ?, ?, ?, ?)',
                [$nueva['nombre_original'], $nueva['nombre_sistema'], $nueva['ruta'], $nueva['tipo_mime'], $nueva['tamano_bytes']]
            );
            ejecutar('UPDATE platos SET archivo_id = ? WHERE id = ?', [ultimoId(), $id]);
            if ($anterior) {
                ejecutar('DELETE FROM archivos WHERE id = ?', [$anterior['id']]);
            }
            return $anterior;
        });
    } catch (Throwable $error) {
        borrarArchivoFisico($nueva['ruta']);
        throw $error;
    }
    if ($anterior) {
        borrarArchivoFisico($anterior['ruta']);
    }
    responder(buscarPlato($id), 201);
});

ruta('DELETE', '/platos/{id}/imagen', function (string $id) {
    requiereAdmin();
    $id = idValido($id);
    $plato = buscarPlato($id);
    if (!$plato) {
        throw new ErrorApi(404, 'El plato no existe.');
    }
    if (!$plato['archivo_id']) {
        throw new ErrorApi(404, 'El plato no tiene una foto subida.');
    }
    $foto = consultarUno('SELECT ruta FROM archivos WHERE id = ?', [$plato['archivo_id']]);
    ejecutar('DELETE FROM archivos WHERE id = ?', [$plato['archivo_id']]);
    if ($foto) {
        borrarArchivoFisico($foto['ruta']);
    }
    responder(buscarPlato($id));
});
