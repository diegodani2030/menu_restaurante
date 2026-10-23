// Mensaje de estado: tipo = "exito" | "error" | "info"
function Aviso({ tipo = 'info', children }) {
  if (!children) return null
  return (
    <p className={`aviso aviso-${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  )
}

export default Aviso
