<?php

declare(strict_types=1);

require __DIR__ . '/lib/config.php';
require __DIR__ . '/lib/respuesta.php';
require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/seguridad.php';
require __DIR__ . '/lib/validaciones.php';
require __DIR__ . '/lib/archivos.php';

ini_set('display_errors', '0');
ini_set('zend.exception_ignore_args', '1');
set_error_handler(function (int $nivel, string $mensaje, string $archivo, int $linea) {
    if (!(error_reporting() & $nivel)) {
        return false;
    }
    throw new ErrorException($mensaje, 0, $nivel, $archivo, $linea);
});
set_exception_handler('manejarError');

header_remove('X-Powered-By');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: same-origin');

$RUTAS = [];

function ruta(string $metodo, string $patron, callable $accion): void
{
    global $RUTAS;
    $regex = '#^' . preg_replace('#\{\w+\}#', '([^/]+)', $patron) . '$#';
    $RUTAS[] = [$metodo, $regex, $accion];
}

$ruta = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if (str_starts_with($ruta, '/uploads/')) {
    servirFoto($ruta);
}
if (!preg_match('#^/api(/.*)?$#', $ruta, $coincidencia)) {
    servirFrontend($ruta);
}

require __DIR__ . '/rutas/auth.php';
require __DIR__ . '/rutas/categorias.php';
require __DIR__ . '/rutas/platos.php';
require __DIR__ . '/rutas/pedidos.php';
require __DIR__ . '/rutas/reportes.php';

$recurso = rtrim($coincidencia[1] ?? '', '/') ?: '/';
$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$rutaExiste = false;

foreach ($RUTAS as [$metodoRuta, $regex, $accion]) {
    if (preg_match($regex, $recurso, $parametros)) {
        $rutaExiste = true;
        if ($metodoRuta === $metodo) {
            array_shift($parametros);
            $accion(...$parametros);
            exit;
        }
    }
}

responder(
    ['error' => $rutaExiste ? 'Método no permitido.' : 'Recurso no encontrado.'],
    $rutaExiste ? 405 : 404
);

function servirFrontend(string $ruta): never
{
    $dist = realpath(dirname(__DIR__) . '/dist');
    if ($dist === false) {
        http_response_code(404);
        header('Content-Type: text/plain; charset=utf-8');
        echo "Frontend no compilado. Ejecute `npm run build` o use `npm run dev` (http://localhost:5173).";
        exit;
    }
    $archivo = realpath($dist . '/' . ltrim(rawurldecode($ruta), '/'));
    if ($archivo === false || !is_file($archivo) || !str_starts_with($archivo, $dist . DIRECTORY_SEPARATOR)) {
        $archivo = $dist . DIRECTORY_SEPARATOR . 'index.html';
    }
    $tipos = [
        'html' => 'text/html; charset=utf-8', 'js' => 'text/javascript', 'css' => 'text/css',
        'svg' => 'image/svg+xml', 'png' => 'image/png', 'jpg' => 'image/jpeg', 'ico' => 'image/x-icon',
        'json' => 'application/json', 'woff2' => 'font/woff2',
    ];
    $extension = strtolower(pathinfo($archivo, PATHINFO_EXTENSION));
    header('Content-Type: ' . ($tipos[$extension] ?? 'application/octet-stream'));
    readfile($archivo);
    exit;
}
