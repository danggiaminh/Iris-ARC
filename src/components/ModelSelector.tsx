import { MODELS } from "@/lib/constants";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface ModelSelectorProps {
	currentModel: string;
	onSelect: (modelId: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ currentModel, onSelect }) => {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const currentDisplay = MODELS.find((m) => m.id === currentModel)?.display_name ?? "Amphora 3.2";

	const handleSelect = useCallback(
		(modelId: string) => {
			onSelect(modelId);
			setIsOpen(false);
		},
		[onSelect],
	);

	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [isOpen]);

	return (
		<div className="model-dropdown" ref={containerRef}>
			<button
				type="button"
				className={`model-trigger ${isOpen ? "open" : ""}`}
				onClick={() => setIsOpen((prev) => !prev)}
				aria-label="Select model"
				aria-expanded={isOpen}
			>
				<span className="model-trigger-label">{currentDisplay}</span>
				<svg
					className={`model-trigger-chevron ${isOpen ? "rotated" : ""}`}
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M6 9l6 6 6-6" />
				</svg>
			</button>

			{isOpen && (
				<div className="model-dropdown-card">
					{MODELS.map((model, index) => (
						<div key={model.id}>
							<button
								type="button"
								className={`model-option ${currentModel === model.id ? "selected" : ""}`}
								onClick={() => handleSelect(model.id)}
							>
								<div className="model-option-left">
									<span className="model-option-name">{model.display_name}</span>
									{model.description && (
										<span className="model-option-desc">{model.description}</span>
									)}
								</div>
								{currentModel === model.id && (
									<svg
										className="model-option-check"
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="#2563eb"
										strokeWidth="2.5"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="M5 13l4 4L19 7" />
									</svg>
								)}
							</button>
							{index < MODELS.length - 1 && <div className="model-option-divider" />}
						</div>
					))}
				</div>
			)}
		</div>
	);
};
