import { test } from 'node:test'
import assert from 'node:assert/strict'

const BASE = process.env.API_URL || 'http://127.0.0.1:3001/api'
const marca = Date.now()

function crearCliente() {
  let cookie = ''
  return async function pedir(metodo, ruta, cuerpo) {
    const esFormulario = cuerpo instanceof FormData
    const respuesta = await fetch(BASE + ruta, {
      method: metodo,
      headers: {
        ...(!esFormulario && { 'Content-Type': 'application/json' }),
        ...(cookie && { Cookie: cookie }),
      },
      body: cuerpo === undefined || esFormulario ? cuerpo : JSON.stringify(cuerpo),
    })
    const nueva = respuesta.headers.getSetCookie().at(-1)
    if (nueva) cookie = nueva.split(';')[0]
    return { estado: respuesta.status, datos: await respuesta.json() }
  }
}

const visitante = crearCliente()
const cliente = crearCliente()
const otroCliente = crearCliente()
const admin = crearCliente()

test('consultas públicas del menú', async () => {
  const { estado, datos } = await visitante('GET', '/platos')
  assert.equal(estado, 200)
  assert.ok(datos.length > 0)
  assert.ok(datos.every((p) => p.disponible && p.categoria), 'cada plato trae su categoría (JOIN)')

  const categorias = await visitante('GET', '/categorias')
  assert.equal(categorias.estado, 200)
  assert.ok(categorias.datos.every((c) => typeof c.total_platos === 'number'))

  const entrada = categorias.datos.find((c) => c.nombre === 'Entrada')
  const filtrados = await visitante('GET', `/platos?categoria_id=${entrada.id}&orden=precio&dir=desc`)
  assert.ok(filtrados.datos.every((p) => p.categoria === 'Entrada'))
  const precios = filtrados.datos.map((p) => p.precio)
  assert.deepEqual(precios, [...precios].sort((a, b) => b - a), 'ordenado por precio descendente')

  const busqueda = await visitante('GET', '/platos?buscar=leche')
  assert.ok(busqueda.datos.length >= 1)
  assert.ok(busqueda.datos.every((p) => /leche/i.test(p.nombre + p.descripcion)))

  const inyeccion = await visitante('GET', `/platos?buscar=${encodeURIComponent("' OR 1=1 --")}`)
  assert.equal(inyeccion.estado, 200)
  assert.equal(inyeccion.datos.length, 0, 'la inyección SQL se trata como texto')

  assert.equal((await visitante('GET', '/platos/999999')).estado, 404)
  assert.equal((await visitante('GET', '/platos/abc')).estado, 404)
})

test('registro e inicio de sesión con validaciones', async () => {
  const invalido = await cliente('POST', '/auth/registro', { nombre: 'A', correo: 'malo', telefono: '12', password: 'corta' })
  assert.equal(invalido.estado, 400)
  assert.deepEqual(Object.keys(invalido.datos.campos).sort(), ['correo', 'nombre', 'password', 'telefono'])

  const correo = `cliente${marca}@prueba.test`
  const registro = await cliente('POST', '/auth/registro', {
    nombre: 'Prueba Cliente', correo, telefono: '3001234567', password: 'clave1234',
  })
  assert.equal(registro.estado, 201)
  assert.equal(registro.datos.usuario.rol, 'cliente')
  assert.equal(registro.datos.usuario.password_hash, undefined, 'nunca se devuelve el hash')

  const duplicado = await visitante('POST', '/auth/registro', {
    nombre: 'Prueba Cliente', correo, telefono: '3001234567', password: 'clave1234',
  })
  assert.equal(duplicado.estado, 409)

  assert.equal((await visitante('POST', '/auth/login', { correo, password: 'otra1234' })).estado, 401)
  assert.equal((await cliente('GET', '/auth/sesion')).datos.usuario.correo, correo)

  await otroCliente('POST', '/auth/registro', {
    nombre: 'Prueba Otro', correo: `otro${marca}@prueba.test`, telefono: '3007654321', password: 'clave1234',
  })

  const login = await admin('POST', '/auth/login', { correo: process.env.ADMIN_CORREO, password: process.env.ADMIN_PASSWORD })
  assert.equal(login.estado, 200, 'el administrador de .env debe existir (npm run db:setup)')
  assert.equal(login.datos.usuario.rol, 'admin')
})

test('fuerza bruta: se bloquea el correo tras 5 intentos fallidos', async () => {
  const correo = `bloqueo${marca}@prueba.test`
  const otro = crearCliente()
  await otro('POST', '/auth/registro', { nombre: 'Prueba Bloqueo', correo, telefono: '3009998877', password: 'clave1234' })

  for (let i = 0; i < 5; i++) {
    assert.equal((await visitante('POST', '/auth/login', { correo, password: 'incorrecta1' })).estado, 401)
  }
  const bloqueado = await visitante('POST', '/auth/login', { correo, password: 'clave1234' })
  assert.equal(bloqueado.estado, 429, 'ni siquiera la contraseña correcta entra durante el bloqueo')
})

