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

const Header = styled.div`
  text-align: center;
  color: white;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 10px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
  font-size: 18px;
  opacity: 0.9;
  margin: 0;
`;

const GameArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  width: 100%;
  max-width: 1400px;
  
  @media (min-width: 1200px) {
    flex-direction: row;
    align-items: flex-start;
    justify-content: center;
    gap: 40px;
  }
`;

const WheelSection = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 30px;
  order: 2;
  flex-wrap: wrap;
  justify-content: center;
  
  @media (min-width: 1200px) {
    order: 2;
    flex-wrap: nowrap;
  }
  
  @media (max-width: 1199px) {
    flex-direction: column;
    gap: 20px;
  }
`;

const WheelWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const StatusWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 280px;
  
  @media (max-width: 1199px) {
    width: 100%;
    max-width: 400px;
  }
`;

const GameStatus = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  text-align: center;
  min-width: 280px;
`;

const StatusItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px 0;
  font-size: 16px;
`;

const StatusLabel = styled.span`
  color: #666;
  font-weight: 500;
`;

const StatusValue = styled.span`
  color: #333;
  font-weight: 700;
  font-size: 18px;
`;

const GameModeIndicator = styled.div<{ $mode: number }>`
  background: ${props => props.$mode === 1 ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'linear-gradient(135deg, #f093fb, #f5576c)'};
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
`;

const SpinInstruction = styled.div`
  color: white;
  text-align: center;
  background: rgba(0, 0, 0, 0.2);
  padding: 16px 24px;
  border-radius: 8px;
  margin-top: 16px;
  font-size: 16px;
  font-weight: 500;
`;

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
  width: 100%;
  max-width: 300px;
  order: 1;
  
  @media (min-width: 1200px) {
    order: 1;
    max-width: 280px;
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
        
        // Calculate correct prize text
        const frontendPrize = getCorrectPrizeText(result.index, result.mode);
        let finalPrize = frontendPrize;
        if (!frontendPrize || frontendPrize === '奖品' || frontendPrize === '再接再厉') {
          if (result.prize && result.prize.trim()) {
            finalPrize = result.prize;
          }
        }
        
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

  // Get display mode (with forced mode override)
  const getDisplayMode = (): number => {
    return forcedMode ?? config?.mode ?? 1;
  };

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
      
      <Header>
        <Title>幸运转盘</Title>
        <Subtitle>管理员控制抽奖</Subtitle>
      </Header>

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
              disabled={config.remaining_spins <= 0}
            />
          </WheelWrapper>
          
          <StatusWrapper>
            <GameStatus>
              <GameModeIndicator $mode={getDisplayMode()}>
                {getDisplayMode() === 1 ? '经典模式' : '固定概率模式'}
              </GameModeIndicator>
              
              <StatusItem>
                <StatusLabel>当前玩家:</StatusLabel>
                <StatusValue>{config.current_player}</StatusValue>
              </StatusItem>
              
              <StatusItem>
                <StatusLabel>剩余次数:</StatusLabel>
                <StatusValue>{config.remaining_spins}</StatusValue>
              </StatusItem>
            </GameStatus>


            {config.remaining_spins === 0 && (
              <SpinInstruction>
                抽奖次数已用完
              </SpinInstruction>
            )}
          </StatusWrapper>
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