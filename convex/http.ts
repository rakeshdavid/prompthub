import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

const http = httpRouter();

/**
 * Returns the appropriate CORS origin for the given request.
 * - Production: matches the configured CLIENT_ORIGIN exactly.
 * - Development: echoes back any localhost origin so Vite's
 *   dynamic port assignment doesn't break preflight checks.
 */
function getAllowedOrigin(request: Request): string {
  const requestOrigin = request.headers.get("Origin") ?? "";
  const configuredOrigin = process.env.CLIENT_ORIGIN;

  if (configuredOrigin && requestOrigin === configuredOrigin) {
    return configuredOrigin;
  }

  if (/^http:\/\/localhost(:\d+)?$/.test(requestOrigin)) {
    return requestOrigin;
  }

  return configuredOrigin ?? "http://localhost:5173";
}

const chatHandler = httpAction(async (ctx, request) => {
  const { conversationId } = await request.json();
  const origin = getAllowedOrigin(request);

  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
  };

  const data = await ctx.runQuery(internal.chat.getConversationWithMessages, {
    conversationId,
  });

  if (!data) {
    return new Response(JSON.stringify({ error: "Conversation not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { prompt, messages } = data;

  const systemMessage = messages.find((m) => m.role === "system");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Gemini API key not configured" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const geminiUrl = `${GEMINI_API_BASE}/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const geminiBody = {
    system_instruction: {
      parts: [{ text: systemMessage?.content ?? prompt.prompt }],
    },
    contents,
    tools: [{ google_search: {} }],
    generationConfig: {
      thinkingConfig: {
        thinkingLevel: "medium",
      },
    },
  };

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const geminiResponse = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiBody),
        });

        if (!geminiResponse.ok || !geminiResponse.body) {
          const errorText = await geminiResponse.text();
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: `Gemini API error: ${geminiResponse.status} ${errorText}` })}\n\n`,
            ),
          );
          controller.close();
          return;
        }

        const reader = geminiResponse.body.getReader();
        const decoder = new TextDecoder();
        const collectedSources: Array<{ uri: string; title: string }> = [];
        let emittedThinking = false;
        let emittedGenerating = false;
        let emittedSearching = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const parts = parsed.candidates?.[0]?.content?.parts;
              if (Array.isArray(parts)) {
                for (const part of parts) {
                  if (part.thought) {
                    if (!emittedThinking) {
                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({ status: "thinking" })}\n\n`,
                        ),
                      );
                      emittedThinking = true;
                    }
                    continue;
                  }
                  if (part.text) {
                    if (!emittedGenerating) {
                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({ status: "generating" })}\n\n`,
                        ),
                      );
                      emittedGenerating = true;
                    }
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ text: part.text })}\n\n`,
                      ),
                    );
                  }
                }
              }

              const groundingMeta = parsed.candidates?.[0]?.groundingMetadata;
              if (groundingMeta?.groundingChunks) {
                if (!emittedSearching) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ status: "searching" })}\n\n`,
                    ),
                  );
                  emittedSearching = true;
                }
                for (const gc of groundingMeta.groundingChunks) {
                  const web = gc.web;
                  if (web?.uri && web?.title) {
                    const exists = collectedSources.some(
                      (s) => s.uri === web.uri,
                    );
                    if (!exists) {
                      collectedSources.push({
                        uri: web.uri,
                        title: web.title,
                      });
                    }
                  }
                }
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }

        if (collectedSources.length > 0) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ sources: collectedSources })}\n\n`,
            ),
          );
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Stream failed";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
});

const corsHandler = httpAction(async (_ctx, request) => {
  const origin = getAllowedOrigin(request);
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
});

http.route({ path: "/api/chat", method: "POST", handler: chatHandler });
http.route({ path: "/api/chat", method: "OPTIONS", handler: corsHandler });

export default http;
