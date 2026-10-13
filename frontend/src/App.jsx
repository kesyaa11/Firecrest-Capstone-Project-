import "./App.css";

import { useState } from "react";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Aside from "./components/Aside";
import Footer from "./components/Footer";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";

import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import Schedule from "./pages/Schedule";
import Timesheet from "./pages/Timesheet";
import Projects from "./pages/Projects";

import HandoffManagement from "./pages/HandoffManagement";

import Preferences from "./pages/Preferences";
import Profile from "./pages/Profile";
import HelpSupport from "./pages/HelpSupport";
import BulkImport from "./pages/BulkImport";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";

function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();

  // Used to tell Leave Activity to reload after a new leave request is submitted
  const [leaveRefresh, setLeaveRefresh] = useState(0);

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
                    <Dashboard
                      onLeaveChanged={() =>
                        setLeaveRefresh((value) => value + 1)
                      }
                    />
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
                path="/bulk-import"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <BulkImport />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/help"
                element={
                  <ProtectedRoute>
                    <HelpSupport />
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
                    <Timesheet
                      onLeaveSubmitted={() =>
                        setLeaveRefresh((value) => value + 1)
                      }
                    />
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
          <Aside currentPath={location.pathname} leaveRefresh={leaveRefresh} />
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
