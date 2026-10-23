import {useState} from "react"
import { precio } from "./utils/formato"

function Tarjeta ({plato, agregarAlCarrito}) {

    const [agregado, setAgregado] = useState (false)

function anima (){

    agregarAlCarrito(plato)
    setAgregado(true)
    setTimeout(() => { setAgregado (false)}, 1000)


}

    return (
        <li className="tarjeta">
            {plato.imagen && <img src={plato.imagen} alt={plato.nombre} loading="lazy"/>}
            <div className="tarjeta-info">
            <h3>{plato.nombre}</h3>
            <p>{plato.descripcion}</p>
            <p className="etiqueta-categoria">{plato.categoria}</p>
            <p className="precio">{precio(plato.precio)}</p>
            <button onClick = {anima}> {agregado ? "Agregado" : "Agregar a la orden"}</button>
            </div>
        </li>
    )
}

export default Tarjeta
