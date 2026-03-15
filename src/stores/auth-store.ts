import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface AuthState {
	session: Session | null;
	user: User | null;
	loading: boolean;
}

interface AuthActions {
	setSession: (session: Session | null) => void;
	setUser: (user: User | null) => void;
	setLoading: (loading: boolean) => void;
	clear: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
	immer((set) => ({
		session: null,
		user: null,
		loading: true,

		setSession: (session: Session | null) => {
			set((state) => {
				state.session = session;
				state.user = session?.user ?? null;
			});
		},

		setUser: (user: User | null) => {
			set((state) => {
				state.user = user;
			});
		},

		setLoading: (loading: boolean) => {
			set((state) => {
				state.loading = loading;
			});
		},

		clear: () => {
			set((state) => {
				state.session = null;
				state.user = null;
				state.loading = false;
			});
		},
	})),
);
