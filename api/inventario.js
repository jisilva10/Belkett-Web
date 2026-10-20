// POST /api/inventario — antes el webhook principal del flujo «Belkett Web».
// Recibe lo que manda el formulario (Recibo, Producción, Cierre o el Ingreso
// del admin), calcula el cuadre contra el último saldo y agrega la fila.
// Solo contesta OK cuando la fila quedó escrita: la web se fía de eso.
import { leer, comoObjetos, agregarFila } from './_lib/google.js';
import { adaptador, obtenerUltimoSaldo, filaParaLaHoja } from './_lib/inventario.js';
import { abrirMesInventario } from './_lib/meses.js';
import { avisar, rellenar } from './_lib/telegram.js';
import * as plantillas from './_lib/plantillas.js';
import { libros, chats } from './_lib/config.js';
import { registrar } from './_lib/registro.js';

async function hojaDeConfig() {
  const config = comoObjetos(await leer(libros.inventario(), 'config', 'A1:B3'));
  return config.find((f) => f.w === 'hoja_actual')?.Value;
}

export async function guardar(body, ahora = new Date()) {
  const datosInput = adaptador(body, ahora);

  // El primer envío del mes puede llegar antes que el cron (el cierre de las
  // 00:30): en ese caso se abre el mes aquí mismo y se sigue.
  let hoja = await hojaDeConfig();
  if (hoja !== datosInput.hoja_actual) {
    await abrirMesInventario(ahora);
    hoja = await hojaDeConfig();
  }

  const filas = comoObjetos(await leer(libros.inventario(), hoja, 'A:DJ'));
  const saldo = obtenerUltimoSaldo(datosInput, filas, ahora);
  const fila = filaParaLaHoja(saldo);
  await agregarFila(libros.inventario(), saldo.hoja_actual, 1, 'AY', fila);

  // Ya quedó guardado; si Telegram falla no se le dice a la chica que no se
  // guardó (en n8n pasaba eso y reenviaban).
  const avisos = await Promise.all([
    saldo.hay_descuadre ? avisar(chats.inventario(), rellenar(plantillas.descuadre, { saldo, fila }), 'HTML') : null,
    avisar(chats.inventario(), rellenar(plantillas.registro, { saldo, fila })),
  ]);
  return { hoja: saldo.hoja_actual, fila, avisos: avisos.filter(Boolean) };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const inicio = Date.now();
  const body = req.body || {};
  try {
    const r = await guardar(body);
    await registrar('inventario', 'ok', inicio, { body, ...r });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    await registrar('inventario', 'error', inicio, { body, error: err.message });
    res.status(500).json({ ok: false, error: err.message });
  }
}
