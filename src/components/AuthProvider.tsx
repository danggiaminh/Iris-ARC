import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import type React from "react";
import { useEffect } from "react";

interface AuthProviderProps {
	children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const { loading, setSession, setLoading } = useAuthStore();

	useEffect(() => {
		void supabase.auth.getSession().then(({ data }) => {
			setSession(data.session);
			setLoading(false);
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
		});

		return () => {
			subscription.unsubscribe();
		};
	}, [setSession, setLoading]);

	if (loading) {
		return (
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					height: "100%",
					width: "100%",
				}}
			>
				<div
					style={{
						width: 24,
						height: 24,
						border: "2px solid #d1d5db",
						borderTop: "2px solid transparent",
						borderRadius: "50%",
						animation: "spin 0.6s linear infinite",
					}}
				/>
			</div>
		);
	}

	return <>{children}</>;
};
