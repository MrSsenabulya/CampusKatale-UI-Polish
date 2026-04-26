import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import "@fontsource-variable/lexend";
import logo from "../assets/CampusKatale.png";
import { getImageUrl } from "../utils/imageUtils";

const STRAPI_URL = "https://campuskatale-fwih.onrender.com";

// ─── Step indicators ──────────────────────────────────────────────────────
const STEPS = [
  { number: 1, label: "Store Info" },
  { number: 2, label: "Social Links" },
  { number: 3, label: "Review" },
];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, i) => (
        <React.Fragment key={step.number}>
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step.number < current
                  ? "bg-[#177529] text-white"
                  : step.number === current
                    ? "bg-[#177529] text-white ring-4 ring-[#177529]/20"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {step.number < current ? "✓" : step.number}
            </div>
            <span
              className={`text-xs mt-1 font-medium ${
                step.number === current ? "text-[#177529]" : "text-gray-400"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-0.5 w-12 mb-4 rounded transition-all ${
                step.number < current ? "bg-[#177529]" : "bg-gray-200"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Input component ──────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-[#0C0D19] block mb-1">
        {label}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border-2 border-[#97C040] focus:outline-none focus:ring-2 focus:ring-[#177529] text-[#0C0D19] text-sm placeholder-gray-400";

// ─── Main component ───────────────────────────────────────────────────────
export default function VendorOnboarding() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    // Step 1 — Store info
    storeName: user?.firstName ? `${user.firstName}'s Store` : "",
    storeDescription: "",
    contactPhone: "",
    // Step 2 — Social links
    instagram: "",
    twitter: "",
    whatsapp: "",
    tiktok: "",
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // ── Validation ────────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!form.storeName.trim()) {
      setError("Store name is required.");
      return false;
    }
    if (form.storeName.trim().length < 3) {
      setError("Store name must be at least 3 characters.");
      return false;
    }
    if (!form.contactPhone.trim()) {
      setError("Contact phone is required so buyers can reach you.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (step === 1 && !validateStep1()) return;
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => s - 1);
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      const vendorId = user?.publicMetadata?.vendorId;

      if (!vendorId)
        throw new Error("Vendor ID not found. Please contact support.");

      // 1. Update Strapi vendor record
      const strapiRes = await fetch(`${STRAPI_URL}/api/vendors/${vendorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            storeName: form.storeName.trim(),
            storeDescription: form.storeDescription.trim(),
            contactPhone: form.contactPhone.trim(),
            socialLinks: {
              instagram: form.instagram.trim(),
              twitter: form.twitter.trim(),
              whatsapp: form.whatsapp.trim(),
              tiktok: form.tiktok.trim(),
            },
          },
        }),
      });

      if (!strapiRes.ok) throw new Error("Failed to save store profile.");

      // 2. Mark onboarding complete in Clerk publicMetadata
      // This goes through your Strapi webhook endpoint to keep secret keys off the frontend
      const metaRes = await fetch(
        `${STRAPI_URL}/api/clerk-webhook/update-metadata`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": import.meta.env.VITE_ADMIN_SECRET_KEY,
          },
          body: JSON.stringify({
            clerkUserId: user.id,
            metadata: {
              role: "vendor",
              vendorStatus: "approved",
              vendorId,
              onboardingComplete: true,
            },
          }),
        },
      );

      if (!metaRes.ok) throw new Error("Failed to complete onboarding setup.");

      // 3. Reload Clerk session so new metadata is reflected
      await user.reload();

      // 4. Go to dashboard
      navigate("/vendor/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F4F6F3] font-[Lexend] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src={getImageUrl(logo)}
            alt="Campus Katale"
            className="h-12 w-auto"
          />
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#0C0D19]">
            Set Up Your Store 🏪
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            You're approved! Complete your store profile to start selling.
          </p>
        </div>

        {/* Step indicators */}
        <StepIndicator current={step} />

        {/* Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7">
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* ── Step 1: Store Info ──────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#177529]/10 rounded-xl flex items-center justify-center text-xl">
                  🏪
                </div>
                <div>
                  <p className="font-bold text-[#0C0D19]">Store Information</p>
                  <p className="text-xs text-gray-400">
                    Basic details buyers will see on your store page
                  </p>
                </div>
              </div>

              <Field label="Store Name *">
                <input
                  type="text"
                  value={form.storeName}
                  onChange={set("storeName")}
                  placeholder="e.g. Reuel's Campus Store"
                  maxLength={50}
                  className={inputClass}
                />
                <p className="text-xs text-gray-400 text-right mt-0.5">
                  {form.storeName.length}/50
                </p>
              </Field>

              <Field
                label="Contact Phone *"
                hint="Buyers will use this to reach you"
              >
                <input
                  type="tel"
                  value={form.contactPhone}
                  onChange={set("contactPhone")}
                  placeholder="+256 7XX XXX XXX"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Store Description"
                hint="What do you sell? Who are your customers?"
              >
                <textarea
                  value={form.storeDescription}
                  onChange={set("storeDescription")}
                  rows={4}
                  maxLength={300}
                  placeholder="e.g. I sell second-hand engineering textbooks and electronics at fair prices for Makerere students..."
                  className={`${inputClass} resize-none`}
                />
                <p className="text-xs text-gray-400 text-right mt-0.5">
                  {form.storeDescription.length}/300
                </p>
              </Field>
            </div>
          )}

          {/* ── Step 2: Social Links ────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#97C040]/15 rounded-xl flex items-center justify-center text-xl">
                  🔗
                </div>
                <div>
                  <p className="font-bold text-[#0C0D19]">
                    Social & Contact Links
                  </p>
                  <p className="text-xs text-gray-400">
                    All optional — add any that apply
                  </p>
                </div>
              </div>

              <Field label="WhatsApp Number">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                    💬
                  </span>
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={set("whatsapp")}
                    placeholder="+256 7XX XXX XXX"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </Field>

              <Field label="Instagram">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                    📸
                  </span>
                  <input
                    type="text"
                    value={form.instagram}
                    onChange={set("instagram")}
                    placeholder="@yourhandle"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </Field>

              <Field label="TikTok">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                    🎵
                  </span>
                  <input
                    type="text"
                    value={form.tiktok}
                    onChange={set("tiktok")}
                    placeholder="@yourhandle"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </Field>

              <Field label="Twitter / X">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                    🐦
                  </span>
                  <input
                    type="text"
                    value={form.twitter}
                    onChange={set("twitter")}
                    placeholder="@yourhandle"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </Field>
            </div>
          )}

          {/* ── Step 3: Review ──────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-xl">
                  👀
                </div>
                <div>
                  <p className="font-bold text-[#0C0D19]">Review Your Store</p>
                  <p className="text-xs text-gray-400">
                    Confirm everything looks right before going live
                  </p>
                </div>
              </div>

              {/* Store info review */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Store Info
                </p>
                {[
                  { label: "Store Name", value: form.storeName },
                  { label: "Phone", value: form.contactPhone },
                  {
                    label: "Description",
                    value: form.storeDescription || "—",
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-xs text-gray-400">{label}</span>
                    <span className="text-xs font-medium text-[#0C0D19] text-right max-w-[60%]">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Social links review */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Social Links
                </p>
                {[
                  { label: "💬 WhatsApp", value: form.whatsapp || "—" },
                  { label: "📸 Instagram", value: form.instagram || "—" },
                  { label: "🎵 TikTok", value: form.tiktok || "—" },
                  { label: "🐦 Twitter", value: form.twitter || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-xs text-gray-400">{label}</span>
                    <span className="text-xs font-medium text-[#0C0D19]">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700">
                ✅ You can always update these details later from your store
                profile settings.
              </div>
            </div>
          )}

          {/* ── Navigation buttons ──────────────────────────────────────── */}
          <div className="flex gap-3 mt-7">
            {step > 1 && (
              <button
                onClick={handleBack}
                disabled={saving}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition text-sm font-medium disabled:opacity-50"
              >
                ← Back
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex-1 py-3 bg-[#177529] text-white rounded-xl hover:bg-[#135c21] transition text-sm font-semibold"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-3 bg-[#177529] text-white rounded-xl hover:bg-[#135c21] transition text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Setting up your store...
                  </>
                ) : (
                  "🚀 Launch My Store"
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Need help?{" "}
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
