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
		<div className="chatbox p-2 transition-all duration-200" style={{ borderRadius: '28px' }}>
			{attachments.length > 0 && (
                <div className="pb-2">
                    <FilePreview attachments={attachments} onRemove={removeAttachment} />
                </div>
            )}
			
			<div className="flex items-end gap-2 px-1">
				<button
					type="button"
					className="w-[38px] h-[38px] flex-shrink-0 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-100 flex items-center justify-center text-gray-600 transition-colors mb-1"
					onClick={() => fileInputRef.current?.click()}
					title="Attach files"
					disabled={isStreaming || attachments.length >= MAX_FILES}
				>
					<span className="text-2xl font-light leading-none" style={{ marginTop: '-2px' }}>+</span>
				</button>
				
				<div className="flex-1 py-1">
					<TextareaAutosize
						ref={textareaRef}
						className="chatbox-textarea w-full bg-transparent outline-none resize-none m-0 p-0 text-[15px] pt-1"
						placeholder="Message AI..."
						value={text}
						onChange={(e) => setText(e.target.value)}
						onKeyDown={handleKeyDown}
						minRows={1}
						maxRows={6}
					/>
				</div>

				<button
					type="button"
					className="w-[38px] h-[38px] flex-shrink-0 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-1"
					onClick={handleSend}
					disabled={!hasContent || isStreaming}
					title="Send message"
				>
					<ArrowUp size={18} />
				</button>
			</div>
            
            <div className="flex items-center px-1 pt-1 mt-1 border-t border-transparent">
                <ModelSelector currentModel={currentModel} onSelect={onModelChange} />
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
