import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useSesion } from '../context/sesion'

function Navbar({ cantidadOrden }) {
  const { usuario, esAdmin, cerrarSesion } = useSesion()
  const [abierto, setAbierto] = useState(false)
  const navegar = useNavigate()

  async function salir() {
    setAbierto(false)
    navegar('/')
    await cerrarSesion()
  }

  const cerrar = () => setAbierto(false)

  return (
    <header className="encabezado">
      <h1><NavLink to="/" onClick={cerrar}>Raíces del Fogón</NavLink></h1>
      <button
        className="menu-movil"
        aria-expanded={abierto}
        aria-controls="navegacion"
        onClick={() => setAbierto(!abierto)}
      >
        {abierto ? 'Cerrar' : 'Menú'}
      </button>
      <nav id="navegacion" className={`navegacion ${abierto ? 'abierta' : ''}`}>
        <NavLink to="/" end onClick={cerrar}>
          Menú{cantidadOrden > 0 && <span className="insignia">{cantidadOrden}</span>}
        </NavLink>
        <NavLink to="/nosotros" onClick={cerrar}>Nosotros</NavLink>
        {usuario && !esAdmin && <NavLink to="/mis-pedidos" onClick={cerrar}>Mis pedidos</NavLink>}
        {esAdmin && (
          <>
            <NavLink to="/admin/platos" onClick={cerrar}>Platos</NavLink>
            <NavLink to="/admin/categorias" onClick={cerrar}>Categorías</NavLink>
            <NavLink to="/admin/pedidos" onClick={cerrar}>Pedidos</NavLink>
            <NavLink to="/admin/reportes" onClick={cerrar}>Reportes</NavLink>
          </>
        )}
        {usuario ? (
          <>
            <span className="saludo">Hola, {usuario.nombre.split(' ')[0]}</span>
            <button className="enlace-boton" onClick={salir}>Cerrar sesión</button>
          </>
        ) : (
          <>
            <NavLink to="/login" onClick={cerrar}>Iniciar sesión</NavLink>
            <NavLink to="/registro" onClick={cerrar}>Registrarse</NavLink>
          </>
        )}
      </nav>
    </header>
  )
}

export default Navbar
