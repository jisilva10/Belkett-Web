// Qué libros y qué chats se usan. No hay valores por defecto a propósito: la
// versión de prueba (Preview en Vercel) apunta a copias de las hojas y a un
// chat de prueba, y si faltara una variable no queremos que escriba en las
// hojas reales sin querer.
function requerida(nombre) {
  const v = process.env[nombre];
  if (!v) throw new Error(`Falta la variable ${nombre}`);
  return v;
}

export const libros = {
  inventario: () => requerida('INVENTARIO_SHEET_ID'),
  facturas: () => requerida('FACTURAS_SHEET_ID'),
};

export const chats = {
  // Grupo de Marco: registros, descuadres y hoja del mes del inventario.
  inventario: () => requerida('TELEGRAM_CHAT_INVENTARIO'),
  // Grupo de facturas.
  facturas: () => requerida('TELEGRAM_CHAT_FACTURAS'),
};
