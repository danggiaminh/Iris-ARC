import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface ProfileState {
	avatarBase64: string | null;
	name: string;
	birthday: string;
	location: string;
	localPassword: string | null;
	isAuthLockEnabled: boolean;
	isUnlocked: boolean;
}

interface ProfileActions {
	setAvatar: (base64: string | null) => void;
	setName: (name: string) => void;
	setBirthday: (date: string) => void;
	setLocation: (location: string) => void;
	setPassword: (password: string | null) => void;
	setAuthLockEnabled: (enabled: boolean) => void;
	setUnlocked: (unlocked: boolean) => void;
	loadProfile: () => void;
}

const STORAGE_KEYS = {
	PROFILE: "irisarc_profile",
} as const;

export const useProfileStore = create<ProfileState & ProfileActions>()(
	immer((set) => ({
		avatarBase64: null,
		name: "Dang Gia Minh",
		birthday: "",
		location: "",
		localPassword: null,
		isAuthLockEnabled: false,
		isUnlocked: false,

		setAvatar: (base64) => {
			set((state) => {
				state.avatarBase64 = base64;
			});
			saveState({ avatarBase64: base64 });
		},
		setName: (name) => {
			set((state) => {
				state.name = name;
			});
			saveState({ name });
		},
		setBirthday: (birthday) => {
			set((state) => {
				state.birthday = birthday;
			});
			saveState({ birthday });
		},
		setLocation: (location) => {
			set((state) => {
				state.location = location;
			});
			saveState({ location });
		},
		setPassword: (password) => {
			set((state) => {
				state.localPassword = password;
				if (!password) {
					state.isAuthLockEnabled = false;
				}
			});
			saveState({ localPassword: password, isAuthLockEnabled: password ? undefined : false });
		},
		setAuthLockEnabled: (enabled) => {
			set((state) => {
				state.isAuthLockEnabled = enabled;
			});
			saveState({ isAuthLockEnabled: enabled });
		},
		setUnlocked: (unlocked) => {
			set((state) => {
				state.isUnlocked = unlocked;
			});
		},

		loadProfile: () => {
			const stored = localStorage.getItem(STORAGE_KEYS.PROFILE);
			if (stored) {
				try {
					const parsed = JSON.parse(stored);
					set((state) => {
						if (parsed.avatarBase64 !== undefined) state.avatarBase64 = parsed.avatarBase64;
						if (parsed.name !== undefined) state.name = parsed.name;
						if (parsed.birthday !== undefined) state.birthday = parsed.birthday;
						if (parsed.location !== undefined) state.location = parsed.location;
						if (parsed.localPassword !== undefined) state.localPassword = parsed.localPassword;
						if (parsed.isAuthLockEnabled !== undefined) state.isAuthLockEnabled = parsed.isAuthLockEnabled;
						
						if (state.isAuthLockEnabled) {
							state.isUnlocked = false; // Require unlock on fresh load if enabled
						} else {
							state.isUnlocked = true;
						}
					});
				} catch (e) {
					console.error("Failed to parse profile storage", e);
				}
			} else {
                set((state) => {
                    state.isUnlocked = true;
                });
            }
		},
	})),
);

// Helper to save partial state
function saveState(updates: Partial<ProfileState>) {
	try {
		const stored = localStorage.getItem(STORAGE_KEYS.PROFILE);
		let data: any = {};
		if (stored) {
			data = JSON.parse(stored);
		}
		const newData = { ...data, ...updates };
		// Never store isUnlocked in local storage
		delete newData.isUnlocked;
		localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(newData));
	} catch (e) {
		console.error("Failed to save profile state", e);
	}
}
