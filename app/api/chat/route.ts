import { groq } from "@ai-sdk/groq";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = await streamText({
      model: groq("llama-3.1-70b-versatile"),
      messages,
      system: `You are Atlas, an intelligent AI assistant for the Atlas.TM emergency management platform. 

You help users with:
- Understanding dashboard features and navigation
- Form management and data collection
- Insights and analytics interpretation  
- User and role management
- System administration tasks
- Emergency response workflows
- Data analysis and reporting

Be helpful, concise, and professional. Provide actionable guidance when possible. If you're unsure about specific platform details, acknowledge this and offer to help with general guidance.`,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
