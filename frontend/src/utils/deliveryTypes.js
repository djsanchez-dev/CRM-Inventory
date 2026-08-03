/**
 * deliveryTypes.js — shared knowledge of which business types offer delivery.
 * Used by the Sales page (badges), the sale modals (conditional toggle) and
 * the Delivery page (section visibility).
 */

// Stores that ship to customers: licoreria, general, abarrotes, ropa, electronica
export const DELIVERY_TYPES = ['licoreria', 'general', 'abarrotes', 'ropa', 'electronica'];

/** Whether a business type supports delivery orders */
export const canUseDelivery = (tipo) => DELIVERY_TYPES.includes(tipo);

/** Human label for a delivery state */
export const DELIVERY_STATE_LABEL = {
  pendiente: 'Pendiente',
  en_camino: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};
