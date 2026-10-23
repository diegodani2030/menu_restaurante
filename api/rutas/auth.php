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

ruta('POST', '/auth/login', function () {
    $datos = validar('validarLogin', cuerpo());
    $fila = consultarUno('SELECT id, password_hash FROM usuarios WHERE correo = ?', [$datos['correo']]);
    // El mismo mensaje para correo inexistente o contraseña errada: así no se
    // revela qué correos están registrados.
    if (!$fila || !password_verify($datos['password'], $fila['password_hash'])) {
        throw new ErrorApi(401, 'Correo o contraseña incorrectos.');
    }
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
