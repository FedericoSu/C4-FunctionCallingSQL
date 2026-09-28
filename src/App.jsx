import { useMemo, useRef, useState } from "react";

const initialMessages = [
  {
    role: "assistant",
    content:
      "¡Hola! ¿En que puedo ayudarte?",
    toolsUsed: [],
  },
];

export default function App() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const conversationForApi = useMemo(
    () =>
      messages
        .filter((message) => message.role === "user" || message.role === "assistant")
        .map(({ role, content }) => ({ role, content })),
    [messages]
  );

  async function sendMessage(text = input) {
    const trimmed = text.trim();

    if (!trimmed || isLoading) {
      return;
    }

    const userMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...conversationForApi, userMessage],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "La solicitud fallo.");
      }

      if (data.toolsUsed?.length > 0) {
        data.toolsUsed.forEach((tool) => {
          console.log(`[function call] ${tool.name}`, tool.arguments);
        });
      } else {
        console.log("[function call] el modelo no llamo ninguna tool para esta respuesta");
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.answer,
          toolsUsed: data.toolsUsed || [],
        },
      ]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  return (
    <main className="shell">
      <section className="workspace" aria-label="Asistente SQL">
        <header className="topbar">
          <div>
            <h1>Asistente de empresa_admin</h1>
            <p>Usar para preguntas sobre cuantas personas trabajan en un departamento o en un puesto especifico.</p>
          </div>
          <span className="status-dot">Demo</span>
        </header>

        <div className="chat" aria-live="polite">
          {messages.map((message, index) => (
            <article key={`${message.role}-${index}`} className={`message ${message.role}`}>
              <p>{message.content}</p>
              {message.toolsUsed?.length > 0 && (
                <div className="tool-note">
                  Se consulto la base mediante una tool
                </div>
              )}
            </article>
          ))}

          {isLoading && (
            <article className="message assistant loading">
              <span />
              <span />
              <span />
            </article>
          )}
        </div>

        {error && <div className="error">{error}</div>}

        <form className="composer" onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Escribi una pregunta..."
            rows={2}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
          />
          <button type="submit" disabled={isLoading || !input.trim()}>
            Enviar
          </button>
        </form>
      </section>
    </main>
  );
}
