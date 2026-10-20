// POST /api/consulta — antes el webhook «consulta». El panel admin pide el
// saldo de un producto (o «ambos») y recibe { titulo, mensaje, valor... }.
import { leer, comoObjetos, HojaNoExiste } from './_lib/google.js';
import { buscarYFormatearSaldo } from './_lib/inventario.js';
import { abrirMesInventario } from './_lib/meses.js';
import { nombreHoja } from './_lib/fechas.js';
import { libros } from './_lib/config.js';
import { registrar } from './_lib/registro.js';

export async function consultar(body, ahora = new Date()) {
  const hoja = nombreHoja(ahora);
  let valores;
  try {
    valores = await leer(libros.inventario(), hoja);
  } catch (err) {
    if (!(err instanceof HojaNoExiste)) throw err;
    await abrirMesInventario(ahora);
    valores = await leer(libros.inventario(), hoja);
  }
  return buscarYFormatearSaldo(comoObjetos(valores), body.producto || 'ambos');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const inicio = Date.now();
  try {
    res.status(200).json(await consultar(req.body || {}));
  } catch (err) {
    console.error(err);
    await registrar('consulta', 'error', inicio, { body: req.body, error: err.message });
    res.status(500).json({ titulo: 'Error', mensaje: 'Error al consultar saldo' });
  }
}
