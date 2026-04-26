import React, { useState, useEffect } from "react";
import { SignIn, SignUp, useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "@fontsource-variable/lexend";
import logo from "../assets/CampusKatale.png";
import { getImageUrl } from "../utils/imageUtils";

// ─── Role card ────────────────────────────────────────────────────────────
function RoleCard({ role, selected, onClick, disabled }) {
  const isBuyer = role === "user";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex-1 rounded-2xl border-2 p-5 text-left transition-all duration-200 group focus:outline-none
        ${disabled ? "opacity-40 cursor-not-allowed" : ""}
        ${
          selected
            ? isBuyer
              ? "border-[#177529] bg-[#177529]/5 shadow-md"
              : "border-[#97C040] bg-[#97C040]/10 shadow-md"
            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
        }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 transition-colors ${
          selected
            ? isBuyer
              ? "bg-[#177529] text-white"
              : "bg-[#97C040] text-white"
            : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
        }`}
      >
        {isBuyer ? "🛍️" : "🏪"}
      </div>
      <p
        className={`font-bold text-sm ${selected ? "text-[#0C0D19]" : "text-gray-600"}`}
      >
        {isBuyer ? "I'm a Buyer" : "I'm a Vendor"}
      </p>
      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
        {isBuyer
          ? "Browse and purchase from campus sellers"
          : "List products and grow your campus business"}
      </p>
      {selected && (
        <div
          className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${
            isBuyer ? "bg-[#177529]" : "bg-[#97C040]"
          }`}
        >
          ✓
        </div>
      )}
    </button>
  );
}

// ─── Vendor pending badge ─────────────────────────────────────────────────
function VendorPendingBadge() {
  return (
    <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
      <span className="font-semibold block mb-0.5">
        ⏳ Vendor accounts require approval
      </span>
      After signing up, your store will be reviewed before going live. You'll
      receive an email once approved.
    </div>
  );
}

// ─── Rejected vendor notice ───────────────────────────────────────────────
function RejectedBadge() {
  return (
    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed">
      <span className="font-semibold block mb-0.5">
        ❌ Vendor application not approved
      </span>
      Your vendor application was not approved. You can continue as a buyer or
      contact support for more information.
    </div>
  );
}

// ─── Clerk appearance factory ─────────────────────────────────────────────
const clerkAppearance = (isVendor) => ({
  elements: {
    rootBox: "w-full",
    card: "rounded-2xl border-2 shadow-none w-full p-7",
    cardBox: "shadow-none",
    headerTitle: "font-[Lexend] text-[#0C0D19]",
    headerSubtitle: "font-[Lexend] text-gray-500",
    socialButtonsBlockButton:
      "border border-gray-200 hover:bg-gray-50 font-[Lexend] rounded-xl",
    formFieldInput: `rounded-xl border-2 focus:ring-2 font-[Lexend] border-[#97C040] ${
      isVendor ? "focus:ring-[#97C040]" : "focus:ring-[#177529]"
    }`,
    formButtonPrimary: `font-[Lexend] rounded-xl ${
      isVendor
        ? "bg-[#97C040] hover:bg-[#7ea832]"
        : "bg-[#177529] hover:bg-[#135c21]"
    }`,
    footerActionLink: "text-[#177529] hover:text-[#97C040] font-[Lexend]",
    formFieldLabel: "font-[Lexend] text-[#0C0D19]",
    dividerLine: "bg-gray-200",
    dividerText: "font-[Lexend] text-gray-400",
    alertText: "font-[Lexend]",
    // Hide Clerk's own sign-in/sign-up switcher — our UI handles this
    footer: "hidden",
    identityPreviewEditButton: "text-[#177529]",
  },
});

