import {useState} from "react"
function Tarjeta ({plato, agregarAlCarrito}) {

    const [agregado, setAgregado] = useState (false)

function anima (){

    agregarAlCarrito(plato)
    setAgregado(true)
    setTimeout(() => { setAgregado (false)}, 1000)
    

}

    return (
        <div className="tarjeta">
            <img src={plato.imagen} alt={plato.nombre}/>
            <div className="tarjeta-info">
            <p>Nombre:{plato.nombre}</p>
            <p>Descripcion:{plato.descripción}</p>
            <p>Precio:{plato.precio}</p>
            <p>Categoria:{plato.categoria}</p>
            <button onClick = {anima}> {agregado ? "agregado" : "agregar al carrito"}</button>
            </div>
        </div>
    )
}

export default Tarjeta