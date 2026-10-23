import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Campo from '../components/Campo'
import Aviso from '../components/Aviso'
import { useSesion } from '../context/sesion'
import { validarLogin, tieneErrores } from '../utils/validaciones'

function Login() {
  const { iniciarSesion } = useSesion()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [valores, setValores] = useState({ correo: '', password: '' })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  function cambiar(evento) {
    const { name, value } = evento.target
    setValores((actual) => ({ ...actual, [name]: value }))
    if (errores[name]) setErrores((actual) => ({ ...actual, [name]: undefined }))
  }

  async function enviar(evento) {
    evento.preventDefault()
    if (enviando) return
    const { errores: nuevos } = validarLogin(valores)
    setErrores(nuevos)
    setErrorGeneral('')
    if (tieneErrores(nuevos)) return

    setEnviando(true)
    try {
      const usuario = await iniciarSesion(valores)
      const destino = ubicacion.state?.volver || (usuario.rol === 'admin' ? '/admin/platos' : '/')
      navegar(destino, { replace: true })
    } catch (error) {
      setErrores(error.campos)
      setErrorGeneral(error.message)
      setValores((actual) => ({ ...actual, password: '' }))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="contenedor contenedor-angosto">
      <form className="panel formulario" onSubmit={enviar} noValidate>
        <h2>Iniciar sesión</h2>
        {ubicacion.state?.volver && <Aviso tipo="info">Inicie sesión para continuar.</Aviso>}
        <Aviso tipo="error">{errorGeneral}</Aviso>
        <Campo etiqueta="Correo electrónico" nombre="correo" tipo="email" value={valores.correo} onChange={cambiar}
          error={errores.correo} required autoComplete="email" />
        <Campo etiqueta="Contraseña" nombre="password" tipo="password" value={valores.password} onChange={cambiar}
          error={errores.password} required autoComplete="current-password" />
        <button className="boton" type="submit" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
        <p className="texto-suave">¿No tiene cuenta? <Link to="/registro">Regístrese aquí</Link></p>
      </form>
    </div>
  )
}

export default Login
