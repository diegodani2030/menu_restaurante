<?php

function usuarioPublico(int $id): ?array
{
    $usuario = consultarUno(
        'SELECT id, nombre, correo, telefono, rol, creado_en FROM usuarios WHERE id = ?',
        [$id]
    );
    return $usuario;
}

ruta('POST', '/auth/registro', function () {
    $datos = validar('validarRegistro', cuerpo());
    if (consultarUno('SELECT id FROM usuarios WHERE correo = ?', [$datos['correo']])) {
        throw new ErrorApi(409, 'Ya existe una cuenta con ese correo.', ['correo' => 'Este correo ya está registrado.']);
    }
    ejecutar(
        "INSERT INTO usuarios (nombre, correo, telefono, password_hash, rol) VALUES (?, ?, ?, ?, 'cliente')",
        [$datos['nombre'], $datos['correo'], $datos['telefono'], password_hash($datos['password'], PASSWORD_DEFAULT)]
    );
    $usuario = usuarioPublico(ultimoId());
    guardarSesion($usuario);
    responder(['usuario' => $usuario], 201);
});

const MAX_INTENTOS_CORREO_IP = 5;
const MAX_INTENTOS_IP = 50;
const MAX_IPS_POR_CORREO = 10;
const MINUTOS_BLOQUEO = 15;

const HASH_FICTICIO = '$2y$10$XvlAzzPfh6GLwAIAoDn.s.h88Cg8DZiB3CdgT3FDr9MeTEihcW5JC';

ruta('POST', '/auth/login', function () {
    $datos = validar('validarLogin', cuerpo());
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'desconocida';

    ejecutar('INSERT INTO intentos_login (correo, ip) VALUES (?, ?)', [$datos['correo'], $ip]);
    $intentoId = ultimoId();
    $intentos = consultarUno(
        'SELECT SUM(correo = ? AND ip = ?) AS par,
                SUM(ip = ?) AS por_ip,
                COUNT(DISTINCT CASE WHEN correo = ? THEN ip END) AS ips_correo
         FROM intentos_login
         WHERE (correo = ? OR ip = ?) AND creado_en > NOW() - INTERVAL ' . MINUTOS_BLOQUEO . ' MINUTE',
        [$datos['correo'], $ip, $ip, $datos['correo'], $datos['correo'], $ip]
    );
    if ((int) $intentos['par'] > MAX_INTENTOS_CORREO_IP
        || (int) $intentos['por_ip'] > MAX_INTENTOS_IP
        || (int) $intentos['ips_correo'] > MAX_IPS_POR_CORREO) {
        ejecutar('DELETE FROM intentos_login WHERE id = ?', [$intentoId]);
        header('Retry-After: ' . MINUTOS_BLOQUEO * 60);
        throw new ErrorApi(429, 'Demasiados intentos fallidos. Espere ' . MINUTOS_BLOQUEO . ' minutos e intente de nuevo.');
    }

    $fila = consultarUno('SELECT id, password_hash FROM usuarios WHERE correo = ?', [$datos['correo']]);
    $valida = password_verify($datos['password'], $fila['password_hash'] ?? HASH_FICTICIO);
    if (!$fila || !$valida) {
        ejecutar('DELETE FROM intentos_login WHERE creado_en < NOW() - INTERVAL 1 DAY');
        throw new ErrorApi(401, 'Correo o contraseña incorrectos.');
    }
    ejecutar('DELETE FROM intentos_login WHERE correo = ? AND ip = ?', [$datos['correo'], $ip]);
    $usuario = usuarioPublico((int) $fila['id']);
    guardarSesion($usuario);
    responder(['usuario' => $usuario]);
});

ruta('POST', '/auth/logout', function () {
    cerrarSesion();
    responder(['mensaje' => 'Sesión cerrada.']);
});

ruta('GET', '/auth/sesion', function () {
    $sesion = sesionActual();
    responder(['usuario' => $sesion ? usuarioPublico($sesion['id']) : null]);
});
