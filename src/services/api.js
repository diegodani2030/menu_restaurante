// Servicio único de comunicación con la API (PHP + MySQL).
// La sesión viaja en una cookie httpOnly, por eso no se guarda ningún token
// en el navegador ni en el código.

export class ErrorApi extends Error {
  constructor(mensaje, estado, campos) {
    super(mensaje)
    this.estado = estado
    this.campos = campos || {}
  }
}

async function pedir(metodo, ruta, cuerpo) {
  // Con FormData (subida de archivos) no se fija Content-Type: el navegador
  // pone multipart/form-data con su "boundary" automáticamente.
  const esFormulario = cuerpo instanceof FormData
  let respuesta
  try {
    respuesta = await fetch(`/api${ruta}`, {
      method: metodo,
      credentials: 'same-origin',
      headers: cuerpo === undefined || esFormulario ? undefined : { 'Content-Type': 'application/json' },
      body: cuerpo === undefined || esFormulario ? cuerpo : JSON.stringify(cuerpo),
    })
  } catch {
    throw new ErrorApi('No hay conexión con el servidor. Verifique que la API esté encendida.', 0)
  }
  const datos = await respuesta.json().catch(() => null)
  if (!respuesta.ok) {
    const mensaje = datos?.error || (respuesta.status >= 500
      ? 'El servidor no está disponible en este momento.'
      : 'No se pudo completar la operación.')
    throw new ErrorApi(mensaje, respuesta.status, datos?.campos)
  }
  return datos
}

function consulta(filtros = {}) {
  const parametros = new URLSearchParams()
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== '' && valor !== undefined && valor !== null) parametros.set(clave, valor)
  }
  const texto = parametros.toString()
  return texto ? `?${texto}` : ''
}

export const api = {
  // Sesión
  sesion: () => pedir('GET', '/auth/sesion'),
  registrar: (datos) => pedir('POST', '/auth/registro', datos),
  iniciarSesion: (datos) => pedir('POST', '/auth/login', datos),
  cerrarSesion: () => pedir('POST', '/auth/logout'),

  // Categorías
  categorias: () => pedir('GET', '/categorias'),
  crearCategoria: (datos) => pedir('POST', '/categorias', datos),
  editarCategoria: (id, datos) => pedir('PUT', `/categorias/${id}`, datos),
  eliminarCategoria: (id) => pedir('DELETE', `/categorias/${id}`),

  // Platos
  platos: (filtros) => pedir('GET', `/platos${consulta(filtros)}`),
  plato: (id) => pedir('GET', `/platos/${id}`),
  crearPlato: (datos) => pedir('POST', '/platos', datos),
  editarPlato: (id, datos) => pedir('PUT', `/platos/${id}`, datos),
  eliminarPlato: (id) => pedir('DELETE', `/platos/${id}`),
  subirFotoPlato: (id, archivo) => {
    const datos = new FormData()
    datos.append('imagen', archivo)
    return pedir('POST', `/platos/${id}/imagen`, datos)
  },
  quitarFotoPlato: (id) => pedir('DELETE', `/platos/${id}/imagen`),

  // Pedidos
  pedidos: (filtros) => pedir('GET', `/pedidos${consulta(filtros)}`),
  pedido: (id) => pedir('GET', `/pedidos/${id}`),
  crearPedido: (datos) => pedir('POST', '/pedidos', datos),
  cambiarEstado: (id, estado) => pedir('PATCH', `/pedidos/${id}/estado`, { estado }),
  cancelarPedido: (id) => pedir('PATCH', `/pedidos/${id}/cancelar`),

  // Reportes
  resumen: () => pedir('GET', '/reportes/resumen'),
}
