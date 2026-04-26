import React, { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import "@fontsource-variable/lexend";
import logo from "../assets/CampusKatale.png";
import { getImageUrl } from "../utils/imageUtils";

const STEPS = [
  {
    icon: "✅",
    label: "Account Created",
    description: "Your account has been created successfully.",
    done: true,
  },
  {
    icon: "🔍",
    label: "Under Review",
    description: "Our team is reviewing your vendor application.",
    done: true,
    active: true,
  },
  {
    icon: "🏪",
    label: "Store Approved",
    description: "You'll receive an email once your store is live.",
    done: false,
  },
];

export default function VendorPending() {
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  // If vendor somehow gets approved while on this page, redirect them
  useEffect(() => {
    if (!isLoaded || !user) return;
    const status = user.publicMetadata?.vendorStatus;
    if (status === "approved") navigate("/vendor/dashboard", { replace: true });
    if (status === "rejected") navigate("/auth?error=vendor_rejected", { replace: true });
  }, [user, isLoaded, navigate]);

  // Let vendor manually check their status (forces Clerk to reload session)
  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      await user.reload();
      const status = user.publicMetadata?.vendorStatus;
      if (status === "approved") {
        navigate("/vendor/dashboard", { replace: true });
      } else if (status === "rejected") {
        navigate("/auth?error=vendor_rejected", { replace: true });
      }
      // Still pending — nothing changes, spinner stops
    } catch (err) {
      console.error("Status check failed:", err);
    } finally {
      setChecking(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6F3]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#177529]" />
      </div>
    );
  }

  const vendorName = user?.firstName || "there";
  const vendorEmail = user?.primaryEmailAddress?.emailAddress || "";

  return (
    <div className="min-h-screen bg-[#F4F6F3] font-[Lexend] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={getImageUrl(logo)} alt="Campus Katale" className="h-14 w-auto" />
        </div>

        {/* Main card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Top banner */}
          <div className="bg-gradient-to-br from-[#177529] to-[#97C040] px-8 py-10 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
              ⏳
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              You're on the list, {vendorName}!
            </h1>
            <p className="text-green-100 text-sm">
              Your vendor application is being reviewed
            </p>
          </div>

          <div className="px-8 py-8 space-y-8">

            {/* Progress steps */}
            <div className="space-y-4">
              {STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  {/* Step indicator */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                        step.done
                          ? step.active
                            ? "bg-amber-100 border-2 border-amber-400"
                            : "bg-green-100 border-2 border-green-400"
                          : "bg-gray-100 border-2 border-gray-200"
                      }`}
                    >
                      {step.icon}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={`w-0.5 h-6 mt-1 ${
                          step.done ? "bg-green-300" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                  {/* Step text */}
                  <div className="pt-1.5">
                    <p
                      className={`text-sm font-semibold ${
                        step.active
                          ? "text-amber-700"
                          : step.done
                          ? "text-green-700"
                          : "text-gray-400"
                      }`}
                    >
                      {step.label}
                      {step.active && (
                        <span className="ml-2 text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                          In progress
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700">
              <p className="font-semibold mb-1">📬 What happens next?</p>
              <p className="text-xs leading-relaxed text-blue-600">
                We'll send an approval confirmation to{" "}
                <span className="font-semibold">{vendorEmail}</span>. Reviews
                typically take 1–2 business days. You can also click "Check
                Status" below to see if you've been approved.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleCheckStatus}
                disabled={checking}
                className="w-full py-3 bg-[#177529] text-white rounded-xl font-semibold text-sm hover:bg-[#135c21] transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {checking ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Checking...
                  </>
                ) : (
                  "🔄 Check Approval Status"
                )}
              </button>

              <button
                onClick={() => navigate("/")}
                className="w-full py-3 border border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50 transition"
              >
                Browse the Marketplace
              </button>

              <button
                onClick={() => signOut(() => navigate("/"))}
                className="w-full py-2 text-gray-400 text-xs hover:text-gray-600 transition"
              >
                Sign out
              </button>
            </div>

          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Questions? Contact us at{" "}
          <a
            href="mailto:support@campuskatale.com"
            className="text-[#177529] hover:underline"
          >
            support@campuskatale.com
          </a>
        </p>
      </div>
    </div>
  );
}