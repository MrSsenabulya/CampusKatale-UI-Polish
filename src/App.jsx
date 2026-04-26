import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth, useUser, AuthenticateWithRedirectCallback } from "@clerk/clerk-react";

import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import ProductDetail from "./pages/ProductDetail";
import AddListing from "./pages/AddListing";
import Wishlist from "./pages/Wishlist";
import Notifications from "./pages/Notifications";
import VendorPending from "./pages/VendorPending";
import VendorDashboard from "./pages/VendorDashboard"; 
import VendorOnboarding from "./pages/VendorOnboarding";

// Generic auth guard
function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen font-[Lexend] text-[#177529]">
        Checking authentication...
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
}

// Role-based guard 
function RoleGuard({ allowedRoles, fallback = "/", children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen font-[Lexend] text-[#177529]">
        Checking authentication...
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  const role = user?.publicMetadata?.role;

  if (!allowedRoles.includes(role)) {
    return <Navigate to={fallback} replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>

      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/product/:id" element={<ProductDetail />} />

      {/*  OAuth SSO callback */}
      <Route
        path="/sso-callback"
        element={<AuthenticateWithRedirectCallback />}
      />

      {/* Buyer routes */}
      <Route
        path="/profile/:id"
        element={
          <RoleGuard allowedRoles={["user"]} fallback="/vendor/dashboard">
            <Profile />
          </RoleGuard>
        }
      />
      <Route
        path="/add-listing"
        element={
          <ProtectedRoute>
            <AddListing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/wishlist"
        element={
          <ProtectedRoute>
            <Wishlist />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />

      {/* Pending screen — any signed-in vendor sees this while awaiting approval */}
      <Route
        path="/vendor/pending"
        element={
          <ProtectedRoute>
            <VendorPending />
          </ProtectedRoute>
        }
      />

      {/* Dashboard — approved vendors only */}
      <Route
        path="/vendor/dashboard"
        element={
          <RoleGuard allowedRoles={["vendor"]} fallback="/auth">
            {/* Replace the placeholder below with <VendorDashboard /> when built */}
            <VendorDashboard />
          </RoleGuard>
        }
      />
      <Route
        path="/vendor/onboarding"
        element={
          <RoleGuard allowedRoles={["vendor"]} fallback="/auth">
            {/* Replace the placeholder below with <VendorDashboard /> when built */}
            <VendorOnboarding />
          </RoleGuard>
        }
      />

      {/* ── Catch-all ──────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />

      {/* Future routes — uncomment as you build them:
      <Route path="/marketplace" element={<MarketplacePage />} />
      <Route path="/chat/:userId" element={<ChatPage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
      */}

    </Routes>
  );
}

export default App;