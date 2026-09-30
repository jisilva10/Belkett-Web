# Guía Paso a Paso: Actualización de Nodos en n8n

> Los bloques de código de este archivo están **sincronizados con el workflow
> `Belkett Web` que está corriendo** (n8n id `xv5EFXvhMzUmUJ0s`). Si cambias un
> nodo en n8n, actualiza también este archivo — si se desincronizan, cualquiera
> que depure el sistema va a leer código que no es el que se está ejecutando.

---

## Incidente 30/09/2026 — "se queda en Enviando..." y después descuadra

**Qué pasó.** Entre 15:57 y 16:39 cuatro envíos (ejecuciones `4796`, `4797`,
`4800`, `4801`) se quedaron esperando a Google Sheets: la conexión no respondía
y n8n se rindió a los ~128 s con `The connection timed out` (en `Get row(s) in
sheet5` o en `Append row in Inventario del mes2`). Ninguno escribió su fila.
Ya había pasado el 27/09 (`4734`) y en Facturas el 30/09 00:29 (`4787`).

El webhook responde en modo `lastNode`, así que la web se quedaba en
"Enviando..." esos 2 minutos y, cuando n8n devolvía el error, mostraba igual
"¡Enviado!" porque no revisaba la respuesta. Mientras tanto se podía cambiar de
modo con los números puestos: la producción de Maribel (164/20/2/22) se reenvió
como **Recibo** (`4802`, cuadre −419) y el recibo de Roxana (`4799`) salió con
−203 porque el cierre con daño de las 16:03 nunca se registró. Las filas malas
se borraron a mano y el cierre se reenvió (`4804`, cuadre 0).

**Qué se corrigió** (web, `src/App.jsx` y `ModeToggle.jsx`):

1. Mientras envía, el formulario, el modo y las pestañas quedan bloqueados.
2. La web espera hasta 150 s (más que los ~130 s de n8n) y solo dice "¡Enviado!"
   si n8n contesta OK. Si no, sale "No se guardó" y los números quedan en
   pantalla para reenviar.
3. A los 12 s avisa "Está tardando más de lo normal, no cierres ni cambies nada".

El cuelgue con Google es intermitente y está del lado del servidor de n8n; esto
no lo evita, pero ya no puede pasar sin que se enteren.

---

## Incidente 17/08/2026 — el inventario se puso en cero

**Qué pasó.** A la 01:12:13 se registró el cierre correcto (ejecución `3637`):
40 paquetes + 12 rosas, 174 girasoles, 11 lilium, 348 verano. Saldos quedaron en
492 / 174 / 11 / 348.

63 segundos después, a la 01:13:16, llegó **otro cierre con todos los campos en
cero** (ejecución `3638`). `Obtener el ultimo Saldo` lo interpretó literalmente
como "dejé 0 flores de todo" y calculó `cuadre: -492`, `cuadre_girasoles: -174`,
`cuadre_lilium: -11`, `cuadre_verano: -348`. Como la columna `SALDOS` de la hoja
se calcula sumando el CUADRE, **todo el inventario quedó en 0**.

**Por qué el modal mostraba 0 y el kardex seguía calculando bien.** Los dos nodos
que leen el saldo lo hacían distinto:

- `Obtener el ultimo Saldo` usaba `f["SALDOS"] || f["Saldos"]`. Como `0` es
  *falsy*, el `||` lo descartaba y saltaba la fila en cero — por accidente eso
  protegió al kardex.
- `Buscar y Formatear Saldo1` (el que responde al modal admin) leía
  `f["SALDOS"]` directo, así que el `0` sí pasaba y el modal reportaba 0.

**Qué se corrigió** (ya aplicado en producción):

1. `Adaptador Web a Variables N8N` emitía la clave `dano_verano` pero
   `Obtener el ultimo Saldo` leía `danado_verano` → **el daño de flores de verano
   nunca se restaba** y reaparecía como descuadre (−108 y −13 el 16/08). Corregido
   a `danado_verano`.
2. `Obtener el ultimo Saldo`: se agregó el guard `cierreVacio`. Un cierre sin
   nada dejado, sin ventas, sin daño y sin entradas ya no calcula cuadre; deja el
   saldo intacto y marca la fila como `ENVIO VACIO IGNORADO`. Un cierre legítimo
   donde se vendió todo (dejo 0 pero hay ventas) **sí** se procesa normal.
3. Se reemplazó la lectura de saldos por la función `pick()`, que acepta el `0`
   como valor válido en ambos nodos.
