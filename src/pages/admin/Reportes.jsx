import { useEffect, useState } from 'react'
import Aviso from '../../components/Aviso'
import { api } from '../../services/api'
import { precio, NOMBRES_ESTADO } from '../../utils/formato'

function Reportes() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.resumen().then(setDatos).catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="contenedor"><Aviso tipo="error">{error}</Aviso></div>
  if (!datos) return <p className="cargando">Calculando reportes…</p>

  const { general, porEstado, porCategoria, masVendidos } = datos

  return (
    <div className="contenedor">
      <h2 className="titulo-pagina">Reportes</h2>
      <p className="texto-suave">Los pedidos cancelados no se cuentan como ventas.</p>
      <div className="indicadores">
        <div className="panel indicador"><span>Pedidos</span><strong>{general.pedidos}</strong></div>
        <div className="panel indicador"><span>Ventas</span><strong>{precio(general.ventas)}</strong></div>
        <div className="panel indicador"><span>Ticket promedio</span><strong>{precio(general.ticket_promedio)}</strong></div>
        <div className="panel indicador"><span>Clientes con pedidos</span><strong>{general.clientes}</strong></div>
      </div>

      <div className="rejilla-dos">
        <section className="panel">
          <h3>Platos más vendidos</h3>
          {masVendidos.length === 0 ? <p className="vacio">Aún no hay ventas.</p> : (
            <div className="tabla-contenedor">
              <table className="tabla">
                <thead><tr><th>Plato</th><th>Categoría</th><th>Unidades</th><th>Ingresos</th></tr></thead>
                <tbody>
                  {masVendidos.map((f) => (
                    <tr key={f.plato}>
                      <td data-titulo="Plato">{f.plato}</td>
                      <td data-titulo="Categoría">{f.categoria}</td>
                      <td data-titulo="Unidades">{f.unidades}</td>
                      <td data-titulo="Ingresos">{precio(f.ingresos)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <h3>Pedidos por estado</h3>
          {porEstado.length === 0 ? <p className="vacio">Aún no hay pedidos.</p> : (
            <div className="tabla-contenedor">
              <table className="tabla">
                <thead><tr><th>Estado</th><th>Pedidos</th><th>Valor</th></tr></thead>
                <tbody>
                  {porEstado.map((f) => (
                    <tr key={f.estado}>
                      <td data-titulo="Estado">{NOMBRES_ESTADO[f.estado]}</td>
                      <td data-titulo="Pedidos">{f.pedidos}</td>
                      <td data-titulo="Valor">{precio(f.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="panel">
        <h3>Platos por categoría</h3>
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead><tr><th>Categoría</th><th>Platos</th><th>Precio promedio</th><th>Mínimo</th><th>Máximo</th></tr></thead>
            <tbody>
              {porCategoria.map((f) => (
                <tr key={f.categoria}>
                  <td data-titulo="Categoría">{f.categoria}</td>
                  <td data-titulo="Platos">{f.platos}</td>
                  <td data-titulo="Precio promedio">{precio(f.precio_promedio)}</td>
                  <td data-titulo="Mínimo">{precio(f.precio_minimo)}</td>
                  <td data-titulo="Máximo">{precio(f.precio_maximo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default Reportes
