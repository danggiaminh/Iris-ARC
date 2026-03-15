import { MODELS } from "@/lib/constants";
import type { ModelInfo } from "@/lib/schemas";
import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";

async function fetchModels(): Promise<ModelInfo[]> {
	try {
		const result = await invoke<ModelInfo[]>("get_models");
		const wantedIds = MODELS.map((m) => m.id);
		return wantedIds.map((id) => {
			const fetched = result.find((m) => m.id === id);
			const fallback = MODELS.find((m) => m.id === id);
			if (!fallback) return { id, display_name: id, provider: "unknown" };
			return fetched
				? {
						...fetched,
						display_name: fallback.display_name,
						provider: fallback.provider,
					}
				: fallback;
		});
	} catch {
		return MODELS;
	}
}

export function useModelsQuery() {
	return useQuery({
		queryKey: ["models"],
		queryFn: fetchModels,
		staleTime: 10 * 60 * 1000, // 10 minutes
		gcTime: 30 * 60 * 1000, // 30 minutes
		retry: 2,
		refetchOnWindowFocus: false,
		initialData: MODELS,
	});
}
