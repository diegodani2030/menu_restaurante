// Identidad corporativa de Raíces del Fogón.
// PROPUESTA PENDIENTE DE VALIDACIÓN POR EL EQUIPO: estos textos fueron
// redactados a partir del concepto del proyecto y deben ser revisados y
// aprobados antes de considerarse oficiales.

const empresa = {
  nombre: 'Raíces del Fogón',
  lema: 'Sabores de nuestra tierra, cocinados con tradición',

  presentacion:
    'Raíces del Fogón es un restaurante de comida tradicional colombiana. Su sistema de información web permite consultar el menú, registrarse, hacer pedidos en línea y hacerles seguimiento, y le da al administrador las herramientas para gestionar los platos, las categorías y los pedidos.',

  mision:
    'Ofrecer platos tradicionales de la cocina colombiana, preparados con recetas de nuestras regiones e ingredientes frescos, en un ambiente cálido y familiar, y facilitar que nuestros clientes conozcan el menú y hagan sus pedidos de forma sencilla y segura a través de nuestra plataforma web.',

  vision:
    'Para el año 2030, ser reconocidos en Bogotá como un restaurante referente de la cocina tradicional colombiana, destacado por la calidad de sus platos, la atención cercana a sus clientes y el uso de la tecnología para agilizar sus pedidos.',

  objetivoGeneral:
    'Desarrollar un sistema de información web que permita a Raíces del Fogón dar a conocer su menú, gestionar sus platos y categorías, y registrar y hacer seguimiento a los pedidos de sus clientes.',

  objetivosEspecificos: [
    'Publicar el menú del restaurante con búsqueda y filtros por categoría.',
    'Permitir el registro y el inicio de sesión seguro de los clientes.',
    'Registrar los pedidos y su detalle en una base de datos relacional MySQL.',
    'Brindar al administrador la gestión completa (crear, consultar, editar y eliminar) de platos y categorías.',
    'Permitir el seguimiento del estado de los pedidos por parte del cliente y del administrador.',
    'Generar consultas y reportes de ventas que apoyen la toma de decisiones.',
  ],

  valores: [
    { nombre: 'Tradición', descripcion: 'Respetamos y conservamos las recetas y costumbres de la cocina colombiana.' },
    { nombre: 'Calidad', descripcion: 'Seleccionamos ingredientes frescos y cuidamos cada preparación.' },
    { nombre: 'Hospitalidad', descripcion: 'Atendemos a cada cliente con calidez, como en casa.' },
    { nombre: 'Honestidad', descripcion: 'Informamos con claridad los precios, los ingredientes y el estado de cada pedido.' },
    { nombre: 'Responsabilidad', descripcion: 'Cumplimos lo que prometemos y protegemos los datos de nuestros clientes.' },
    { nombre: 'Trabajo en equipo', descripcion: 'Cocina, servicio y administración trabajan unidos por la satisfacción del cliente.' },
  ],

  servicios: [
    { nombre: 'Menú en línea', descripcion: 'Entradas, platos fuertes y postres típicos, con fotos, descripción y precio.' },
    { nombre: 'Pedidos por la página', descripcion: 'Arme su orden, ajuste las cantidades y envíe su pedido desde cualquier dispositivo.' },
    { nombre: 'Seguimiento del pedido', descripcion: 'Consulte en "Mis pedidos" si su orden está pendiente, en preparación o entregada.' },
  ],

  // Datos de contacto: PENDIENTES. Complete los valores reales del negocio.
  // Mientras estén vacíos, la sección de contacto no se muestra en la página.
  contacto: {
    direccion: '',
    telefono: '',
    correo: '',
    horario: '',
  },
}

export default empresa
