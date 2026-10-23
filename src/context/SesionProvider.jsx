import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { SesionContext } from './sesion'

// Guarda el usuario que inició sesión y lo comparte con toda la aplicación.
function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    api.sesion()
      .then((datos) => setUsuario(datos.usuario))
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false))
  }, [])

  async function iniciarSesion(credenciales) {
    const datos = await api.iniciarSesion(credenciales)
    setUsuario(datos.usuario)
    return datos.usuario
  }

  async function registrar(datosRegistro) {
    const datos = await api.registrar(datosRegistro)
    setUsuario(datos.usuario)
    return datos.usuario
  }

  async function cerrarSesion() {
    await api.cerrarSesion().catch(() => {})
    setUsuario(null)
  }

  const valor = { usuario, cargando, esAdmin: usuario?.rol === 'admin', iniciarSesion, registrar, cerrarSesion }
  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>
}

export default SesionProvider
