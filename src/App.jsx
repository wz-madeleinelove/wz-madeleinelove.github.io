// src/App.jsx
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useEffect } from 'react';
import DrawPage from './pages/DrawPage';
import AdminPage from './pages/AdminPage';
import AdminLoginPage from './pages/AdminLoginPage';
import RequireAdmin from './components/RequireAdmin';
import useAuthStore from './store/useAuthStore';
import './App.css';

function App() {
  useEffect(() => {
    // ✅ getState()로 고정 참조를 가져오면 deps가 필요 없음(빈 배열 유지)
    const { listenAuthState } = useAuthStore.getState();
    const unsub = listenAuthState();

    // (선택) 구독 해제 반환—store에서 onAuthStateChanged의 unsubscribe를 반환하도록 해두었다면:
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []); // ✅ 항상 빈 배열

  return (
    <Router>
      <Routes>
        <Route path="/" element={<DrawPage />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminPage />
            </RequireAdmin>
          }
        />
        <Route path="/admin-login" element={<AdminLoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;
