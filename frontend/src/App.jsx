import "./App.css";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Aside from "./components/Aside";
import Footer from "./components/Footer";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import Preferences from "./pages/Preferences";
import Schedule from "./pages/Schedule";
import Timesheet from "./pages/Timesheet";
import Projects from "./pages/Projects";
import HandoffManagement from "./pages/HandoffManagement";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";

function AppLayout() {
  const { user } = useAuth();

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />

      {user ? (
        <div className="app-container">
          <Sidebar />

          <main className="main-container">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <Projects />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={["manager", "admin"]}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/preferences"
                element={
                  <ProtectedRoute>
                    <Preferences />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/schedule"
                element={
                  <ProtectedRoute allowedRoles={["manager", "sd", "developer"]}>
                    <Schedule />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/timesheet"
                element={
                  <ProtectedRoute allowedRoles={["manager", "sd", "developer"]}>
                    <Timesheet />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/handoff"
                element={
                  <ProtectedRoute allowedRoles={["manager", "sd", "developer"]}>
                    <HandoffManagement />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Aside />
        </div>
      ) : (
        <div className="flex-fill">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
