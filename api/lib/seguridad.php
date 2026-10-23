<?php

const NOMBRE_COOKIE = 'rf_sesion';
const DURACION_SESION = 8 * 60 * 60;

function iniciarSesionPhp(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.gc_maxlifetime', (string) DURACION_SESION);
    session_name(NOMBRE_COOKIE);
    session_set_cookie_params([
        'lifetime' => DURACION_SESION,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Strict',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    ]);
    session_start();
}

function sesionActual(): ?array
{
    static $sesion = false;
    if ($sesion !== false) {
        return $sesion;
    }
    $sesion = null;
    if (!empty($_COOKIE[NOMBRE_COOKIE])) {
        iniciarSesionPhp();
        if (isset($_SESSION['usuario_id'], $_SESSION['expira']) && $_SESSION['expira'] > time()) {
            $sesion = ['id' => $_SESSION['usuario_id'], 'rol' => $_SESSION['rol']];
        }
    }
    return $sesion;
}

function guardarSesion(array $usuario): void
{
    iniciarSesionPhp();
    session_regenerate_id(true);
    $_SESSION['usuario_id'] = (int) $usuario['id'];
    $_SESSION['rol'] = $usuario['rol'];
    $_SESSION['expira'] = time() + DURACION_SESION;
}

function cerrarSesion(): void
{
    if (!empty($_COOKIE[NOMBRE_COOKIE])) {
        iniciarSesionPhp();
        $_SESSION = [];
        session_destroy();
    }
    setcookie(NOMBRE_COOKIE, '', ['expires' => time() - 3600, 'path' => '/', 'httponly' => true, 'samesite' => 'Strict']);
}

function requiereSesion(): array
{
    $sesion = sesionActual();
    if (!$sesion) {
        throw new ErrorApi(401, 'Debe iniciar sesión para continuar.');
    }
    return $sesion;
}

function requiereAdmin(): array
{
    $sesion = requiereSesion();
    if ($sesion['rol'] !== 'admin') {
        throw new ErrorApi(403, 'No tiene permisos para realizar esta acción.');
    }
    return $sesion;
}

function esAdmin(): bool
{
    return (sesionActual()['rol'] ?? null) === 'admin';
}
