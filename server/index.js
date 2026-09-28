import "dotenv/config";
import express from "express";
import cors from "cors";
import { answerWithTools } from "./openai.js";

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/chat", async (req, res) => {
  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const lastMessage = messages.at(-1);

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Falta OPENAI_API_KEY en el backend." });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: "Falta DATABASE_URL en el backend." });
  }

  if (!lastMessage || lastMessage.role !== "user" || !String(lastMessage.content || "").trim()) {
    return res.status(400).json({ error: "Envia al menos un mensaje de usuario." });
  }

  try {
    const cleanMessages = messages.slice(-12).map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: String(message.content || "").slice(0, 2000),
    }));

    const result = await answerWithTools(cleanMessages);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "No se pudo generar la respuesta. Revisa la configuracion del backend y la base de datos.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listo en http://localhost:${PORT}`);
});
