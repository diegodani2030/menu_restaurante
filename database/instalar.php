<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('Este script solo se ejecuta desde la consola.');
}

require dirname(__DIR__) . '/api/lib/config.php';
require dirname(__DIR__) . '/api/lib/validaciones.php';

$conDemo = in_array('--demo', $argv, true);

try {
    $pdo = new PDO(
        sprintf('mysql:host=%s;port=%s;charset=utf8mb4', env('DB_HOST', '127.0.0.1'), env('DB_PORT', '3306')),
        env('DB_USER', 'root'),
        env('DB_PASSWORD'),
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );

    foreach (['schema.sql', 'seed.sql'] as $archivo) {
        $pdo->exec(file_get_contents(__DIR__ . "/$archivo"));
        echo "✔ $archivo ejecutado\n";
    }
    $pdo->exec('USE raices_del_fogon');

    $columna = $pdo->query(
        "SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = 'raices_del_fogon' AND TABLE_NAME = 'platos' AND COLUMN_NAME = 'archivo_id'"
    )->fetchColumn();
    if ((int) $columna === 0) {
        $pdo->exec(file_get_contents(__DIR__ . '/migracion_001_fotos.sql'));
        echo "✔ migracion_001_fotos.sql ejecutada (fotos de platos)\n";
    }

    $crearUsuario = function (array $u, string $rol) use ($pdo): int {
        $buscar = $pdo->prepare('SELECT id FROM usuarios WHERE correo = ?');
        $buscar->execute([$u['correo']]);
        if ($id = $buscar->fetchColumn()) {
            return (int) $id;
        }
        $pdo->prepare('INSERT INTO usuarios (nombre, correo, telefono, password_hash, rol) VALUES (?, ?, ?, ?, ?)')
            ->execute([$u['nombre'], $u['correo'], $u['telefono'], password_hash($u['password'], PASSWORD_DEFAULT), $rol]);
        return (int) $pdo->lastInsertId();
    };

    [$admin, $errores] = validarRegistro([
        'nombre' => env('ADMIN_NOMBRE', 'Administrador'),
        'correo' => env('ADMIN_CORREO'),
        'telefono' => env('ADMIN_TELEFONO', '3000000000'),
        'password' => env('ADMIN_PASSWORD'),
    ]);
    if ($errores) {
        echo "⚠ No se creó el administrador. Revise ADMIN_* en el archivo .env:\n";
        foreach ($errores as $campo => $mensaje) {
            echo "   - $campo: $mensaje\n";
        }
    } else {
        $crearUsuario($admin, 'admin');
        echo "✔ Administrador listo: {$admin['correo']}\n";
    }

    if ($conDemo) {
        $ids = [];
        foreach ([
            ['nombre' => 'Cliente Demo Uno', 'correo' => 'cliente1@demo.test', 'telefono' => '3001112233'],
            ['nombre' => 'Cliente Demo Dos', 'correo' => 'cliente2@demo.test', 'telefono' => '3004445566'],
        ] as $cliente) {
            $ids[] = $crearUsuario($cliente + ['password' => bin2hex(random_bytes(12))], 'cliente');
        }

        $existentes = $pdo->prepare('SELECT COUNT(*) FROM pedidos WHERE usuario_id IN (?, ?)');
        $existentes->execute($ids);
        if ((int) $existentes->fetchColumn() === 0) {
            $platos = [];
            foreach ($pdo->query('SELECT id, nombre, precio FROM platos') as $p) {
                $platos[$p['nombre']] = $p;
            }
            $pedidos = [
                [$ids[0], 'entregado', [['Bandeja paisa', 2], ['Arroz con leche', 2]]],
                [$ids[0], 'pendiente', [['Empanadas', 3], ['Sancocho de gallina', 1]]],
                [$ids[1], 'en_preparacion', [['Churrasco con papas', 1], ['Tres leches', 1]]],
                [$ids[1], 'cancelado', [['Patacones fritos', 1]]],
            ];
            $insertarPedido = $pdo->prepare(
                "INSERT INTO pedidos (usuario_id, estado, total, observaciones) VALUES (?, ?, ?, 'Pedido de demostración')"
            );
            $insertarDetalle = $pdo->prepare(
                'INSERT INTO detalle_pedido (pedido_id, plato_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)'
            );
            $pdo->beginTransaction();
            foreach ($pedidos as [$usuarioId, $estado, $items]) {
                $total = array_sum(array_map(fn ($i) => $platos[$i[0]]['precio'] * $i[1], $items));
                $insertarPedido->execute([$usuarioId, $estado, $total]);
                $pedidoId = (int) $pdo->lastInsertId();
                foreach ($items as [$nombre, $cantidad]) {
                    $insertarDetalle->execute([$pedidoId, $platos[$nombre]['id'], $cantidad, $platos[$nombre]['precio']]);
                }
            }
            $pdo->commit();
            echo "✔ Datos de demostración agregados (2 clientes ficticios, 4 pedidos)\n";
        } else {
            echo "✔ Los datos de demostración ya existían\n";
        }
    }
    echo "Base de datos lista.\n";
} catch (Throwable $error) {
    fwrite(STDERR, '✖ Error instalando la base de datos: ' . $error->getMessage() . "\n");
    exit(1);
}
