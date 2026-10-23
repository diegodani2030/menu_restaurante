<?php
// Consultas de resumen (conteos, totales y promedios) para el panel del administrador.
// Los pedidos cancelados no cuentan como ventas.

ruta('GET', '/reportes/resumen', function () {
    requiereAdmin();

    $general = consultarUno(
        "SELECT COUNT(*) AS pedidos,
                COALESCE(SUM(total), 0) AS ventas,
                COALESCE(AVG(total), 0) AS ticket_promedio,
                COUNT(DISTINCT usuario_id) AS clientes
         FROM pedidos
         WHERE estado <> 'cancelado'"
    );

    $porEstado = consultar(
        'SELECT estado, COUNT(*) AS pedidos, COALESCE(SUM(total), 0) AS total
         FROM pedidos GROUP BY estado ORDER BY pedidos DESC'
    );

    $porCategoria = consultar(
        'SELECT c.nombre AS categoria,
                COUNT(p.id) AS platos,
                COALESCE(ROUND(AVG(p.precio)), 0) AS precio_promedio,
                COALESCE(MIN(p.precio), 0) AS precio_minimo,
                COALESCE(MAX(p.precio), 0) AS precio_maximo
         FROM categorias c
         LEFT JOIN platos p ON p.categoria_id = c.id
         GROUP BY c.id ORDER BY c.id'
    );

    $masVendidos = consultar(
        "SELECT pl.nombre AS plato, c.nombre AS categoria,
                SUM(d.cantidad) AS unidades, SUM(d.subtotal) AS ingresos
         FROM detalle_pedido d
         INNER JOIN pedidos pe ON pe.id = d.pedido_id
         INNER JOIN platos pl ON pl.id = d.plato_id
         INNER JOIN categorias c ON c.id = pl.categoria_id
         WHERE pe.estado <> 'cancelado'
         GROUP BY pl.id
         ORDER BY unidades DESC, ingresos DESC
         LIMIT 5"
    );

    responder([
        'general' => [
            'pedidos' => (int) $general['pedidos'],
            'ventas' => numero($general['ventas']),
            'ticket_promedio' => (int) round((float) $general['ticket_promedio']),
            'clientes' => (int) $general['clientes'],
        ],
        'porEstado' => array_map(fn ($f) => [
            'estado' => $f['estado'],
            'pedidos' => (int) $f['pedidos'],
            'total' => numero($f['total']),
        ], $porEstado),
        'porCategoria' => array_map(fn ($f) => [
            'categoria' => $f['categoria'],
            'platos' => (int) $f['platos'],
            'precio_promedio' => numero($f['precio_promedio']),
            'precio_minimo' => numero($f['precio_minimo']),
            'precio_maximo' => numero($f['precio_maximo']),
        ], $porCategoria),
        'masVendidos' => array_map(fn ($f) => [
            'plato' => $f['plato'],
            'categoria' => $f['categoria'],
            'unidades' => (int) $f['unidades'],
            'ingresos' => numero($f['ingresos']),
        ], $masVendidos),
    ]);
});