4. `Buscar y Formatear Saldo1` ahora muestra el desglose físico real de las rosas
   ("492 unidades (40 paquetes + 12 sueltas)"), tomado del último conteo
   registrado — no una división teórica, que daría "41 paquetes".

En la web app (`src/App.jsx`) se agregó la validación que impide enviar el
formulario en ceros, que es lo que originó todo.

---

Abre cada uno de los siguientes nodos en tu lienzo de n8n y realiza los cambios que se indican a continuación.

---

## 1. Nodo: `Extraer Saldos Finales`
**Qué cambiar:** El código JavaScript.
**Paso a paso:**
1. Haz doble clic en el nodo `Extraer Saldos Finales`.
2. Borra todo el código que está en la caja de "JavaScript Code".
3. Copia y pega este nuevo código:

```javascript
// Obtenemos los datos del nodo de Google Sheets (Leer Hoja Mes Anterior)
const items = $input.all();

// Recuperamos las fechas del nodo PRIMERO
const fechas = $("Calculo Fechas (Actual y Anterior)").first().json;

// Si no hay datos, iniciamos en 0
if (items.length === 0 || items[0].json.error) {
  return [{
    saldo_final_rosas: 0,
    saldo_final_girasoles: 0,
    saldo_final_lilium: 0,
    saldo_final_verano: 0,
    hoja_nueva: fechas.hoja_nueva,
    fecha: fechas.fecha_fila,
    mensaje: "Iniciando mes desde cero (Hoja anterior vacía)"
  }];
}

const filas = items.map(i => i.json);

const COL_SALDO_ROSAS = "SALDOS";
const COL_SALDO_GIRASOLES = "SALDO GIRASOLES";
const COL_SALDO_LILIUM = "SALDO LILIUM";
const COL_SALDO_VERANO = "SALDO VERANO";

let saldoR = 0, saldoG = 0, saldoL = 0, saldoV = 0;
let foundR = false, foundG = false, foundL = false, foundV = false;

// Recorremos de abajo hacia arriba
for (let i = filas.length - 1; i >= 0; i--) {
  const f = filas[i];
  
  if (!foundR) {
    const s = f[COL_SALDO_ROSAS];
    if (s !== undefined && s !== "" && !isNaN(Number(s))) { saldoR = Number(s); foundR = true; }
  }
  
  if (!foundG) {
    const sG = f[COL_SALDO_GIRASOLES];
    if (sG !== undefined && sG !== "" && !isNaN(Number(sG))) { saldoG = Number(sG); foundG = true; }
  }
  
  if (!foundL) {
    const sL = f[COL_SALDO_LILIUM];
    if (sL !== undefined && sL !== "" && !isNaN(Number(sL))) { saldoL = Number(sL); foundL = true; }
  }
  
  if (!foundV) {
    const sV = f[COL_SALDO_VERANO];
    if (sV !== undefined && sV !== "" && !isNaN(Number(sV))) { saldoV = Number(sV); foundV = true; }
  }
  
  if (foundR && foundG && foundL && foundV) break;
}

return [{
  saldo_final_rosas: saldoR, 
  saldo_final_girasoles: saldoG,
  saldo_final_lilium: saldoL,
  saldo_final_verano: saldoV,
  hoja_nueva: fechas.hoja_nueva,
  fecha: fechas.fecha_fila,
  mensaje: "Saldos recuperados correctamente"
}];
```

---

## 2. Nodo: `Escribir Saldo Inicial1` (Google Sheets)
**Qué cambiar:** Añadir nuevas columnas al mapeo de escritura.
**Paso a paso:**
1. Haz doble clic en el nodo `Escribir Saldo Inicial1`.
2. Ve a la sección inferior de **Values to Send** (donde mapeas las columnas).
3. Haz clic en **Add Field** y escribe `LILIUM`. En su caja de valor (Value), pega exactamente esto: 
   `={{ $json.saldo_final_lilium }}`
4. Haz clic nuevamente en **Add Field** y escribe `VERANO`. En su caja de valor, pega exactamente esto: 
   `={{ $json.saldo_final_verano }}`

---

## 3. Nodo: `Adaptador Web a Variables N8N`
**Qué cambiar:** El código JavaScript.
**Paso a paso:**
1. Haz doble clic en el nodo.
2. Borra todo el código JavaScript actual.
3. Pega este nuevo código:

