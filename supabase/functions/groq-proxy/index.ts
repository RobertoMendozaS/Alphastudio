import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Realiza una petición HTTP con reintentos usando Exponential Backoff.
 * Se activan los reintentos para errores de red, límites de cuota (429) 
 * y errores internos del servidor (500+).
 * 
 * @param {string} url - La URL del endpoint
 * @param {RequestInit} options - Opciones del fetch
 * @param {number} maxRetries - Número máximo de intentos permitidos (default: 3)
 * @returns {Promise<Response>} La respuesta de la petición HTTP
 */
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let attempt = 0;
  let delay = 1000; // Retraso inicial de 1 segundo
  
  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, options);
      // Solo reintentamos ante Rate Limit o Server Errors
      if (!response.ok && (response.status === 429 || response.status >= 500)) {
        if (attempt === maxRetries - 1) return response; // Si es el último intento, devolvemos el error
        console.warn(`[Groq Proxy] Request falló con status ${response.status}. Reintentando en ${delay}ms... (Intento ${attempt + 1} de ${maxRetries})`);
      } else {
        return response; // Respuesta exitosa o error de cliente (4xx) que no debe reintentarse
      }
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      console.warn(`[Groq Proxy] Error de red: ${error}. Reintentando en ${delay}ms... (Intento ${attempt + 1} de ${maxRetries})`);
    }
    
    await new Promise(resolve => setTimeout(resolve, delay));
    delay *= 2; // Incrementar el delay exponencialmente
    attempt++;
  }
  throw new Error("Se alcanzó el número máximo de reintentos.");
}

serve(async (req: Request) => {
  // Manejo de preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Validación de método
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // Validación de variables de entorno
  if (!GROQ_API_KEY) {
    console.error("[Groq Proxy] Error: GROQ_API_KEY no está configurada.");
    return new Response(JSON.stringify({ error: "Configuración interna faltante. Contacta soporte." }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Formato JSON inválido." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    const { prompt, model, temperature } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "El campo 'prompt' es obligatorio." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Ejecutar petición con lógica de reintentos
    const groqResponse = await fetchWithRetry(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: model || "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: temperature ?? 0.5,
      }),
    });

    const data = await groqResponse.json();

    return new Response(JSON.stringify(data), {
      status: groqResponse.status,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error(`[Groq Proxy] Excepción atrapada: ${message}`);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
