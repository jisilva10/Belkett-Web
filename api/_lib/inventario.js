// Lógica del inventario portada de los nodos de código del flujo «Belkett Web»
// de n8n (versión viva al 20/10/2026, la misma de Paso_a_Paso_n8n.md).
// Cada función conserva el nombre del nodo y su lógica línea por línea, para
// que se pueda comparar con el original. Antes de migrar se corrieron las dos
// versiones lado a lado (47 envíos reales de octubre y 4000 al azar) y dieron
// exactamente lo mismo.
import { horaEcuador, MESES } from './fechas.js';

// ── Nodo «Adaptador Web a Variables N8N» ────────────────────────────────────
export function adaptador(body, ahora = new Date()) {
  const ecuadorTime = horaEcuador(ahora);
  const dia = String(ecuadorTime.getDate()).padStart(2, '0');
  const mes = String(ecuadorTime.getMonth() + 1).padStart(2, '0');
  const anio = ecuadorTime.getFullYear();
  const fechaStr = `${dia}/${mes}/${anio}`;
  const hojaActual = `${MESES[ecuadorTime.getMonth()]} ${anio}`;

  let recibe_paq = 0, recibe_ind = 0, recibe_giras = 0, recibe_lilium = 0, recibe_verano = 0;
  let prod_paq = 0, prod_ind = 0, prod_giras = 0, prod_lilium = 0, prod_verano = 0;
  let venta_paq = 0, venta_ind = 0, venta_giras = 0, venta_lilium = 0, venta_verano = 0;
  let dano_paq = 0, dano_ind = 0, dano_giras = 0, dano_lilium = 0, dano_verano = 0;
  let seguidor_ind = 0;
  let deja_paq = 0, deja_ind = 0, deja_giras = 0, deja_lilium = 0, deja_verano = 0;

  const modoRaw = body.modo || '';
  const modo = modoRaw.toLowerCase();
  const datos = body.datos || {};
  const es_compra_real = modo.includes('ingreso');

  // El campo «principal» va a un solo lugar según el modo.
  if (modo.includes('ingreso') || modo.includes('recibo')) {
    if (datos.paquetes_rosas) recibe_paq = Number(datos.paquetes_rosas.principal) || 0;
    if (datos.rosas_individuales) recibe_ind = Number(datos.rosas_individuales.principal) || 0;
    if (datos.girasoles) recibe_giras = Number(datos.girasoles.principal) || 0;
    if (datos.lilium) recibe_lilium = Number(datos.lilium.principal) || 0;
    if (datos.flores_verano) recibe_verano = Number(datos.flores_verano.principal) || 0;
  } else if (modo.includes('cierre') || modo.includes('dejo')) {
    if (datos.paquetes_rosas) deja_paq = Number(datos.paquetes_rosas.principal) || 0;
    if (datos.rosas_individuales) deja_ind = Number(datos.rosas_individuales.principal) || 0;
    if (datos.girasoles) deja_giras = Number(datos.girasoles.principal) || 0;
    if (datos.lilium) deja_lilium = Number(datos.lilium.principal) || 0;
    if (datos.flores_verano) deja_verano = Number(datos.flores_verano.principal) || 0;
  } else if (modo.includes('produccion')) {
    if (datos.paquetes_rosas) prod_paq = Number(datos.paquetes_rosas.principal) || 0;
    if (datos.rosas_individuales) prod_ind = Number(datos.rosas_individuales.principal) || 0;
    if (datos.girasoles) prod_giras = Number(datos.girasoles.principal) || 0;
    if (datos.lilium) prod_lilium = Number(datos.lilium.principal) || 0;
    if (datos.flores_verano) prod_verano = Number(datos.flores_verano.principal) || 0;
  }

  // Los extras se mapean siempre que vengan.
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

  const capitalizar = (str) => str.charAt(0).toUpperCase() + str.slice(1);
  let observacionFinal = capitalizar(modoRaw);
  if (body.observaciones) observacionFinal += ` - ${body.observaciones}`;

  return {
    chat_id: '1556465374',
    fecha: fechaStr,
    hoja_actual: hojaActual,
    ayudante: body.responsable,
    tipo: modoRaw,
    observacion: observacionFinal,
    es_ingreso_nuevo: es_compra_real,

    recibe_paquetes: recibe_paq, recibe_individual: recibe_ind, recibe_girasoles: recibe_giras, recibe_lilium, recibe_verano,
    produccion_paquetes: prod_paq, produccion_individual: prod_ind, produccion_girasoles: prod_giras, produccion_lilium: prod_lilium, produccion_verano: prod_verano,
    venta_paquetes: venta_paq, venta_individual: venta_ind, venta_girasoles: venta_giras, venta_lilium, venta_verano,
    danado_paquetes: dano_paq, danado_individual: dano_ind, danado_girasoles: dano_giras, danado_lilium: dano_lilium, danado_verano: dano_verano,
    seguidor_individual: seguidor_ind,
    deja_paquetes: deja_paq, deja_individual: deja_ind, deja_girasoles: deja_giras, deja_lilium, deja_verano,
  };
}

