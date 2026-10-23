import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Aviso from '../../components/Aviso'
import { api } from '../../services/api'
import { precio } from '../../utils/formato'

const FILTROS_INICIALES = { buscar: '', categoria_id: '', disponible: '', precio_min: '', precio_max: '', orden: '', dir: 'asc' }

// Módulo principal con CRUD completo: listado con búsqueda, filtros combinados
// y orden (Read), enlaces a crear y editar (Create / Update) y eliminación con
// confirmación (Delete).
function AdminPlatos() {
  const ubicacion = useLocation()
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)
  const [categorias, setCategorias] = useState([])
  const [platos, setPlatos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState(ubicacion.state?.mensaje || '')
  const [eliminando, setEliminando] = useState(null)
  const [recargar, setRecargar] = useState(0)

  useEffect(() => {
    api.categorias().then(setCategorias).catch(() => {})
  }, [])

  useEffect(() => {
    let vigente = true
    const espera = setTimeout(() => {
      setCargando(true)
      api.platos(filtros)
        .then((datos) => { if (vigente) { setPlatos(datos); setError('') } })
        .catch((e) => { if (vigente) setError(e.message) })
        .finally(() => { if (vigente) setCargando(false) })
    }, 250)
    return () => { vigente = false; clearTimeout(espera) }
  }, [filtros, recargar])

  function cambiarFiltro(evento) {
    setFiltros((actual) => ({ ...actual, [evento.target.name]: evento.target.value }))
  }

  async function eliminar(plato) {
    if (!window.confirm(`¿Eliminar definitivamente "${plato.nombre}"? Esta acción no se puede deshacer.`)) return
    setEliminando(plato.id)
    setError('')
    setMensaje('')
    try {
      await api.eliminarPlato(plato.id)
      setMensaje(`Se eliminó "${plato.nombre}".`)
      setRecargar((n) => n + 1)
    } catch (e) {
      setError(e.message)
    } finally {
      setEliminando(null)
    }
  }

  return (
    <div className="contenedor">
      <div className="encabezado-panel">
        <h2 className="titulo-pagina">Gestión de platos</h2>
        <Link className="boton" to="/admin/platos/nuevo">+ Nuevo plato</Link>
      </div>

      <form className="panel filtros-admin" onSubmit={(e) => e.preventDefault()} aria-label="Filtros de búsqueda">
        <div className="campo">
          <label htmlFor="f-buscar">Buscar</label>
          <input id="f-buscar" name="buscar" type="search" value={filtros.buscar} onChange={cambiarFiltro}
            placeholder="Nombre o descripción" maxLength={100} />
        </div>
        <div className="campo">
          <label htmlFor="f-categoria">Categoría</label>
          <select id="f-categoria" name="categoria_id" value={filtros.categoria_id} onChange={cambiarFiltro}>
            <option value="">Todas</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="f-disponible">Disponibilidad</label>
          <select id="f-disponible" name="disponible" value={filtros.disponible} onChange={cambiarFiltro}>
            <option value="">Todos</option>
            <option value="1">Disponibles</option>
            <option value="0">No disponibles</option>
          </select>
        </div>
        <div className="campo">
          <label htmlFor="f-min">Precio mínimo</label>
          <input id="f-min" name="precio_min" type="number" min="0" value={filtros.precio_min} onChange={cambiarFiltro} />
        </div>
        <div className="campo">
          <label htmlFor="f-max">Precio máximo</label>
          <input id="f-max" name="precio_max" type="number" min="0" value={filtros.precio_max} onChange={cambiarFiltro} />
        </div>
        <div className="campo">
          <label htmlFor="f-orden">Ordenar por</label>
          <select id="f-orden" name="orden" value={filtros.orden} onChange={cambiarFiltro}>
            <option value="">Categoría (predeterminado)</option>
            <option value="nombre">Nombre</option>
            <option value="precio">Precio</option>
            <option value="fecha">Fecha de creación</option>
          </select>
        </div>
        <div className="campo">
          <label htmlFor="f-dir">Dirección</label>
          <select id="f-dir" name="dir" value={filtros.dir} onChange={cambiarFiltro}>
            <option value="asc">Ascendente</option>
            <option value="desc">Descendente</option>
          </select>
        </div>
        <button type="button" className="boton boton-secundario" onClick={() => setFiltros(FILTROS_INICIALES)}>
          Limpiar filtros
        </button>
      </form>

      <Aviso tipo="exito">{mensaje}</Aviso>
      <Aviso tipo="error">{error}</Aviso>
      <p className="texto-suave">{cargando ? 'Consultando…' : `${platos.length} plato(s) encontrado(s)`}</p>

      {!cargando && !error && platos.length === 0 && <p className="vacio">No hay platos con esos filtros.</p>}
      {platos.length > 0 && (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr><th>ID</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {platos.map((p) => (
                <tr key={p.id}>
                  <td data-titulo="ID">{p.id}</td>
                  <td data-titulo="Nombre">{p.nombre}</td>
                  <td data-titulo="Categoría">{p.categoria}</td>
                  <td data-titulo="Precio">{precio(p.precio)}</td>
                  <td data-titulo="Estado">
                    <span className={`estado ${p.disponible ? 'estado-entregado' : 'estado-cancelado'}`}>
                      {p.disponible ? 'Disponible' : 'No disponible'}
                    </span>
                  </td>
                  <td className="acciones">
                    <Link to={`/admin/platos/${p.id}`}>Ver</Link>
                    <Link to={`/admin/platos/${p.id}/editar`}>Editar</Link>
                    <button className="eliminar" disabled={eliminando === p.id} onClick={() => eliminar(p)}>
                      {eliminando === p.id ? 'Eliminando…' : 'Eliminar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminPlatos
