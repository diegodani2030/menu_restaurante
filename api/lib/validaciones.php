<?php

const ESTADOS_PEDIDO = ['pendiente', 'en_preparacion', 'entregado', 'cancelado'];
const REGEX_CORREO = '/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u';
const REGEX_NOMBRE_PERSONA = "/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]+$/u";
const REGEX_TELEFONO = '/^\+?\d{7,15}$/';

function texto(mixed $valor): string
{
    return is_string($valor) ? trim($valor) : '';
}

function espaciosSimples(string $valor): string
{
    return preg_replace('/\s+/u', ' ', $valor);
}

function enteroPositivo(mixed $valor): ?int
{
    if (is_int($valor)) {
        return $valor > 0 ? $valor : null;
    }
    if (is_float($valor) && floor($valor) === $valor) {
        return $valor > 0 ? (int) $valor : null;
    }
    if (is_string($valor) && ctype_digit($valor)) {
        return (int) $valor > 0 ? (int) $valor : null;
    }
    return null;
}

function validarLongitud(array &$errores, string $campo, string $valor, int $min, int $max, string $etiqueta, string $terminacion = 'o'): void
{
    $largo = mb_strlen($valor);
    if ($valor === '') {
        $errores[$campo] = "$etiqueta es obligatori$terminacion.";
    } elseif ($largo < $min) {
        $errores[$campo] = "$etiqueta debe tener al menos $min caracteres.";
    } elseif ($largo > $max) {
        $errores[$campo] = "$etiqueta no puede superar $max caracteres.";
    }
}

function validarRegistro(array $entrada): array
{
    $errores = [];
    $datos = [
        'nombre' => espaciosSimples(texto($entrada['nombre'] ?? null)),
        'correo' => mb_strtolower(texto($entrada['correo'] ?? null)),
        'telefono' => preg_replace('/[\s-]/', '', texto($entrada['telefono'] ?? null)),
        'password' => is_string($entrada['password'] ?? null) ? $entrada['password'] : '',
    ];

    validarLongitud($errores, 'nombre', $datos['nombre'], 3, 100, 'El nombre');
    if (!isset($errores['nombre']) && !preg_match(REGEX_NOMBRE_PERSONA, $datos['nombre'])) {
        $errores['nombre'] = 'El nombre solo puede contener letras y espacios.';
    }

    if ($datos['correo'] === '') {
        $errores['correo'] = 'El correo es obligatorio.';
    } elseif (mb_strlen($datos['correo']) > 150 || !preg_match(REGEX_CORREO, $datos['correo'])) {
        $errores['correo'] = 'Escriba un correo válido, por ejemplo nombre@correo.com.';
    }

    if ($datos['telefono'] === '') {
        $errores['telefono'] = 'El teléfono es obligatorio.';
    } elseif (!preg_match(REGEX_TELEFONO, $datos['telefono'])) {
        $errores['telefono'] = 'El teléfono debe tener entre 7 y 15 dígitos.';
    }

    $largo = strlen($datos['password']);
    if ($datos['password'] === '') {
        $errores['password'] = 'La contraseña es obligatoria.';
    } elseif ($largo < 8 || $largo > 72) {
        $errores['password'] = 'La contraseña debe tener entre 8 y 72 caracteres.';
    } elseif (!preg_match('/[A-Za-z]/', $datos['password']) || !preg_match('/\d/', $datos['password'])) {
        $errores['password'] = 'La contraseña debe combinar letras y números.';
    }

    return [$datos, $errores];
}

function validarLogin(array $entrada): array
{
    $errores = [];
    $datos = [
        'correo' => mb_strtolower(texto($entrada['correo'] ?? null)),
        'password' => is_string($entrada['password'] ?? null) ? $entrada['password'] : '',
    ];
    if ($datos['correo'] === '') {
        $errores['correo'] = 'El correo es obligatorio.';
    } elseif (!preg_match(REGEX_CORREO, $datos['correo'])) {
        $errores['correo'] = 'Escriba un correo válido.';
    }
    if ($datos['password'] === '') {
        $errores['password'] = 'La contraseña es obligatoria.';
    }
    return [$datos, $errores];
}

