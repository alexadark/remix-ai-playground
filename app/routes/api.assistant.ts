import { ActionFunctionArgs } from "@remix-run/node";
import { AssistantResponse } from "ai";
import OpenAI from "openai";

// IMPORTANT! Set the runtime to edge when deployed to vercel
export const config = { runtime: "edge" };

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

interface HomeTemperatures {
  [key: string]: number;
}

const homeTemperatures: HomeTemperatures = {
  bedroom: 20,
  "home office": 21,
  "living room": 21,
  kitchen: 22,
  bathroom: 23,
};

export async function action({ request }: ActionFunctionArgs) {
  // Parse the request body
  const input: {
    threadId: string | null;
    message: string;
  } = await request.json();

  //create a thread if needed
  const threadId = input.threadId ?? (await openai.beta.threads.create({})).id;

  //add message to the thread
  const createdMessage = await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: input.message,
  });

  // The AssistantResponse allows you to send a stream of assistant update to useAssistant. It is designed to facilitate streaming assistant responses to the useAssistant hook. It receives an assistant thread and a current message, and can send messages and data messages to the client.
  return AssistantResponse(
    { threadId, messageId: createdMessage.id },
    async ({ forwardStream, sendDataMessage }) => {
      // Create and stream the assistant run on the thread using the provided assistant ID
      const runStream = openai.beta.threads.runs.stream(threadId, {
        assistant_id:
          process.env.ASSISTANT_ID ??
          (() => {
            throw new Error("ASSISTANT_ID is not set");
          })(),
      });

      // Forward the run status and stream message deltas
      let runResult = await forwardStream(runStream);

      // Loop to handle actions required by the assistant
      while (
        runResult?.status === "requires_action" &&
        runResult.required_action?.type === "submit_tool_outputs"
      ) {
        // Map through the tool calls required by the assistant and handle them
        const tool_outputs = await Promise.all(
          runResult.required_action.submit_tool_outputs.tool_calls.map(
            handleToolCall
          )
        );

        // Submit the tool outputs and continue streaming
        runResult = await forwardStream(
          openai.beta.threads.runs.submitToolOutputsStream(
            threadId,
            runResult.id,
            { tool_outputs }
          )
        );
      }

      async function handleToolCall(toolCall: any) {
        // Parse the arguments to get parameters
        const parameters = JSON.parse(toolCall.function.arguments);

        // Handle different tool call functions
        switch (toolCall.function.name) {
          case "getRoomTemperature":
            return handleGetRoomTemperature(toolCall, parameters);
          case "setRoomTemperature":
            return handleSetRoomTemperature(
              toolCall,
              parameters,
              sendDataMessage
            );
          default:
            throw new Error(
              `Unknown tool call function: ${toolCall.function.name}`
            );
        }
      }

      function handleGetRoomTemperature(toolCall: any, parameters: any) {
        // Retrieve the temperature of the specified room
        const temperature =
          homeTemperatures[parameters.room as keyof typeof homeTemperatures];
        return {
          tool_call_id: toolCall.id,
          output: temperature.toString(),
        };
      }

      function handleSetRoomTemperature(
        toolCall: any,
        parameters: any,
        sendDataMessage: any
      ) {
        // Set the temperature of the specified room and send a data message
        const oldTemperature =
          homeTemperatures[parameters.room as keyof typeof homeTemperatures];
        homeTemperatures[parameters.room as keyof typeof homeTemperatures] =
          parameters.temperature;

        sendDataMessage({
          role: "data",
          data: {
            oldTemperature,
            newTemperature: parameters.temperature,
            description: `Temperature in ${parameters.room} changed from ${oldTemperature} to ${parameters.temperature}`,
          },
        });

        return {
          tool_call_id: toolCall.id,
          output: `temperature set successfully`,
        };
      }
    }
  );
}
