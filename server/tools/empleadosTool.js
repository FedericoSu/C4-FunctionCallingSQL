import { query } from "../db.js";

// empleados y departamentos son tablas reales de la base (JOIN por departamento_id).
const CAMPOS = {
  puesto: 'e."puesto"',
  departamento: 'd."nombre"',
  nombre: 'e."nombre"',
  apellido: 'e."apellido"',
};

const MAX_LIMITE = 25;
const FROM = `FROM empleados e JOIN departamentos d ON d.id = e.departamento_id`;
const COLUMNAS = `e.id, e.nombre, e.apellido, e.puesto, d.nombre AS departamento, e.salario`;

export const consultarEmpleadosTool = {
  type: "function",
  name: "consultar_empleados",
  description:
    "Consulta personas (empleados): en que puesto trabajan y a que departamento pertenecen. Usar para preguntas sobre cuantas personas trabajan en un departamento o en un puesto especifico.",
  parameters: {
    type: "object",
    properties: {
      campo: {
        type: ["string", "null"],
        enum: [...Object.keys(CAMPOS), null],
        description: "Atributo por el cual filtrar: puesto, departamento, nombre o apellido. Usar null si no hay filtro.",
      },
      valor: {
        type: ["string", "null"],
        description: "Valor a buscar en 'campo' (ej: 'Ventas', 'Desarrollador'). Usar null si no hay filtro.",
      },
      contar: {
        type: "boolean",
        description: "true para devolver solo la cantidad de personas que matchean, false para listarlas.",
      },
      limite: {
        type: "integer",
        minimum: 1,
        maximum: MAX_LIMITE,
        description: "Cantidad maxima de registros a devolver cuando contar es false.",
      },
    },
    required: ["campo", "valor", "contar", "limite"],
    additionalProperties: false,
  },
  strict: true,
};

export async function consultarEmpleados(rawArgs) {
  const { campo, valor, contar, limite } = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;

  if (campo && !CAMPOS[campo]) {
    throw new Error(`Campo no permitido: ${campo}`);
  }

  const params = [];
  let where = "";
  if (campo && valor) {
    params.push(`%${String(valor).trim()}%`);
    where = `WHERE ${CAMPOS[campo]}::text ILIKE $${params.length}`;
  }

  if (contar) {
    const sql = `SELECT COUNT(*)::int AS total ${FROM} ${where}`;
    console.log("    [SQL]", sql, params);
    const result = await query(sql, params);
    return { tipo: "conteo", total: result.rows[0].total };
  }

  params.push(Math.min(Number(limite) || 10, MAX_LIMITE));
  const sql = `SELECT ${COLUMNAS} ${FROM} ${where} ORDER BY e.id LIMIT $${params.length}`;
  console.log("    [SQL]", sql, params);
  const result = await query(sql, params);

  return { tipo: "registros", total: result.rowCount, registros: result.rows };
}
