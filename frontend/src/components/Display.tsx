import React, { useState, useEffect, useCallback } from 'react';
import User from '../pages/User';
import Restaurant from '../pages/Restaurant';
import { apiService, GameConfig } from '../services/api';
import { wsService } from '../services/websocket';

// Note: Page control components removed as per redesign requirements

const Display: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('lottery1');
  const [loading, setLoading] = useState(true);

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
      clearInterval(pingInterval);
      wsService.disconnect();
    };
  }, [loadConfig]);

  // Note: Page switching removed as per redesign requirements

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
      {/* Current Page Content */}
      {renderCurrentPage()}
    </>
  );
};

export default Display;