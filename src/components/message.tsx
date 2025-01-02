import { cn } from "@/lib/utils";

interface MessageProps {
  message: string;
  role: "system" | "user" | "assistant" | string;
}

const Message = ({ message, role }: MessageProps) => {
  return (
    <div className={cn("flex items-end", { "justify-end": role === "user" })}>
      <div className="order-2 mx-2 flex flex-col items-start space-y-2 text-xs">
        <div>
          <span
            className={cn({
              "inline-block rounded-lg rounded-bl-none bg-gray-300 px-4 py-2 text-gray-600 max-w-xs":
                role === "assistant",
              "px-4 py-2 rounded-lg inline-block rounded-br-none bg-blue-600 text-white max-w-xs":
                role === "user",
            })}
          >
            {message}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Message;
