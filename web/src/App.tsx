import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { APP_ROUTES } from "@/config/routes";

import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import FeedPage from "@/pages/FeedPage";
import ConnectionsPage from "@/pages/ConnectionsPage";
import RequestsPage from "@/pages/RequestsPage";
import ChatIndexPage from "@/pages/ChatIndexPage";
import ChatRoomPage from "@/pages/ChatRoomPage";
import ProfilePage from "@/pages/ProfilePage";
import PremiumPage from "@/pages/PremiumPage";

export function AppRoutes() {
  return (
    <div className="min-h-screen flex flex-col flex-1">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path={APP_ROUTES.HOME} element={<HomePage />} />
          <Route path={APP_ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={APP_ROUTES.SIGNUP} element={<SignupPage />} />
          <Route path={APP_ROUTES.FEED} element={<FeedPage />} />
          <Route path={APP_ROUTES.CONNECTIONS} element={<ConnectionsPage />} />
          <Route path={APP_ROUTES.REQUESTS} element={<RequestsPage />} />
          <Route path={APP_ROUTES.CHAT} element={<ChatIndexPage />} />
          <Route
            path="/chat/:targetUserId"
            element={<ChatRoomPage />}
          />
          <Route path={APP_ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path={APP_ROUTES.PREMIUM} element={<PremiumPage />} />
          <Route path="*" element={<Navigate to={APP_ROUTES.HOME} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ToastProvider>
  );
}
