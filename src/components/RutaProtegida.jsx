import { Navigate, useLocation } from 'react-router-dom'
import { useSesion } from '../context/sesion'

function RutaProtegida({ soloAdmin = false, children }) {
  const { usuario, cargando } = useSesion()
  const ubicacion = useLocation()

  if (cargando) return <p className="cargando">Cargando…</p>
  if (!usuario) return <Navigate to="/login" replace state={{ volver: ubicacion.pathname }} />
  if (soloAdmin && usuario.rol !== 'admin') {
    return <p className="aviso aviso-error contenedor">No tiene permisos para ver esta página.</p>
  }
  return children
}

export default RutaProtegida
