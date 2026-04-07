import { Navigate, Route, Routes } from "react-router-dom";
import { AdminProtected, VoterProtected } from "./components/ProtectedRoute.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import VotingPage from "./pages/VotingPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ResultsPage from "./pages/ResultsPage.jsx";
import SuccessPage from "./pages/SuccessPage.jsx";
import AdminLayout from "./admin/AdminLayout.jsx";
import AdminLoginPage from "./admin/AdminLoginPage.jsx";
import AdminDashboardPage from "./admin/AdminDashboardPage.jsx";
import AdminCandidatesPage from "./admin/AdminCandidatesPage.jsx";
import AdminAddCandidatePage from "./admin/AdminAddCandidatePage.jsx";
import AdminVotersPage from "./admin/AdminVotersPage.jsx";
import AdminElectionPage from "./admin/AdminElectionPage.jsx";
import AdminStatisticsPage from "./admin/AdminStatisticsPage.jsx";
import AdminResultsPage from "./admin/AdminResultsPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <VoterProtected>
            <DashboardPage />
          </VoterProtected>
        }
      />
      <Route
        path="/vote"
        element={
          <VoterProtected>
            <VotingPage />
          </VoterProtected>
        }
      />
      <Route
        path="/profile"
        element={
          <VoterProtected>
            <ProfilePage />
          </VoterProtected>
        }
      />
      <Route
        path="/results"
        element={
          <VoterProtected>
            <ResultsPage />
          </VoterProtected>
        }
      />
      <Route
        path="/success"
        element={
          <VoterProtected>
            <SuccessPage />
          </VoterProtected>
        }
      />

      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="admin"
        element={
          <AdminProtected>
            <AdminLayout />
          </AdminProtected>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="candidates" element={<AdminCandidatesPage />} />
        <Route path="add-candidate" element={<AdminAddCandidatePage />} />
        <Route path="voters" element={<AdminVotersPage />} />
        <Route path="election" element={<AdminElectionPage />} />
        <Route path="statistics" element={<AdminStatisticsPage />} />
        <Route path="results" element={<AdminResultsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
