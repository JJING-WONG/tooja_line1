import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/investor/LoginPage";
import AdminLoginPage from "./pages/admin/LoginPage";
import HomePage from "./pages/investor/HomePage";
import TeamDetailPage from "./pages/investor/TeamDetailPage";
import InvestmentSuccessPage from "./pages/investor/InvestmentSuccessPage";
import InvestorProtectedRoute from "./features/auth/components/InvestorProtectedRoute";

function App() {
  return (
    <Routes>
      {/* 투자자 */}
      <Route element={<InvestorProtectedRoute guestOnly />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route element={<InvestorProtectedRoute />}>
        <Route path="/invest" element={<HomePage />} />
        <Route path="/invest/teams/:teamId" element={<TeamDetailPage />} />
        <Route
          path="/invest/success/:investmentId"
          element={<InvestmentSuccessPage />}
        />
      </Route>

      {/* 관리자 */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<div>관리자 홈</div>} />

      {/* 공개 대시보드 */}
      <Route path="/dashboard" element={<div>공개 대시보드</div>} />
    </Routes>
  );
}

export default App;
