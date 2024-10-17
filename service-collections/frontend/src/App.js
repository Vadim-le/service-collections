import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ServiceCard from './components/ServiceCard';
import ServiceInfoPage from './components/ServiceInfoPage';

function App() {
  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<ServiceCard />} />
        <Route path="/services/:serviceName" element={<ServiceInfoPage />} />
      </Routes>
    </Router>
  );
}

export default App;