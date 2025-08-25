import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import Admin from './pages/Admin';
import Display from './components/Display';
import './App.css';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  font-family: 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif;
`;

const GlobalStyles = styled.div`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  body {
    font-family: 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`;

function App() {
  return (
    <>
      <GlobalStyles />
      <AppContainer>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/user" replace />} />
            <Route path="/user" element={<Display />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/user" replace />} />
          </Routes>
        </Router>
      </AppContainer>
    </>
  );
}

export default App;