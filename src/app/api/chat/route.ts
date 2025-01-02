import { LangChainStream, StreamingTextResponse } from "ai";
import { z } from "zod";
import { MeiliSearch } from "meilisearch";
import { GoogleGenerativeAI } from "@google/generative-ai";

// { messages: [ { role: 'user', content: 'hi' } ] }
const ChatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["function", "system", "user", "assistant"]),
      content: z.string(),
      id: z.string().optional(),
      createdAt: z.date().optional(),
    })
  ),
});

export const runtime = "edge";

export async function POST(req: Request) {
  const body = await req.json();

  try {
    const { messages } = ChatSchema.parse(body);
    
    // Initialize Meilisearch client
    const client = new MeiliSearch({
      host: process.env.MEILISEARCH_HOST!,
      apiKey: process.env.MEILISEARCH_API_KEY!,
    });

    const index = client.index(process.env.MEILISEARCH_INDEX_NAME!);

    // Get the last user message
    const lastMessage = messages[messages.length - 1].content;

    // Search for relevant documents
    const searchResults = await index.search(lastMessage, {
      limit: 5,
    });

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-2.0" });

    // Format context from search results
    const context = searchResults.hits
      .map((hit) => hit.content)
      .join("\n\n");

    // Format conversation history
    const conversationHistory = messages
      .slice(0, -1)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    // Create prompt with context and history
    const prompt = `
Context from CV:
${context}

Conversation history:
${conversationHistory}

User question: ${lastMessage}

Please provide a helpful response based on the CV context above.`;

    // Get streaming response from Gemini
    const result = await model.generateContentStream(prompt);
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          controller.enqueue(chunk.text());
        }
        controller.close();
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("Error in chat route:", error);
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 });
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
