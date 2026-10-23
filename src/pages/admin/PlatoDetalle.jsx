import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Aviso from '../../components/Aviso'
import { api } from '../../services/api'
import { precio, fecha } from '../../utils/formato'

function PlatoDetalle() {
  const { id } = useParams()
  const navegar = useNavigate()
  const [plato, setPlato] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    api.plato(id)
      .then(setPlato)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [id])

  async function eliminar() {
    if (!window.confirm(`¿Eliminar definitivamente "${plato.nombre}"? Esta acción no se puede deshacer.`)) return
    setEliminando(true)
    setError('')
    try {
      await api.eliminarPlato(plato.id)
      navegar('/admin/platos', { state: { mensaje: `Se eliminó "${plato.nombre}".` } })
    } catch (e) {
      setError(e.message)
      setEliminando(false)
    }
  }

  if (cargando) return <p className="cargando">Cargando plato…</p>
  if (!plato) {
    return (
      <div className="contenedor">
        <Aviso tipo="error">{error || 'El plato no existe.'}</Aviso>
        <Link to="/admin/platos">Volver al listado</Link>
      </div>
    )
  }

  return (
    <div className="contenedor contenedor-medio">
      <p><Link to="/admin/platos">← Volver al listado</Link></p>
      <article className="panel detalle-plato">
        {plato.imagen && <img src={plato.imagen} alt={plato.nombre} />}
        <div>
          <h2>{plato.nombre}</h2>
          <p>{plato.descripcion}</p>
          <Aviso tipo="error">{error}</Aviso>
          <dl className="datos">
            <div><dt>ID</dt><dd>{plato.id}</dd></div>
            <div><dt>Categoría</dt><dd>{plato.categoria}</dd></div>
            <div><dt>Precio</dt><dd>{precio(plato.precio)}</dd></div>
            <div><dt>Estado</dt><dd>{plato.disponible ? 'Disponible' : 'No disponible'}</dd></div>
            <div>
              <dt>Foto</dt>
              <dd>{plato.archivo_id ? `Subida al servidor (${plato.archivo_nombre})` : plato.imagen_url ? 'URL externa' : 'Sin foto'}</dd>
            </div>
            <div><dt>Pedidos en los que aparece</dt><dd>{plato.ventas.pedidos}</dd></div>
            <div><dt>Unidades vendidas</dt><dd>{plato.ventas.unidades}</dd></div>
            <div><dt>Creado</dt><dd>{fecha(plato.creado_en)}</dd></div>
            <div><dt>Última modificación</dt><dd>{fecha(plato.actualizado_en)}</dd></div>
          </dl>
          <div className="botones">
            <Link className="boton" to={`/admin/platos/${plato.id}/editar`}>Editar</Link>
            <button className="boton boton-peligro" disabled={eliminando} onClick={eliminar}>
              {eliminando ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        </div>
      </article>
    </div>
  )
}

export default PlatoDetalle
