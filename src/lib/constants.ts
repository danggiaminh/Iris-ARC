import type { ModelInfo } from "@/lib/schemas";

export const MODELS: ModelInfo[] = [
	{
		id: "Amphora 3.2",
		display_name: "Amphora 3.2",
		description: "High capability reasoning model",
		provider: "cerebras",
	},
	{
		id: "Phosphora 3.1.2",
		display_name: "Phosphora 3.1.2",
		description: "Lightweight fast model",
		provider: "cerebras",
	},
];

export const MODEL_MAP: Record<string, string> = {
	"Amphora 3.2": "qwen-3-235b-a22b-instruct-2507",
	"Phosphora 3.1.2": "llama3.1-8b",
};

export const DEFAULT_MODEL_ID = "Amphora 3.2";

export const STORAGE_KEYS = {
	MODEL: "irisarc_model",
} as const;

export const IMAGE_MIMES = ["image/png", "image/jpeg", "image/webp"] as const;

export const TEXT_MIMES = ["text/plain"] as const;

export const MAX_FILES = 4;
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const FILE_ACCEPT = "image/png,image/jpeg,image/webp,application/pdf,text/plain,text/*";
