import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Aviso from '../components/Aviso'
import EstadoPedido from '../components/EstadoPedido'
import { useSesion } from '../context/sesion'
import { api } from '../services/api'
import { precio, fecha, NOMBRES_ESTADO } from '../utils/formato'
import { ESTADOS_PEDIDO } from '../utils/validaciones'

function PedidoDetalle() {
  const { id } = useParams()
  const { esAdmin } = useSesion()
  const [pedido, setPedido] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    api.pedido(id)
      .then(setPedido)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [id])

  async function cambiarEstado(estado) {
    setGuardando(true)
    setError('')
    setMensaje('')
    try {
      await (esAdmin ? api.cambiarEstado(pedido.id, estado) : api.cancelarPedido(pedido.id))
      setPedido({ ...pedido, estado })
      setMensaje(`El pedido quedó en estado "${NOMBRES_ESTADO[estado]}".`)
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  function cancelar() {
    if (window.confirm('¿Seguro que desea cancelar este pedido?')) cambiarEstado('cancelado')
  }

  const volver = esAdmin ? '/admin/pedidos' : '/mis-pedidos'

  if (cargando) return <p className="cargando">Cargando pedido…</p>
  if (!pedido) {
    return (
      <div className="contenedor">
        <Aviso tipo="error">{error || 'El pedido no existe.'}</Aviso>
        <Link to={volver}>Volver</Link>
      </div>
    )
  }

  return (
    <div className="contenedor">
      <p><Link to={volver}>← Volver a los pedidos</Link></p>
      <div className="panel">
        <div className="encabezado-panel">
          <h2>Pedido #{pedido.id}</h2>
          <EstadoPedido estado={pedido.estado} />
        </div>
        <Aviso tipo="exito">{mensaje}</Aviso>
        <Aviso tipo="error">{error}</Aviso>
        <dl className="datos">
          <div><dt>Fecha</dt><dd>{fecha(pedido.creado_en)}</dd></div>
          <div><dt>Cliente</dt><dd>{pedido.cliente}</dd></div>
          {esAdmin && <div><dt>Correo</dt><dd>{pedido.correo}</dd></div>}
          {esAdmin && <div><dt>Teléfono</dt><dd>{pedido.telefono}</dd></div>}
          {pedido.observaciones && <div><dt>Observaciones</dt><dd>{pedido.observaciones}</dd></div>}
        </dl>

        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr><th>Plato</th><th>Categoría</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr>
            </thead>
            <tbody>
              {pedido.detalle.map((d) => (
                <tr key={d.id}>
                  <td data-titulo="Plato">{d.plato}</td>
                  <td data-titulo="Categoría">{d.categoria}</td>
                  <td data-titulo="Cantidad">{d.cantidad}</td>
                  <td data-titulo="Precio unitario">{precio(d.precio_unitario)}</td>
                  <td data-titulo="Subtotal">{precio(d.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="carrito-total">Total: {precio(pedido.total)}</p>

        {esAdmin ? (
          <div className="campo campo-en-linea">
            <label htmlFor="estado">Cambiar estado</label>
            <select id="estado" value={pedido.estado} disabled={guardando}
              onChange={(e) => cambiarEstado(e.target.value)}>
              {ESTADOS_PEDIDO.map((estado) => <option key={estado} value={estado}>{NOMBRES_ESTADO[estado]}</option>)}
            </select>
          </div>
        ) : pedido.estado === 'pendiente' && (
          <button className="boton boton-peligro" disabled={guardando} onClick={cancelar}>
            {guardando ? 'Cancelando…' : 'Cancelar pedido'}
          </button>
        )}
      </div>
    </div>
  )
}

export default PedidoDetalle
