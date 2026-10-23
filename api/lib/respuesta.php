<?php

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

function validar(callable $validador, array $entrada): array
{
    [$datos, $errores] = $validador($entrada);
    if ($errores) {
        throw new ErrorApi(400, 'Revise los datos del formulario.', $errores);
    }
    return $datos;
}

function idValido(string $valor): int
{
    if (!ctype_digit($valor) || (int) $valor <= 0) {
        throw new ErrorApi(404, 'Registro no encontrado.');
    }
    return (int) $valor;
}

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
            case 1045:
            case 1049:
            case 2002:
                error_log('[BD] ' . $error->getMessage());
                responder(['error' => 'La base de datos no está disponible. Intente más tarde.'], 503);
        }
    }
    error_log(sprintf('[API] %s: %s en %s:%d', get_class($error), $error->getMessage(), $error->getFile(), $error->getLine()));
    responder(['error' => 'Ocurrió un error inesperado en el servidor.'], 500);
}
