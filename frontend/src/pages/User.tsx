import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import SpinnerWheel from '../components/SpinnerWheel';
import WinnerAnnouncements from '../components/WinnerAnnouncements';
import WinnerBanner from '../components/WinnerBanner';
import { apiService, GameConfig, SpinHistory, SpinResult, PrizeOption } from '../services/api';
import { wsService } from '../services/websocket';

const UserContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 30px;
`;

// Note: Header components removed as per redesign requirements

const GameArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 80vh;
`;

const WheelSection = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const WheelWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

// Note: Status components removed as per redesign requirements

const ErrorMessage = styled.div`
  background: #ff6b6b;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  margin: 16px 0;
  text-align: center;
  font-weight: 500;
`;

const LoadingMessage = styled.div`
  color: white;
  text-align: center;
  font-size: 18px;
  margin: 40px 0;
`;

const AnnouncementsSection = styled.div`
  position: fixed;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 280px;
  z-index: 100;
  
  @media (max-width: 1199px) {
    display: none; /* Hide on smaller screens to avoid overlap */
  }
`;

const ConnectionStatus = styled.div<{ $status: 'connected' | 'connecting' | 'disconnected' }>`
  position: fixed;
  top: 16px;
  right: 16px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 6px;
  
  background: ${props => {
    switch (props.$status) {
      case 'connected': return 'rgba(34, 197, 94, 0.9)';
      case 'connecting': return 'rgba(251, 191, 36, 0.9)';
      case 'disconnected': return 'rgba(239, 68, 68, 0.9)';
    }
  }};
  color: white;
  
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    ${props => props.$status === 'connecting' && 'animation: pulse 1.5s ease-in-out infinite;'}
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const ConnectionActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const ConnectionButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;



interface UserProps {
  forcedMode?: number; // Optional forced mode override (1 or 2)
}

const User: React.FC<UserProps> = ({ forcedMode }) => {
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [history, setHistory] = useState<SpinHistory>({ results: [] });
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningIndex, setWinningIndex] = useState<number | undefined>();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [winnerResult, setWinnerResult] = useState<SpinResult | null>(null);
  const [spinStartTime, setSpinStartTime] = useState<number | null>(null);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [configData, historyData] = await Promise.all([
        apiService.getConfig(),
        apiService.getHistory()
      ]);
      setConfig(configData);
      setHistory(historyData);
      setError('');
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('无法加载游戏数据，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize WebSocket and load data
  useEffect(() => {
    loadData();
    
    // Connect WebSocket only if not already connected
    if (!wsService.isConnected()) {
      wsService.connect();
    }
    
    // Set up connection status monitoring
    const statusInterval = setInterval(() => {
      const status = wsService.getConnectionStatus();
      setConnectionStatus(status);
      
      // Start HTTP polling fallback if disconnected
      if (status === 'disconnected' && !usingFallback) {
        console.log('🔄 Starting HTTP polling fallback');
        setUsingFallback(true);
        startHttpPolling();
      } else if (status === 'connected' && usingFallback) {
        console.log('✅ WebSocket reconnected, stopping HTTP polling fallback');
        setUsingFallback(false);
        stopHttpPolling();
      }
    }, 2000);
    
    // Set up permanent failure handler
    wsService.onPermanentFailure(() => {
      setConnectionStatus('disconnected');
      if (!usingFallback) {
        console.log('🔄 WebSocket permanently failed, starting HTTP polling fallback');
        setUsingFallback(true);
        startHttpPolling();
      }
    });

    // Set up WebSocket event handlers
    const unsubscribeConfig = wsService.onConfigUpdated((data: GameConfig) => {
      // Simply ignore config updates during spins (backend now blocks them)
      if (!isSpinning) {
        setConfig(data);
      }
    });

    const unsubscribeSpinStarted = wsService.onSpinStarted(() => {
      setIsSpinning(true);
      setSpinStartTime(Date.now());
      setError('');
    });

    const unsubscribeSpinCompleted = wsService.onSpinCompleted((data: any) => {
      const { result, config: newConfig } = data;
      setConfig(newConfig);
      setWinningIndex(result.index);
      
      // Schedule winner display and history refresh after animation
      setTimeout(async () => {
        // Refresh history from backend to avoid duplicates
        try {
          const historyData = await apiService.getHistory();
          setHistory(historyData);
        } catch (err) {
          console.error('Failed to reload history:', err);
        }
        
        // Use backend's prize text directly - it's authoritative and up-to-date
        // This fixes the issue where frontend config might be stale during config updates
        const finalPrize = result.prize && result.prize.trim() ? result.prize : getCorrectPrizeText(result.index, result.mode);
        
        const correctedResult = {
          ...result,
          prize: finalPrize
        };
        
        console.log('🏆 Showing winner banner for:', correctedResult);
        
        // Show winner banner (always works) - user can manually play audio
        setWinnerResult(correctedResult);
      }, 6000);

      // Stop spinning after animation completes
      setTimeout(() => {
        setIsSpinning(false);
        setWinningIndex(undefined);
        setSpinStartTime(null);
      }, 7000);
    });

    const unsubscribeStateUpdated = wsService.onStateUpdated((data: GameConfig) => {
      setConfig(data);
      setHistory({ results: [] }); // Clear history on reset
    });

    // Keep connection alive
    const pingInterval = setInterval(() => {
      if (wsService.isConnected()) {
        wsService.ping();
      }
    }, 30000);

    // Cleanup
    return () => {
      unsubscribeConfig();
      unsubscribeSpinStarted();
      unsubscribeSpinCompleted();
      unsubscribeStateUpdated();
      clearInterval(pingInterval);
      clearInterval(statusInterval);
      stopHttpPolling();
      wsService.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle spin request
  const handleSpin = async () => {
    if (!config || isSpinning || config.remaining_spins <= 0) {
      return;
    }

    try {
      setError('');
      
      // Ensure audio is unlocked for future automatic playback
      if (window.AudioManager?.ensureUnlocked) {
        window.AudioManager.ensureUnlocked();
      }
      
      await apiService.spin();
    } catch (err: any) {
      console.error('Spin failed:', err);
      setError(err.message || '抽奖失败，请重试');
      setIsSpinning(false);
    }
  };

  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [usingFallback, setUsingFallback] = useState(false);
  
  // HTTP polling fallback
  const fallbackPollingRef = useRef<NodeJS.Timeout | null>(null);
  

  
  // HTTP polling fallback when WebSocket fails
  const startHttpPolling = useCallback(() => {
    if (fallbackPollingRef.current) return; // Already polling
    
    const pollData = async () => {
      try {
        const [configData, historyData] = await Promise.all([
          apiService.getConfig(),
          apiService.getHistory()
        ]);
        
        // Update config if changed
        setConfig(prevConfig => {
          if (!prevConfig || JSON.stringify(prevConfig) !== JSON.stringify(configData)) {
            console.log('📡 HTTP fallback: Config updated');
            return configData;
          }
          return prevConfig;
        });
        
        // Update history if changed
        setHistory(prevHistory => {
          if (JSON.stringify(prevHistory.results) !== JSON.stringify(historyData.results)) {
            console.log('📡 HTTP fallback: History updated');
            return historyData;
          }
          return prevHistory;
        });
        
      } catch (err) {
        console.error('📡 HTTP polling failed:', err);
      }
    };
    
    // Initial poll
    pollData();
    
    // Poll every 5 seconds
    fallbackPollingRef.current = setInterval(pollData, 5000);
    console.log('📡 HTTP polling started (every 5 seconds)');
  }, []);
  
  const stopHttpPolling = useCallback(() => {
    if (fallbackPollingRef.current) {
      clearInterval(fallbackPollingRef.current);
      fallbackPollingRef.current = null;
      console.log('📡 HTTP polling stopped');
    }
  }, []);
  
  // Get correct prize text from frontend options
  const getCorrectPrizeText = (index: number, mode: number): string => {
    const wheelOptions = getWheelOptions();
    
    console.log('🎁 getCorrectPrizeText called:', {
      index,
      mode,
      wheelOptionsLength: wheelOptions.length,
      configExists: !!config,
      wheelOptions: wheelOptions.map((opt, i) => `${i}: ${opt.text}`)
    });
    
    if (index >= 0 && index < wheelOptions.length) {
      const prizeText = wheelOptions[index].text;
      console.log(`✅ Found prize at index ${index}: "${prizeText}"`);
      return prizeText;
    }
    
    // Better fallback logic
    if (mode === 2) {
      console.log('🎮 Mode 2 fallback: 再接再厉');
      return '再接再厉';
    } else {
      // Mode 1: Use index to generate prize name
      const fallbackPrize = `奖品${index + 1}`;
      console.log(`⚠️ Mode 1 fallback for index ${index}: "${fallbackPrize}"`);
      return fallbackPrize;
    }
  };


  // Get options based on mode (with forced mode override)
  const getWheelOptions = (): PrizeOption[] => {
    console.log('🎨 getWheelOptions called:', {
      configExists: !!config,
      configMode: config?.mode,
      forcedMode,
      mode1OptionsLength: config?.mode1_options?.length,
      mode1Options: config?.mode1_options
    });
    
    if (!config) {
      console.log('❌ No config available in getWheelOptions');
      return [];
    }
    
    // Use forced mode if provided, otherwise use config mode
    const activeMode = forcedMode ?? config.mode;
    console.log(`🎮 Using mode: ${activeMode}`);
    
    if (activeMode === 1) {
      const options = config.mode1_options || [];
      console.log(`🎁 Mode 1 options:`, options);
      return options;
    } else {
      // Mode 2: Configurable options
      const options: PrizeOption[] = [];
      const winRate = config.mode2_win_rate || 8.33;
      const loseRate = (100 - winRate) / 11;
      const loseText = config.mode2_lose_text || '再接再厉';
      const winText = config.mode2_win_text || '中奖了!';
      
      for (let i = 0; i < 11; i++) {
        options.push({ text: loseText, probability: loseRate });
      }
      options.push({ text: winText, probability: winRate });
      console.log(`🎁 Mode 2 options:`, options);
      return options;
    }
  };

  // Note: Display mode function removed as per redesign requirements

  if (loading) {
    return (
      <UserContainer>
        <LoadingMessage>加载中...</LoadingMessage>
      </UserContainer>
    );
  }

  if (!config) {
    return (
      <UserContainer>
        <ErrorMessage>无法加载游戏配置</ErrorMessage>
      </UserContainer>
    );
  }

  const wheelOptions = getWheelOptions();
  
  // Connection status helpers
  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return '已连接';
      case 'connecting': return '连接中...';
      case 'disconnected': return '连接断开';
      default: return '未知状态';
    }
  };
  
  const handleReconnect = () => {
    wsService.disconnect();
    setTimeout(() => {
      wsService.connect();
      setConnectionStatus('connecting');
    }, 100);
  };
  
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <UserContainer>
      <ConnectionStatus $status={connectionStatus}>
        {getStatusText(connectionStatus)}
        {usingFallback && ' (HTTP模式)'}
        {connectionStatus === 'disconnected' && (
          <ConnectionActions>
            <ConnectionButton onClick={handleReconnect}>重连</ConnectionButton>
            <ConnectionButton onClick={handleRefresh}>刷新</ConnectionButton>
          </ConnectionActions>
        )}
      </ConnectionStatus>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}

      <GameArea>
        <AnnouncementsSection>
          <WinnerAnnouncements results={history.results} />
        </AnnouncementsSection>

        <WheelSection>
          <WheelWrapper>
            <SpinnerWheel
              options={wheelOptions}
              onSpin={handleSpin}
              isSpinning={isSpinning}
              winningIndex={winningIndex}
              spinStartTime={spinStartTime}
              disabled={config.remaining_spins <= 0}
            />
          </WheelWrapper>
        </WheelSection>

      </GameArea>
      
      {/* Winner Banner - Simple, always reliable visual announcement */}
      {winnerResult && (
        <WinnerBanner
          player={winnerResult.player}
          prize={winnerResult.prize}
          mode={winnerResult.mode || 1}
          onClose={() => setWinnerResult(null)}
        />
      )}
    </UserContainer>
  );
};

export default User;