import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TypesetterView from './views/TypesetterView';
import AdminView from './views/AdminView';
import LoginView from './views/LoginView';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TypesetterView />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="/admin" element={<AdminView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
