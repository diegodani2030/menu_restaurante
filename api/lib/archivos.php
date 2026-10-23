<?php

const MAX_BYTES_IMAGEN = 2 * 1024 * 1024;
const MAX_LADO_IMAGEN = 6000;
const CARPETA_FOTOS = 'uploads/platos';
const TIPOS_IMAGEN = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
];

function rutaAbsoluta(string $ruta): string
{
    return dirname(__DIR__, 2) . '/' . $ruta;
}

function bytesIni(string $valor): int
{
    $numero = (int) $valor;
    return match (strtoupper(substr(trim($valor), -1))) {
        'G' => $numero * 1024 ** 3,
        'M' => $numero * 1024 ** 2,
        'K' => $numero * 1024,
        default => $numero,
    };
}

function recibirImagen(string $campo): array
{
    $limitePost = bytesIni((string) ini_get('post_max_size'));
    if (empty($_FILES) && $limitePost > 0 && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > $limitePost) {
        throw new ErrorApi(413, 'La foto es demasiado grande (máximo 2 MB).');
    }
    $archivo = $_FILES[$campo] ?? null;
    if ($archivo === null || is_array($archivo['error'])) {
        throw new ErrorApi(400, 'Seleccione una foto.', ['imagen' => 'Seleccione una foto.']);
    }

    if ($archivo['error'] !== UPLOAD_ERR_OK) {
        [$estado, $mensaje] = match ($archivo['error']) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => [413, 'La foto es demasiado grande (máximo 2 MB).'],
            UPLOAD_ERR_PARTIAL => [400, 'La foto se subió de forma incompleta. Intente de nuevo.'],
            UPLOAD_ERR_NO_FILE => [400, 'Seleccione una foto.'],
            default => [500, 'El servidor no pudo recibir la foto.'],
        };
        if ($estado === 500) {
            error_log('[archivos] Error de subida PHP: ' . $archivo['error']);
        }
        throw new ErrorApi($estado, $mensaje, $estado === 500 ? null : ['imagen' => $mensaje]);
    }

    if (!is_uploaded_file($archivo['tmp_name'])) {
        throw new ErrorApi(400, 'Archivo no válido.', ['imagen' => 'Archivo no válido.']);
    }
    if ($archivo['size'] <= 0 || $archivo['size'] > MAX_BYTES_IMAGEN) {
        throw new ErrorApi(413, 'La foto debe pesar como máximo 2 MB.', ['imagen' => 'La foto debe pesar como máximo 2 MB.']);
    }

    $info = @getimagesize($archivo['tmp_name']);
    $mime = $info['mime'] ?? '';
    if (!$info || !isset(TIPOS_IMAGEN[$mime])) {
        throw new ErrorApi(415, 'Formato no permitido. Use una foto JPG, PNG o WEBP.', ['imagen' => 'Use una foto JPG, PNG o WEBP.']);
    }
    if ($info[0] < 1 || $info[1] < 1 || $info[0] > MAX_LADO_IMAGEN || $info[1] > MAX_LADO_IMAGEN) {
        throw new ErrorApi(400, 'Las dimensiones de la foto no son válidas (máximo 6000 px por lado).', ['imagen' => 'Máximo 6000 px por lado.']);
    }

    $original = basename(str_replace('\\', '/', (string) $archivo['name']));
    $original = preg_replace('/[\x00-\x1F\x7F]/u', '', $original) ?? '';
    $original = mb_substr($original, 0, 255) ?: 'foto';

    $nombreSistema = bin2hex(random_bytes(16)) . '.' . TIPOS_IMAGEN[$mime];
    $ruta = CARPETA_FOTOS . '/' . $nombreSistema;

    $carpeta = rutaAbsoluta(CARPETA_FOTOS);
    if (!is_dir($carpeta) && !mkdir($carpeta, 0755, true)) {
        error_log('[archivos] No se pudo crear ' . $carpeta);
        throw new ErrorApi(500, 'El servidor no pudo guardar la foto.');
    }
    if (!move_uploaded_file($archivo['tmp_name'], rutaAbsoluta($ruta))) {
        error_log('[archivos] move_uploaded_file falló para ' . $ruta);
        throw new ErrorApi(500, 'El servidor no pudo guardar la foto.');
    }

    return [
        'nombre_original' => $original,
        'nombre_sistema' => $nombreSistema,
        'ruta' => $ruta,
        'tipo_mime' => $mime,
        'tamano_bytes' => (int) $archivo['size'],
    ];
}

function borrarArchivoFisico(string $ruta): void
{
    if (preg_match('#^uploads/platos/[a-f0-9]{32}\.(jpg|png|webp)$#', $ruta) && is_file(rutaAbsoluta($ruta))) {
        @unlink(rutaAbsoluta($ruta));
    }
}

function servirFoto(string $ruta): void
{
    if (!preg_match('#^/uploads/platos/([a-f0-9]{32})\.(jpg|png|webp)$#', $ruta, $partes)
        || !is_file(rutaAbsoluta(ltrim($ruta, '/')))) {
        http_response_code(404);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Foto no encontrada.';
        exit;
    }
    $tipos = ['jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];
    header('Content-Type: ' . $tipos[$partes[2]]);
    header('Content-Length: ' . filesize(rutaAbsoluta(ltrim($ruta, '/'))));
    header('Cache-Control: public, max-age=31536000, immutable');
    readfile(rutaAbsoluta(ltrim($ruta, '/')));
    exit;
}