```javascript
// =============================================
// ADAPTADOR: WEB APP -> VARIABLES INTERNAS
// =============================================
const body = $input.first().json.body || $input.first().json;

// 1. PREPARAR FECHA Y HOJA (ECUADOR 🇪🇨)
const serverTime = new Date();
const ecuadorTime = new Date(serverTime.toLocaleString("en-US", {timeZone: "America/Guayaquil"}));
const dia = String(ecuadorTime.getDate()).padStart(2, "0");
const mes = String(ecuadorTime.getMonth() + 1).padStart(2, "0");
const anio = ecuadorTime.getFullYear();
const fechaStr = `${dia}/${mes}/${anio}`;

const nombresMeses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const nombreMes = nombresMeses[ecuadorTime.getMonth()];
const hojaActual = `${nombreMes} ${anio}`;

// 2. INICIALIZAR VARIABLES
let recibe_paq=0, recibe_ind=0, recibe_giras=0, recibe_lilium=0, recibe_verano=0;
let prod_paq=0, prod_ind=0, prod_giras=0, prod_lilium=0, prod_verano=0;
let venta_paq=0, venta_ind=0, venta_giras=0, venta_lilium=0, venta_verano=0;
let dano_paq=0, dano_ind=0, dano_giras=0, dano_lilium=0, dano_verano=0;
let seguidor_ind=0;
let deja_paq=0, deja_ind=0, deja_giras=0, deja_lilium=0, deja_verano=0;

const modoRaw = body.modo || "";
const modo = modoRaw.toLowerCase();
const datos = body.datos || {};
let es_compra_real = modo.includes('ingreso');

// ========================================================
// 3. MAPEO INTELIGENTE (Mutuamente Excluyente)
// ========================================================

// --- A) EL CAMPO "PRINCIPAL" (Solo va a un lugar) ---
if (modo.includes('ingreso') || modo.includes('recibo')) {
    if (datos.paquetes_rosas) recibe_paq = Number(datos.paquetes_rosas.principal) || 0;
    if (datos.rosas_individuales) recibe_ind = Number(datos.rosas_individuales.principal) || 0;
    if (datos.girasoles) recibe_giras = Number(datos.girasoles.principal) || 0;
    if (datos.lilium) recibe_lilium = Number(datos.lilium.principal) || 0;
    if (datos.flores_verano) recibe_verano = Number(datos.flores_verano.principal) || 0;
} 
else if (modo.includes('cierre') || modo.includes('dejo')) {
    if (datos.paquetes_rosas) deja_paq = Number(datos.paquetes_rosas.principal) || 0;
    if (datos.rosas_individuales) deja_ind = Number(datos.rosas_individuales.principal) || 0;
    if (datos.girasoles) deja_giras = Number(datos.girasoles.principal) || 0;
    if (datos.lilium) deja_lilium = Number(datos.lilium.principal) || 0;
    if (datos.flores_verano) deja_verano = Number(datos.flores_verano.principal) || 0;
}
else if (modo.includes('produccion')) {
    if (datos.paquetes_rosas) prod_paq = Number(datos.paquetes_rosas.principal) || 0;
    if (datos.rosas_individuales) prod_ind = Number(datos.rosas_individuales.principal) || 0;
    if (datos.girasoles) prod_giras = Number(datos.girasoles.principal) || 0;
    if (datos.lilium) prod_lilium = Number(datos.lilium.principal) || 0;
    if (datos.flores_verano) prod_verano = Number(datos.flores_verano.principal) || 0;
}

// --- B) LOS CAMPOS EXTRAS (Siempre se mapean si existen) ---
if (datos.paquetes_rosas) {
    venta_paq = Number(datos.paquetes_rosas.vendido) || 0;
    dano_paq = Number(datos.paquetes_rosas.danado) || 0;
}
if (datos.rosas_individuales) {
    venta_ind = Number(datos.rosas_individuales.vendido) || 0;
    dano_ind = Number(datos.rosas_individuales.danado) || 0;
    seguidor_ind = Number(datos.rosas_individuales.seguidor) || 0;
}
if (datos.girasoles) {
    venta_giras = Number(datos.girasoles.vendido) || 0;
    dano_giras = Number(datos.girasoles.danado) || 0;
}
if (datos.lilium) {
    venta_lilium = Number(datos.lilium.vendido) || 0;
    dano_lilium = Number(datos.lilium.danado) || 0;
}
if (datos.flores_verano) {
    venta_verano = Number(datos.flores_verano.vendido) || 0;
    dano_verano = Number(datos.flores_verano.danado) || 0;
}

// 4. OBSERVACIÓN
function capitalizar(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
let observacionFinal = capitalizar(modoRaw);
if (body.observaciones) { observacionFinal += ` - ${body.observaciones}`; }

return [{
    json: {
        chat_id: "1556465374",
        fecha: fechaStr,
        hoja_actual: hojaActual,
        ayudante: body.responsable,
        tipo: modoRaw,
        observacion: observacionFinal,
        es_ingreso_nuevo: es_compra_real,
        
        recibe_paquetes: recibe_paq, recibe_individual: recibe_ind, recibe_girasoles: recibe_giras, recibe_lilium: recibe_lilium, recibe_verano: recibe_verano,
        produccion_paquetes: prod_paq, produccion_individual: prod_ind, produccion_girasoles: prod_giras, produccion_lilium: prod_lilium, produccion_verano: prod_verano,
        venta_paquetes: venta_paq, venta_individual: venta_ind, venta_girasoles: venta_giras, venta_lilium: venta_lilium, venta_verano: venta_verano,
        danado_paquetes: dano_paq, danado_individual: dano_ind, danado_girasoles: dano_giras, danado_lilium: dano_lilium, danado_verano: dano_verano,
        seguidor_individual: seguidor_ind,
        deja_paquetes: deja_paq, deja_individual: deja_ind, deja_girasoles: deja_giras, deja_lilium: deja_lilium, deja_verano: deja_verano
    }
}]
```

