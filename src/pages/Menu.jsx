import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Filtro from '../Filtro'
import Tarjeta from '../Tarjeta'
import Carrito from '../Carrito'
import Aviso from '../components/Aviso'
import { api } from '../services/api'

function Menu({ carrito, pedidoConfirmado, ...accionesCarrito }) {
  const ubicacion = useLocation()
  const [categoria, setcategoria] = useState('Todas')
  const [buscar, setBuscar] = useState('')
  const [categorias, setCategorias] = useState([])
  const [platos, setPlatos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.categorias().then(setCategorias).catch(() => setCategorias([]))
  }, [])

  useEffect(() => {
    let vigente = true
    const espera = setTimeout(() => {
      setCargando(true)
      api.platos({ categoria_id: categoria === 'Todas' ? '' : categoria, buscar })
        .then((datos) => { if (vigente) { setPlatos(datos); setError('') } })
        .catch((e) => { if (vigente) setError(e.message) })
        .finally(() => { if (vigente) setCargando(false) })
    }, 250)
    return () => { vigente = false; clearTimeout(espera) }
  }, [categoria, buscar])

  return (
    <div>
      <Aviso tipo="exito">{ubicacion.state?.mensaje}</Aviso>
      <Filtro categoria={categoria} setcategoria={setcategoria} categorias={categorias} />
      <div className="buscador">
        <label htmlFor="buscar" className="solo-lectores">Buscar plato</label>
        <input id="buscar" type="search" placeholder="Buscar plato…" value={buscar} maxLength={100}
          onChange={(e) => setBuscar(e.target.value)} />
      </div>
      {pedidoConfirmado && (
        <p className="pedido-confirmado">
          Pedido #{pedidoConfirmado} confirmado. <Link to={`/mis-pedidos/${pedidoConfirmado}`}>Ver pedido</Link>
        </p>
      )}
      <div className="contenido">
        <div className="menu-columna">
          <Aviso tipo="error">{error}</Aviso>
          {cargando && platos.length === 0 && <p className="cargando">Cargando menú…</p>}
          {!cargando && !error && platos.length === 0 && (
            <p className="vacio">No encontramos platos con esos criterios.</p>
          )}
          <ul className="menu">
            {platos.map((plato) => (
              <Tarjeta key={plato.id} plato={plato} agregarAlCarrito={accionesCarrito.agregarAlCarrito} />
            ))}
          </ul>
        </div>
        {carrito.length > 0 && <Carrito carrito={carrito} {...accionesCarrito} />}
      </div>
    </div>
  )
}

export default Menu
