<?php
// Respuestas JSON y manejo centralizado de errores.

// Error controlado: su mensaje sí se muestra al usuario.
class ErrorApi extends Exception
{
    public function __construct(public int $estado, string $mensaje, public ?array $campos = null)
    {
        parent::__construct($mensaje);
    }
}

function responder(mixed $datos, int $estado = 200): never
{
    http_response_code($estado);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// Cuerpo JSON de la petición como arreglo asociativo.
function cuerpo(): array
{
    static $datos = null;
    if ($datos === null) {
        $texto = file_get_contents('php://input');
        if ($texto === '' || $texto === false) {
            $datos = [];
        } else {
            $datos = json_decode($texto, true);
            if (!is_array($datos)) {
                throw new ErrorApi(400, 'El cuerpo de la petición no es un JSON válido.');
            }
        }
    }
    return $datos;
}

// Aplica una función de validaciones.php y lanza un error 400 con el
// detalle por campo si los datos no son válidos.
function validar(callable $validador, array $entrada): array
{
    [$datos, $errores] = $validador($entrada);
    if ($errores) {
        throw new ErrorApi(400, 'Revise los datos del formulario.', $errores);
    }
    return $datos;
}

// Convierte el :id de la URL en número o responde 404.
function idValido(string $valor): int
{
    if (!ctype_digit($valor) || (int) $valor <= 0) {
        throw new ErrorApi(404, 'Registro no encontrado.');
    }
    return (int) $valor;
}

// Traduce errores conocidos de MySQL a mensajes comprensibles.
// Cualquier otro error se registra en el log del servidor y al cliente
// solo le llega un mensaje genérico (no se exponen detalles internos).
function manejarError(Throwable $error): never
{
    if ($error instanceof ErrorApi) {
        $respuesta = ['error' => $error->getMessage()];
        if ($error->campos) {
            $respuesta['campos'] = $error->campos;
        }
        responder($respuesta, $error->estado);
    }
    if ($error instanceof PDOException) {
        $codigo = $error->errorInfo[1] ?? (int) $error->getCode();
        switch ($codigo) {
            case 1062:
                responder(['error' => 'Ya existe un registro con ese valor.'], 409);
            case 1451:
                responder(['error' => 'No se puede eliminar porque tiene registros relacionados.'], 409);
            case 1452:
                responder(['error' => 'El registro relacionado no existe.'], 400);
            case 1045: // acceso denegado
            case 1049: // base de datos inexistente
            case 2002: // servidor apagado
                error_log('[BD] ' . $error->getMessage());
                responder(['error' => 'La base de datos no está disponible. Intente más tarde.'], 503);
        }
    }
    error_log('[API] ' . $error);
    responder(['error' => 'Ocurrió un error inesperado en el servidor.'], 500);
}
