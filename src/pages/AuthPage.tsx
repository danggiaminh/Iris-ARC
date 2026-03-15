import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import type React from "react";
import { useState } from "react";

type AuthView = "login" | "signup";

export const AuthPage: React.FC = () => {
	const [view, setView] = useState<AuthView>("login");

	return (
		<div
			style={{
				height: "100%",
				width: "100%",
			}}
		>
			<div
				key={view}
				style={{
					height: "100%",
					animation: "authFadeIn 0.2s ease",
				}}
			>
				{view === "login" ? (
					<LoginPage onSwitchToSignup={() => setView("signup")} />
				) : (
					<SignupPage onSwitchToLogin={() => setView("login")} />
				)}
			</div>
		</div>
	);
};