---

## 4. Nodo: `Obtener el ultimo Saldo`
**Qué cambiar:** El código JavaScript.
**Paso a paso:**
1. Haz doble clic en el nodo.
2. Borra todo el código.
3. Pega este nuevo código:

```javascript
// =============================================
// CONFIGURACIÓN Y LECTURA DE DATOS
// =============================================
const NODO_SHEETS = "Code in JavaScript10"; 

// Devuelve el primer valor presente entre varias claves posibles.
// OJO: no usar `a || b` para leer saldos, porque el 0 es falsy y se salta.
function pick(f, ...keys) {
    for (const k of keys) {
        const v = f[k];
        if (v !== undefined && v !== null && v !== "") return v;
    }
    return undefined;
}

const NODO_ORIGEN = "Adaptador Web a Variables N8N"; 

const COL_SALDOS_ROSAS = "SALDOS";
const COL_PAQ_DEJADOS = "PAQUETES DEJADOS";
const COL_ROSAS_DEJADAS = "ROSAS DEJADAS";
const COL_SALDO_GIRASOLES = "SALDO GIRASOLES";
const COL_DEJO_GIRASOLES = "GIRASOLES DEJADOS";
const COL_SALDO_LILIUM = "SALDO LILIUM";
const COL_DEJO_LILIUM = "LILIUM DEJADOS";
const COL_SALDO_VERANO = "SALDO VERANO";
const COL_DEJO_VERANO = "VERANO DEJADOS";

// 1. OBTENER DATOS DE ENTRADA
let datosInput = {};
try {
    datosInput = $(NODO_ORIGEN).first().json;
} catch (e) {
    throw new Error("❌ Error: No se pudo leer del nodo '" + NODO_ORIGEN + "'.");
}

const items = $(NODO_SHEETS).all(); 
const filas = items.map(i => i.json); 

// 2. BUSCAR SALDOS ANTERIORES
let saldoAnteriorRosas = 0, ultimoDejoPaq = 0, ultimoDejoInd = 0;
let saldoAnteriorGiras = 0, ultimoDejoGiras = 0;
let saldoAnteriorLilium = 0, ultimoDejoLilium = 0;
let saldoAnteriorVerano = 0, ultimoDejoVerano = 0;

let foundSaldoRosas = false, foundDejoRosas = false;
let foundSaldoGiras = false, foundDejoGiras = false;
let foundSaldoLilium = false, foundDejoLilium = false;
let foundSaldoVerano = false, foundDejoVerano = false;

for (let i = filas.length - 1; i >= 0; i--) {
    const f = filas[i];
    if (!foundSaldoRosas) { 
        const s = pick(f, COL_SALDOS_ROSAS, "Saldos"); 
        if (s != null && s !== "" && !isNaN(Number(s))) { saldoAnteriorRosas = Number(s); foundSaldoRosas = true; } 
    }
    if (!foundDejoRosas) { 
        const p = f[COL_PAQ_DEJADOS], r = f[COL_ROSAS_DEJADAS]; 
        if ((p != null && p !== "") || (r != null && r !== "")) { ultimoDejoPaq = Number(p)||0; ultimoDejoInd = Number(r)||0; foundDejoRosas = true; } 
    }
    if (!foundSaldoGiras) { 
        const sG = pick(f, COL_SALDO_GIRASOLES, "Saldo Girasoles"); 
        if (sG != null && sG !== "" && !isNaN(Number(sG))) { saldoAnteriorGiras = Number(sG); foundSaldoGiras = true; } 
    }
    if (!foundDejoGiras) { 
        const dG = f[COL_DEJO_GIRASOLES] || f["Girasoles Dejados"]; 
        if (dG != null && dG !== "") { ultimoDejoGiras = Number(dG)||0; foundDejoGiras = true; } 
    }
    if (!foundSaldoLilium) { 
        const sL = pick(f, COL_SALDO_LILIUM, "Saldo Lilium"); 
        if (sL != null && sL !== "" && !isNaN(Number(sL))) { saldoAnteriorLilium = Number(sL); foundSaldoLilium = true; } 
    }
    if (!foundDejoLilium) { 
        const dL = f[COL_DEJO_LILIUM] || f["Lilium Dejados"]; 
        if (dL != null && dL !== "") { ultimoDejoLilium = Number(dL)||0; foundDejoLilium = true; } 
    }
    if (!foundSaldoVerano) { 
        const sV = pick(f, COL_SALDO_VERANO, "Saldo Verano"); 
        if (sV != null && sV !== "" && !isNaN(Number(sV))) { saldoAnteriorVerano = Number(sV); foundSaldoVerano = true; } 
    }
    if (!foundDejoVerano) { 
        const dV = f[COL_DEJO_VERANO] || f["Verano Dejados"]; 
        if (dV != null && dV !== "") { ultimoDejoVerano = Number(dV)||0; foundDejoVerano = true; } 
    }

    if (foundSaldoRosas && foundDejoRosas && foundSaldoGiras && foundDejoGiras && foundSaldoLilium && foundDejoLilium && foundSaldoVerano && foundDejoVerano) break;
}

// 3. EXTRACCIÓN Y CÁLCULOS
const tipoRaw = (datosInput.tipo || "").toLowerCase();

const inPaq = Number(datosInput.recibe_paquetes)||0;
const inInd = Number(datosInput.recibe_individual)||0;
const inGiras = Number(datosInput.recibe_girasoles)||0;
const inLilium = Number(datosInput.recibe_lilium)||0;
const inVerano = Number(datosInput.recibe_verano)||0;
const hayEntrada = (inPaq > 0 || inInd > 0 || inGiras > 0 || inLilium > 0 || inVerano > 0);

const ventaR = ((Number(datosInput.venta_paquetes)||0)*12) + (Number(datosInput.venta_individual)||0);
const danoR  = ((Number(datosInput.danado_paquetes)||0)*12) + (Number(datosInput.danado_individual)||0);
const seguidorR = (Number(datosInput.seguidor_individual)||0);
const prodR  = ((Number(datosInput.produccion_paquetes)||0)*12) + (Number(datosInput.produccion_individual)||0);
const prodPuraR = prodR; 
const totalSalidasR = ventaR + danoR + seguidorR + prodPuraR;

const ventaG = Number(datosInput.venta_girasoles)||0;
const danoG  = Number(datosInput.danado_girasoles)||0;
const seguidorG = Number(datosInput.seguidor_girasoles)||0;
const prodPuraG  = Number(datosInput.produccion_girasoles)||0;
const totalSalidasG = ventaG + danoG + seguidorG + prodPuraG;

const ventaL = Number(datosInput.venta_lilium)||0;
const danoL  = Number(datosInput.danado_lilium)||0;
const prodPuraL  = Number(datosInput.produccion_lilium)||0;
const totalSalidasL = ventaL + danoL + prodPuraL;

const ventaV = Number(datosInput.venta_verano)||0;
const danoV  = Number(datosInput.danado_verano)||0;
const prodPuraV  = Number(datosInput.produccion_verano)||0;
const totalSalidasV = ventaV + danoV + prodPuraV;

const dejoPaq = Number(datosInput.deja_paquetes)||0;
const dejoInd = Number(datosInput.deja_individual)||0;
const dejoGiras = Number(datosInput.deja_girasoles)||0;
const dejoLilium = Number(datosInput.deja_lilium)||0;
const dejoVerano = Number(datosInput.deja_verano)||0;
const hayDejo = tipoRaw.includes('dejo') || tipoRaw.includes('cierre');

let excelPaq=0, excelInd=0, excelGiras=0, excelLilium=0, excelVerano=0;
let outCuadreRosas=0, outCuadreGiras=0, outCuadreLilium=0, outCuadreVerano=0;

if (hayEntrada) {
    let esIngreso = datosInput.es_ingreso_nuevo === true;
    if (tipoRaw.includes("recibo") || tipoRaw.includes("turno")) esIngreso = false;
    if (esIngreso) { excelPaq = inPaq; excelInd = inInd; excelGiras = inGiras; excelLilium = inLilium; excelVerano = inVerano; } 
    else { 
        if (foundSaldoRosas || saldoAnteriorRosas > 0) outCuadreRosas = ((inPaq * 12) + inInd) - saldoAnteriorRosas; 
        if (foundSaldoGiras || saldoAnteriorGiras > 0) outCuadreGiras = inGiras - saldoAnteriorGiras; 
        if (foundSaldoLilium || saldoAnteriorLilium > 0) outCuadreLilium = inLilium - saldoAnteriorLilium; 
        if (foundSaldoVerano || saldoAnteriorVerano > 0) outCuadreVerano = inVerano - saldoAnteriorVerano; 
    }
}

// GUARD: un cierre con TODO en cero (formulario vacio / envio duplicado) no es
// un conteo real. Si se deja pasar, el cuadre negativo pone el inventario en 0.
const totalDejo = dejoPaq + dejoInd + dejoGiras + dejoLilium + dejoVerano;
const totalSalidas = totalSalidasR + totalSalidasG + totalSalidasL + totalSalidasV;
const cierreVacio = hayDejo && totalDejo === 0 && totalSalidas === 0 && !hayEntrada;

if (hayDejo && !cierreVacio) {
    const teoricoR = saldoAnteriorRosas + ((excelPaq*12) + excelInd) - totalSalidasR;
    outCuadreRosas = ((dejoPaq * 12) + dejoInd) - teoricoR;
    const teoricoG = saldoAnteriorGiras + excelGiras - totalSalidasG;
    outCuadreGiras = dejoGiras - teoricoG;
    const teoricoL = saldoAnteriorLilium + excelLilium - totalSalidasL;
    outCuadreLilium = dejoLilium - teoricoL;
    const teoricoV = saldoAnteriorVerano + excelVerano - totalSalidasV;
    outCuadreVerano = dejoVerano - teoricoV;
}

const alerta = Math.abs(outCuadreRosas) > 0.1 || Math.abs(outCuadreGiras) > 0.1 || Math.abs(outCuadreLilium) > 0.1 || Math.abs(outCuadreVerano) > 0.1;

// --- AJUSTE FECHA Y HOJA ---
const ecuadorTime = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Guayaquil"}));
const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const hojaEnPalabras = `${meses[ecuadorTime.getMonth()]} ${ecuadorTime.getFullYear()}`;

// =============================================
// 4. SALIDA (VARIABLES CON NOMBRES PARA APPEND)
// =============================================
return [{
    json: {
        chat_id: datosInput.chat_id,
        hoja_actual: hojaEnPalabras,
        fecha: datosInput.fecha,
        observacion: cierreVacio
            ? `${datosInput.observacion} - ENVIO VACIO IGNORADO (no se toco el saldo)`
            : datosInput.observacion,
        envio_vacio: cierreVacio,
        ayudante: datosInput.ayudante,
        
        // Entradas Excel
        excel_individual: excelInd,
        excel_paquetes: excelPaq,
        excel_girasoles: excelGiras,
        excel_lilium: excelLilium,
        excel_verano: excelVerano,
        
        // Salidas Desglosadas
        col_produccion_pura_r: prodPuraR, 
        col_produccion_pura_g: prodPuraG,
        col_produccion_pura_l: prodPuraL,
        col_produccion_pura_v: prodPuraV,

        col_venta_r: ventaR, col_venta_g: ventaG, col_venta_l: ventaL, col_venta_v: ventaV,
        col_dano_r: danoR, col_dano_g: danoG, col_dano_l: danoL, col_dano_v: danoV,
        col_seguidor_r: seguidorR,
        
        // Físico Dejado
        paquetes_dejados: dejoPaq,
        rosas_dejadas: dejoInd,
        girasoles_dejados: dejoGiras,
        lilium_dejados: dejoLilium,
        verano_dejados: dejoVerano,
        
        // Resultados
        cuadre: outCuadreRosas,
        cuadre_girasoles: outCuadreGiras,
        cuadre_lilium: outCuadreLilium,
        cuadre_verano: outCuadreVerano,
        hay_descuadre: alerta,
        
        // Para el mensaje de éxito
        msg_paquetes: inPaq,
        msg_individual: inInd,
        msg_girasoles: inGiras,
        msg_lilium: inLilium,
        msg_verano: inVerano,
        produccion_salida: totalSalidasR,
        produccion_girasoles_salida: totalSalidasG,
        produccion_lilium_salida: totalSalidasL,
        produccion_verano_salida: totalSalidasV
    }
}]
```

