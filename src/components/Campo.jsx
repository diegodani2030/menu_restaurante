// Campo de formulario con etiqueta, mensaje de error y atributos de accesibilidad.
function Campo({ etiqueta, nombre, error, tipo = 'text', ayuda, children, ...props }) {
  const idError = error ? `${nombre}-error` : undefined
  const comun = {
    id: nombre,
    name: nombre,
    'aria-invalid': Boolean(error),
    'aria-describedby': idError,
    ...props,
  }

  let control
  if (tipo === 'select') control = <select {...comun}>{children}</select>
  else if (tipo === 'textarea') control = <textarea {...comun} />
  else control = <input type={tipo} {...comun} />

  return (
    <div className={`campo ${error ? 'campo-error' : ''}`}>
      <label htmlFor={nombre}>{etiqueta}{props.required && <span aria-hidden="true"> *</span>}</label>
      {control}
      {ayuda && !error && <small className="campo-ayuda">{ayuda}</small>}
      {error && <small id={idError} className="campo-mensaje">{error}</small>}
    </div>
  )
}

export default Campo
