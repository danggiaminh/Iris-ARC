import { AuthPage } from "@/pages/AuthPage";
import { useAuthStore } from "@/stores/auth-store";
import type React from "react";

interface ProtectedRouteProps {
	children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
	const { session, loading } = useAuthStore();

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

	if (!session) {
		return <AuthPage />;
	}

	return <>{children}</>;
};