test('fuerza bruta: peticiones simultáneas no se saltan el límite', async () => {
  const correo = `simultaneo${marca}@prueba.test`
  const respuestas = await Promise.all(
    Array.from({ length: 10 }, () => visitante('POST', '/auth/login', { correo, password: 'incorrecta1' })),
  )
  const revisadas = respuestas.filter((r) => r.estado === 401).length
  assert.ok(revisadas <= 5, `solo 5 intentos pueden revisar la contraseña (fueron ${revisadas})`)
  assert.equal(respuestas.filter((r) => r.estado === 429).length, 10 - revisadas)
})

test('permisos: solo el administrador modifica el menú', async () => {
  const plato = { nombre: 'Prueba sin permiso', descripcion: 'No debería guardarse', precio: 1000, categoria_id: 1 }
  assert.equal((await visitante('POST', '/platos', plato)).estado, 401)
  assert.equal((await cliente('POST', '/platos', plato)).estado, 403)
  assert.equal((await cliente('DELETE', '/platos/1')).estado, 403)
  assert.equal((await cliente('GET', '/reportes/resumen')).estado, 403)
  assert.equal((await visitante('GET', '/pedidos')).estado, 401)
})

test('CRUD completo de platos y categorías', async () => {
  const categoria = await admin('POST', '/categorias', { nombre: `Prueba ${marca}`, descripcion: 'Categoría temporal' })
  assert.equal(categoria.estado, 201)
  const categoriaId = categoria.datos.id

  const invalido = await admin('POST', '/platos', { nombre: '', descripcion: 'corta', precio: -5, categoria_id: '', imagen_url: 'javascript:alert(1)' })
  assert.equal(invalido.estado, 400)
  assert.deepEqual(Object.keys(invalido.datos.campos).sort(), ['categoria_id', 'descripcion', 'imagen_url', 'nombre', 'precio'])

  const creado = await admin('POST', '/platos', {
    nombre: `Prueba Ajiaco ${marca}`, descripcion: 'Sopa santafereña de prueba', precio: 25000, categoria_id: categoriaId,
  })
  assert.equal(creado.estado, 201)
  assert.equal(creado.datos.categoria, `Prueba ${marca}`)
  const platoId = creado.datos.id

  const repetido = await admin('POST', '/platos', {
    nombre: `Prueba Ajiaco ${marca}`, descripcion: 'Sopa santafereña de prueba', precio: 25000, categoria_id: categoriaId,
  })
  assert.equal(repetido.estado, 409, 'nombre único')

  const categoriaInexistente = await admin('POST', '/platos', {
    nombre: `Prueba Huérfano ${marca}`, descripcion: 'Categoría que no existe', precio: 1000, categoria_id: 999999,
  })
  assert.equal(categoriaInexistente.estado, 400, 'la llave foránea rechaza la categoría inexistente')

  const leido = await admin('GET', `/platos/${platoId}`)
  assert.equal(leido.estado, 200)
  assert.equal(leido.datos.ventas.unidades, 0)

  const editado = await admin('PUT', `/platos/${platoId}`, { ...leido.datos, precio: 27000, disponible: false })
  assert.equal(editado.estado, 200)
  assert.equal(editado.datos.precio, 27000)
  assert.equal(editado.datos.disponible, false)
  assert.equal((await visitante('GET', `/platos/${platoId}`)).estado, 404, 'oculto para el público si no está disponible')
  assert.equal((await admin('PUT', '/platos/999999', leido.datos)).estado, 404)

  assert.equal((await admin('DELETE', `/categorias/${categoriaId}`)).estado, 409)
  assert.equal((await admin('DELETE', `/platos/${platoId}`)).estado, 200)
  assert.equal((await admin('GET', `/platos/${platoId}`)).estado, 404)
  assert.equal((await admin('DELETE', `/categorias/${categoriaId}`)).estado, 200)
})

