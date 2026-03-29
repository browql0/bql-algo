import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import LandingPage from './components/landing/LandingPage';
import EditorLayout from './components/editor/EditorLayout';
import AuthLayout from './components/auth/AuthLayout';
import Login from './components/auth/Login';
import SignUp from './components/auth/SignUp';

const App = () => {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<LandingPage onStart={() => navigate('/editor')} />} />
      <Route path="/editor" element={<EditorLayout />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
      </Route>
    </Routes>
  );
};

export default App;