// ─── Main component ───────────────────────────────────────────────────────
export default function Auth() {
  const [role, setRole] = useState(null); // "user" | "vendor" | null
  const [mode, setMode] = useState("signIn"); // "signIn" | "signUp"
  const [step, setStep] = useState("role"); // "role" | "auth"

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const vendorRejected = searchParams.get("error") === "vendor_rejected";

  // ── Single source of truth for post-auth redirect ─────────────────────
  // Runs whenever Clerk session changes. Clerk is told to return to /auth
  // (via afterSignInUrl/afterSignUpUrl) so this effect always gets to run.
  useEffect(() => {
    if (!isSignedIn || !user) return;

    const userRole = user.publicMetadata?.role;
    const vendorStatus = user.publicMetadata?.vendorStatus;

    // In the useEffect inside Auth.jsx
    if (userRole === "vendor") {
      if (vendorStatus === "approved") {
        // Check if they've completed onboarding
        if (!user.publicMetadata?.onboardingComplete) {
          navigate("/vendor/onboarding", { replace: true });
        } else {
          navigate("/vendor/dashboard", { replace: true });
        }
      } else if (vendorStatus === "rejected") {
        navigate("/auth?error=vendor_rejected", { replace: true });
      } else {
        navigate("/vendor/pending", { replace: true });
      }
    } else {
      // buyer or any unrecognised role
      navigate(`/profile/${user.id}`, { replace: true });
    }
  }, [isSignedIn, user, navigate]);

  // ── Mode/step handlers ────────────────────────────────────────────────
  const handleModeChange = (newMode) => {
    setMode(newMode);
    // When switching to sign-in, role doesn't matter — clear it
    if (newMode === "signIn") setRole(null);
  };

  const handleContinue = () => {
    // Sign-in doesn't need a role — go straight to the Clerk form
    if (mode === "signIn") {
      setStep("auth");
      return;
    }
    // Sign-up requires a role to be selected
    if (role) setStep("auth");
  };

  const isVendor = role === "vendor";
  const needsRole = mode === "signUp" && !role;

  // ── Step 1: Role selection ────────────────────────────────────────────
  const RoleStep = (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-center mb-8">
        <img
          src={getImageUrl(logo)}
          alt="Campus Katale"
          className="h-16 w-auto"
        />
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-xl font-bold text-[#0C0D19] mb-1">
          Welcome to CampusKatale
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          How would you like to use the platform?
        </p>

        {/* Sign In / Sign Up toggle — shown first */}
        <div
          className={`flex rounded-xl border-2 overflow-hidden mb-5 ${
            isVendor ? "border-[#97C040]" : "border-[#177529]"
          }`}
        >
          <button
            onClick={() => handleModeChange("signIn")}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
              mode === "signIn"
                ? isVendor
                  ? "bg-[#97C040] text-white"
                  : "bg-[#177529] text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => handleModeChange("signUp")}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
              mode === "signUp"
                ? isVendor
                  ? "bg-[#97C040] text-white"
                  : "bg-[#177529] text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Role cards — only required for sign up */}
        <div className="mb-2">
          <p
            className={`text-xs font-medium mb-3 ${
              mode === "signIn" ? "text-gray-300" : "text-gray-500"
            }`}
          >
            {mode === "signIn"
              ? "Role is remembered from your account"
              : "Select your account type"}
          </p>
          <div className="flex gap-3">
            <RoleCard
              role="user"
              selected={role === "user"}
              disabled={mode === "signIn"}
              onClick={() => setRole("user")}
            />
            <RoleCard
              role="vendor"
              selected={role === "vendor"}
              disabled={mode === "signIn"}
              onClick={() => setRole("vendor")}
            />
          </div>
        </div>

        {/* Vendor approval notice */}
        {role === "vendor" && mode === "signUp" && <VendorPendingBadge />}

        {/* Rejected vendor notice */}
        {vendorRejected && <RejectedBadge />}

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={needsRole}
          className={`w-full mt-5 py-3 rounded-xl font-bold text-white text-sm transition-all
            disabled:opacity-40 disabled:cursor-not-allowed ${
              isVendor
                ? "bg-[#97C040] hover:bg-[#7ea832]"
                : "bg-[#177529] hover:bg-[#135c21]"
            }`}
        >
          {mode === "signIn"
            ? "Continue to Sign In →"
            : role
              ? `Continue as ${role === "user" ? "Buyer" : "Vendor"} →`
              : "Select your account type to continue"}
        </button>
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={() => navigate("/")}
          className="text-sm text-gray-400 hover:text-[#177529] transition-colors"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );

  // ── Step 2: Clerk auth forms ──────────────────────────────────────────
  const AuthStep = (
    <div className="w-full max-w-md mx-auto">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setStep("role")}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#177529] transition-colors"
        >
          ← Back
        </button>
        <img
          src={getImageUrl(logo)}
          alt="Campus Katale"
          className="h-10 w-auto"
        />
        {/* Role pill — shows actual role for sign-in, chosen role for sign-up */}
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
            isVendor
              ? "bg-[#97C040]/15 text-[#5a7a1e]"
              : "bg-[#177529]/10 text-[#177529]"
          }`}
        >
          {mode === "signIn" ? "👤" : isVendor ? "🏪" : "🛍️"}
          {mode === "signIn" ? "Sign In" : isVendor ? "Vendor" : "Buyer"}
        </div>
      </div>

      {/* Mode switcher */}
      <div
        className={`flex rounded-xl border-2 overflow-hidden mb-4 ${
          isVendor ? "border-[#97C040]" : "border-[#177529]"
        }`}
      >
        <button
          onClick={() => {
            handleModeChange("signIn");
          }}
          className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
            mode === "signIn"
              ? isVendor
                ? "bg-[#97C040] text-white"
                : "bg-[#177529] text-white"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => {
            handleModeChange("signUp");
          }}
          className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
            mode === "signUp"
              ? isVendor
                ? "bg-[#97C040] text-white"
                : "bg-[#177529] text-white"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Vendor sign-up approval notice */}
      {isVendor && mode === "signUp" && <VendorPendingBadge />}

      {/* Clerk component */}
      {/* 
        IMPORTANT: afterSignInUrl and afterSignUpUrl both point back to /auth
        so the useEffect above always runs and handles the role-based redirect.
        Never point these directly to /profile or /vendor/dashboard.
      */}
      <div className="mt-4">
        {mode === "signIn" ? (
          <SignIn
            routing="hash"
            afterSignInUrl="/auth"
            appearance={clerkAppearance(isVendor)}
          />
        ) : (
          <SignUp
            routing="hash"
            afterSignUpUrl="/auth"
            // Passes chosen role to Clerk — webhook reads this and
            // promotes it to publicMetadata (the trusted source of truth)
            unsafeMetadata={{ intendedRole: role }}
            appearance={clerkAppearance(isVendor)}
          />
        )}
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={() => navigate("/")}
          className="text-sm text-gray-400 hover:text-[#177529] transition-colors"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F6F3] font-[Lexend] flex items-center justify-center py-10 px-4">
      {step === "role" ? RoleStep : AuthStep}
    </div>
  );
}
