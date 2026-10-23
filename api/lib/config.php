<?php

function configuracion(): array
{
    static $valores = null;
    if ($valores !== null) {
        return $valores;
    }
    $valores = [];
    $archivo = dirname(__DIR__, 2) . '/.env';
    if (!is_file($archivo)) {
        return $valores;
    }
    foreach (file($archivo, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $linea) {
        $linea = trim($linea);
        if ($linea === '' || $linea[0] === '#' || !str_contains($linea, '=')) {
            continue;
        }
        [$clave, $valor] = array_map('trim', explode('=', $linea, 2));
        $valores[$clave] = $valor;
    }
    return $valores;
}

function env(string $clave, string $porDefecto = ''): string
{
    $valor = function_exists('getenv') ? getenv($clave) : false;
    if ($valor === false || $valor === '') {
        $valor = configuracion()[$clave] ?? '';
    }
    return $valor === '' ? $porDefecto : $valor;
}
