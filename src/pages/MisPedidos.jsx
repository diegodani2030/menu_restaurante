import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Aviso from '../components/Aviso'
import EstadoPedido from '../components/EstadoPedido'
import { api } from '../services/api'
import { precio, fecha } from '../utils/formato'

function MisPedidos() {
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.pedidos()
      .then(setPedidos)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  return (
    <div className="contenedor">
      <h2 className="titulo-pagina">Mis pedidos</h2>
      <Aviso tipo="error">{error}</Aviso>
      {cargando && <p className="cargando">Cargando pedidos…</p>}
      {!cargando && !error && pedidos.length === 0 && (
        <p className="vacio">Todavía no ha hecho pedidos. <Link to="/">Ver el menú</Link></p>
      )}
      {pedidos.length > 0 && (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr><th>N.º</th><th>Fecha</th><th>Platos</th><th>Total</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id}>
                  <td data-titulo="N.º">#{p.id}</td>
                  <td data-titulo="Fecha">{fecha(p.creado_en)}</td>
                  <td data-titulo="Platos">{p.unidades}</td>
                  <td data-titulo="Total">{precio(p.total)}</td>
                  <td data-titulo="Estado"><EstadoPedido estado={p.estado} /></td>
                  <td><Link to={`/mis-pedidos/${p.id}`}>Ver detalle</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default MisPedidos
