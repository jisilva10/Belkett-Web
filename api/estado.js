// GET /api/estado — solo en la versión de prueba (Preview). Dice a qué libros
// y a qué chats apuntan las variables, por su nombre, sin escribir nada y sin
// mostrar llaves. Sirve para confirmar que la prueba usa las COPIAS antes de
// tocar nada. En producción no existe.
import { titulo } from './_lib/google.js';
import { libros, chats } from './_lib/config.js';

async function nombreDelChat(chatId) {
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getChat?chat_id=${encodeURIComponent(chatId)}`);
  const json = await res.json();
  return json.ok ? (json.result.title || json.result.first_name) : `error: ${json.description}`;
}

export default async function handler(req, res) {
  if (process.env.VERCEL_ENV === 'production') return res.status(404).json({ ok: false });
  const intentar = (f) => f().catch((err) => `error: ${err.message}`);
  res.status(200).json({
    entorno: process.env.VERCEL_ENV || 'local',
    libroInventario: await intentar(() => titulo(libros.inventario())),
    libroFacturas: await intentar(() => titulo(libros.facturas())),
    chatInventario: await intentar(() => nombreDelChat(chats.inventario())),
    chatFacturas: await intentar(() => nombreDelChat(chats.facturas())),
  });
}
