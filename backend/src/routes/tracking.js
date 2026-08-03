const express = require('express');
const { queryOne } = require('../database');

const router = express.Router();

/** Parse a business config JSON safely */
function parseBusinessConfig(raw) {
  try {
    if (typeof raw === 'string') return JSON.parse(raw || '{}');
    return raw || {};
  } catch (e) {
    return {};
  }
}

/**
 * GET /api/tracking/:token — PUBLIC, no auth required.
 *
 * Resolves a one-time tracking token for a delivery order so the customer
 * can follow their order in real time (shared by the store owner via
 * WhatsApp / phone call). Only exposes the fields a customer needs.
 *
 * The link "expires" (returns 410) once the order is delivered or cancelled:
 *   - pendiente / en_camino → 200 with live status
 *   - entregado / cancelado → 410 (link no longer available)
 *   - invalid / non-delivery → 404
 */
router.get('/:token', async (req, res) => {
  try {
    const token = req.params.token;

    const sale = await queryOne(
      `SELECT s.id, s.total, s.tipo_pago, s.created_at, s.updated_at,
              s.es_delivery, s.estado_delivery, s.direccion_entrega, s.repartidor,
              s.repartidor_lat, s.repartidor_lng,
              s.destino_lat, s.destino_lng,
              c.nombre as customer_name,
              b.nombre as business_name, b.tipo_negocio, b.config as business_config
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       LEFT JOIN businesses b ON s.business_id = b.id
       WHERE s.tracking_token = $1`,
      [token]
    );

    if (!sale || !sale.es_delivery) {
      return res.status(404).json({ error: 'Enlace de seguimiento no válido o ya no existe' });
    }

    if (sale.estado_delivery === 'entregado' || sale.estado_delivery === 'cancelado') {
      return res.status(410).json({
        error: 'Este enlace de seguimiento ya no está disponible',
        estado_delivery: sale.estado_delivery,
        order_id: sale.id,
        business_name: sale.business_name,
      });
    }

    // Store location (lat/lng) so the customer's map can show the origin
    const businessConfig = parseBusinessConfig(sale.business_config);
    const storeLocation = businessConfig.ubicacion || null;

    res.json({
      order_id: sale.id,
      business_name: sale.business_name,
      business_type: sale.tipo_negocio,
      moneda: businessConfig.moneda || 'PEN',
      customer_name: sale.customer_name || 'Cliente',
      estado_delivery: sale.estado_delivery,
      direccion_entrega: sale.direccion_entrega,
      repartidor: sale.repartidor,
      repartidor_lat: sale.repartidor_lat ?? null,
      repartidor_lng: sale.repartidor_lng ?? null,
      destino_lat: sale.destino_lat ?? null,
      destino_lng: sale.destino_lng ?? null,
      store_location: storeLocation,
      total: sale.total,
      tipo_pago: sale.tipo_pago,
      created_at: sale.created_at,
      updated_at: sale.updated_at,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/tracking/:token/location — PUBLIC, no auth required.
 *
 * Called by the delivery person's phone (they open the share link and the
 * browser's geolocation API pushes GPS coordinates here periodically). Only
 * accepted while the order is active; once delivered/cancelled it returns
 * 410 so the sharing page can stop.
 */
router.put('/:token/location', async (req, res) => {
  try {
    const token = req.params.token;
    const { lat, lng } = req.body || {};

    if (typeof lat !== 'number' || typeof lng !== 'number' || !isFinite(lat) || !isFinite(lng)) {
      return res.status(400).json({ error: 'Coordenadas inválidas' });
    }
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return res.status(400).json({ error: 'Coordenadas fuera de rango' });
    }

    const sale = await queryOne(
      'SELECT id, es_delivery, estado_delivery FROM sales WHERE tracking_token = $1',
      [token]
    );

    if (!sale || !sale.es_delivery) {
      return res.status(404).json({ error: 'Enlace no válido o el pedido no existe' });
    }
    if (sale.estado_delivery === 'entregado' || sale.estado_delivery === 'cancelado') {
      return res.status(410).json({
        error: 'El pedido ya finalizó, se detuvo el envío de ubicación',
        estado_delivery: sale.estado_delivery,
      });
    }

    await queryOne(
      'UPDATE sales SET repartidor_lat = $1, repartidor_lng = $2, updated_at = NOW() WHERE id = $3',
      [lat, lng, sale.id]
    );

    res.json({ ok: true, repartidor_lat: lat, repartidor_lng: lng });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
