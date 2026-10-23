<?php
// Registro, inicio y cierre de sesión.

function usuarioPublico(int $id): ?array
{
    $usuario = consultarUno(
        'SELECT id, nombre, correo, telefono, rol, creado_en FROM usuarios WHERE id = ?',
        [$id]
    );
    return $usuario;
}

// Registro de clientes nuevos. El rol siempre es "cliente": un usuario no
// puede registrarse a sí mismo como administrador.
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

// Protección contra fuerza bruta: máximo de intentos en una ventana de tiempo.
// El límite principal es por correo + IP: así un atacante no puede bloquear la
// cuenta de otra persona que entra desde otro equipo.
const MAX_INTENTOS_CORREO_IP = 5;  // mismo correo desde el mismo equipo
const MAX_INTENTOS_IP = 50;        // muchos correos desde un mismo equipo
const MAX_INTENTOS_CORREO = 100;   // mismo correo desde muchos equipos (ataque distribuido)
const MINUTOS_BLOQUEO = 15;

// Hash de una contraseña aleatoria que nadie conoce. Se verifica cuando el correo
// no existe para que la respuesta tarde lo mismo y no revele qué correos están registrados.
const HASH_FICTICIO = '$2y$10$XvlAzzPfh6GLwAIAoDn.s.h88Cg8DZiB3CdgT3FDr9MeTEihcW5JC';

ruta('POST', '/auth/login', function () {
    $datos = validar('validarLogin', cuerpo());
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'desconocida';

    // El intento se registra ANTES de revisar la contraseña y luego se cuenta
    // incluyéndolo. Así, aunque lleguen muchas peticiones al mismo tiempo, cada una
    // ve también los intentos de las demás y no se puede saltar el límite.
    ejecutar('INSERT INTO intentos_login (correo, ip) VALUES (?, ?)', [$datos['correo'], $ip]);
    $intentos = consultarUno(
        'SELECT SUM(correo = ? AND ip = ?) AS par, SUM(ip = ?) AS por_ip, SUM(correo = ?) AS por_correo
         FROM intentos_login
         WHERE (correo = ? OR ip = ?) AND creado_en > NOW() - INTERVAL ' . MINUTOS_BLOQUEO . ' MINUTE',
        [$datos['correo'], $ip, $ip, $datos['correo'], $datos['correo'], $ip]
    );
    if ((int) $intentos['par'] > MAX_INTENTOS_CORREO_IP
        || (int) $intentos['por_ip'] > MAX_INTENTOS_IP
        || (int) $intentos['por_correo'] > MAX_INTENTOS_CORREO) {
        header('Retry-After: ' . MINUTOS_BLOQUEO * 60);
        throw new ErrorApi(429, 'Demasiados intentos fallidos. Espere ' . MINUTOS_BLOQUEO . ' minutos e intente de nuevo.');
    }

    $fila = consultarUno('SELECT id, password_hash FROM usuarios WHERE correo = ?', [$datos['correo']]);
    $valida = password_verify($datos['password'], $fila['password_hash'] ?? HASH_FICTICIO);
    // El mismo mensaje para correo inexistente o contraseña errada: así no se
    // revela qué correos están registrados. El intento queda registrado como fallido.
    if (!$fila || !$valida) {
        ejecutar('DELETE FROM intentos_login WHERE creado_en < NOW() - INTERVAL 1 DAY'); // limpieza
        throw new ErrorApi(401, 'Correo o contraseña incorrectos.');
    }
    // Entrada correcta: se borran los intentos de este correo desde este equipo
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