// No usar `a || b` para leer saldos: el 0 es falsy y se salta (incidente 17/08).
function pick(f, ...keys) {
  for (const k of keys) {
    const v = f[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

// ── Nodo «Obtener el ultimo Saldo» ──────────────────────────────────────────
// datosInput = salida del adaptador; filas = la hoja del mes (la de config).
export function obtenerUltimoSaldo(datosInput, filas, ahora = new Date()) {
  // n8n también guardaba el último «dejó» de cada flor, pero no lo usaba;
  // aquí solo queda la bandera, que sigue decidiendo cuándo parar de buscar.
  let saldoAnteriorRosas = 0, saldoAnteriorGiras = 0, saldoAnteriorLilium = 0, saldoAnteriorVerano = 0;

  let foundSaldoRosas = false, foundDejoRosas = false;
  let foundSaldoGiras = false, foundDejoGiras = false;
  let foundSaldoLilium = false, foundDejoLilium = false;
  let foundSaldoVerano = false, foundDejoVerano = false;

  for (let i = filas.length - 1; i >= 0; i--) {
    const f = filas[i];
    if (!foundSaldoRosas) {
      const s = pick(f, 'SALDOS', 'Saldos');
      if (s != null && s !== '' && !isNaN(Number(s))) { saldoAnteriorRosas = Number(s); foundSaldoRosas = true; }
    }
    if (!foundDejoRosas) {
      const p = f['PAQUETES DEJADOS'], r = f['ROSAS DEJADAS'];
      if ((p != null && p !== '') || (r != null && r !== '')) { foundDejoRosas = true; }
    }
    if (!foundSaldoGiras) {
      const sG = pick(f, 'SALDO GIRASOLES', 'Saldo Girasoles');
      if (sG != null && sG !== '' && !isNaN(Number(sG))) { saldoAnteriorGiras = Number(sG); foundSaldoGiras = true; }
    }
    if (!foundDejoGiras) {
      const dG = f['GIRASOLES DEJADOS'] || f['Girasoles Dejados'];
      if (dG != null && dG !== '') { foundDejoGiras = true; }
    }
    if (!foundSaldoLilium) {
      const sL = pick(f, 'SALDO LILIUM', 'Saldo Lilium');
      if (sL != null && sL !== '' && !isNaN(Number(sL))) { saldoAnteriorLilium = Number(sL); foundSaldoLilium = true; }
    }
    if (!foundDejoLilium) {
      const dL = f['LILIUM DEJADOS'] || f['Lilium Dejados'];
      if (dL != null && dL !== '') { foundDejoLilium = true; }
    }
    if (!foundSaldoVerano) {
      const sV = pick(f, 'SALDO VERANO', 'Saldo Verano');
      if (sV != null && sV !== '' && !isNaN(Number(sV))) { saldoAnteriorVerano = Number(sV); foundSaldoVerano = true; }
    }
    if (!foundDejoVerano) {
      const dV = f['VERANO DEJADOS'] || f['Verano Dejados'];
      if (dV != null && dV !== '') { foundDejoVerano = true; }
    }

    if (foundSaldoRosas && foundDejoRosas && foundSaldoGiras && foundDejoGiras && foundSaldoLilium && foundDejoLilium && foundSaldoVerano && foundDejoVerano) break;
  }

  const tipoRaw = (datosInput.tipo || '').toLowerCase();

  const inPaq = Number(datosInput.recibe_paquetes) || 0;
  const inInd = Number(datosInput.recibe_individual) || 0;
  const inGiras = Number(datosInput.recibe_girasoles) || 0;
  const inLilium = Number(datosInput.recibe_lilium) || 0;
  const inVerano = Number(datosInput.recibe_verano) || 0;
  const hayEntrada = (inPaq > 0 || inInd > 0 || inGiras > 0 || inLilium > 0 || inVerano > 0);

  const ventaR = ((Number(datosInput.venta_paquetes) || 0) * 12) + (Number(datosInput.venta_individual) || 0);
  const danoR = ((Number(datosInput.danado_paquetes) || 0) * 12) + (Number(datosInput.danado_individual) || 0);
  const seguidorR = (Number(datosInput.seguidor_individual) || 0);
  const prodR = ((Number(datosInput.produccion_paquetes) || 0) * 12) + (Number(datosInput.produccion_individual) || 0);
  const prodPuraR = prodR;
  const totalSalidasR = ventaR + danoR + seguidorR + prodPuraR;

  const ventaG = Number(datosInput.venta_girasoles) || 0;
  const danoG = Number(datosInput.danado_girasoles) || 0;
  const seguidorG = Number(datosInput.seguidor_girasoles) || 0;
  const prodPuraG = Number(datosInput.produccion_girasoles) || 0;
  const totalSalidasG = ventaG + danoG + seguidorG + prodPuraG;

  const ventaL = Number(datosInput.venta_lilium) || 0;
  const danoL = Number(datosInput.danado_lilium) || 0;
  const prodPuraL = Number(datosInput.produccion_lilium) || 0;
  const totalSalidasL = ventaL + danoL + prodPuraL;

  const ventaV = Number(datosInput.venta_verano) || 0;
  const danoV = Number(datosInput.danado_verano) || 0;
  const prodPuraV = Number(datosInput.produccion_verano) || 0;
  const totalSalidasV = ventaV + danoV + prodPuraV;

  const dejoPaq = Number(datosInput.deja_paquetes) || 0;
  const dejoInd = Number(datosInput.deja_individual) || 0;
  const dejoGiras = Number(datosInput.deja_girasoles) || 0;
  const dejoLilium = Number(datosInput.deja_lilium) || 0;
  const dejoVerano = Number(datosInput.deja_verano) || 0;
  const hayDejo = tipoRaw.includes('dejo') || tipoRaw.includes('cierre');

  let excelPaq = 0, excelInd = 0, excelGiras = 0, excelLilium = 0, excelVerano = 0;
  let outCuadreRosas = 0, outCuadreGiras = 0, outCuadreLilium = 0, outCuadreVerano = 0;

  if (hayEntrada) {
    let esIngreso = datosInput.es_ingreso_nuevo === true;
    if (tipoRaw.includes('recibo') || tipoRaw.includes('turno')) esIngreso = false;
    if (esIngreso) { excelPaq = inPaq; excelInd = inInd; excelGiras = inGiras; excelLilium = inLilium; excelVerano = inVerano; } else {
      if (foundSaldoRosas || saldoAnteriorRosas > 0) outCuadreRosas = ((inPaq * 12) + inInd) - saldoAnteriorRosas;
      if (foundSaldoGiras || saldoAnteriorGiras > 0) outCuadreGiras = inGiras - saldoAnteriorGiras;
      if (foundSaldoLilium || saldoAnteriorLilium > 0) outCuadreLilium = inLilium - saldoAnteriorLilium;
      if (foundSaldoVerano || saldoAnteriorVerano > 0) outCuadreVerano = inVerano - saldoAnteriorVerano;
    }
  }

  // Un cierre con TODO en cero no es un conteo real: si pasa, el cuadre
  // negativo pone el inventario en 0 (incidente 17/08).
  const totalDejo = dejoPaq + dejoInd + dejoGiras + dejoLilium + dejoVerano;
  const totalSalidas = totalSalidasR + totalSalidasG + totalSalidasL + totalSalidasV;
  const cierreVacio = hayDejo && totalDejo === 0 && totalSalidas === 0 && !hayEntrada;

  if (hayDejo && !cierreVacio) {
    const teoricoR = saldoAnteriorRosas + ((excelPaq * 12) + excelInd) - totalSalidasR;
    outCuadreRosas = ((dejoPaq * 12) + dejoInd) - teoricoR;
    const teoricoG = saldoAnteriorGiras + excelGiras - totalSalidasG;
    outCuadreGiras = dejoGiras - teoricoG;
    const teoricoL = saldoAnteriorLilium + excelLilium - totalSalidasL;
    outCuadreLilium = dejoLilium - teoricoL;
    const teoricoV = saldoAnteriorVerano + excelVerano - totalSalidasV;
    outCuadreVerano = dejoVerano - teoricoV;
  }

  const alerta = Math.abs(outCuadreRosas) > 0.1 || Math.abs(outCuadreGiras) > 0.1 || Math.abs(outCuadreLilium) > 0.1 || Math.abs(outCuadreVerano) > 0.1;

  const ecuadorTime = horaEcuador(ahora);
  const hojaEnPalabras = `${MESES[ecuadorTime.getMonth()]} ${ecuadorTime.getFullYear()}`;

  return {
    chat_id: datosInput.chat_id,
    hoja_actual: hojaEnPalabras,
    fecha: datosInput.fecha,
    observacion: cierreVacio
      ? `${datosInput.observacion} - ENVIO VACIO IGNORADO (no se toco el saldo)`
      : datosInput.observacion,
    envio_vacio: cierreVacio,
    ayudante: datosInput.ayudante,

    excel_individual: excelInd,
    excel_paquetes: excelPaq,
    excel_girasoles: excelGiras,
    excel_lilium: excelLilium,
    excel_verano: excelVerano,

    col_produccion_pura_r: prodPuraR,
    col_produccion_pura_g: prodPuraG,
    col_produccion_pura_l: prodPuraL,
    col_produccion_pura_v: prodPuraV,

    col_venta_r: ventaR, col_venta_g: ventaG, col_venta_l: ventaL, col_venta_v: ventaV,
    col_dano_r: danoR, col_dano_g: danoG, col_dano_l: danoL, col_dano_v: danoV,
    col_seguidor_r: seguidorR,

    paquetes_dejados: dejoPaq,
    rosas_dejadas: dejoInd,
    girasoles_dejados: dejoGiras,
    lilium_dejados: dejoLilium,
    verano_dejados: dejoVerano,

    cuadre: outCuadreRosas,
    cuadre_girasoles: outCuadreGiras,
    cuadre_lilium: outCuadreLilium,
    cuadre_verano: outCuadreVerano,
    hay_descuadre: alerta,

    msg_paquetes: inPaq,
    msg_individual: inInd,
    msg_girasoles: inGiras,
    msg_lilium: inLilium,
    msg_verano: inVerano,
    produccion_salida: totalSalidasR,
    produccion_girasoles_salida: totalSalidasG,
    produccion_lilium_salida: totalSalidasL,
    produccion_verano_salida: totalSalidasV,
  };
}

// ── Nodo «Append row in Inventario del mes2»: columna de la hoja ← dato ─────
export function filaParaLaHoja(s) {
  return {
    OBSERVACION: s.observacion,
    AYUDANTE: s.ayudante,
    INDIVIDUAL: s.excel_individual,
    PAQUETES: s.excel_paquetes,
    PRODUCCION: s.col_produccion_pura_r,
    VENTA: s.col_venta_r,
    'DAÑO': s.col_dano_r,
    SEGUIDOR: s.col_seguidor_r,
    'PAQUETES DEJADOS': s.paquetes_dejados,
    'ROSAS DEJADAS': s.rosas_dejadas,
    CUADRE: s.cuadre,
    GIRASOLES: s.excel_girasoles,
    'VENTA G.': s.col_venta_g,
    'DAÑO G.': s.col_dano_g,
    'PRODUCCION G.': s.col_produccion_pura_g,
    'GIRASOLES DEJADOS': s.girasoles_dejados,
    'CUADRE GIRASOLES': s.cuadre_girasoles,
    FECHA: s.fecha,
    LILIUM: s.excel_lilium,
    'VENTA L.': s.col_venta_l,
    'DAÑO L.': s.col_dano_l,
    'PRODUCCION L.': s.col_produccion_pura_l,
    'LILIUM DEJADOS': s.lilium_dejados,
    'CUADRE LILIUM': s.cuadre_lilium,
    'DAÑO V.': s.col_dano_v,
    'VENTA V.': s.col_venta_v,
    'PRODUCCION V.': s.col_produccion_pura_v,
    VERANO: s.excel_verano,
    'VERANO DEJADOS': s.verano_dejados,
    'CUADRE VERANO': s.cuadre_verano,
  };
}

// ── Nodo «Buscar y Formatear Saldo1» (consulta del panel admin) ─────────────
export function buscarYFormatearSaldo(filas, producto = 'ambos') {
  let saldoRosas = 0, saldoGiras = 0, saldoLilium = 0, saldoVerano = 0;
  let foundR = false, foundG = false, foundL = false, foundV = false;

  for (let i = filas.length - 1; i >= 0; i--) {
    const f = filas[i];
    if (!foundR) {
      const s = f['SALDOS'];
      if (s != null && s !== '' && !isNaN(Number(s))) { saldoRosas = Number(s); foundR = true; }
    }
    if (!foundG) {
      const sG = f['SALDO GIRASOLES'];
      if (sG != null && sG !== '' && !isNaN(Number(sG))) { saldoGiras = Number(sG); foundG = true; }
    }
    if (!foundL) {
      const sL = f['SALDO LILIUM'];
      if (sL != null && sL !== '' && !isNaN(Number(sL))) { saldoLilium = Number(sL); foundL = true; }
    }
    if (!foundV) {
      const sV = f['SALDO VERANO'];
      if (sV != null && sV !== '' && !isNaN(Number(sV))) { saldoVerano = Number(sV); foundV = true; }
    }
    if (foundR && foundG && foundL && foundV) break;
  }

  // Las rosas se guardan en unidades (1 paquete = 12) pero físicamente están
  // en paquetes + sueltas: se muestra el último conteo REAL del cierre.
  let ultPaq = 0, ultSueltas = 0, foundConteo = false;
  for (let i = filas.length - 1; i >= 0 && !foundConteo; i--) {
    const p = Number(filas[i]['PAQUETES DEJADOS']) || 0;
    const r = Number(filas[i]['ROSAS DEJADAS']) || 0;
    if (p > 0 || r > 0) { ultPaq = p; ultSueltas = r; foundConteo = true; }
  }
  const desgloseRosas = (foundConteo && (ultPaq * 12 + ultSueltas) === saldoRosas)
    ? `${ultPaq} paquetes + ${ultSueltas} sueltas`
    : `${Math.floor(saldoRosas / 12)} paq + ${saldoRosas % 12} aprox.`;

  let titulo = '';
  let cuerpo = '';
  if (producto === 'rosas') {
    titulo = '🌹 Saldo de Rosas';
    cuerpo = `Actualmente quedan <b>${saldoRosas}</b> unidades (${desgloseRosas}).`;
  } else if (producto === 'girasoles') {
    titulo = '🌻 Saldo de Girasoles';
    cuerpo = `Actualmente quedan <b>${saldoGiras}</b> unidades en inventario.`;
  } else if (producto === 'lilium') {
    titulo = '🌸 Saldo de Lilium';
    cuerpo = `Actualmente quedan <b>${saldoLilium}</b> unidades en inventario.`;
  } else if (producto === 'verano') {
    titulo = '🌺 Saldo de Flores de Verano';
    cuerpo = `Actualmente quedan <b>${saldoVerano}</b> unidades en inventario.`;
  } else {
    titulo = '📊 Reporte General de Saldos';
    cuerpo = `🌹 Rosas: <b>${saldoRosas}</b> unidades (${desgloseRosas})<br>🌻 Girasoles: <b>${saldoGiras}</b> unidades<br>🌸 Lilium: <b>${saldoLilium}</b> unidades<br>🌺 Verano: <b>${saldoVerano}</b> unidades`;
  }

  return {
    titulo,
    mensaje: cuerpo,
    valorRosas: saldoRosas,
    valorGiras: saldoGiras,
    valorLilium: saldoLilium,
    valorVerano: saldoVerano,
  };
}

// ── Nodo «Extraer Saldos Finales» (apertura de mes) ─────────────────────────
export function extraerSaldosFinales(filas) {
  let saldoR = 0, saldoG = 0, saldoL = 0, saldoV = 0;
  let foundR = false, foundG = false, foundL = false, foundV = false;
  for (let i = filas.length - 1; i >= 0; i--) {
    const f = filas[i];
    if (!foundR) {
      const s = f['SALDOS'];
      if (s !== undefined && s !== '' && !isNaN(Number(s))) { saldoR = Number(s); foundR = true; }
    }
    if (!foundG) {
      const sG = f['SALDO GIRASOLES'];
      if (sG !== undefined && sG !== '' && !isNaN(Number(sG))) { saldoG = Number(sG); foundG = true; }
    }
    if (!foundL) {
      const sL = f['SALDO LILIUM'];
      if (sL !== undefined && sL !== '' && !isNaN(Number(sL))) { saldoL = Number(sL); foundL = true; }
    }
    if (!foundV) {
      const sV = f['SALDO VERANO'];
      if (sV !== undefined && sV !== '' && !isNaN(Number(sV))) { saldoV = Number(sV); foundV = true; }
    }
    if (foundR && foundG && foundL && foundV) break;
  }
  return { saldo_final_rosas: saldoR, saldo_final_girasoles: saldoG, saldo_final_lilium: saldoL, saldo_final_verano: saldoV };
}
