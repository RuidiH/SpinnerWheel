import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import User from '../pages/User';
import Restaurant from '../pages/Restaurant';
import { apiService, GameConfig } from '../services/api';
import { wsService } from '../services/websocket';

// Styled components for page controls
const PageControlBar = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  background: rgba(0, 0, 0, 0.7);
  padding: 10px 20px;
  border-radius: 25px;
  backdrop-filter: blur(10px);
  z-index: 1000;
`;

const PageButton = styled.button<{ $active: boolean; $disabled?: boolean }>`
  padding: 8px 16px;
  border: none;
  border-radius: 18px;
  background: ${props => {
    if (props.$disabled) return 'rgba(128, 128, 128, 0.3)';
    return props.$active 
      ? 'rgba(102, 126, 234, 0.8)' 
      : 'rgba(255, 255, 255, 0.1)';
  }};
  color: ${props => props.$disabled ? 'rgba(255, 255, 255, 0.5)' : 'white'};
  font-size: 14px;
  font-weight: 500;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  white-space: nowrap;
  opacity: ${props => props.$disabled ? '0.6' : '1'};
  
  &:hover {
    background: ${props => {
      if (props.$disabled) return 'rgba(128, 128, 128, 0.3)';
      return props.$active 
        ? 'rgba(102, 126, 234, 1)' 
        : 'rgba(255, 255, 255, 0.2)';
    }};
    transform: ${props => props.$disabled ? 'none' : 'translateY(-1px)'};
  }

  &:active {
    transform: ${props => props.$disabled ? 'none' : 'translateY(0)'};
  }
`;

const Display: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('lottery1');
  const [loading, setLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);

  // Load initial configuration to determine current page
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const config = await apiService.getConfig();
      setCurrentPage(config.current_page || 'lottery1');
    } catch (error) {
      console.error('Failed to load config:', error);
      // Fallback to lottery1 if config fails to load
      setCurrentPage('lottery1');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize and set up WebSocket listeners
  useEffect(() => {
    loadConfig();
    
    // Connect WebSocket
    wsService.connect();

    // Listen for page switching events
    const unsubscribePageSwitch = wsService.on('page_switched', (data: any) => {
      console.log('Page switched to:', data.page);
      setCurrentPage(data.page);
    });

    // Listen for config updates
    const unsubscribeConfig = wsService.onConfigUpdated((data: GameConfig) => {
      setCurrentPage(data.current_page || 'lottery1');
    });
    
    // Listen for spin events to manage page switching lock
    const unsubscribeSpinStarted = wsService.onSpinStarted(() => {
      setIsSpinning(true);
    });

    const unsubscribeSpinCompleted = wsService.onSpinCompleted(() => {
      // Don't unlock page switching yet - wait for spin_lock_cleared
    });

    // Listen for lock cleared event
    const unsubscribeSpinLockCleared = wsService.on('spin_lock_cleared', () => {
      setIsSpinning(false);
    });

    // Listen for spin lock recovery
    const unsubscribeSpinRecovered = wsService.on('spin_lock_recovered', () => {
      setIsSpinning(false);
    });

    // Keep connection alive with ping
    const pingInterval = setInterval(() => {
      if (wsService.isConnected()) {
        wsService.ping();
      }
    }, 30000);

    // Cleanup
    return () => {
      unsubscribePageSwitch();
      unsubscribeConfig();
      unsubscribeSpinStarted();
      unsubscribeSpinCompleted();
      unsubscribeSpinLockCleared();
      unsubscribeSpinRecovered();
      clearInterval(pingInterval);
      wsService.disconnect();
    };
  }, [loadConfig]);

  // Handle page switching
  const handlePageSwitch = async (targetPage: string) => {
    // Block page switching during spins
    if (isSpinning) {
      console.log('Page switching blocked - spin in progress');
      return;
    }
    
    try {
      const response = await fetch('/api/switch-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ page: targetPage }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to switch page:', error.error);
      }
    } catch (error) {
      console.error('Failed to switch page:', error);
    }
  };

  // Show loading state 
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '24px'
      }}>
        加载中...
      </div>
    );
  }

  // Render the appropriate page with controls
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'lottery1':
        // Force mode 1 for lottery1 page - removed key to prevent remounting
        return <User forcedMode={1} />;
      
      case 'lottery2':
        // Force mode 2 for lottery2 page - removed key to prevent remounting
        return <User forcedMode={2} />;
      
      case 'advertisement':
        return <Restaurant />;
      
      default:
        console.warn('Unknown page type:', currentPage, 'falling back to lottery1');
        return <User forcedMode={1} />;
    }
  };

  return (
    <>
      {/* Page Control Bar - Only show on lottery pages */}
      {currentPage !== 'advertisement' && (
        <PageControlBar>
          <PageButton 
            $active={currentPage === 'lottery1'}
            $disabled={isSpinning}
            onClick={() => handlePageSwitch('lottery1')}
          >
            抽奖模式 1
          </PageButton>
          <PageButton 
            $active={currentPage === 'lottery2'}
            $disabled={isSpinning}
            onClick={() => handlePageSwitch('lottery2')}
          >
            抽奖模式2
          </PageButton>
          <PageButton 
            $active={currentPage === 'advertisement'}
            $disabled={isSpinning}
            onClick={() => handlePageSwitch('advertisement')}
          >
            广告展示
          </PageButton>
        </PageControlBar>
      )}

      {/* Current Page Content */}
      {renderCurrentPage()}
    </>
  );
};

export default Display;