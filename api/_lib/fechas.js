// Todo se fecha en hora de Ecuador, igual que hacían los nodos de n8n.
// Se usa el mismo truco que ellos (toLocaleString → new Date) para que los
// getters (getDate, getMonth...) devuelvan la hora de Quito sin importar en
// qué zona corra el servidor (Vercel corre en UTC).

export const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function horaEcuador(ahora = new Date()) {
  return new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
}

// "octubre 2026": así se llaman las hojas de cada mes en los dos libros.
export function nombreHoja(ahora = new Date()) {
  const ec = horaEcuador(ahora);
  return `${MESES[ec.getMonth()]} ${ec.getFullYear()}`;
}

export function mesYAnio(ahora = new Date()) {
  const ec = horaEcuador(ahora);
  return { mes: MESES[ec.getMonth()], anio: ec.getFullYear() };
}

// Para el registro: "2026-10-20 15:42:07".
export function sello(ahora = new Date()) {
  const ec = horaEcuador(ahora);
  const p = (n) => String(n).padStart(2, '0');
  return `${ec.getFullYear()}-${p(ec.getMonth() + 1)}-${p(ec.getDate())} ` +
    `${p(ec.getHours())}:${p(ec.getMinutes())}:${p(ec.getSeconds())}`;
}
