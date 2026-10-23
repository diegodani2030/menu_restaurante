import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Campo from '../components/Campo'
import Aviso from '../components/Aviso'
import { useSesion } from '../context/sesion'
import { validarRegistro, tieneErrores } from '../utils/validaciones'

const INICIAL = { nombre: '', correo: '', telefono: '', password: '', confirmar: '' }

function Registro() {
  const { registrar } = useSesion()
  const navegar = useNavigate()
  const [valores, setValores] = useState(INICIAL)
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
    const { errores: nuevos } = validarRegistro(valores)
    if (!valores.confirmar) nuevos.confirmar = 'Confirme la contraseña.'
    else if (valores.confirmar !== valores.password) nuevos.confirmar = 'Las contraseñas no coinciden.'
    setErrores(nuevos)
    setErrorGeneral('')
    if (tieneErrores(nuevos)) return

    setEnviando(true)
    try {
      const { confirmar: _confirmar, ...datos } = valores
      await registrar(datos)
      navegar('/', { state: { mensaje: '¡Cuenta creada! Ya puede hacer su pedido.' } })
    } catch (error) {
      setErrores(error.campos)
      setErrorGeneral(error.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="contenedor contenedor-angosto">
      <form className="panel formulario" onSubmit={enviar} noValidate>
        <h2>Crear cuenta</h2>
        <p className="texto-suave">Regístrese para hacer pedidos y consultar su historial.</p>
        <Aviso tipo="error">{errorGeneral}</Aviso>
        <Campo etiqueta="Nombre completo" nombre="nombre" value={valores.nombre} onChange={cambiar}
          error={errores.nombre} required maxLength={100} autoComplete="name" />
        <Campo etiqueta="Correo electrónico" nombre="correo" tipo="email" value={valores.correo} onChange={cambiar}
          error={errores.correo} required maxLength={150} autoComplete="email" />
        <Campo etiqueta="Teléfono" nombre="telefono" tipo="tel" value={valores.telefono} onChange={cambiar}
          error={errores.telefono} required maxLength={15} autoComplete="tel" ayuda="Solo números, entre 7 y 15 dígitos." />
        <Campo etiqueta="Contraseña" nombre="password" tipo="password" value={valores.password} onChange={cambiar}
          error={errores.password} required maxLength={72} autoComplete="new-password"
          ayuda="Mínimo 8 caracteres, con letras y números." />
        <Campo etiqueta="Confirmar contraseña" nombre="confirmar" tipo="password" value={valores.confirmar} onChange={cambiar}
          error={errores.confirmar} required maxLength={72} autoComplete="new-password" />
        <button className="boton" type="submit" disabled={enviando}>
          {enviando ? 'Creando cuenta…' : 'Registrarme'}
        </button>
        <p className="texto-suave">¿Ya tiene cuenta? <Link to="/login">Inicie sesión</Link></p>
      </form>
    </div>
  )
}

export default Registro
