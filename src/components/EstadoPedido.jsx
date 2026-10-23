import { NOMBRES_ESTADO } from '../utils/formato'

function EstadoPedido({ estado }) {
  return <span className={`estado estado-${estado}`}>{NOMBRES_ESTADO[estado] || estado}</span>
}

export default EstadoPedido
