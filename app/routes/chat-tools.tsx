import { ChatRequest, ToolCallHandler, generateId } from 'ai';
import { Message, useChat } from 'ai/react';


const ChatTools = () => {
    const toolCallHandler: ToolCallHandler = async (chatMessages, toolCalls) => {
        let handledFunction = false;
        for (const tool of toolCalls) {
          if (tool.type === 'function') {
            const { name, arguments: args } = tool.function;

            if (name === 'eval_code_in_browser') {
              // Parsing here does not always work since it seems that some characters in generated code aren't escaped properly.
              const parsedFunctionCallArguments: { code: string } =
                JSON.parse(args);

              // WARNING: Do NOT do this in real-world applications!
              eval(parsedFunctionCallArguments.code);

              const result = parsedFunctionCallArguments.code;

              if (result) {
                handledFunction = true;

                chatMessages.push({
                  id: generateId(),
                  tool_call_id: tool.id,
                  name: tool.function.name,
                  role: 'tool' as const,
                  content: result,
                });
              }
            }
          }
        }
        if (handledFunction) {
            const toolResponse: ChatRequest = { messages: chatMessages };
            return toolResponse;
          }
        };


    const { messages, input, handleInputChange, handleSubmit } = useChat({
        api: '/api/chatTools',
        experimental_onToolCall:toolCallHandler,
      });

        // Generate a map of message role to text color
  const roleToColorMap: Record<Message['role'], string> = {
    system: 'red',
    user: 'black',
    function: 'blue',
    tool: 'purple',
    assistant: 'green',
    data: 'orange',
  };


  return  (
  <div className="w-full max-w-6xl mx-auto rounded-xl shadow-lg text-white bg-black ">
  <h2 className="text-2xl md:text-4xl font-bold text-center py-6 ">Chat with tool calling</h2>
  <section className="p-6 space-y-4 overflow-auto" style={{ maxHeight: '85vh' }}>
    {messages.map((m) => (
      <div
        key={m.id}
        style={{ color: roleToColorMap[m.role] }}
        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-lg px-4 py-2 m-2 rounded-lg shadow-md ${m.role === 'user' ? 'bg-zinc-300 text-black' : 'bg-gray-800 text-gray-300'}`}
        >
          <p className="whitespace-pre-wrap break-words">{m.content}</p>
        </div>
      </div>
    ))}
  </section>

  <form onSubmit={handleSubmit} className="flex w-full p-6 ">
    <input
      type="text"
      className="flex-grow h-12 px-4 mr-4 text-xl bg-white text-black rounded-lg focus:outline-none"
      value={input}
      placeholder="Type your message here..."
      onChange={handleInputChange}
      autoFocus
    />
    <button
      type="submit"
      className="px-6 h-12 bg-white text-black font-bold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
    >
      Send
    </button>
  </form>
</div>
)
}

export default ChatTools
