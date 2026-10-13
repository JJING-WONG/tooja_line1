import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <Routes>
      {/* 투자자 */}
      <Route path="/login" element={<div>투자자 로그인</div>} />
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