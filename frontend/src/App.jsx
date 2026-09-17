import "./App.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import Schedule from "./pages/Schedule";
import Payroll from "./pages/Payroll";
import Projects from "./pages/Projects";
import ManagerDashboard from "./pages/ManagerDashboard";
import DeveloperDashboard from "./pages/DeveloperDashboard";
import ServiceDeliveryDashboard from "./pages/ServiceDeliveryDashboard";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Users from "./components/Users";

export default function App() {
  return (
    <BrowserRouter>
      <div className="d-flex flex-column min-vh-100">
        <Header />

        <div className="flex-fill">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/users" element={<Users />} />
            <Route path="/manager-dashboard" element={<ManagerDashboard />} />
            <Route
              path="/developer-dashboard"
              element={<DeveloperDashboard />}
            />
            <Route
              path="/service-delivery-dashboard"
              element={<ServiceDeliveryDashboard />}
            />
          </Routes>
        </div>

        <Footer />
      </div>
    </BrowserRouter>
  );
}
