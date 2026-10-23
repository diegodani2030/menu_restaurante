<?php

function conexion(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            env('DB_HOST', '127.0.0.1'),
            env('DB_PORT', '3306'),
            env('DB_NAME', 'raices_del_fogon')
        );
        $pdo = new PDO($dsn, env('DB_USER', 'root'), env('DB_PASSWORD'), [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
    return $pdo;
}

function consultar(string $sql, array $parametros = []): array
{
    $sentencia = conexion()->prepare($sql);
    $sentencia->execute($parametros);
    return $sentencia->fetchAll();
}

function consultarUno(string $sql, array $parametros = []): ?array
{
    return consultar($sql, $parametros)[0] ?? null;
}

function ejecutar(string $sql, array $parametros = []): int
{
    $sentencia = conexion()->prepare($sql);
    $sentencia->execute($parametros);
    return $sentencia->rowCount();
}

function ultimoId(): int
{
    return (int) conexion()->lastInsertId();
}

function transaccion(callable $trabajo): mixed
{
    $pdo = conexion();
    $pdo->beginTransaction();
    try {
        $resultado = $trabajo();
        $pdo->commit();
        return $resultado;
    } catch (Throwable $error) {
        $pdo->rollBack();
        throw $error;
    }
}

function numero(mixed $valor): int|float
{
    $numero = (float) $valor;
    return floor($numero) === $numero ? (int) $numero : $numero;
}
