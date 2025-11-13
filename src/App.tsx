// src/App.tsx
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";

import { SplashScreen } from "@/components/SplashScreen";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

import { useAuthStore } from "@/stores/authStore";

const queryClient = new QueryClient();


function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuthStore();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/signin" replace />;
  return children;
}

function GuestOnly({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuthStore();
  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to="/" replace />;
  return children;
}


const SignInFormWrapper = () => {
  const navigate = useNavigate();
  return (
    <SignInForm
      onSignUp={() => navigate("/signup")}
      onForgotPassword={() => navigate("/forgot-password")}
    />
  );
};

const SignUpFormWrapper = () => {
  const navigate = useNavigate();
  return <SignUpForm onSignIn={() => navigate("/signin")} />;
};

const ForgotPasswordFormWrapper = () => {
  const navigate = useNavigate();
  return <ForgotPasswordForm onBackToSignIn={() => navigate("/signin")} />;
};


const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashComplete = () => setShowSplash(false);


  const initAuth = useAuthStore((s) => s.init);
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vendor-app-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {showSplash ? (
            <SplashScreen onComplete={handleSplashComplete} />
          ) : (
            <BrowserRouter>
              <Routes>
                {/* Dashboard (Protected) */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  }
                />

                {/* Auth Routes (Guest only) */}
                <Route
                  path="/signin"
                  element={
                    <GuestOnly>
                      <SignInFormWrapper />
                    </GuestOnly>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <GuestOnly>
                      <SignUpFormWrapper />
                    </GuestOnly>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <GuestOnly>
                      <ForgotPasswordFormWrapper />
                    </GuestOnly>
                  }
                />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          )}
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
