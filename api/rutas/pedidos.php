<?php

function formatoPedido(array $p): array
{
    $p['total'] = numero($p['total']);
    $p['usuario_id'] = (int) $p['usuario_id'];
    if (isset($p['unidades'])) {
        $p['unidades'] = (int) $p['unidades'];
    }
    return $p;
}

ruta('POST', '/pedidos', function () {
    $sesion = requiereSesion();
    $datos = validar('validarPedido', cuerpo());
    $ids = array_column($datos['items'], 'plato_id');

    $pedido = transaccion(function () use ($datos, $ids, $sesion) {
        $marcadores = implode(', ', array_fill(0, count($ids), '?'));
        $platos = consultar("SELECT id, precio FROM platos WHERE disponible = 1 AND id IN ($marcadores)", $ids);
        if (count($platos) !== count($ids)) {
            throw new ErrorApi(400, 'Uno o más platos ya no están disponibles. Actualice su orden.');
        }
        $precios = array_column($platos, 'precio', 'id');
        $total = 0;
        foreach ($datos['items'] as $item) {
            $total += $precios[$item['plato_id']] * $item['cantidad'];
        }

        ejecutar(
            'INSERT INTO pedidos (usuario_id, total, observaciones) VALUES (?, ?, ?)',
            [$sesion['id'], $total, $datos['observaciones']]
        );
        $pedidoId = ultimoId();
        foreach ($datos['items'] as $item) {
            ejecutar(
                'INSERT INTO detalle_pedido (pedido_id, plato_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                [$pedidoId, $item['plato_id'], $item['cantidad'], $precios[$item['plato_id']]]
            );
        }
        return ['id' => $pedidoId, 'total' => numero($total), 'estado' => 'pendiente'];
    });

    responder($pedido, 201);
});

ruta('GET', '/pedidos', function () {
    $sesion = requiereSesion();
    $condiciones = [];
    $parametros = [];

    if ($sesion['rol'] !== 'admin') {
        $condiciones[] = 'pe.usuario_id = ?';
        $parametros[] = $sesion['id'];
    } else {
        $buscar = mb_substr(trim((string) ($_GET['buscar'] ?? '')), 0, 100);
        if ($buscar !== '') {
            $condiciones[] = '(u.nombre LIKE ? OR u.correo LIKE ?)';
            array_push($parametros, "%$buscar%", "%$buscar%");
        }
    }
    if (in_array($_GET['estado'] ?? '', ESTADOS_PEDIDO, true)) {
        $condiciones[] = 'pe.estado = ?';
        $parametros[] = $_GET['estado'];
    }
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $_GET['desde'] ?? '')) {
        $condiciones[] = 'pe.creado_en >= ?';
        $parametros[] = $_GET['desde'] . ' 00:00:00';
    }
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $_GET['hasta'] ?? '')) {
        $condiciones[] = 'pe.creado_en <= ?';
        $parametros[] = $_GET['hasta'] . ' 23:59:59';
    }

    $where = $condiciones ? 'WHERE ' . implode(' AND ', $condiciones) : '';
    $pedidos = consultar(
        "SELECT pe.id, pe.estado, pe.total, pe.observaciones, pe.creado_en,
                u.id AS usuario_id, u.nombre AS cliente, u.correo, u.telefono,
                COALESCE(SUM(d.cantidad), 0) AS unidades
         FROM pedidos pe
         INNER JOIN usuarios u ON u.id = pe.usuario_id
         LEFT JOIN detalle_pedido d ON d.pedido_id = pe.id
         $where
         GROUP BY pe.id
         ORDER BY pe.creado_en DESC, pe.id DESC",
        $parametros
    );
    responder(array_map('formatoPedido', $pedidos));
});

function buscarPedido(int $id, array $sesion): array
{
    $pedido = consultarUno(
        'SELECT pe.id, pe.estado, pe.total, pe.observaciones, pe.creado_en,
                u.id AS usuario_id, u.nombre AS cliente, u.correo, u.telefono
         FROM pedidos pe
         INNER JOIN usuarios u ON u.id = pe.usuario_id
         WHERE pe.id = ?',
        [$id]
    );
    if (!$pedido || ($sesion['rol'] !== 'admin' && (int) $pedido['usuario_id'] !== $sesion['id'])) {
        throw new ErrorApi(404, 'El pedido no existe.');
    }
    return formatoPedido($pedido);
}

ruta('GET', '/pedidos/{id}', function (string $id) {
    $pedido = buscarPedido(idValido($id), requiereSesion());
    $detalle = consultar(
        'SELECT d.id, d.plato_id, pl.nombre AS plato, c.nombre AS categoria,
                d.cantidad, d.precio_unitario, d.subtotal
         FROM detalle_pedido d
         INNER JOIN platos pl ON pl.id = d.plato_id
         INNER JOIN categorias c ON c.id = pl.categoria_id
         WHERE d.pedido_id = ?
         ORDER BY d.id',
        [$pedido['id']]
    );
    $pedido['detalle'] = array_map(fn ($d) => [
        'precio_unitario' => numero($d['precio_unitario']),
        'subtotal' => numero($d['subtotal']),
    ] + $d, $detalle);
    responder($pedido);
});

ruta('PATCH', '/pedidos/{id}/estado', function (string $id) {
    requiereAdmin();
    $id = idValido($id);
    $estado = cuerpo()['estado'] ?? null;
    if (!in_array($estado, ESTADOS_PEDIDO, true)) {
        throw new ErrorApi(400, 'Estado no válido.', ['estado' => 'Use uno de: ' . implode(', ', ESTADOS_PEDIDO) . '.']);
    }
    if (!consultarUno('SELECT id FROM pedidos WHERE id = ?', [$id])) {
        throw new ErrorApi(404, 'El pedido no existe.');
    }
    ejecutar('UPDATE pedidos SET estado = ? WHERE id = ?', [$estado, $id]);
    responder(['id' => $id, 'estado' => $estado]);
});

ruta('PATCH', '/pedidos/{id}/cancelar', function (string $id) {
    $pedido = buscarPedido(idValido($id), requiereSesion());
    if ($pedido['estado'] !== 'pendiente') {
        throw new ErrorApi(409, 'Solo se pueden cancelar pedidos en estado pendiente.');
    }
    ejecutar("UPDATE pedidos SET estado = 'cancelado' WHERE id = ? AND estado = 'pendiente'", [$pedido['id']]);
    responder(['id' => $pedido['id'], 'estado' => 'cancelado']);
});
