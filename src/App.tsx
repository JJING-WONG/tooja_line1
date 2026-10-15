import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/investor/LoginPage";

function App() {
  return (
    <Routes>
      {/* 투자자 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/invest" element={<div>투자 홈</div>} />

      {/* 관리자 */}
      <Route path="/admin/login" element={<div>관리자 로그인</div>} />
      <Route path="/admin" element={<div>관리자 홈</div>} />

      {/* 공개 대시보드 */}
      <Route path="/dashboard" element={<div>공개 대시보드</div>} />
    </Routes>
  );
}

export default App;
