import "./App.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import Schedule from "./pages/Schedule";
import Timesheet from "./pages/Timesheet";
import HandoffManagement from "./pages/HandoffManagement";
import AuthCallback from "./pages/AuthCallback";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="d-flex flex-column min-vh-100">
          <Header />

          <div className="flex-fill">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
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
          </div>

          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