---

## 5. Nodo: `Append row in Inventario del mes2` (Google Sheets)
**Qué cambiar:** Añadir 12 nuevas columnas en el mapeo de escritura (6 para Lilium y 6 para Verano).
**Paso a paso:**
1. Haz doble clic en el nodo.
2. Ve a la sección **Values to Send** y ve añadiendo estos 12 campos (usa "Add Field" por cada uno):

- Nombre: `LILIUM` — Valor: `={{ $json.excel_lilium }}`
- Nombre: `VENTA L.` — Valor: `={{ $json.col_venta_l }}`
- Nombre: `DAÑO L.` — Valor: `={{ $json.col_dano_l }}`
- Nombre: `PRODUCCION L.` — Valor: `={{ $json.col_produccion_pura_l }}`
- Nombre: `LILIUM DEJADOS` — Valor: `={{ $json.lilium_dejados }}`
- Nombre: `CUADRE LILIUM` — Valor: `={{ $json.cuadre_lilium }}`

- Nombre: `VERANO` — Valor: `={{ $json.excel_verano }}`
- Nombre: `VENTA V.` — Valor: `={{ $json.col_venta_v }}`
- Nombre: `DAÑO V.` — Valor: `={{ $json.col_dano_v }}`
- Nombre: `PRODUCCION V.` — Valor: `={{ $json.col_produccion_pura_v }}`
- Nombre: `VERANO DEJADOS` — Valor: `={{ $json.verano_dejados }}`
- Nombre: `CUADRE VERANO` — Valor: `={{ $json.cuadre_verano }}`

