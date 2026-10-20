// Apertura de mes de los dos libros (antes: los «Cron Mensual» de n8n).
// Se puede llamar las veces que sea: solo hace algo si la hoja del mes no
// existe. La llaman el cron diario y también el primer envío del mes, por si
// las chicas mandan antes de que corra el cron (el cierre de las 00:30).
import { hojas, lote, leer, comoObjetos, escribir, agregarFila, borrarHoja, HojaNoExiste } from './google.js';
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

// Inventario: copia la plantilla y escribe la fila «Mes anterior» con los
// saldos con que cerró el mes pasado.
export async function abrirMesInventario(ahora = new Date()) {
  const f = fechas(ahora);
  const creada = await duplicarPlantilla(libros.inventario(), f.hoja_nueva);
  let saldos;
  if (creada) {
    try {
      // n8n leía la hoja anterior solo hasta la columna Z y por eso lilium
      // (AJ) y verano (AV) arrancaban cada mes en 0. Corregido el 20/10/2026:
      // se lee entera. Si la hoja anterior no existe se arranca de cero.
      let filas = [];
      try {
        filas = comoObjetos(await leer(libros.inventario(), f.hoja_anterior));
      } catch (err) {
        if (!(err instanceof HojaNoExiste)) throw err;
      }
      saldos = extraerSaldosFinales(filas);
      await agregarFila(libros.inventario(), f.hoja_nueva, 1, 'AY', {
        FECHA: f.fecha_fila,
        OBSERVACION: 'Mes anterior',
        AYUDANTE: 'BelkettBot',
        GIRASOLES: saldos.saldo_final_girasoles,
        INDIVIDUAL: saldos.saldo_final_rosas,
        LILIUM: saldos.saldo_final_lilium,
        VERANO: saldos.saldo_final_verano,
      });
    } catch (err) {
      // Un mes sin su fila «Mes anterior» arrancaría en cero. Se borra la hoja
      // recién creada (solo tiene la plantilla) para que el próximo intento,
      // del cron o del siguiente envío, la haga completa.
      await borrarHoja(libros.inventario(), f.hoja_nueva).catch(() => {});
      throw err;
    }
    await avisar(chats.inventario(), plantillas.hojaInventario);
  }
  const config = await apuntarConfig(f.hoja_nueva);
  return { creada, hoja: f.hoja_nueva, saldos, config };
}

// «config»!B2 era donde n8n leía qué hoja usar. La web ya no lo necesita (lee
// la hoja del mes en hora de Quito), pero se mantiene al día por si se vuelve
// a n8n. La pestaña está protegida y solo la puede editar el dueño: si no se
// puede, se anota y se sigue.
async function apuntarConfig(hoja) {
  try {
    const config = await leer(libros.inventario(), 'config', 'A1:B3');
    if ((config[1] || [])[1] === hoja) return 'al día';
    await escribir(libros.inventario(), 'config', 'B2', [[hoja]]);
    return 'actualizada';
  } catch (err) {
    console.warn('config:', err.message);
    return `sin cambiar (${err.message})`;
  }
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
