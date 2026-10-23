// Reglas de validación del frontend (React). Son las mismas reglas que aplica
// el servidor en api/lib/validaciones.php: React avisa al usuario antes de
// enviar el formulario y PHP las vuelve a aplicar, porque nunca se confía solo
// en el navegador.
// Cada función devuelve { datos, errores }: datos ya limpios y un objeto con
// un mensaje por cada campo inválido (vacío si todo está bien).
export const ESTADOS_PEDIDO = ['pendiente', 'en_preparacion', 'entregado', 'cancelado']

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const REGEX_NOMBRE_PERSONA = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]+$/
const REGEX_TELEFONO = /^\+?\d{7,15}$/

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : ''
}

function enteroPositivo(valor) {
  const numero = Number(valor)
  return Number.isInteger(numero) && numero > 0 ? numero : null
}

function longitud(errores, campo, valor, min, max, etiqueta, terminacion = 'o') {
  if (!valor) errores[campo] = `${etiqueta} es obligatori${terminacion}.`
  else if (valor.length < min) errores[campo] = `${etiqueta} debe tener al menos ${min} caracteres.`
  else if (valor.length > max) errores[campo] = `${etiqueta} no puede superar ${max} caracteres.`
}

export function validarRegistro(entrada = {}) {
  const errores = {}
  const datos = {
    nombre: texto(entrada.nombre).replace(/\s+/g, ' '),
    correo: texto(entrada.correo).toLowerCase(),
    telefono: texto(entrada.telefono).replace(/[\s-]/g, ''),
    password: typeof entrada.password === 'string' ? entrada.password : '',
  }

  longitud(errores, 'nombre', datos.nombre, 3, 100, 'El nombre')
  if (!errores.nombre && !REGEX_NOMBRE_PERSONA.test(datos.nombre)) {
    errores.nombre = 'El nombre solo puede contener letras y espacios.'
  }

  if (!datos.correo) errores.correo = 'El correo es obligatorio.'
  else if (datos.correo.length > 150 || !REGEX_CORREO.test(datos.correo)) {
    errores.correo = 'Escriba un correo válido, por ejemplo nombre@correo.com.'
  }

  if (!datos.telefono) errores.telefono = 'El teléfono es obligatorio.'
  else if (!REGEX_TELEFONO.test(datos.telefono)) {
    errores.telefono = 'El teléfono debe tener entre 7 y 15 dígitos.'
  }

  if (!datos.password) errores.password = 'La contraseña es obligatoria.'
  else if (datos.password.length < 8 || datos.password.length > 72) {
    errores.password = 'La contraseña debe tener entre 8 y 72 caracteres.'
  } else if (!/[A-Za-z]/.test(datos.password) || !/\d/.test(datos.password)) {
    errores.password = 'La contraseña debe combinar letras y números.'
  }

  return { datos, errores }
}

export function validarLogin(entrada = {}) {
  const errores = {}
  const datos = {
    correo: texto(entrada.correo).toLowerCase(),
    password: typeof entrada.password === 'string' ? entrada.password : '',
  }
  if (!datos.correo) errores.correo = 'El correo es obligatorio.'
  else if (!REGEX_CORREO.test(datos.correo)) errores.correo = 'Escriba un correo válido.'
  if (!datos.password) errores.password = 'La contraseña es obligatoria.'
  return { datos, errores }
}

export function validarPlato(entrada = {}) {
  const errores = {}
  const precioTexto = String(entrada.precio ?? '').trim()
  const datos = {
    nombre: texto(entrada.nombre).replace(/\s+/g, ' '),
    descripcion: texto(entrada.descripcion),
    precio: Number(precioTexto),
    categoria_id: enteroPositivo(entrada.categoria_id),
    imagen_url: texto(entrada.imagen_url) || null,
    disponible: entrada.disponible === undefined ? true : Boolean(entrada.disponible),
  }

  longitud(errores, 'nombre', datos.nombre, 3, 100, 'El nombre')
  longitud(errores, 'descripcion', datos.descripcion, 10, 500, 'La descripción', 'a')

  if (!precioTexto) errores.precio = 'El precio es obligatorio.'
  else if (!Number.isFinite(datos.precio) || !/^\d+(\.\d{1,2})?$/.test(precioTexto)) {
    errores.precio = 'El precio debe ser un número positivo (máximo 2 decimales).'
  } else if (datos.precio < 500 || datos.precio > 1000000) {
    errores.precio = 'El precio debe estar entre $500 y $1.000.000.'
  }

  if (!datos.categoria_id) errores.categoria_id = 'Seleccione una categoría.'

  if (datos.imagen_url) {
    if (datos.imagen_url.length > 500) errores.imagen_url = 'La URL no puede superar 500 caracteres.'
    else if (!/^https?:\/\/[^\s]+$/i.test(datos.imagen_url)) {
      errores.imagen_url = 'La imagen debe ser una URL que empiece por http:// o https://.'
    }
  }

  return { datos, errores }
}

export function validarCategoria(entrada = {}) {
  const errores = {}
  const datos = {
    nombre: texto(entrada.nombre).replace(/\s+/g, ' '),
    descripcion: texto(entrada.descripcion) || null,
  }
  longitud(errores, 'nombre', datos.nombre, 3, 50, 'El nombre')
  if (datos.descripcion && datos.descripcion.length > 255) {
    errores.descripcion = 'La descripción no puede superar 255 caracteres.'
  }
  return { datos, errores }
}

export function validarPedido(entrada = {}) {
  const errores = {}
  const items = Array.isArray(entrada.items) ? entrada.items : []
  const datos = {
    observaciones: texto(entrada.observaciones) || null,
    items: items.map((item) => ({
      plato_id: enteroPositivo(item?.plato_id),
      cantidad: enteroPositivo(item?.cantidad),
    })),
  }

  if (datos.items.length === 0) errores.items = 'El pedido debe tener al menos un plato.'
  else if (datos.items.length > 30) errores.items = 'El pedido no puede tener más de 30 platos distintos.'
  else if (datos.items.some((item) => !item.plato_id || !item.cantidad || item.cantidad > 50)) {
    errores.items = 'Cada plato debe tener una cantidad entre 1 y 50.'
  } else if (new Set(datos.items.map((item) => item.plato_id)).size !== datos.items.length) {
    errores.items = 'Hay platos repetidos en el pedido.'
  }

  if (datos.observaciones && datos.observaciones.length > 255) {
    errores.observaciones = 'Las observaciones no pueden superar 255 caracteres.'
  }
  return { datos, errores }
}

// Foto del plato (subida de archivo). Mismas reglas que api/lib/archivos.php;
// el servidor además revisa el contenido real del archivo.
export const MAX_BYTES_IMAGEN = 2 * 1024 * 1024 // 2 MB
export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp']

export function validarImagen(archivo) {
  if (!archivo) return ''
  if (!TIPOS_IMAGEN.includes(archivo.type)) return 'Use una foto JPG, PNG o WEBP.'
  if (archivo.size > MAX_BYTES_IMAGEN) return 'La foto debe pesar como máximo 2 MB.'
  return ''
}

export function tieneErrores(errores) {
  return Object.keys(errores).length > 0
}
