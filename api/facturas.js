// POST /api/facturas — antes el webhook «ingresar-facturas». Agrega la factura
// a la hoja del mes del libro «Facturas Belkett» (encabezados en la fila 10)
// y avisa al grupo de facturas.
import { agregarFila, HojaNoExiste } from './_lib/google.js';
import { abrirMesFacturas } from './_lib/meses.js';
import { mesYAnio } from './_lib/fechas.js';
import { avisar, rellenar } from './_lib/telegram.js';
import * as plantillas from './_lib/plantillas.js';
import { libros, chats } from './_lib/config.js';
import { registrar } from './_lib/registro.js';

export async function guardarFactura(body, ahora = new Date()) {
  const { mes, anio } = mesYAnio(ahora);
  const hoja = `${mes} ${anio}`;
  const fila = {
    Fecha: body.fecha,
    Responsable: body.responsable,
    Entidad: body.entidad,
    Nombre: body.nombre,
    Valor: body.valor,
  };
  try {
    await agregarFila(libros.facturas(), hoja, 10, 'E', fila);
  } catch (err) {
    if (!(err instanceof HojaNoExiste)) throw err;
    await abrirMesFacturas(ahora);
    await agregarFila(libros.facturas(), hoja, 10, 'E', fila);
  }
  const aviso = await avisar(chats.facturas(), rellenar(plantillas.factura, { factura: { body, mes, 'año': anio } }));
  return { hoja, fila, avisos: aviso ? [aviso] : [] };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const inicio = Date.now();
  const body = req.body || {};
  try {
    const r = await guardarFactura(body);
    await registrar('facturas', 'ok', inicio, { body, ...r });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    await registrar('facturas', 'error', inicio, { body, error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  }
}
