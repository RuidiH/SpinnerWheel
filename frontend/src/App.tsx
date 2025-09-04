import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import Admin from './pages/Admin';
import Display from './components/Display';
import Restaurant from './pages/Restaurant';
import './App.css';

const AppContainer = styled.div`
  min-height: 100vh;
  background-image: url('/bg.png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
  background-attachment: fixed;
  display: flex;
  flex-direction: column;
  font-family: 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif;
  
  /* Fallback for older browsers or if image fails to load */
  background-color: #DC143C;
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
            <Route path="/restaurant" element={<Restaurant />} />
            <Route path="*" element={<Navigate to="/user" replace />} />
          </Routes>
        </Router>
      </AppContainer>
    </>
  );
}

export default App;