import React, { useState } from "react";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import "@fontsource-variable/lexend";
import logo from "../assets/CampusKatale.png";
import { getImageUrl } from "../utils/imageUtils";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const toggleForm = (form) => setIsLogin(form === "login");

  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-[Lexend] py-8 px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src={getImageUrl(logo)}
            alt="Campus Katale Logo"
            className="h-16 md:h-20 w-auto"
          />
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => toggleForm("login")}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              isLogin
                ? "bg-[#177529] text-white"
                : "text-[#177529] hover:text-[#97C040]"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => toggleForm("signup")}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              !isLogin
                ? "bg-[#177529] text-white"
                : "text-[#177529] hover:text-[#97C040]"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Clerk Components */}
        <div className="flex justify-center">
          {isLogin ? (
            <SignIn
              routing="hash"
              afterSignInUrl="/"
              signUpUrl="#signup"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "rounded-2xl border-2 border-[#97C040] shadow-none w-full",
                  headerTitle: "font-[Lexend] text-[#177529]",
                  headerSubtitle: "font-[Lexend] text-gray-500",
                  socialButtonsBlockButton:
                    "border border-gray-200 hover:bg-gray-50 font-[Lexend]",
                  formFieldInput:
                    "rounded-lg border-2 border-[#97C040] focus:ring-2 focus:ring-[#177529] font-[Lexend]",
                  formButtonPrimary:
                    "bg-[#177529] hover:bg-[#135c21] font-[Lexend] rounded-lg",
                  footerActionLink:
                    "text-[#177529] hover:text-[#97C040] font-[Lexend]",
                  identityPreviewEditButton: "text-[#177529]",
                  formFieldLabel: "font-[Lexend] text-[#0C0D19]",
                  dividerLine: "bg-[#97C040]",
                  dividerText: "font-[Lexend] text-gray-400",
                  alertText: "font-[Lexend]",
                  // Hide Clerk's built-in "Don't have an account?" link — our tabs handle switching
                  footer: "hidden",
                },
              }}
            />
          ) : (
            <SignUp
              routing="hash"
              afterSignUpUrl="/"
              signInUrl="#signin"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "rounded-2xl border-2 border-[#97C040] shadow-none w-full",
                  headerTitle: "font-[Lexend] text-[#177529]",
                  headerSubtitle: "font-[Lexend] text-gray-500",
                  socialButtonsBlockButton:
                    "border border-gray-200 hover:bg-gray-50 font-[Lexend]",
                  formFieldInput:
                    "rounded-lg border-2 border-[#97C040] focus:ring-2 focus:ring-[#177529] font-[Lexend]",
                  formButtonPrimary:
                    "bg-[#177529] hover:bg-[#135c21] font-[Lexend] rounded-lg",
                  footerActionLink:
                    "text-[#177529] hover:text-[#97C040] font-[Lexend]",
                  formFieldLabel: "font-[Lexend] text-[#0C0D19]",
                  dividerLine: "bg-[#97C040]",
                  dividerText: "font-[Lexend] text-gray-400",
                  alertText: "font-[Lexend]",
                  footer: "hidden",
                },
              }}
            />
          )}
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-[#177529] text-sm hover:text-[#97C040] transition-colors"
          >
            &lt; Back to Home
          </button>
        </div>

      </div>
    </div>
  );
}

export default Auth;