import React, { useState, useEffect, useRef } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import "@fontsource-variable/lexend";
import { Navbar } from "../components";

const STRAPI_URL = "https://campuskatale-fwih.onrender.com";

// ─── Helpers ──────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString();

function apiHeaders() {
  return { "Content-Type": "application/json" };
}

// ─── Mini bar chart (no external lib) ────────────────────────────────────
function BarChart({ data, color }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-20 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[9px] text-gray-400 font-medium">
            {d.value > 0 ? d.value : ""}
          </span>
          <div
            className="w-full rounded-t-md transition-all duration-500"
            style={{
              height: `${Math.max((d.value / max) * 60, 3)}px`,
              backgroundColor: color,
              opacity: 0.6 + (i / data.length) * 0.4,
            }}
          />
          <span className="text-[9px] text-gray-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────
function StatCard({ emoji, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ backgroundColor: `${color}18` }}
      >
        {emoji}
      </div>
      <div>
        <p className="text-2xl font-bold text-[#0C0D19]">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Add / Edit Listing Modal ─────────────────────────────────────────────
function ListingModal({ listing, vendorClerkId, onClose, onSaved }) {
  const isEdit = !!listing;
  const [form, setForm] = useState({
    title: listing?.attributes?.title || "",
    price: listing?.attributes?.price || "",
    description: listing?.attributes?.description || "",
    category: listing?.attributes?.category || "",
    condition: listing?.attributes?.condition || "new",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!form.title || !form.price) {
      setError("Title and price are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const url = isEdit
        ? `${STRAPI_URL}/api/products/${listing.id}`
        : `${STRAPI_URL}/api/products`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: apiHeaders(),
        body: JSON.stringify({
          data: {
            ...form,
            price: Number(form.price),
            clerkUserId: vendorClerkId,
            publishedAt: new Date(),
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to save listing");
      const saved = await res.json();
      onSaved(saved.data, isEdit);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border-2 border-[#97C040] focus:outline-none focus:ring-2 focus:ring-[#177529] text-[#0C0D19] text-sm";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#0C0D19]">
            {isEdit ? "Edit Listing" : "Add New Listing"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Engineering Mathematics Textbook"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Price (UGX) *
            </label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="e.g. 25000"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Category
            </label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. Books, Electronics, Clothing"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Condition
            </label>
            <select
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
              className={inputClass}
            >
              <option value="new">New</option>
              <option value="like_new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              placeholder="Describe the item..."
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-[#177529] text-white rounded-xl hover:bg-[#135c21] transition text-sm font-semibold disabled:opacity-60"
          >
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Post Listing"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirmation ──────────────────────────────────────────────────
function DeleteConfirm({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          🗑️
        </div>
        <h3 className="text-lg font-bold text-[#0C0D19] mb-2">
          Delete Listing?
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          This cannot be undone. The listing will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition text-sm font-semibold"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Store Profile Edit Modal ─────────────────────────────────────────────
function StoreProfileModal({ vendor, clerkUser, onClose, onSaved }) {
  const [form, setForm] = useState({
    storeName: vendor?.storeName || "",
    storeDescription: vendor?.storeDescription || "",
    contactPhone: vendor?.contactPhone || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!form.storeName.trim()) {
      setError("Store name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const vendorId = clerkUser?.publicMetadata?.vendorId;
      const res = await fetch(`${STRAPI_URL}/api/vendors/${vendorId}`, {
        method: "PUT",
        headers: apiHeaders(),
        body: JSON.stringify({ data: form }),
      });
      if (!res.ok) throw new Error("Failed to update store profile");
      const updated = await res.json();
      onSaved(updated.data.attributes);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border-2 border-[#97C040] focus:outline-none focus:ring-2 focus:ring-[#177529] text-[#0C0D19] text-sm";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#0C0D19]">Edit Store Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Store Name *
            </label>
            <input
              type="text"
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              value={form.contactPhone}
              onChange={(e) =>
                setForm({ ...form, contactPhone: e.target.value })
              }
              placeholder="+256 7XX XXX XXX"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Store Description
            </label>
            <textarea
              value={form.storeDescription}
              onChange={(e) =>
                setForm({ ...form, storeDescription: e.target.value })
              }
              rows={3}
              maxLength={300}
              placeholder="Tell customers about your store..."
              className={`${inputClass} resize-none`}
            />
            <p className="text-xs text-gray-400 text-right mt-0.5">
              {form.storeDescription.length}/300
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-[#177529] text-white rounded-xl hover:bg-[#135c21] transition text-sm font-semibold disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main VendorDashboard ─────────────────────────────────────────────────
export default function VendorDashboard() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [loadingListings, setLoadingListings] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingVendor, setLoadingVendor] = useState(false);

  // Modals
  const [listingModal, setListingModal] = useState(null); // null | "add" | listing object
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [storeModal, setStoreModal] = useState(false);

  const clerkUserId = user?.id;
  const vendorId = user?.publicMetadata?.vendorId;

  // ── Fetch listings ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!clerkUserId) return;
    setLoadingListings(true);
    fetch(
      `${STRAPI_URL}/api/products?filters[clerkUserId][$eq]=${clerkUserId}&populate=*&sort=createdAt:desc`
    )
      .then((r) => r.json())
      .then((d) => setListings(d.data || []))
      .catch(console.error)
      .finally(() => setLoadingListings(false));
  }, [clerkUserId]);

  // ── Fetch orders ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!clerkUserId) return;
    setLoadingOrders(true);
    fetch(
      `${STRAPI_URL}/api/orders?filters[vendorClerkId][$eq]=${clerkUserId}&populate=*&sort=createdAt:desc`
    )
      .then((r) => r.json())
      .then((d) => setOrders(d.data || []))
      .catch(console.error)
      .finally(() => setLoadingOrders(false));
  }, [clerkUserId]);

  // ── Fetch vendor profile ────────────────────────────────────────────────
  useEffect(() => {
    if (!vendorId) return;
    setLoadingVendor(true);
    fetch(`${STRAPI_URL}/api/vendors/${vendorId}`)
      .then((r) => r.json())
      .then((d) => setVendor(d.data?.attributes || null))
      .catch(console.error)
      .finally(() => setLoadingVendor(false));
  }, [vendorId]);

  // ── Derived stats ───────────────────────────────────────────────────────
  const soldListings = listings.filter(
    (l) => l.attributes?.sold || l.attributes?.status === "sold"
  );
  const activeListings = listings.filter(
    (l) => !l.attributes?.sold && l.attributes?.status !== "sold"
  );
  const totalRevenue = soldListings.reduce(
    (sum, l) => sum + (Number(l.attributes?.price) || 0),
    0
  );
  const pendingOrders = orders.filter(
    (o) => o.attributes?.status === "pending"
  );

  // ── Chart data: last 6 months ───────────────────────────────────────────
  const buildChartData = (items, dateKey = "createdAt") => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        label: d.toLocaleString("default", { month: "short" }),
        month: d.getMonth(),
        year: d.getFullYear(),
        value: 0,
      });
    }
    items.forEach((item) => {
      const d = new Date(item.attributes?.[dateKey]);
      const entry = months.find(
        (m) => m.month === d.getMonth() && m.year === d.getFullYear()
      );
      if (entry) entry.value++;
    });
    return months;
  };

  // ── Listing actions ─────────────────────────────────────────────────────
  const handleListingSaved = (savedListing, isEdit) => {
    if (isEdit) {
      setListings((prev) =>
        prev.map((l) => (l.id === savedListing.id ? savedListing : l))
      );
    } else {
      setListings((prev) => [savedListing, ...prev]);
    }
    setListingModal(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`${STRAPI_URL}/api/products/${deleteTarget}`, {
        method: "DELETE",
      });
      setListings((prev) => prev.filter((l) => l.id !== deleteTarget));
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleMarkSold = async (id) => {
    try {
      const res = await fetch(`${STRAPI_URL}/api/products/${id}`, {
        method: "PUT",
        headers: apiHeaders(),
        body: JSON.stringify({ data: { sold: true, status: "sold" } }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setListings((prev) =>
        prev.map((l) => (l.id === id ? updated.data : l))
      );
    } catch {
      alert("Failed to mark as sold.");
    }
  };

  // ── Tab config ──────────────────────────────────────────────────────────
  const tabs = [
    { key: "overview", label: "Overview", emoji: "📊" },
    { key: "listings", label: "Listings", emoji: "🏷️" },
    { key: "orders", label: "Orders", emoji: "📦" },
    { key: "store", label: "Store Profile", emoji: "🏪" },
  ];

  const storeName =
    vendor?.storeName ||
    user?.firstName ||
    "My Store";

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F4F6F3] font-[Lexend]">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#177529] to-[#97C040] pt-24 pb-14 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-end gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-4xl shadow-inner">
            🏪
          </div>
          <div className="text-center md:text-left flex-1">
            <p className="text-green-200 text-sm mb-0.5">Vendor Dashboard</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {storeName}
            </h1>
            {vendor?.contactPhone && (
              <p className="text-green-200 text-sm mt-1">
                📞 {vendor.contactPhone}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
              <span className="text-xs bg-green-700/40 text-green-100 px-2.5 py-1 rounded-full font-medium">
                ✅ Approved Vendor
              </span>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={() => setStoreModal(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition"
            >
              ✏️ Edit Store
            </button>
            <button
              onClick={() => signOut(() => navigate("/"))}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.key
                  ? "border-[#177529] text-[#177529]"
                  : "border-transparent text-gray-500 hover:text-[#177529]"
              }`}
            >
              {tab.emoji} {tab.label}
              {tab.key === "orders" && pendingOrders.length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {pendingOrders.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* OVERVIEW ──────────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard emoji="🏷️" label="Active Listings" value={activeListings.length} color="#177529" />
              <StatCard emoji="✅" label="Items Sold" value={soldListings.length} color="#97C040" />
              <StatCard
                emoji="💰"
                label="Total Revenue"
                value={`UGX ${fmt(totalRevenue)}`}
                color="#F8C810"
                sub="from sold items"
              />
              <StatCard
                emoji="📦"
                label="Orders"
                value={orders.length}
                color="#177529"
                sub={`${pendingOrders.length} pending`}
              />
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm font-semibold text-[#0C0D19] mb-0.5">
                  Listings Posted
                </p>
                <p className="text-xs text-gray-400 mb-4">Last 6 months</p>
                <BarChart data={buildChartData(listings)} color="#177529" />
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm font-semibold text-[#0C0D19] mb-0.5">
                  Orders Received
                </p>
                <p className="text-xs text-gray-400 mb-4">Last 6 months</p>
                <BarChart data={buildChartData(orders)} color="#97C040" />
              </div>
            </div>

            {/* Recent listings preview */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-[#0C0D19]">
                  Recent Listings
                </p>
                <button
                  onClick={() => setActiveTab("listings")}
                  className="text-xs text-[#177529] hover:underline"
                >
                  View all →
                </button>
              </div>
              {loadingListings ? (
                <p className="text-sm text-gray-400">Loading...</p>
              ) : listings.length === 0 ? (
                <p className="text-sm text-gray-400">No listings yet.</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {listings.slice(0, 5).map((l) => {
                    const isSold =
                      l.attributes?.sold || l.attributes?.status === "sold";
                    return (
                      <div
                        key={l.id}
                        className="py-3 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium text-[#0C0D19]">
                            {l.attributes?.title}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(
                              l.attributes?.createdAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[#177529]">
                            UGX {fmt(l.attributes?.price)}
                          </p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              isSold
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {isSold ? "Sold" : "Active"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* LISTINGS ──────────────────────────────────────────────────────── */}
        {activeTab === "listings" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#0C0D19]">
                  My Listings
                </h2>
                <p className="text-sm text-gray-500">
                  {activeListings.length} active · {soldListings.length} sold
                </p>
              </div>
              <button
                onClick={() => setListingModal("add")}
                className="px-4 py-2 bg-[#177529] text-white rounded-xl text-sm font-semibold hover:bg-[#135c21] transition"
              >
                + Add Listing
              </button>
            </div>

            {loadingListings ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-gray-100 h-52 animate-pulse"
                  />
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <p className="text-4xl mb-3">📦</p>
                <p className="text-gray-500 font-medium">No listings yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  Add your first product to start selling.
                </p>
                <button
                  onClick={() => setListingModal("add")}
                  className="mt-4 px-5 py-2 bg-[#177529] text-white rounded-xl text-sm font-semibold hover:bg-[#135c21] transition"
                >
                  + Add First Listing
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {listings.map((listing) => {
                  const attr = listing.attributes;
                  const isSold = attr?.sold || attr?.status === "sold";
                  const imageUrl = attr?.images?.data?.[0]?.attributes?.url
                    ? `${STRAPI_URL}${attr.images.data[0].attributes.url}`
                    : null;

                  return (
                    <div
                      key={listing.id}
                      className={`relative bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition ${
                        isSold
                          ? "border-green-100 opacity-75"
                          : "border-gray-100"
                      }`}
                    >
                      {isSold && (
                        <div className="absolute top-2 left-2 z-10 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                          Sold
                        </div>
                      )}
                      <div className="h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={attr?.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl">📷</span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-semibold text-sm text-[#0C0D19] truncate">
                          {attr?.title}
                        </p>
                        <p className="text-[#177529] font-bold text-sm mt-0.5">
                          UGX {fmt(attr?.price)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(attr?.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex gap-1.5 mt-3">
                          {!isSold && (
                            <button
                              onClick={() => handleMarkSold(listing.id)}
                              className="flex-1 text-xs py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition font-medium"
                            >
                              Mark Sold
                            </button>
                          )}
                          <button
                            onClick={() => setListingModal(listing)}
                            className="flex-1 text-xs py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget(listing.id)}
                            className="text-xs px-2 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ORDERS ─────────────────────────────────────────────────────────── */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#0C0D19]">
                Orders Received
              </h2>
              <p className="text-sm text-gray-500">
                {orders.length} total · {pendingOrders.length} pending
              </p>
            </div>

            {loadingOrders ? (
              <p className="text-sm text-gray-400">Loading orders...</p>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <p className="text-4xl mb-3">📬</p>
                <p className="text-gray-500 font-medium">No orders yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  Orders from buyers will appear here.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {orders.map((order) => {
                  const attr = order.attributes;
                  const statusColors = {
                    pending: "bg-yellow-100 text-yellow-700",
                    completed: "bg-green-100 text-green-700",
                    cancelled: "bg-red-100 text-red-600",
                  };
                  return (
                    <div
                      key={order.id}
                      className="p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-sm text-[#0C0D19]">
                          Order #{order.id}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(attr?.createdAt).toLocaleDateString(
                            "en-UG",
                            { day: "numeric", month: "short", year: "numeric" }
                          )}
                        </p>
                        {attr?.buyerEmail && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            👤 {attr.buyerEmail}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#177529]">
                          UGX{" "}
                          {fmt(attr?.total || attr?.amount)}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
                            statusColors[attr?.status] ||
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {attr?.status || "placed"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STORE PROFILE ──────────────────────────────────────────────────── */}
        {activeTab === "store" && (
          <div className="max-w-xl space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-[#0C0D19]">
                  Store Profile
                </h2>
                <button
                  onClick={() => setStoreModal(true)}
                  className="px-3 py-1.5 bg-[#177529] text-white rounded-lg text-xs font-semibold hover:bg-[#135c21] transition"
                >
                  ✏️ Edit
                </button>
              </div>

              {loadingVendor ? (
                <p className="text-sm text-gray-400">Loading...</p>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: "Store Name", value: vendor?.storeName || "—" },
                    {
                      label: "Contact Phone",
                      value: vendor?.contactPhone || "Not set",
                    },
                    {
                      label: "Status",
                      value: (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          {vendor?.status || "approved"}
                        </span>
                      ),
                    },
                    {
                      label: "Description",
                      value: vendor?.storeDescription || "No description yet.",
                    },
                    {
                      label: "Member Since",
                      value: vendor?.createdAt
                        ? new Date(vendor.createdAt).toLocaleDateString(
                            "en-UG",
                            { day: "numeric", month: "long", year: "numeric" }
                          )
                        : "—",
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between gap-4">
                      <span className="text-sm text-gray-400 flex-shrink-0">
                        {label}
                      </span>
                      <span className="text-sm font-medium text-[#0C0D19] text-right">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Account actions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-[#0C0D19] mb-4">
                Account Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate("/")}
                  className="w-full text-left px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 text-sm text-gray-700 transition"
                >
                  ← Back to Marketplace
                </button>
                <button
                  onClick={() => signOut(() => navigate("/"))}
                  className="w-full text-left px-4 py-3 rounded-xl border border-red-100 hover:bg-red-50 text-sm text-red-600 transition"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {listingModal && (
        <ListingModal
          listing={listingModal === "add" ? null : listingModal}
          vendorClerkId={clerkUserId}
          onClose={() => setListingModal(null)}
          onSaved={handleListingSaved}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {storeModal && (
        <StoreProfileModal
          vendor={vendor}
          clerkUser={user}
          onClose={() => setStoreModal(false)}
          onSaved={(updated) => {
            setVendor((prev) => ({ ...prev, ...updated }));
            setStoreModal(false);
          }}
        />
      )}
    </div>
  );
}