test('pedidos: creación con transacción, consultas multitabla y estados', async () => {
  const { datos: platos } = await visitante('GET', '/platos')
  const [a, b] = platos

  assert.equal((await visitante('POST', '/pedidos', { items: [{ plato_id: a.id, cantidad: 1 }] })).estado, 401)
  assert.equal((await cliente('POST', '/pedidos', { items: [] })).estado, 400)
  assert.equal((await cliente('POST', '/pedidos', { items: [{ plato_id: a.id, cantidad: 99 }] })).estado, 400)
  assert.equal((await cliente('POST', '/pedidos', { items: [{ plato_id: 999999, cantidad: 1 }] })).estado, 400)

  const creado = await cliente('POST', '/pedidos', {
    items: [{ plato_id: a.id, cantidad: 2, precio: 1 }, { plato_id: b.id, cantidad: 1 }],
    observaciones: 'Prueba automática',
  })
  assert.equal(creado.estado, 201)
  assert.equal(creado.datos.total, a.precio * 2 + b.precio)
  const pedidoId = creado.datos.id

  const detalle = await cliente('GET', `/pedidos/${pedidoId}`)
  assert.equal(detalle.estado, 200)
  assert.equal(detalle.datos.detalle.length, 2)
  assert.ok(detalle.datos.detalle.every((d) => d.plato && d.categoria && d.subtotal === d.cantidad * d.precio_unitario))

  assert.equal((await otroCliente('GET', `/pedidos/${pedidoId}`)).estado, 404, 'un cliente no ve pedidos ajenos')
  const propios = await cliente('GET', '/pedidos')
  assert.ok(propios.datos.every((p) => p.usuario_id === detalle.datos.usuario_id))

  const filtrados = await admin('GET', `/pedidos?estado=pendiente&buscar=${encodeURIComponent('Prueba Cliente')}`)
  assert.ok(filtrados.datos.some((p) => p.id === pedidoId))

  assert.equal((await cliente('PATCH', `/pedidos/${pedidoId}/estado`, { estado: 'entregado' })).estado, 403)
  assert.equal((await admin('PATCH', `/pedidos/${pedidoId}/estado`, { estado: 'volando' })).estado, 400)
  assert.equal((await admin('PATCH', `/pedidos/${pedidoId}/estado`, { estado: 'en_preparacion' })).estado, 200)
  assert.equal((await cliente('PATCH', `/pedidos/${pedidoId}/cancelar`)).estado, 409, 'ya no está pendiente')

  assert.equal((await admin('DELETE', `/platos/${a.id}`)).estado, 409)

  const resumen = await admin('GET', '/reportes/resumen')
  assert.equal(resumen.estado, 200)
  assert.ok(resumen.datos.general.pedidos >= 1)
  assert.ok(resumen.datos.masVendidos.length >= 1)
})

const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

function formularioFoto(contenido, nombre, tipo) {
  const datos = new FormData()
  datos.append('imagen', new Blob([contenido], { type: tipo }), nombre)
  return datos
}

test('fotos de platos: subida segura, reemplazo y eliminación', async () => {
  const ORIGEN = BASE.replace(/\/api$/, '')
  const creado = await admin('POST', '/platos', {
    nombre: `Prueba Foto ${marca}`, descripcion: 'Plato temporal para probar fotos', precio: 12000, categoria_id: 1,
  })
  assert.equal(creado.estado, 201)
  const id = creado.datos.id

  assert.equal((await visitante('POST', `/platos/${id}/imagen`, formularioFoto(PNG_1X1, 'a.png', 'image/png'))).estado, 401)
  assert.equal((await cliente('POST', `/platos/${id}/imagen`, formularioFoto(PNG_1X1, 'a.png', 'image/png'))).estado, 403)

  assert.equal((await admin('POST', `/platos/${id}/imagen`, new FormData())).estado, 400)
  const disfrazado = await admin('POST', `/platos/${id}/imagen`, formularioFoto('<?php echo "hola"; ?>', 'foto.php.png', 'image/png'))
  assert.equal(disfrazado.estado, 415, 'se revisa el contenido real, no la extensión')
  const grande = Buffer.concat([PNG_1X1, Buffer.alloc(2 * 1024 * 1024)])
  assert.equal((await admin('POST', `/platos/${id}/imagen`, formularioFoto(grande, 'grande.png', 'image/png'))).estado, 413)
  assert.equal((await admin('POST', '/platos/999999/imagen', formularioFoto(PNG_1X1, 'a.png', 'image/png'))).estado, 404)

  const subida = await admin('POST', `/platos/${id}/imagen`, formularioFoto(PNG_1X1, '../../mi foto.png', 'image/png'))
  assert.equal(subida.estado, 201)
  assert.match(subida.datos.imagen, /^\/uploads\/platos\/[a-f0-9]{32}\.png$/)
  assert.equal(subida.datos.archivo_nombre, 'mi foto.png', 'el nombre original se guarda sin rutas')
  const foto = await fetch(ORIGEN + subida.datos.imagen)
  assert.equal(foto.status, 200)
  assert.equal(foto.headers.get('content-type'), 'image/png')

  const reemplazo = await admin('POST', `/platos/${id}/imagen`, formularioFoto(PNG_1X1, 'nueva.png', 'image/png'))
  assert.equal(reemplazo.estado, 201)
  assert.notEqual(reemplazo.datos.imagen, subida.datos.imagen)
  assert.equal((await fetch(ORIGEN + subida.datos.imagen)).status, 404)

  assert.equal((await fetch(`${ORIGEN}/uploads/platos/..%2F..%2F.env`)).status, 404)

  const sinFoto = await admin('DELETE', `/platos/${id}/imagen`)
  assert.equal(sinFoto.estado, 200)
  assert.equal(sinFoto.datos.archivo_id, null)
  assert.equal(sinFoto.datos.imagen, null)
  assert.equal((await fetch(ORIGEN + reemplazo.datos.imagen)).status, 404)
  assert.equal((await admin('DELETE', `/platos/${id}/imagen`)).estado, 404)

  const ultima = await admin('POST', `/platos/${id}/imagen`, formularioFoto(PNG_1X1, 'ultima.png', 'image/png'))
  assert.equal((await admin('DELETE', `/platos/${id}`)).estado, 200)
  assert.equal((await fetch(ORIGEN + ultima.datos.imagen)).status, 404)
})
