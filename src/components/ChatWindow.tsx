import { MessageBubble } from "@/components/MessageBubble";
import type { UIMessage } from "@/lib/schemas";
import type React from "react";
import { useEffect, useRef } from "react";

interface ChatWindowProps {
	messages: UIMessage[];
	onToggleLike: (messageId: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onToggleLike }) => {
	const bottomRef = useRef<HTMLDivElement>(null);

	const lastMsg = messages[messages.length - 1];
	const isStreamingNow = lastMsg?.isStreaming ?? false;

	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message/stream changes
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages.length, isStreamingNow]);

	return (
		<div className="chat-scroll">
			{messages.map((msg) => (
				<MessageBubble
					key={msg.id}
					message={msg}
					onToggleLike={() => onToggleLike(msg.id)}
				/>
			))}
			<div ref={bottomRef} />
		</div>
	);
};
