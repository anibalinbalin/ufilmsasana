import { Markdown } from "./markdown";
import type { UIMessage } from "ai";

export function Message({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  const textParts = message.parts.filter((p) => p.type === "text");
  if (textParts.length === 0) return null;

  const text = textParts.map((p) => p.text).join("\n");

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl bg-blue-600 px-4 py-2 text-white">
          <p className="text-sm whitespace-pre-wrap text-pretty">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[80%]">
      <Markdown>{text}</Markdown>
    </div>
  );
}
