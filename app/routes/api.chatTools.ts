import { ActionFunctionArgs } from "@remix-run/node";
import {
  OpenAIStream,
  StreamingTextResponse,
  ToolCallPayload,
  StreamData,
} from "ai";
import OpenAI from "openai";
import { tools } from "~/utils";

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// IMPORTANT! Set the runtime to edge when deployed to vercel
export const config = { runtime: "edge" };

export async function action({ request }: ActionFunctionArgs) {
  const { messages } = await request.json();
  const model = "gpt-3.5-turbo-0613";

  const response = await openai.chat.completions.create({
    model,
    stream: true,
    messages,
    tools,
    tool_choice: "auto",
  });

  const data = new StreamData();
  const stream = OpenAIStream(response, {
    experimental_onToolCall: async (
      call: ToolCallPayload,
      appendToolCallMessage
    ) => {
      for (const toolCall of call.tools) {
        // Note: this is a very simple example of a tool call handler
        // that only supports a single tool call function.
        if (toolCall.func.name === "get_current_weather") {
          // Call a weather API here
          const weatherData = {
            temperature: 20,
            unit: toolCall.func.arguments.format === "celsius" ? "C" : "F",
          };

          const newMessages = appendToolCallMessage({
            tool_call_id: toolCall.id,
            function_name: "get_current_weather",
            tool_call_result: weatherData,
          });

          return openai.chat.completions.create({
            messages: [...messages, ...newMessages],
            model,
            stream: true,
            tools,
            tool_choice: "auto",
          });
        }
      }
    },
    onCompletion(completion) {
      console.log("completion", completion);
    },
    onFinal(completion) {
      data.close();
    },
  });

  // data.append({
  //   text: 'Hello, how are you?',
  // });

  return new StreamingTextResponse(stream, {}, data);
}
