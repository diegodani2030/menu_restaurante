import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Aviso from '../../components/Aviso'
import EstadoPedido from '../../components/EstadoPedido'
import { api } from '../../services/api'
import { precio, fecha, NOMBRES_ESTADO } from '../../utils/formato'
import { ESTADOS_PEDIDO } from '../../utils/validaciones'

const FILTROS_INICIALES = { buscar: '', estado: '', desde: '', hasta: '' }

function AdminPedidos() {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let vigente = true
    const espera = setTimeout(() => {
      setCargando(true)
      api.pedidos(filtros)
        .then((datos) => { if (vigente) { setPedidos(datos); setError('') } })
        .catch((e) => { if (vigente) setError(e.message) })
        .finally(() => { if (vigente) setCargando(false) })
    }, 250)
    return () => { vigente = false; clearTimeout(espera) }
  }, [filtros])

  function cambiarFiltro(evento) {
    setFiltros((actual) => ({ ...actual, [evento.target.name]: evento.target.value }))
  }

  const total = pedidos.filter((p) => p.estado !== 'cancelado').reduce((suma, p) => suma + p.total, 0)

  return (
    <div className="contenedor">
      <h2 className="titulo-pagina">Pedidos</h2>
      <form className="panel filtros-admin" onSubmit={(e) => e.preventDefault()} aria-label="Filtros de pedidos">
        <div className="campo">
          <label htmlFor="p-buscar">Cliente</label>
          <input id="p-buscar" name="buscar" type="search" value={filtros.buscar} onChange={cambiarFiltro}
            placeholder="Nombre o correo" maxLength={100} />
        </div>
        <div className="campo">
          <label htmlFor="p-estado">Estado</label>
          <select id="p-estado" name="estado" value={filtros.estado} onChange={cambiarFiltro}>
            <option value="">Todos</option>
            {ESTADOS_PEDIDO.map((e) => <option key={e} value={e}>{NOMBRES_ESTADO[e]}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="p-desde">Desde</label>
          <input id="p-desde" name="desde" type="date" value={filtros.desde} onChange={cambiarFiltro} />
        </div>
        <div className="campo">
          <label htmlFor="p-hasta">Hasta</label>
          <input id="p-hasta" name="hasta" type="date" value={filtros.hasta} onChange={cambiarFiltro} />
        </div>
        <button type="button" className="boton boton-secundario" onClick={() => setFiltros(FILTROS_INICIALES)}>
          Limpiar filtros
        </button>
      </form>

      <Aviso tipo="error">{error}</Aviso>
      <p className="texto-suave">
        {cargando ? 'Consultando…' : `${pedidos.length} pedido(s) · Ventas (sin cancelados): ${precio(total)}`}
      </p>
      {!cargando && !error && pedidos.length === 0 && <p className="vacio">No hay pedidos con esos filtros.</p>}
      {pedidos.length > 0 && (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr><th>N.º</th><th>Fecha</th><th>Cliente</th><th>Platos</th><th>Total</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id}>
                  <td data-titulo="N.º">#{p.id}</td>
                  <td data-titulo="Fecha">{fecha(p.creado_en)}</td>
                  <td data-titulo="Cliente">{p.cliente}<br /><small className="texto-suave">{p.correo}</small></td>
                  <td data-titulo="Platos">{p.unidades}</td>
                  <td data-titulo="Total">{precio(p.total)}</td>
                  <td data-titulo="Estado"><EstadoPedido estado={p.estado} /></td>
                  <td><Link to={`/admin/pedidos/${p.id}`}>Gestionar</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminPedidos
