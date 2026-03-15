import type { Attachment, UIMessage } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { Copy, ThumbsUp } from "lucide-react";
import type React from "react";
import { useState } from "react";

interface MessageBubbleProps {
	message: UIMessage;
	onToggleLike: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onToggleLike }) => {
	const [copied, setCopied] = useState(false);
	const isUser = message.role === "user";
	const showTyping = message.isStreaming && message.content.length === 0;
	const attachments = (message.attachments ?? []) as Attachment[];

	const handleCopyMessage = async () => {
		try {
			await navigator.clipboard.writeText(message.content);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			/* ignore */
		}
	};

	return (
		<div className="message-block">
			<div className={cn("message-row", isUser ? "user" : "assistant")}>
				{isUser ? (
					<div className="message-bubble user">
						<div className="message-text">{message.content}</div>
						{attachments.length > 0 && (
							<div className="message-attachments">
								{attachments.map((att) =>
									att.isImage ? (
										<img
											key={att.id}
											src={att.objectUrl}
											alt={att.name}
											className="message-attachment-image"
										/>
									) : (
										<span key={att.id} className="message-attachment">
											{att.name}
										</span>
									),
								)}
							</div>
						)}
					</div>
				) : (
					<div className="message-plain">
						{showTyping ? (
							<div className="typing-dots">
								<span />
								<span />
								<span />
							</div>
						) : (
							<div className="message-text">{message.content}</div>
						)}
					</div>
				)}
			</div>
			{!isUser && !message.isStreaming && (
				<div className="message-actions">
					<button
						type="button"
						className={cn("action-button", copied && "active")}
						onClick={handleCopyMessage}
						title="Copy"
					>
						<Copy size={12} />
					</button>
					<button
						type="button"
						className={cn("action-button", message.isLiked && "active")}
						onClick={onToggleLike}
						title="Like"
					>
						<ThumbsUp size={12} />
					</button>
				</div>
			)}
		</div>
	);
};
