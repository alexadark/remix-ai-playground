// import type { ActionFunctionArgs } from '@vercel/remix';
import { ActionFunctionArgs } from '@remix-run/node';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
export const config = { runtime: 'edge' };

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function action({ request }: ActionFunctionArgs) {
  const { messages } = await request.json();
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    stream: true,
    messages,
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);
  // Respond with the stream
  const aiResponse = new StreamingTextResponse(stream);
  console.log("aiResponse",await aiResponse);
  return aiResponse
}