---

## 6. Nodo: `Text Marco` (Mensaje de Telegram de Éxito)
**Qué cambiar:** Añadir texto al final del mensaje.
**Paso a paso:**
1. Haz doble clic en el nodo.
2. Ve a la caja de texto (Text).
3. **Alerta**: No borres lo que ya tienes. Simplemente, ve al final de tu texto actual (después del bloque de girasoles), da un salto de línea y **pega esto**:

```text
━━━━━━━━━━━━━━━━━━ 
🌸REPORTE DE LILIUM
━━━━━━━━━━━━━━━━━━ 
📥Entrada: {{ $('Obtener el ultimo Saldo').item.json.msg_lilium }} unds 
📤Produccion: {{ $json['PRODUCCION L.'] }}
📤Venta: {{ $json['VENTA L.'] }}
📤Daño: {{ $json['DAÑO L.'] }}
📦Dejo: {{ $('Obtener el ultimo Saldo').item.json.lilium_dejados }} unds
━━━━━━━━━━━━━━━━━━ 
🌺REPORTE FLORES VERANO
━━━━━━━━━━━━━━━━━━ 
📥Entrada: {{ $('Obtener el ultimo Saldo').item.json.msg_verano }} unds 
📤Produccion: {{ $json['PRODUCCION V.'] }}
📤Venta: {{ $json['VENTA V.'] }}
📤Daño: {{ $json['DAÑO V.'] }}
📦Dejo: {{ $('Obtener el ultimo Saldo').item.json.verano_dejados }} unds
```

