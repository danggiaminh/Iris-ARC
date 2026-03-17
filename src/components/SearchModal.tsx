import React, { useEffect, useRef, useState } from "react";

interface SearchModalProps {
	onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ onClose }) => {
	const [query, setQuery] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};

		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, [onClose]);

	return (
		<div className="fixed inset-0 z-50 flex justify-center items-start pt-[15vh] bg-black/20 backdrop-blur-sm" onClick={onClose}>
			<div 
                className="w-full max-w-[560px] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden flex flex-col mx-4"
                onClick={(e) => e.stopPropagation()}
            >
				<div className="flex items-center px-4 py-3 border-b border-gray-100">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mr-3">
						<circle cx="11" cy="11" r="8"></circle>
						<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
					</svg>
					<input
						ref={inputRef}
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search past chats..."
						className="flex-1 text-[15px] outline-none bg-transparent placeholder-gray-400 text-gray-800"
					/>
					<div className="flex items-center gap-1.5 ml-2">
                        <kbd className="font-mono text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">ESC</kbd>
                    </div>
				</div>
                <div className="p-2 min-h-[100px] max-h-[300px] overflow-y-auto">
                    {query.trim().length > 0 ? (
                        <div className="py-8 text-center text-sm text-gray-500">
                            No results found for "{query}"
                        </div>
                    ) : (
                        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Recent Searches
                        </div>
                    )}
                </div>
			</div>
		</div>
	);
};
