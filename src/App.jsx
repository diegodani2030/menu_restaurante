import { useState } from "react";
import { Routes, Route, useNavigate, Link } from "react-router-dom";
import Navbar from "./components/Navbar";
import RutaProtegida from "./components/RutaProtegida";
import Menu from "./pages/Menu";
import Nosotros from "./pages/Nosotros";
import Registro from "./pages/Registro";
import Login from "./pages/Login";
import MisPedidos from "./pages/MisPedidos";
import PedidoDetalle from "./pages/PedidoDetalle";
import AdminPlatos from "./pages/admin/AdminPlatos";
import PlatoFormulario from "./pages/admin/PlatoFormulario";
import PlatoDetalle from "./pages/admin/PlatoDetalle";
import AdminCategorias from "./pages/admin/AdminCategorias";
import AdminPedidos from "./pages/admin/AdminPedidos";
import Reportes from "./pages/admin/Reportes";
import { useSesion } from "./context/sesion";
import { api } from "./services/api";

function App (){

  const { usuario } = useSesion()
  const navegar = useNavigate()
  const [carrito, setcarrito] = useState ([])
  const [pedidoConfirmado, setPedidoConfirmado] = useState (null)

function agregarAlCarrito (plato){

  const existente = carrito.find((item) => item.id === plato.id)

  if (existente) {
    if (existente.cantidad >= 50) return
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

// Envía la orden a la API. Si no hay sesión, lleva al inicio de sesión y
// conserva la orden para enviarla al volver.
async function confirmarPedido (observaciones) {

  if (!usuario) {
    navegar("/login", { state: { volver: "/" } })
    return
  }
  const pedido = await api.crearPedido({
    items: carrito.map((item) => ({ plato_id: item.id, cantidad: item.cantidad })),
    observaciones,
  })
  vaciarCarrito()
  setPedidoConfirmado(pedido.id)
  setTimeout(() => {
    setPedidoConfirmado(null)
  }, 6000 )
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

const cantidadOrden = carrito.reduce((suma, item) => suma + item.cantidad, 0)

  return (
    <div>
      <Navbar cantidadOrden={cantidadOrden} />
      <main>
        <Routes>
          <Route path="/" element={
            <Menu carrito={carrito} pedidoConfirmado={pedidoConfirmado} agregarAlCarrito={agregarAlCarrito}
              eliminarDelCarrito={eliminarDelCarrito} vaciarCarrito={vaciarCarrito}
              confirmarPedido={confirmarPedido} restarCantidad={restarCantidad} />
          } />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/login" element={<Login />} />
          <Route path="/mis-pedidos" element={<RutaProtegida><MisPedidos /></RutaProtegida>} />
          <Route path="/mis-pedidos/:id" element={<RutaProtegida><PedidoDetalle /></RutaProtegida>} />
          <Route path="/admin/platos" element={<RutaProtegida soloAdmin><AdminPlatos /></RutaProtegida>} />
          <Route path="/admin/platos/nuevo" element={<RutaProtegida soloAdmin><PlatoFormulario /></RutaProtegida>} />
          <Route path="/admin/platos/:id" element={<RutaProtegida soloAdmin><PlatoDetalle /></RutaProtegida>} />
          <Route path="/admin/platos/:id/editar" element={<RutaProtegida soloAdmin><PlatoFormulario /></RutaProtegida>} />
          <Route path="/admin/categorias" element={<RutaProtegida soloAdmin><AdminCategorias /></RutaProtegida>} />
          <Route path="/admin/pedidos" element={<RutaProtegida soloAdmin><AdminPedidos /></RutaProtegida>} />
          <Route path="/admin/pedidos/:id" element={<RutaProtegida soloAdmin><PedidoDetalle /></RutaProtegida>} />
          <Route path="/admin/reportes" element={<RutaProtegida soloAdmin><Reportes /></RutaProtegida>} />
          <Route path="*" element={
            <div className="contenedor vacio">
              <p>La página que busca no existe.</p>
              <Link to="/">Volver al menú</Link>
            </div>
          } />
        </Routes>
      </main>
      <footer className="pie">
        <p>Raíces del Fogón · Sabores de nuestra tierra</p>
      </footer>
    </div>
  )
}
export default App
