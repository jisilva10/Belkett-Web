// Lo que en n8n era el historial de ejecuciones: cada llamada deja una fila en
// la pestaña oculta «registro web» del libro de inventario, con lo que llegó y
// lo que se calculó. Vercel gratis guarda sus logs muy poco tiempo; esto queda.
// Si el registro falla no se cae el envío: solo se avisa en el log de Vercel.
import { anexar, lote, HojaNoExiste } from './google.js';
import { libros } from './config.js';
import { sello } from './fechas.js';

const HOJA = 'registro web';

export async function registrar(ruta, estado, inicio, detalle) {
  const fila = [[sello(), ruta, estado, Date.now() - inicio, JSON.stringify(detalle).slice(0, 45000)]];
  try {
    await anexar(libros.inventario(), HOJA, 'A1:E', fila, 8000);
  } catch (err) {
    if (!(err instanceof HojaNoExiste)) return console.error('registro:', err.message);
    try {
      await lote(libros.inventario(), [{ addSheet: { properties: { title: HOJA, hidden: true } } }]);
      await anexar(libros.inventario(), HOJA, 'A1:E', [['fecha', 'ruta', 'estado', 'ms', 'detalle'], ...fila], 8000);
    } catch (err2) {
      console.error('registro:', err2.message);
    }
  }
}
