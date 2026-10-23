const pesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export function precio(valor) {
  return pesos.format(Number(valor) || 0)
}

export function fecha(valor) {
  if (!valor) return ''
  return new Date(String(valor).replace(' ', 'T')).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export const NOMBRES_ESTADO = {
  pendiente: 'Pendiente',
  en_preparacion: 'En preparación',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}
