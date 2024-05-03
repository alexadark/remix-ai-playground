import { MetaFunction } from "@remix-run/node";
import ChatUI from "../components/ChatUi";

// IMPORTANT! Set the runtime to edge when deployed to vercel
export const config = { runtime: "edge" };

export const meta: MetaFunction = () => {
  return [{ title: "Your Remix AI APP" }];
};

export default function Features() {
  return (
    <>
      <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-black to-zinc-900 p-4 md:p-8">
        <ChatUI />
      </main>
    </>
  );
}
