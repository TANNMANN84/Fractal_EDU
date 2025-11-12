import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '../contexts/AppContext'; 

import RootLayout from '../components/RootLayout';
import ProfilerPage from './ProfilerPage';
import AnalysisPage from './exam-analysis/AnalysisPage';

const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter basename="/Fractal_EDU">
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<ProfilerPage />} />
            <Route path="analysis" element={<AnalysisPage />} />
            {/* You can add more routes here later */}
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
