import OpenAI from "openai";
import { consultarEmpleados, consultarEmpleadosTool } from "./tools/empleadosTool.js";

let client;

function getClient() {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return client;
}

const instructions = `
Sos un asistente claro y breve para consultar informacion de empleados.
Usa la herramienta consultar_empleados solo cuando la pregunta requiera datos reales sobre personas, puestos o departamentos.
No uses la herramienta para saludos, definiciones, explicaciones generales ni preguntas que puedas responder sin datos internos.
Nunca inventes datos. Si faltan columnas reales o la consulta no alcanza, explicalo.
`;

function toResponseInput(messages) {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "assistant" : "user",
    content: String(message.content || ""),
  }));
}

export async function answerWithTools(messages) {
  const openai = getClient();
  const model = process.env.OPENAI_MODEL || "gpt-5";

  console.log("\n[1] Usuario pregunta:", messages.at(-1)?.content);

  let response = await openai.responses.create({
    model,
    instructions,
    input: toResponseInput(messages),
    tools: [consultarEmpleadosTool],
    tool_choice: "auto",
  });

  const toolCalls = [];
  const functionCalls = response.output.filter((item) => item.type === "function_call");

  if (functionCalls.length === 0) {
    console.log("[2] El modelo respondio sin llamar ninguna funcion.");
    return {
      answer: response.output_text,
      toolsUsed: toolCalls,
    };
  }

  console.log(`[2] El modelo pidio ejecutar ${functionCalls.length} funcion(es).`);

  const toolOutputs = [];

  for (const call of functionCalls) {
    console.log(`[3] Function call: ${call.name}(${call.arguments})`);

    if (call.name !== "consultar_empleados") {
      throw new Error(`Herramienta no permitida: ${call.name}`);
    }

    const result = await consultarEmpleados(call.arguments);
    console.log("[4] Resultado devuelto por la funcion:", result);

    toolCalls.push({
      name: call.name,
      arguments: JSON.parse(call.arguments),
    });

    toolOutputs.push({
      type: "function_call_output",
      call_id: call.call_id,
      output: JSON.stringify(result),
    });
  }

  console.log("[5] Reenviando el resultado al modelo para que redacte la respuesta final...");

  response = await openai.responses.create({
    model,
    instructions,
    previous_response_id: response.id,
    input: toolOutputs,
    tools: [consultarEmpleadosTool],
  });

  console.log("[6] Respuesta final del modelo:", response.output_text, "\n");

  return {
    answer: response.output_text,
    toolsUsed: toolCalls,
  };
}