---

## 7. Nodo: `Send a text message` (Alerta Descuadre en Telegram)
**Qué cambiar:** El mensaje de alerta para que muestre si Lilium o Verano descuadraron.
**Paso a paso:**
1. Haz doble clic en el nodo.
2. Borra tu texto actual y **reemplázalo** por esto:

```text
=🚨 <b>ALERTA DE DESCUADRE</b> 🚨

📅 <b>Fecha:</b> {{ $('Obtener el ultimo Saldo').item.json.fecha }}
👤 <b>Ayudante:</b> {{ $('Obtener el ultimo Saldo').item.json.ayudante }}
📝 <b>Acción:</b>{{ $('Obtener el ultimo Saldo').item.json.observacion }} 

------------------------------------
🌹 <b>ROSAS:</b> {{ $json.CUADRE }}

🌻 <b>GIRASOLES:</b> {{ $json['CUADRE GIRASOLES'] }}

🌸 <b>LILIUM:</b> {{ $json['CUADRE LILIUM'] }}

🌺 <b>VERANO:</b> {{ $json['CUADRE VERANO'] }}

------------------------------------

⚠️ <i>Por favor revisar inventario físico.</i>
```

---

## 8. Nodo: `Buscar y Formatear Saldo1` (Webhook de Consulta)
**Qué cambiar:** El código JavaScript.
**Paso a paso:**
1. Haz doble clic en el nodo.
2. Borra el código actual y **pega esto**:

