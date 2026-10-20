// GET /api/mes — cron diario de Vercel (vercel.json). Abre la hoja del mes en
// los dos libros si todavía no existe; los demás días no hace nada. Corre a
// las 05:05 UTC (00:05 en Quito) y Vercel puede atrasarlo hasta una hora; por
// eso el primer envío del mes también sabe abrir el mes solo.
import { abrirMesInventario, abrirMesFacturas } from './_lib/meses.js';
import { registrar } from './_lib/registro.js';

export default async function handler(req, res) {
  const secreto = process.env.CRON_SECRET;
  if (secreto && req.headers.authorization !== `Bearer ${secreto}`) {
    return res.status(401).json({ ok: false });
  }
  const inicio = Date.now();
  try {
    const inventario = await abrirMesInventario();
    const facturas = await abrirMesFacturas();
    if (inventario.creada || facturas.creada) await registrar('mes', 'ok', inicio, { inventario, facturas });
    res.status(200).json({ ok: true, inventario, facturas });
  } catch (err) {
    console.error(err);
    await registrar('mes', 'error', inicio, { error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  }
}
