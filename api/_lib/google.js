// Acceso a Google Sheets con una cuenta de servicio, sin librerías: se firma el
// JWT con node:crypto y se habla con la API REST. Reemplaza a la credencial
// «Google Sheets Belkett» que vivía dentro de n8n.
import crypto from 'node:crypto';

const API = 'https://sheets.googleapis.com/v4/spreadsheets';

// El 30/09 Google dejó colgado a n8n ~128 s. Aquí cada llamada tiene su
// límite y las LECTURAS se reintentan; la escritura no, porque si se cortó a
// medias no sabemos si quedó la fila y reintentar podría duplicarla.
const LIMITE_LECTURA_MS = 15000;
const LIMITE_ESCRITURA_MS = 45000;

export class HojaNoExiste extends Error {}

let token = null;

function credenciales() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('Falta la variable GOOGLE_SERVICE_ACCOUNT_JSON');
  return JSON.parse(raw);
}

async function pedirToken() {
  if (token && token.vence > Date.now() + 60000) return token.valor;
  const { client_email, private_key } = credenciales();
  const ahora = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const sinFirmar = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({
    iss: client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: ahora,
    exp: ahora + 3600,
  });
  const firma = crypto.createSign('RSA-SHA256').update(sinFirmar).sign(private_key, 'base64url');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${sinFirmar}.${firma}`,
    }),
    signal: AbortSignal.timeout(LIMITE_LECTURA_MS),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Google no dio acceso: ${json.error_description || json.error}`);
  token = { valor: json.access_token, vence: Date.now() + json.expires_in * 1000 };
  return token.valor;
}

async function llamar(url, { method = 'GET', body, limite, intentos = 1 } = {}) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, {
        method,
        headers: {
          authorization: `Bearer ${await pedirToken()}`,
          ...(body ? { 'content-type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(limite),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) return json;
      const mensaje = json.error?.message || `HTTP ${res.status}`;
      // Pasa cuando la hoja del mes todavía no se ha creado.
      if (res.status === 400 && /Unable to parse range/i.test(mensaje)) throw new HojaNoExiste(mensaje);
      const err = new Error(`Google Sheets: ${mensaje}`);
      err.reintentable = res.status === 429 || res.status >= 500;
      throw err;
    } catch (err) {
      const reintentable = err.reintentable || err.name === 'TimeoutError' || err.name === 'TypeError';
      if (i >= intentos || !reintentable) throw err;
      await new Promise((r) => setTimeout(r, 800 * i));
    }
  }
}

const rango = (hoja, celdas) => encodeURIComponent(`'${hoja.replace(/'/g, "''")}'${celdas ? `!${celdas}` : ''}`);

// Lee valores. Por defecto igual que el nodo «Get row(s)» de n8n: números sin
// formato y fechas como texto.
export async function leer(libro, hoja, celdas, render = 'UNFORMATTED_VALUE') {
  const url = `${API}/${libro}/values/${rango(hoja, celdas)}` +
    `?valueRenderOption=${render}&dateTimeRenderOption=FORMATTED_STRING`;
  const json = await llamar(url, { limite: LIMITE_LECTURA_MS, intentos: 3 });
  return json.values || [];
}

// Convierte filas en objetos con el encabezado como clave, como hacía n8n:
// filaEncabezado es el índice (0 = primera fila del rango leído). Si dos
// columnas se llaman igual gana la de más a la derecha, igual que en n8n.
export function comoObjetos(valores, filaEncabezado = 0) {
  const encabezado = valores[filaEncabezado] || [];
  return valores.slice(filaEncabezado + 1).map((fila) => {
    const obj = {};
    encabezado.forEach((col, i) => {
      if (col === '' || col == null) return;
      obj[col] = fila[i] === undefined ? '' : fila[i];
    });
    return obj;
  });
}

// Agrega una fila igual que el nodo «Append row» de n8n: escribe justo debajo
// de la última fila con datos y suma una fila vacía al final de la grilla (por
// eso cada hoja del mes crece una fila por envío). No se usa el «append» de
// Google porque toma como tabla las filas vacías con formato y escribe al
// final de la grilla (fila 1278 en vez de 280 en la prueba del 20/10).
// Cada valor va bajo la columna cuyo encabezado se llama igual; si se repite
// (FECHA, OBSERVACION y AYUDANTE salen cuatro veces en el inventario) se llena
// en todas. Las columnas que no vienen quedan intactas: ahí están las
// fórmulas de saldo.
export async function agregarFila(libro, hoja, filaEncabezado, ultimaColumna, valores) {
  const contenido = await leer(libro, hoja, undefined, 'FORMATTED_VALUE');
  const encabezado = (contenido[filaEncabezado - 1] || []).slice(0, columnaANumero(ultimaColumna));
  const faltan = Object.keys(valores).filter((k) => !encabezado.includes(k));
  if (faltan.length) throw new Error(`La hoja «${hoja}» no tiene las columnas: ${faltan.join(', ')}`);
  const fila = encabezado.map((col) => (col in valores ? valores[col] : null));
  const siguiente = contenido.length + 1;

  const { sheetId } = (await hojas(libro)).find((h) => h.title === hoja);
  await lote(libro, [{ appendDimension: { sheetId, dimension: 'ROWS', length: 1 } }]);
  await escribir(libro, hoja, `A${siguiente}:${ultimaColumna}${siguiente}`, [fila]);
  return { fila: siguiente };
}

function columnaANumero(letras) {
  return [...letras].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);
}

export async function anexar(libro, hoja, celdas, filas, limite = LIMITE_ESCRITURA_MS) {
  const url = `${API}/${libro}/values/${rango(hoja, celdas)}:append` +
    '?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS';
  return llamar(url, { method: 'POST', body: { values: filas }, limite });
}

export async function escribir(libro, hoja, celdas, valores) {
  const url = `${API}/${libro}/values/${rango(hoja, celdas)}?valueInputOption=USER_ENTERED`;
  return llamar(url, { method: 'PUT', body: { values: valores }, limite: LIMITE_ESCRITURA_MS });
}

export async function hojas(libro) {
  const json = await llamar(`${API}/${libro}?fields=sheets.properties`, { limite: LIMITE_LECTURA_MS, intentos: 3 });
  return json.sheets.map((s) => s.properties);
}

export async function lote(libro, requests) {
  return llamar(`${API}/${libro}:batchUpdate`, { method: 'POST', body: { requests }, limite: LIMITE_ESCRITURA_MS });
}
