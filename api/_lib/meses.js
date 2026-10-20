// Apertura de mes de los dos libros (antes: los «Cron Mensual» de n8n).
// Se puede llamar las veces que sea: solo hace algo si la hoja del mes no
// existe. La llaman el cron diario y también el primer envío del mes, por si
// las chicas mandan antes de que corra el cron (el cierre de las 00:30).
import { hojas, lote, leer, comoObjetos, escribir, agregarFila, HojaNoExiste } from './google.js';
import { horaEcuador, MESES } from './fechas.js';
import { extraerSaldosFinales } from './inventario.js';
import { avisar, rellenar } from './telegram.js';
import * as plantillas from './plantillas.js';
import { libros, chats } from './config.js';

// La plantilla de cada libro es la primera hoja (sheetId 0), y la copia va en
// la posición 1, igual que el nodo «Duplicar Plantilla».
async function duplicarPlantilla(libro, nombre) {
  const existentes = await hojas(libro);
  if (existentes.some((h) => h.title === nombre)) return false;
  try {
    await lote(libro, [{ duplicateSheet: { sourceSheetId: 0, insertSheetIndex: 1, newSheetName: nombre } }]);
    return true;
  } catch (err) {
    // Si dos llamadas llegan juntas, solo una la crea; la otra no hace nada.
    if (/already exists/i.test(err.message)) return false;
    throw err;
  }
}

function fechas(ahora) {
  const hoy = horaEcuador(ahora);
  const idx = hoy.getMonth();
  const anio = hoy.getFullYear();
  const idxPrev = idx === 0 ? 11 : idx - 1;
  const anioPrev = idx === 0 ? anio - 1 : anio;
  return {
    hoja_nueva: `${MESES[idx]} ${anio}`,
    hoja_anterior: `${MESES[idxPrev]} ${anioPrev}`,
    fecha_fila: `1/${idx + 1}/${anio}`,
  };
}

// Inventario: copia la plantilla, apunta «config» al mes nuevo y escribe la
// fila «Mes anterior» con los saldos con que cerró el mes pasado.
export async function abrirMesInventario(ahora = new Date()) {
  const f = fechas(ahora);
  const creada = await duplicarPlantilla(libros.inventario(), f.hoja_nueva);

  // «config»!B2 dice qué hoja leen los envíos para buscar el saldo anterior.
  const config = await leer(libros.inventario(), 'config', 'A1:B3');
  if ((config[1] || [])[1] !== f.hoja_nueva) {
    await escribir(libros.inventario(), 'config', 'B2', [[f.hoja_nueva]]);
  }
  if (!creada) return { creada: false, hoja: f.hoja_nueva };

  // n8n leía la hoja anterior solo hasta la columna Z y por eso lilium (AJ) y
  // verano (AV) arrancaban cada mes en 0. Corregido el 20/10/2026: se lee
  // entera. Si la hoja anterior no existe se arranca de cero, como antes.
  let filas = [];
  try {
    filas = comoObjetos(await leer(libros.inventario(), f.hoja_anterior, 'A:DJ'));
  } catch (err) {
    if (!(err instanceof HojaNoExiste)) throw err;
  }
  const s = extraerSaldosFinales(filas);

  await agregarFila(libros.inventario(), f.hoja_nueva, 1, 'AY', {
    FECHA: f.fecha_fila,
    OBSERVACION: 'Mes anterior',
    AYUDANTE: 'BelkettBot',
    GIRASOLES: s.saldo_final_girasoles,
    INDIVIDUAL: s.saldo_final_rosas,
    LILIUM: s.saldo_final_lilium,
    VERANO: s.saldo_final_verano,
  });
  await avisar(chats.inventario(), plantillas.hojaInventario);
  return { creada: true, hoja: f.hoja_nueva, saldos: s };
}

// Facturas: solo copia la plantilla y avisa.
export async function abrirMesFacturas(ahora = new Date()) {
  const hoy = horaEcuador(ahora);
  const mes = MESES[hoy.getMonth()];
  const anio = hoy.getFullYear();
  const creada = await duplicarPlantilla(libros.facturas(), `${mes} ${anio}`);
  if (creada) {
    await avisar(chats.facturas(), rellenar(plantillas.hojaFacturas, { factura: { mes, 'año': anio } }));
  }
  return { creada, hoja: `${mes} ${anio}` };
}
