import { FilePreview } from "@/components/FilePreview";
import { ModelSelector } from "@/components/ModelSelector";
import { FILE_ACCEPT, MAX_FILES, MAX_FILE_SIZE } from "@/lib/constants";
import { fileToBase64, fileToText, isImageMime, isPdfMime, isTextMime } from "@/lib/helpers";
import type { Attachment } from "@/lib/schemas";
import { ArrowUp } from "lucide-react";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { v4 as uuidv4 } from "uuid";

interface ChatBoxProps {
	onSend: (text: string, attachments: Attachment[]) => void;
	isStreaming: boolean;
	currentModel: string;
	onModelChange: (modelId: string) => void;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
	onSend,
	isStreaming,
	currentModel,
	onModelChange,
}) => {
	const [text, setText] = useState("");
	const [attachments, setAttachments] = useState<Attachment[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const hasContent = text.trim().length > 0;

	const handleSend = useCallback(() => {
		if (isStreaming || !hasContent) return;
		onSend(text.trim(), attachments);
		setText("");
		setAttachments([]);
		if (fileInputRef.current) fileInputRef.current.value = "";
		if (textareaRef.current) {
			textareaRef.current.style.height = "48px";
		}
	}, [text, attachments, isStreaming, hasContent, onSend]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files) return;

		const remaining = MAX_FILES - attachments.length;
		const toProcess = Array.from(files).slice(0, remaining);
		const newAttachments: Attachment[] = [];

		for (const file of toProcess) {
			if (file.size > MAX_FILE_SIZE) continue;
			const mime = file.type || "text/plain";

			if (isImageMime(mime)) {
				const base64 = await fileToBase64(file);
				newAttachments.push({
					id: uuidv4(),
					name: file.name,
					mimeType: mime,
					sizeBytes: file.size,
					base64DataUrl: base64,
					objectUrl: URL.createObjectURL(file),
					isImage: true,
				});
				continue;
			}

			if (isPdfMime(mime)) {
				const base64 = await fileToBase64(file);
				newAttachments.push({
					id: uuidv4(),
					name: file.name,
					mimeType: mime,
					sizeBytes: file.size,
					base64DataUrl: base64,
					objectUrl: "",
					isImage: false,
				});
				continue;
			}

			if (isTextMime(mime)) {
				const textContent = await fileToText(file);
				newAttachments.push({
					id: uuidv4(),
					name: file.name,
					mimeType: mime,
					sizeBytes: file.size,
					base64DataUrl: "",
					objectUrl: "",
					isImage: false,
					textContent,
				});
			}
		}

		setAttachments((prev) => [...prev, ...newAttachments].slice(0, MAX_FILES));
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const removeAttachment = (id: string) => {
		setAttachments((prev) => {
			const att = prev.find((a) => a.id === id);
			if (att?.objectUrl) URL.revokeObjectURL(att.objectUrl);
			return prev.filter((a) => a.id !== id);
		});
	};

	return (
		<div className="chatbox">
			<FilePreview attachments={attachments} onRemove={removeAttachment} />
			<div className="chatbox-input">
				<TextareaAutosize
					ref={textareaRef}
					className="chatbox-textarea"
					placeholder="How can I help you today?"
					value={text}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={handleKeyDown}
					minRows={1}
					maxRows={6}
				/>
			</div>
			<div className="chatbox-bar">
				<button
					type="button"
					className="chatbox-icon"
					onClick={() => fileInputRef.current?.click()}
					title="Attach files"
					disabled={isStreaming || attachments.length >= MAX_FILES}
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M12 5v14M5 12h14" />
					</svg>
				</button>
				<ModelSelector currentModel={currentModel} onSelect={onModelChange} />
				<div className="flex-1" />
				<button
					type="button"
					className="send-button"
					onClick={handleSend}
					disabled={!hasContent || isStreaming}
					title="Send message"
				>
					<ArrowUp size={16} />
				</button>
			</div>
			<input
				type="file"
				ref={fileInputRef}
				className="hidden"
				accept={FILE_ACCEPT}
				multiple
				onChange={handleFileSelect}
			/>
		</div>
	);
};
