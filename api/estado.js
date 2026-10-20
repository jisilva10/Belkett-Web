// GET /api/estado — dice a qué libros y a qué chats apuntan las variables de
// este entorno, por su nombre, sin escribir nada y sin mostrar llaves. En la
// prueba (Preview) tiene que decir «PRUEBA migración…» y «José»; en producción
// «Inventario Belkett», «Facturas Belkett» y los dos grupos. Las variables de
// Vercel no se pueden leer una vez guardadas: esta es la forma de comprobarlas.
import { titulo } from './_lib/google.js';
import { libros, chats } from './_lib/config.js';

async function nombreDelChat(chatId) {
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getChat?chat_id=${encodeURIComponent(chatId)}`);
  const json = await res.json();
  return json.ok ? (json.result.title || json.result.first_name) : `error: ${json.description}`;
}

export default async function handler(req, res) {
  const intentar = (f) => f().catch((err) => `error: ${err.message}`);
  res.status(200).json({
    entorno: process.env.VERCEL_ENV || 'local',
    libroInventario: await intentar(() => titulo(libros.inventario())),
    libroFacturas: await intentar(() => titulo(libros.facturas())),
    chatInventario: await intentar(() => nombreDelChat(chats.inventario())),
    chatFacturas: await intentar(() => nombreDelChat(chats.facturas())),
  });
}