function validarPlato(array $entrada): array
{
    $errores = [];
    $precio = $entrada['precio'] ?? '';
    $precioTexto = is_int($precio) || is_float($precio) ? (string) $precio : texto($precio);
    $datos = [
        'nombre' => espaciosSimples(texto($entrada['nombre'] ?? null)),
        'descripcion' => texto($entrada['descripcion'] ?? null),
        'precio' => is_numeric($precioTexto) ? (float) $precioTexto : null,
        'categoria_id' => enteroPositivo($entrada['categoria_id'] ?? null),
        'imagen_url' => texto($entrada['imagen_url'] ?? null) ?: null,
        'disponible' => array_key_exists('disponible', $entrada) ? (bool) $entrada['disponible'] : true,
    ];

    validarLongitud($errores, 'nombre', $datos['nombre'], 3, 100, 'El nombre');
    validarLongitud($errores, 'descripcion', $datos['descripcion'], 10, 500, 'La descripción', 'a');

    if ($precioTexto === '') {
        $errores['precio'] = 'El precio es obligatorio.';
    } elseif (!preg_match('/^\d+(\.\d{1,2})?$/', $precioTexto)) {
        $errores['precio'] = 'El precio debe ser un número positivo (máximo 2 decimales).';
    } elseif ($datos['precio'] < 500 || $datos['precio'] > 1000000) {
        $errores['precio'] = 'El precio debe estar entre $500 y $1.000.000.';
    }

    if (!$datos['categoria_id']) {
        $errores['categoria_id'] = 'Seleccione una categoría.';
    }

    if ($datos['imagen_url'] !== null) {
        if (mb_strlen($datos['imagen_url']) > 500) {
            $errores['imagen_url'] = 'La URL no puede superar 500 caracteres.';
        } elseif (!preg_match('/^https?:\/\/\S+$/i', $datos['imagen_url'])) {
            $errores['imagen_url'] = 'La imagen debe ser una URL que empiece por http:// o https://.';
        }
    }

    return [$datos, $errores];
}

function validarCategoria(array $entrada): array
{
    $errores = [];
    $datos = [
        'nombre' => espaciosSimples(texto($entrada['nombre'] ?? null)),
        'descripcion' => texto($entrada['descripcion'] ?? null) ?: null,
    ];
    validarLongitud($errores, 'nombre', $datos['nombre'], 3, 50, 'El nombre');
    if ($datos['descripcion'] !== null && mb_strlen($datos['descripcion']) > 255) {
        $errores['descripcion'] = 'La descripción no puede superar 255 caracteres.';
    }
    return [$datos, $errores];
}

function validarPedido(array $entrada): array
{
    $errores = [];
    $items = is_array($entrada['items'] ?? null) ? array_values($entrada['items']) : [];
    $datos = [
        'observaciones' => texto($entrada['observaciones'] ?? null) ?: null,
        'items' => array_map(fn ($item) => [
            'plato_id' => enteroPositivo(is_array($item) ? ($item['plato_id'] ?? null) : null),
            'cantidad' => enteroPositivo(is_array($item) ? ($item['cantidad'] ?? null) : null),
        ], $items),
    ];

    $ids = array_column($datos['items'], 'plato_id');
    if (!$datos['items']) {
        $errores['items'] = 'El pedido debe tener al menos un plato.';
    } elseif (count($datos['items']) > 30) {
        $errores['items'] = 'El pedido no puede tener más de 30 platos distintos.';
    } elseif (array_filter($datos['items'], fn ($i) => !$i['plato_id'] || !$i['cantidad'] || $i['cantidad'] > 50)) {
        $errores['items'] = 'Cada plato debe tener una cantidad entre 1 y 50.';
    } elseif (count(array_unique($ids)) !== count($ids)) {
        $errores['items'] = 'Hay platos repetidos en el pedido.';
    }

    if ($datos['observaciones'] !== null && mb_strlen($datos['observaciones']) > 255) {
        $errores['observaciones'] = 'Las observaciones no pueden superar 255 caracteres.';
    }
    return [$datos, $errores];
}
