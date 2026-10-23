import { useEffect, useState } from 'react'
import Campo from '../../components/Campo'
import Aviso from '../../components/Aviso'
import { api } from '../../services/api'
import { validarCategoria, tieneErrores } from '../../utils/validaciones'

const VACIO = { nombre: '', descripcion: '' }

// CRUD de categorías en una sola página: el formulario sirve para crear y,
// al pulsar "Editar", para modificar la categoría seleccionada.
function AdminCategorias() {
  const [categorias, setCategorias] = useState([])
  const [valores, setValores] = useState(VACIO)
  const [editandoId, setEditandoId] = useState(null)
  const [errores, setErrores] = useState({})
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)

  function cargar() {
    return api.categorias()
      .then(setCategorias)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [])

  function cambiar(evento) {
    const { name, value } = evento.target
    setValores((actual) => ({ ...actual, [name]: value }))
    if (errores[name]) setErrores((actual) => ({ ...actual, [name]: undefined }))
  }

  function editar(categoria) {
    setEditandoId(categoria.id)
    setValores({ nombre: categoria.nombre, descripcion: categoria.descripcion || '' })
    setErrores({})
    setMensaje('')
    setError('')
  }

  function cancelarEdicion() {
    setEditandoId(null)
    setValores(VACIO)
    setErrores({})
  }

  async function enviar(evento) {
    evento.preventDefault()
    if (enviando) return
    const { errores: nuevos } = validarCategoria(valores)
    setErrores(nuevos)
    setError('')
    setMensaje('')
    if (tieneErrores(nuevos)) return

    setEnviando(true)
    try {
      if (editandoId) await api.editarCategoria(editandoId, valores)
      else await api.crearCategoria(valores)
      setMensaje(editandoId ? 'Categoría actualizada.' : 'Categoría creada.')
      cancelarEdicion()
      await cargar()
    } catch (e) {
      setErrores(e.campos)
      setError(e.message)
    } finally {
      setEnviando(false)
    }
  }

  async function eliminar(categoria) {
    if (!window.confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) return
    setError('')
    setMensaje('')
    try {
      await api.eliminarCategoria(categoria.id)
      setMensaje(`Se eliminó la categoría "${categoria.nombre}".`)
      if (editandoId === categoria.id) cancelarEdicion()
      await cargar()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="contenedor">
      <h2 className="titulo-pagina">Gestión de categorías</h2>
      <div className="rejilla-lateral">
        <form className="panel formulario" onSubmit={enviar} noValidate>
          <h3>{editandoId ? 'Editar categoría' : 'Nueva categoría'}</h3>
          <Campo etiqueta="Nombre" nombre="nombre" value={valores.nombre} onChange={cambiar}
            error={errores.nombre} required maxLength={50} />
          <Campo etiqueta="Descripción" nombre="descripcion" tipo="textarea" rows={3} value={valores.descripcion}
            onChange={cambiar} error={errores.descripcion} maxLength={255} ayuda="Opcional. Máximo 255 caracteres." />
          <div className="botones">
            <button className="boton" type="submit" disabled={enviando}>
              {enviando ? 'Guardando…' : editandoId ? 'Guardar cambios' : 'Crear categoría'}
            </button>
            {editandoId && (
              <button type="button" className="boton boton-secundario" onClick={cancelarEdicion}>Cancelar</button>
            )}
          </div>
        </form>

        <div>
          <Aviso tipo="exito">{mensaje}</Aviso>
          <Aviso tipo="error">{error}</Aviso>
          {cargando && <p className="cargando">Cargando…</p>}
          {!cargando && categorias.length === 0 && <p className="vacio">No hay categorías registradas.</p>}
          {categorias.length > 0 && (
            <div className="tabla-contenedor">
              <table className="tabla">
                <thead>
                  <tr><th>ID</th><th>Nombre</th><th>Descripción</th><th>Platos</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {categorias.map((c) => (
                    <tr key={c.id}>
                      <td data-titulo="ID">{c.id}</td>
                      <td data-titulo="Nombre">{c.nombre}</td>
                      <td data-titulo="Descripción">{c.descripcion || '—'}</td>
                      <td data-titulo="Platos">{c.total_platos} ({c.platos_disponibles} disponibles)</td>
                      <td className="acciones">
                        <button className="enlace-boton" onClick={() => editar(c)}>Editar</button>
                        <button className="eliminar" onClick={() => eliminar(c)}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminCategorias
