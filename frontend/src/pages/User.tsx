import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import SpinnerWheel from '../components/SpinnerWheel';
import History from '../components/History';
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
  
  @media (min-width: 1200px) {
    flex-direction: row;
    align-items: flex-start;
    gap: 40px;
  }
`;

const WheelSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
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

const HistorySection = styled.div`
  width: 100%;
  max-width: 400px;
  
  @media (min-width: 1200px) {
    max-width: 350px;
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

    // Set up WebSocket event handlers
    const unsubscribeConfig = wsService.onConfigUpdated((data: GameConfig) => {
      setConfig(data);
    });

    const unsubscribeSpinStarted = wsService.onSpinStarted(() => {
      setIsSpinning(true);
      setError('');
    });

    const unsubscribeSpinCompleted = wsService.onSpinCompleted((data: any) => {
      const { result, config: newConfig } = data;
      setConfig(newConfig);
      setWinningIndex(result.index);
      
      // Update history and announce result when wheel stops (maintains suspense)
      setTimeout(() => {
        // Update history at the climactic moment
        setHistory(prev => ({
          results: [result, ...prev.results]
        }));
        // Then announce result
        announceResult(result);
      }, 6000);

      // Stop spinning after animation completes and voice plays
      setTimeout(() => {
        setIsSpinning(false);
        setWinningIndex(undefined);
      }, 7500);
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
      wsService.disconnect();
    };
  }, []); // Removed loadData dependency to prevent effect re-registration

  // Handle spin request
  const handleSpin = async () => {
    if (!config || isSpinning || config.remaining_spins <= 0) {
      return;
    }

    try {
      setError('');
      await apiService.spin();
    } catch (err: any) {
      console.error('Spin failed:', err);
      setError(err.message || '抽奖失败，请重试');
      setIsSpinning(false);
    }
  };

  // Announce result using TTS
  const announceResult = (result: SpinResult) => {
    if ('speechSynthesis' in window) {
      // Prevent multiple simultaneous announcements
      if (speechSynthesis.speaking) {
        console.log('Speech already in progress, skipping announcement');
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(
        `玩家${result.player}抽中了${result.prize}`
      );
      utterance.lang = 'zh-CN';
      utterance.rate = 0.8;
      utterance.volume = 0.8;
      
      // Find Chinese voice if available
      const voices = speechSynthesis.getVoices();
      const chineseVoice = voices.find(voice => 
        voice.lang.includes('zh') || voice.lang.includes('CN')
      );
      if (chineseVoice) {
        utterance.voice = chineseVoice;
      }
      
      speechSynthesis.speak(utterance);
    } else {
      // Fallback to console
      console.log(`🎯 玩家${result.player}抽中了${result.prize}`);
    }
  };

  // Get options based on mode (with forced mode override)
  const getWheelOptions = (): PrizeOption[] => {
    if (!config) return [];
    
    // Use forced mode if provided, otherwise use config mode
    const activeMode = forcedMode ?? config.mode;
    
    if (activeMode === 1) {
      return config.mode1_options || [];
    } else {
      // Mode 2: Fixed options
      const options: PrizeOption[] = [];
      for (let i = 0; i < 11; i++) {
        options.push({ text: '没中奖', probability: 95 / 11 });
      }
      options.push({ text: '中奖了!', probability: 5 });
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

  return (
    <UserContainer>
      <Header>
        <Title>幸运转盘</Title>
        <Subtitle>管理员控制抽奖</Subtitle>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <GameArea>
        <WheelSection>
          <SpinnerWheel
            options={wheelOptions}
            onSpin={handleSpin}
            isSpinning={isSpinning}
            winningIndex={winningIndex}
            disabled={config.remaining_spins <= 0}
          />
          
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
            
            <StatusItem>
              <StatusLabel>总抽奖数:</StatusLabel>
              <StatusValue>{config.total_spins}</StatusValue>
            </StatusItem>
          </GameStatus>

          {!isSpinning && config.remaining_spins > 0 && (
            <SpinInstruction>
              等待管理员触发抽奖
            </SpinInstruction>
          )}

          {config.remaining_spins === 0 && (
            <SpinInstruction>
              抽奖次数已用完
            </SpinInstruction>
          )}
        </WheelSection>

        <HistorySection>
          <History results={history.results} />
        </HistorySection>
      </GameArea>
    </UserContainer>
  );
};

export default User;