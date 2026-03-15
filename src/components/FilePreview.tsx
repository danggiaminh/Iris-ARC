import type { Attachment } from "@/lib/schemas";
import type React from "react";

interface FilePreviewProps {
	attachments: Attachment[];
	onRemove: (id: string) => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ attachments, onRemove }) => {
	if (attachments.length === 0) return null;

	return (
		<div className="file-badges">
			{attachments.map((att) => (
				<div key={att.id} className="file-badge" title={att.name}>
					<span>{att.name}</span>
					<button
						type="button"
						className="file-badge-remove"
						onClick={() => onRemove(att.id)}
						title="Remove"
					>
						×
					</button>
				</div>
			))}
		</div>
	);
};
