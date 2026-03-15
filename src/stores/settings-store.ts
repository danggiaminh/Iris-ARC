import { DEFAULT_MODEL_ID, STORAGE_KEYS } from "@/lib/constants";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface SettingsState {
	currentModel: string;
}

interface SettingsActions {
	setCurrentModel: (modelId: string) => void;
	loadModel: () => void;
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
	immer((set) => ({
		currentModel: DEFAULT_MODEL_ID,

		setCurrentModel: (modelId: string) => {
			localStorage.setItem(STORAGE_KEYS.MODEL, modelId);
			set((state) => {
				state.currentModel = modelId;
			});
		},

		loadModel: () => {
			const stored = localStorage.getItem(STORAGE_KEYS.MODEL);
			if (stored) {
				set((state) => {
					state.currentModel = stored;
				});
			}
		},
	})),
);
