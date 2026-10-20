import { RobotAvatar } from "@/components/RobotAvatar";

export interface TypingIndicatorProps {
  label?: string;
}

export function TypingIndicator({ label = "Product Mentor is typing" }: TypingIndicatorProps) {
  return (
    <div
      className="flex items-start justify-start gap-2.5 animate-in fade-in duration-200"
      role="status"
      aria-label={label}
    >
      <RobotAvatar size="sm" />
      <div className="typing-bubble">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}
