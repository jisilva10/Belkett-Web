// Mensajes de Telegram. Las plantillas son las de n8n tal cual; aquí solo se
// resuelven sus {{ expresiones }} con los mismos datos que tenía cada nodo.

// n8n mandaba Markdown cuando el nodo no decía nada (por eso las facturas
// llegan con negritas). Si Telegram no puede leer el formato (un nombre con
// un «_» suelto, por ejemplo) se reenvía como texto plano: mejor un mensaje
// sin negritas que ninguno.
export async function enviar(chatId, texto, parseMode = 'Markdown') {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('Falta la variable TELEGRAM_BOT_TOKEN');
  const mandar = async (modo) => {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: texto, ...(modo ? { parse_mode: modo } : {}) }),
      signal: AbortSignal.timeout(15000),
    });
    return { ok: res.ok, json: await res.json().catch(() => ({})) };
  };
  let r = await mandar(parseMode);
  if (!r.ok && /parse entities/i.test(r.json.description || '')) r = await mandar(null);
  if (!r.ok) throw new Error(`Telegram: ${r.json.description || 'error'}`);
  return r.json.result;
}

// Igual que enviar(), pero un fallo de Telegram no tumba lo que ya se guardó:
// devuelve el error como texto (va al registro) o null si salió bien.
export async function avisar(chatId, texto, parseMode) {
  try {
    await enviar(chatId, texto, parseMode);
    return null;
  } catch (err) {
    console.error(err);
    return `Telegram ${chatId}: ${err.message}`;
  }
}

const texto = (v) => (v === undefined || v === null ? '' : String(v));

// Traduce las expresiones de n8n que usan estas plantillas. Si aparece una que
// no conoce, falla en las pruebas en vez de mandar un mensaje a medias.
export function rellenar(plantilla, { saldo = {}, fila = {}, factura = {} } = {}) {
  return plantilla.replace(/^=/, '').replace(/\{\{([\s\S]*?)\}\}/g, (_, crudo) => {
    const e = crudo.trim();
    let m;
    if (e === `$('Obtener el ultimo Saldo').item.json.observacion.includes('Recibo') ? "✅RECIBO DE TURNO REGISTRADO" : "✅REGISTRO GUARDADO CON ÉXITO"`) {
      return saldo.observacion.includes('Recibo') ? '✅RECIBO DE TURNO REGISTRADO' : '✅REGISTRO GUARDADO CON ÉXITO';
    }
    if ((m = e.match(/^\$\('Obtener el ultimo Saldo'\)\.item\.json\.(\w+)$/))) return texto(saldo[m[1]]);
    if ((m = e.match(/^\$json\.(\w+)$/)) || (m = e.match(/^\$json\['([^']+)'\]$/))) return texto(fila[m[1]]);
    if ((m = e.match(/^\$\('Code Meses \((?:Factura|Cron)\)'\)\.item\.json\.body\.(\w+)$/))) return texto(factura.body?.[m[1]]);
    if ((m = e.match(/^\$\('Code Meses \((?:Factura|Cron)\)'\)\.item\.json(?:\.([\wñ]+)|\['([^']+)'\])$/))) return texto(factura[m[1] || m[2]]);
    throw new Error(`Expresión de n8n sin traducir: ${e}`);
  });
}
