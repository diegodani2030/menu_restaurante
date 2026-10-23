import empresa from '../empresa'

const ETIQUETAS_CONTACTO = { direccion: 'Dirección', telefono: 'Teléfono', correo: 'Correo', horario: 'Horario' }

function Nosotros() {
  const contacto = Object.entries(empresa.contacto).filter(([, valor]) => valor)

  return (
    <div className="contenedor nosotros">
      <section className="portada">
        <h2>{empresa.nombre}</h2>
        <p className="lema">{empresa.lema}</p>
        <p>{empresa.presentacion}</p>
      </section>

      <div className="rejilla-dos">
        <section className="panel">
          <h3>Misión</h3>
          <p>{empresa.mision}</p>
        </section>
        <section className="panel">
          <h3>Visión</h3>
          <p>{empresa.vision}</p>
        </section>
      </div>

      <section className="panel">
        <h3>Objetivo general</h3>
        <p>{empresa.objetivoGeneral}</p>
        <h3>Objetivos específicos</h3>
        <ol className="lista-objetivos">
          {empresa.objetivosEspecificos.map((objetivo) => <li key={objetivo}>{objetivo}</li>)}
        </ol>
      </section>

      <section>
        <h3 className="titulo-seccion">Nuestros valores</h3>
        <ul className="rejilla-valores">
          {empresa.valores.map((valor) => (
            <li key={valor.nombre} className="panel">
              <h4>{valor.nombre}</h4>
              <p>{valor.descripcion}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="titulo-seccion">Servicios</h3>
        <ul className="rejilla-valores">
          {empresa.servicios.map((servicio) => (
            <li key={servicio.nombre} className="panel">
              <h4>{servicio.nombre}</h4>
              <p>{servicio.descripcion}</p>
            </li>
          ))}
        </ul>
      </section>

      {contacto.length > 0 && (
        <section className="panel">
          <h3>Contacto</h3>
          <dl className="datos">
            {contacto.map(([clave, valor]) => (
              <div key={clave}>
                <dt>{ETIQUETAS_CONTACTO[clave]}</dt>
                <dd>{valor}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  )
}

export default Nosotros
