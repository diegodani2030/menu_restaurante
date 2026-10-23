import { useState } from "react"
import { precio } from "./utils/formato"
import Aviso from "./components/Aviso"

function Carrito ({carrito, eliminarDelCarrito, vaciarCarrito, confirmarPedido, restarCantidad, agregarAlCarrito}){

    const [observaciones, setObservaciones] = useState("")
    const [enviando, setEnviando] = useState(false)
    const [error, setError] = useState("")

    const total = carrito.reduce((suma,item) => suma + item.precio * item.cantidad, 0)

    async function pedir () {
        if (enviando) return
        if (observaciones.length > 255) {
            setError("Las observaciones no pueden superar 255 caracteres.")
            return
        }
        setEnviando(true)
        setError("")
        try {
            await confirmarPedido(observaciones)
            setObservaciones("")
        } catch (e) {
            setError(e.message)
        } finally {
            setEnviando(false)
        }
    }

    return (
        <aside className="carrito" aria-label="Orden actual">
            <h2>Orden</h2>
            <ul>
                {carrito.map((item,index)=> (
                    <li key={item.id}>
                       <div className="carrito-item-info">
                         <p>{item.nombre}</p>
                         <p>{precio(item.precio * item.cantidad)}</p>
                       </div>
                       <div className="cantidad-control">
                        <button className="cantidad" aria-label={`Quitar una unidad de ${item.nombre}`}
                         onClick={() => restarCantidad(item)}>-</button>
                        <span className="cantidad-numero">{item.cantidad}</span>
                        <button  className="cantidad" aria-label={`Agregar una unidad de ${item.nombre}`}
                        disabled={item.cantidad >= 50}
                        onClick={() => agregarAlCarrito(item)}>+</button>
                       </div>
                       <button className="eliminar" onClick={() => eliminarDelCarrito(index)}>Eliminar</button>
                    </li>
                  ))}
            </ul>
         <p className="carrito-total">Total: {precio(total)}</p>
         <label className="etiqueta-observaciones" htmlFor="observaciones">Observaciones (opcional)</label>
         <textarea id="observaciones" value={observaciones} maxLength={255} rows={2}
           placeholder="Ej.: sin cebolla"
           onChange={(e) => setObservaciones(e.target.value)} />
         <Aviso tipo="error">{error}</Aviso>
         <button className="pedir" disabled={enviando} onClick={pedir}>{enviando ? "Enviando…" : "Pedir"}</button>
         <button className="vaciar" disabled={enviando} onClick={() => vaciarCarrito()}>Vaciar</button>
         </aside>
    )
}
export default Carrito
