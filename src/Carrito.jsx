function Carrito ({carrito, eliminarDelCarrito, vaciarCarrito, confirmarPedido, restarCantidad, agregarAlCarrito}){

    const total = carrito.reduce((suma,item) => suma + item.precio * item.cantidad, 0)

    return (
        <div className="carrito">
            <h2>Orden</h2>
            <button className="pedir" onClick={() => confirmarPedido()}>Pedir</button>
            <ul>
                {carrito.map((item,index)=> (
                    <li key={index}>
                       <p>{item.nombre}</p>
                       <p>${item.precio * item.cantidad}</p>
                       <div className="cantidad-control">
                        <button className="cantidad"
                         onClick={() => restarCantidad(item)}>-</button>
                        <span className="cantidad-numero">{item.cantidad}</span>
                        <button  className="cantidad"
                        onClick={() => agregarAlCarrito(item)}>+</button>
                       </div>
                       <button className="eliminar" onClick={() => eliminarDelCarrito(index)}>Eliminar</button>
                    </li>
                  ))}
            </ul>
         <p>Total: ${total}</p>
         <button className="vaciar" onClick={() => vaciarCarrito()}>Vaciar</button>
         </div>
    )
}
export default Carrito
  