import { Tool } from "ai";

export const tools: Tool[] = [
    {
      type: 'function',
      function: {
        name: 'get_current_weather',
        description: 'Get the current weather',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'The city and state, e.g. San Francisco, CA',
            },
            format: {
              type: 'string',
              enum: ['celsius', 'fahrenheit'],
              description:
                'The temperature unit to use. Infer this from the users location.',
            },
          },
          required: ['location', 'format'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'eval_code_in_browser',
        description: 'Execute javascript code in the browser with eval().',
        parameters: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: `Javascript code that will be directly executed via eval(). Do not use backticks in your response.
             DO NOT include any newlines in your response, and be sure to provide only valid JSON when providing the arguments object.
             The output of the eval() will be returned directly by the function.`,
            },
          },
          required: ['code'],
        },
      },
    },
  ];