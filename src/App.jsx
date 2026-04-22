import { useState, useEffect } from "react";
import platos from "./platos";
import Filtro from "./Filtro";
import Tarjeta from "./Tarjeta";
import Carrito from "./Carrito";

function App (){

  const [categoria, setcategoria] = useState ("Todas")
  const [carrito, setcarrito] = useState ([])
  const [pedidoConfirmado, setPedidoConfirmado] = useState (false)

function agregarAlCarrito (plato){

  const existente = carrito.find((item) => item.id === plato.id)

  if (existente) {
    setcarrito(carrito.map((item) =>
    item.id === plato.id
       ? {...item, cantidad: item.cantidad + 1}
       :item))
  } else {
  setcarrito([...carrito, {...plato, cantidad: 1}])
  }
}

function eliminarDelCarrito(index) {

  const nuevoCarrito = carrito.filter((_,i) => i !== index)
  setcarrito(nuevoCarrito)
}

function vaciarCarrito() {

  const newCarrito = []
  setcarrito(newCarrito)
}

function confirmarPedido () {

  vaciarCarrito()
  setPedidoConfirmado(true)
  setTimeout(() => {
    setPedidoConfirmado(false)
  }, 3000 )
}

function restarCantidad (plato) {
  if (plato.cantidad === 1) {

    eliminarDelCarrito(carrito.findIndex((item) => item.id === plato.id))
  }else {
    setcarrito(carrito.map((item) => 
    item.id === plato.id
      ? {...item, cantidad: item.cantidad - 1}
      : item))
  }
}

const platosFiltro = categoria === "Todas"
  ? platos
  : platos.filter((platos) => platos.categoria === categoria)

  return (
    <div>
       <h1>Raíces del Fogón</h1>
       <Filtro categoria={categoria} setcategoria = {setcategoria} />
       <div className="contenido">
         <ul className="menu"> 
           {platosFiltro.map((plato) => (
            <Tarjeta key = {plato.id} plato={plato} agregarAlCarrito={agregarAlCarrito} />
           ))}
         </ul> 
        {pedidoConfirmado && <p className="pedido-confirmado">Pedido confirmado</p>}
        {carrito.length> 0 && <Carrito carrito={carrito} eliminarDelCarrito={eliminarDelCarrito} vaciarCarrito={vaciarCarrito} confirmarPedido={confirmarPedido}
        restarCantidad={restarCantidad} agregarAlCarrito={agregarAlCarrito} />}
        </div>
      </div>
  )
}
export default App