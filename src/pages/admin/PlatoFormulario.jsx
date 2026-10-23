import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Campo from '../../components/Campo'
import Aviso from '../../components/Aviso'
import { api } from '../../services/api'
import { validarPlato, validarImagen, tieneErrores } from '../../utils/validaciones'

const VACIO = { nombre: '', descripcion: '', precio: '', categoria_id: '', imagen_url: '', disponible: true }

function PlatoFormulario() {
  const { id } = useParams()
  const editando = Boolean(id)
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [valores, setValores] = useState(VACIO)
  const [categorias, setCategorias] = useState([])
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState(ubicacion.state?.error || '')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(editando)
  const [noExiste, setNoExiste] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const [fotoGuardada, setFotoGuardada] = useState(null)
  const [archivoFoto, setArchivoFoto] = useState(null)
  const [vistaPrevia, setVistaPrevia] = useState('')
  const [quitandoFoto, setQuitandoFoto] = useState(false)
  const inputFoto = useRef(null)

  useEffect(() => {
    api.categorias().then(setCategorias).catch((e) => setErrorGeneral(e.message))
  }, [])

  useEffect(() => {
    if (!editando) return
    api.plato(id)
      .then((p) => {
        setValores({
          nombre: p.nombre, descripcion: p.descripcion, precio: String(p.precio),
          categoria_id: String(p.categoria_id), imagen_url: p.imagen_url || '', disponible: p.disponible,
        })
        setFotoGuardada(p.archivo_id ? { imagen: p.imagen, archivo_nombre: p.archivo_nombre } : null)
      })
      .catch((e) => { if (e.estado === 404) setNoExiste(true); else setErrorGeneral(e.message) })
      .finally(() => setCargando(false))
  }, [id, editando])

  useEffect(() => {
    if (!archivoFoto) {
      setVistaPrevia('')
      return
    }
    const url = URL.createObjectURL(archivoFoto)
    setVistaPrevia(url)
    return () => URL.revokeObjectURL(url)
  }, [archivoFoto])

  function cambiar(evento) {
    const { name, value, type, checked } = evento.target
    setValores((actual) => ({ ...actual, [name]: type === 'checkbox' ? checked : value }))
    if (errores[name]) setErrores((actual) => ({ ...actual, [name]: undefined }))
  }

  function limpiarSeleccion() {
    setArchivoFoto(null)
    if (inputFoto.current) inputFoto.current.value = ''
  }

  function elegirFoto(evento) {
    const archivo = evento.target.files?.[0] ?? null
    const error = validarImagen(archivo)
    setErrores((actual) => ({ ...actual, imagen: error || undefined }))
    if (error) {
      limpiarSeleccion()
      return
    }
    setArchivoFoto(archivo)
  }

  async function quitarFotoGuardada() {
    if (!window.confirm('¿Quitar la foto subida de este plato? El archivo se eliminará del servidor.')) return
    setQuitandoFoto(true)
    setErrorGeneral('')
    setMensaje('')
    try {
      await api.quitarFotoPlato(id)
      setFotoGuardada(null)
      setMensaje('Se quitó la foto subida.')
    } catch (e) {
      setErrorGeneral(e.message)
    } finally {
      setQuitandoFoto(false)
    }
  }

  async function enviar(evento) {
    evento.preventDefault()
    if (enviando) return
    const { errores: nuevos } = validarPlato(valores)
    const errorFoto = validarImagen(archivoFoto)
    if (errorFoto) nuevos.imagen = errorFoto
    setErrores(nuevos)
    setErrorGeneral('')
    setMensaje('')
    if (tieneErrores(nuevos)) return

    setEnviando(true)
    let plato
    try {
      plato = editando ? await api.editarPlato(id, valores) : await api.crearPlato(valores)
    } catch (e) {
      setErrores(e.campos)
      setErrorGeneral(e.message)
      setEnviando(false)
      return
    }

    if (archivoFoto) {
      try {
        await api.subirFotoPlato(plato.id, archivoFoto)
      } catch (e) {
        setEnviando(false)
        setErrores((actual) => ({ ...actual, ...e.campos }))
        const aviso = `Se guardaron los datos de "${plato.nombre}", pero la foto no se pudo subir: ${e.message}`
        setErrorGeneral(aviso)
        if (!editando) navegar(`/admin/platos/${plato.id}/editar`, { replace: true, state: { error: aviso } })
        return
      }
    }

    navegar('/admin/platos', {
      state: { mensaje: editando ? `Se actualizó "${plato.nombre}".` : `Se creó "${plato.nombre}".` },
    })
  }

  if (cargando) return <p className="cargando">Cargando plato…</p>
  if (noExiste) {
    return (
      <div className="contenedor">
        <Aviso tipo="error">El plato que intenta editar no existe.</Aviso>
        <Link to="/admin/platos">Volver al listado</Link>
      </div>
    )
  }

  const urlValida = valores.imagen_url && !errores.imagen_url && /^https?:\/\//i.test(valores.imagen_url)
  const fotoMostrada = vistaPrevia || fotoGuardada?.imagen || (urlValida ? valores.imagen_url : '')

  return (
    <div className="contenedor contenedor-medio">
      <p><Link to="/admin/platos">← Volver al listado</Link></p>
      <form className="panel formulario" onSubmit={enviar} noValidate>
        <h2>{editando ? 'Editar plato' : 'Nuevo plato'}</h2>
        <Aviso tipo="error">{errorGeneral}</Aviso>
        <Aviso tipo="exito">{mensaje}</Aviso>
        <Campo etiqueta="Nombre" nombre="nombre" value={valores.nombre} onChange={cambiar}
          error={errores.nombre} required maxLength={100} />
        <Campo etiqueta="Descripción" nombre="descripcion" tipo="textarea" rows={3} value={valores.descripcion}
          onChange={cambiar} error={errores.descripcion} required maxLength={500} ayuda="Entre 10 y 500 caracteres." />
        <div className="rejilla-dos">
          <Campo etiqueta="Precio (COP)" nombre="precio" tipo="number" min="500" max="1000000" step="100"
            value={valores.precio} onChange={cambiar} error={errores.precio} required />
          <Campo etiqueta="Categoría" nombre="categoria_id" tipo="select" value={valores.categoria_id}
            onChange={cambiar} error={errores.categoria_id} required>
            <option value="">Seleccione…</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </Campo>
        </div>

        <fieldset className="grupo-foto">
          <legend>Foto del plato</legend>
          {fotoMostrada && <img className="vista-previa" src={fotoMostrada} alt="Vista previa del plato" />}

          {fotoGuardada && !archivoFoto && (
            <p className="texto-suave">
              Foto subida: {fotoGuardada.archivo_nombre}{' '}
              <button type="button" className="eliminar" disabled={quitandoFoto} onClick={quitarFotoGuardada}>
                {quitandoFoto ? 'Quitando…' : 'Quitar foto subida'}
              </button>
            </p>
          )}

          <div className={`campo ${errores.imagen ? 'campo-error' : ''}`}>
            <label htmlFor="imagen">{fotoGuardada ? 'Reemplazar foto' : 'Subir foto desde el equipo'}</label>
            <input
              id="imagen"
              ref={inputFoto}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={elegirFoto}
              disabled={enviando}
              aria-invalid={Boolean(errores.imagen)}
              aria-describedby={errores.imagen ? 'imagen-error' : undefined}
            />
            {errores.imagen
              ? <small id="imagen-error" className="campo-mensaje">{errores.imagen}</small>
              : <small className="campo-ayuda">Opcional. JPG, PNG o WEBP de máximo 2 MB.</small>}
          </div>
          {archivoFoto && (
            <p className="texto-suave">
              Seleccionada: {archivoFoto.name}{' '}
              <button type="button" className="enlace-boton" onClick={limpiarSeleccion}>Quitar selección</button>
            </p>
          )}

          <Campo etiqueta="O use la URL de una imagen" nombre="imagen_url" tipo="url" value={valores.imagen_url}
            onChange={cambiar} error={errores.imagen_url} maxLength={500} placeholder="https://…"
            ayuda="Opcional. Si también sube una foto, se muestra la foto subida." />
        </fieldset>

        <label className="casilla">
          <input type="checkbox" name="disponible" checked={valores.disponible} onChange={cambiar} />
          Disponible en el menú
        </label>
        <div className="botones">
          <button className="boton" type="submit" disabled={enviando}>
            {enviando ? (archivoFoto ? 'Guardando y subiendo foto…' : 'Guardando…') : editando ? 'Guardar cambios' : 'Crear plato'}
          </button>
          <Link className="boton boton-secundario" to="/admin/platos">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}

export default PlatoFormulario