```javascript
// 1. OBTENER DATOS
const items = $input.all();
const filas = items.map(i => i.json);

// Recuperamos qué producto pidió el usuario desde el nodo adaptador
let producto = "ambos";
try {
    producto = $('Adaptador Consulta Web').first().json.producto;
} catch (e) {}

// 2. BUSCAR ÚLTIMOS SALDOS
let saldoRosas = 0, saldoGiras = 0, saldoLilium = 0, saldoVerano = 0;
let foundR = false, foundG = false, foundL = false, foundV = false;

for (let i = filas.length - 1; i >= 0; i--) {
    const f = filas[i];
    
    if (!foundR) {
        const s = f["SALDOS"];
        if (s != null && s !== "" && !isNaN(Number(s))) {
            saldoRosas = Number(s);
            foundR = true;
        }
    }
    
    if (!foundG) {
        const sG = f["SALDO GIRASOLES"];
        if (sG != null && sG !== "" && !isNaN(Number(sG))) {
            saldoGiras = Number(sG);
            foundG = true;
        }
    }

    if (!foundL) {
        const sL = f["SALDO LILIUM"];
        if (sL != null && sL !== "" && !isNaN(Number(sL))) {
            saldoLilium = Number(sL);
            foundL = true;
        }
    }

    if (!foundV) {
        const sV = f["SALDO VERANO"];
        if (sV != null && sV !== "" && !isNaN(Number(sV))) {
            saldoVerano = Number(sV);
            foundV = true;
        }
    }
    
    if (foundR && foundG && foundL && foundV) break;
}

// 3. GENERAR RESPUESTA "BONITA" PARA LA WEB APP
let titulo = "";
let cuerpo = "";

// Las rosas se guardan en unidades sueltas (1 paquete = 12), pero fisicamente
// estan en paquetes + sueltas. Mostramos el ultimo conteo REAL registrado en el
// cierre, no una division teorica: 492 unidades son "40 paq + 12", no "41 paq".
let ultPaq = 0, ultSueltas = 0, foundConteo = false;
for (let i = filas.length - 1; i >= 0 && !foundConteo; i--) {
    const p = Number(filas[i]["PAQUETES DEJADOS"]) || 0;
    const r = Number(filas[i]["ROSAS DEJADAS"]) || 0;
    if (p > 0 || r > 0) { ultPaq = p; ultSueltas = r; foundConteo = true; }
}
const desgloseRosas = (foundConteo && (ultPaq * 12 + ultSueltas) === saldoRosas)
    ? `${ultPaq} paquetes + ${ultSueltas} sueltas`
    : `${Math.floor(saldoRosas / 12)} paq + ${saldoRosas % 12} aprox.`;

if (producto === "rosas") {
    titulo = "🌹 Saldo de Rosas";
    cuerpo = `Actualmente quedan <b>${saldoRosas}</b> unidades (${desgloseRosas}).`;
} else if (producto === "girasoles") {
    titulo = "🌻 Saldo de Girasoles";
    cuerpo = `Actualmente quedan <b>${saldoGiras}</b> unidades en inventario.`;
} else if (producto === "lilium") {
    titulo = "🌸 Saldo de Lilium";
    cuerpo = `Actualmente quedan <b>${saldoLilium}</b> unidades en inventario.`;
} else if (producto === "verano") {
    titulo = "🌺 Saldo de Flores de Verano";
    cuerpo = `Actualmente quedan <b>${saldoVerano}</b> unidades en inventario.`;
} else {
    titulo = "📊 Reporte General de Saldos";
    cuerpo = `🌹 Rosas: <b>${saldoRosas}</b> unidades (${desgloseRosas})<br>🌻 Girasoles: <b>${saldoGiras}</b> unidades<br>🌸 Lilium: <b>${saldoLilium}</b> unidades<br>🌺 Verano: <b>${saldoVerano}</b> unidades`;
}

return [{ 
    json: { 
        titulo: titulo,
        mensaje: cuerpo,
        valorRosas: saldoRosas,
        valorGiras: saldoGiras,
        valorLilium: saldoLilium,
        valorVerano: saldoVerano
    } 
}]
```
