import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { apiService, GameConfig, PrizeOption, ConfigUpdateRequest } from '../services/api';
import { wsService } from '../services/websocket';

const AdminContainer = styled.div`
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

const ConfigForm = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 800px;
`;

const Section = styled.div`
  margin-bottom: 30px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  color: #333;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  border-bottom: 2px solid #667eea;
  padding-bottom: 8px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  color: #555;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 14px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
  
  &:invalid {
    border-color: #ff6b6b;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const Button = styled.button<{ $variant?: 'primary' | 'danger' | 'secondary' }>`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  ${props => {
    switch (props.$variant) {
      case 'danger':
        return `
          background: #ff6b6b;
          color: white;
          &:hover { background: #ff5252; }
        `;
      case 'secondary':
        return `
          background: #636e72;
          color: white;
          &:hover { background: #2d3436; }
        `;
      default:
        return `
          background: #667eea;
          color: white;
          &:hover { background: #5a67d8; }
        `;
    }
  }}
  
  &:disabled {
    background: #bdc3c7;
    cursor: not-allowed;
  }
`;

const ModeSelector = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

const ModeButton = styled.button<{ $active: boolean }>`
  padding: 12px 24px;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$active ? '#667eea' : 'white'};
  color: ${props => props.$active ? 'white' : '#667eea'};
  
  &:hover {
    background: ${props => props.$active ? '#5a67d8' : '#f8f9fa'};
  }
`;

const PrizeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-top: 16px;
`;

const PrizeItem = styled.div`
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 16px;
  background: #f8f9fa;
`;

const PrizeLabel = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 14px;
`;

const PrizeInputGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ProbabilityInput = styled(Input)`
  width: 80px;
  flex-shrink: 0;
`;

const ErrorMessage = styled.div`
  background: #ff6b6b;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  margin: 16px 0;
  font-weight: 500;
`;

const SuccessMessage = styled.div`
  background: #00b894;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  margin: 16px 0;
  font-weight: 500;
`;

const LoadingMessage = styled.div`
  color: white;
  text-align: center;
  font-size: 18px;
  margin: 40px 0;
`;

const Mode2Display = styled.div`
  background: #f8f9fa;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  padding: 20px;
  margin-top: 16px;
`;

const Mode2Item = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e1e5e9;
  
  &:last-child {
    border-bottom: none;
  }
`;

const Admin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [remainingSpins, setRemainingSpins] = useState(100);
  const [selectedMode, setSelectedMode] = useState(1);
  const [mode1Options, setMode1Options] = useState<PrizeOption[]>([]);

  // Load initial configuration
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const configData = await apiService.getConfig();
      
      // Update form state
      setCurrentPlayer(configData.current_player);
      setRemainingSpins(configData.remaining_spins);
      setSelectedMode(configData.mode);
      setMode1Options(configData.mode1_options || []);
      
      setError('');
    } catch (err: any) {
      console.error('Failed to load config:', err);
      setError('无法加载配置，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize
  useEffect(() => {
    loadConfig();
    
    // Connect WebSocket
    wsService.connect();

    // Listen for config updates from other sources
    const unsubscribe = wsService.onConfigUpdated((data: GameConfig) => {
      setCurrentPlayer(data.current_player);
      setRemainingSpins(data.remaining_spins);
      setSelectedMode(data.mode);
      setMode1Options(data.mode1_options || []);
    });

    return () => {
      unsubscribe();
      wsService.disconnect();
    };
  }, [loadConfig]);

  // Initialize mode1 options if empty
  useEffect(() => {
    if (mode1Options.length === 0) {
      const defaultOptions: PrizeOption[] = [];
      for (let i = 1; i <= 12; i++) {
        defaultOptions.push({
          text: `奖品${i}`,
          probability: Math.round((100 / 12) * 100) / 100
        });
      }
      setMode1Options(defaultOptions);
    }
  }, [mode1Options.length]);

  // Handle mode1 option change
  const handleMode1OptionChange = (index: number, field: 'text' | 'probability', value: string) => {
    const newOptions = [...mode1Options];
    if (field === 'text') {
      newOptions[index].text = value;
    } else {
      newOptions[index].probability = parseFloat(value) || 0;
    }
    setMode1Options(newOptions);
  };

  // Calculate total probability for mode1
  const getTotalProbability = () => {
    return mode1Options.reduce((sum, option) => sum + option.probability, 0);
  };

  // Handle save configuration
  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Validate mode1 probabilities
      if (selectedMode === 1) {
        const totalProb = getTotalProbability();
        if (Math.abs(totalProb - 100) > 0.01) {
          throw new Error(`概率总和必须为100%，当前为${totalProb.toFixed(2)}%`);
        }

        // Check for empty texts
        for (let i = 0; i < mode1Options.length; i++) {
          if (!mode1Options[i].text.trim()) {
            throw new Error(`奖品${i + 1}的名称不能为空`);
          }
        }
      }

      // Validate basic fields
      if (currentPlayer < 1) {
        throw new Error('玩家编号必须大于0');
      }
      
      if (remainingSpins < 0) {
        throw new Error('剩余次数不能小于0');
      }

      // Prepare update request
      const updateRequest: ConfigUpdateRequest = {
        mode: selectedMode,
        current_player: currentPlayer,
        remaining_spins: remainingSpins,
      };

      if (selectedMode === 1) {
        updateRequest.mode1_options = mode1Options;
      }

      // Save configuration
      const updatedConfig = await apiService.updateConfig(updateRequest);
      setSuccess('配置保存成功！');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (err: any) {
      console.error('Failed to save config:', err);
      setError(err.message || '保存配置失败');
    } finally {
      setSaving(false);
    }
  };

  // Handle reset game
  const handleReset = async () => {
    if (!window.confirm('确定要重置游戏吗？这将清空所有历史记录并重置玩家和次数。')) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await apiService.resetGame();
      await loadConfig(); // Reload config after reset
      setSuccess('游戏重置成功！');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (err: any) {
      console.error('Failed to reset game:', err);
      setError(err.message || '重置游戏失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminContainer>
        <LoadingMessage>加载中...</LoadingMessage>
      </AdminContainer>
    );
  }

  return (
    <AdminContainer>
      <Header>
        <Title>管理界面</Title>
        <Subtitle>配置游戏模式和参数</Subtitle>
      </Header>

      <ConfigForm>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        {/* Game Mode Selection */}
        <Section>
          <SectionTitle>游戏模式</SectionTitle>
          <ModeSelector>
            <ModeButton
              $active={selectedMode === 1}
              onClick={() => setSelectedMode(1)}
            >
              模式1 - 经典模式
            </ModeButton>
            <ModeButton
              $active={selectedMode === 2}
              onClick={() => setSelectedMode(2)}
            >
              模式2 - 固定概率
            </ModeButton>
          </ModeSelector>

          {selectedMode === 1 && (
            <div>
              <p style={{ color: '#666', marginBottom: '16px' }}>
                自定义12个奖品及其中奖概率，概率总和必须为100%
              </p>
              <div style={{ marginBottom: '16px', color: '#333' }}>
                <strong>概率总和: {getTotalProbability().toFixed(2)}%</strong>
                {Math.abs(getTotalProbability() - 100) > 0.01 && (
                  <span style={{ color: '#ff6b6b', marginLeft: '8px' }}>
                    (必须为100%)
                  </span>
                )}
              </div>
              <PrizeGrid>
                {mode1Options.map((option, index) => (
                  <PrizeItem key={index}>
                    <PrizeLabel>奖品 {index + 1}</PrizeLabel>
                    <FormGroup>
                      <Input
                        type="text"
                        placeholder="奖品名称"
                        value={option.text}
                        onChange={(e) => handleMode1OptionChange(index, 'text', e.target.value)}
                      />
                    </FormGroup>
                    <PrizeInputGroup>
                      <ProbabilityInput
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={option.probability}
                        onChange={(e) => handleMode1OptionChange(index, 'probability', e.target.value)}
                      />
                      <span style={{ color: '#666' }}>%</span>
                    </PrizeInputGroup>
                  </PrizeItem>
                ))}
              </PrizeGrid>
            </div>
          )}

          {selectedMode === 2 && (
            <div>
              <p style={{ color: '#666', marginBottom: '16px' }}>
                固定模式：11个"没中奖" + 1个"中奖了!"，总中奖率5%
              </p>
              <Mode2Display>
                {Array.from({ length: 11 }, (_, i) => (
                  <Mode2Item key={i}>
                    <span>没中奖</span>
                    <span style={{ color: '#666' }}>~8.64%</span>
                  </Mode2Item>
                ))}
                <Mode2Item>
                  <span style={{ color: '#00b894', fontWeight: '600' }}>中奖了!</span>
                  <span style={{ color: '#00b894', fontWeight: '600' }}>5%</span>
                </Mode2Item>
              </Mode2Display>
            </div>
          )}
        </Section>

        {/* Basic Settings */}
        <Section>
          <SectionTitle>基本设置</SectionTitle>
          
          <FormGroup>
            <Label htmlFor="currentPlayer">当前玩家编号</Label>
            <Input
              id="currentPlayer"
              type="number"
              min="1"
              value={currentPlayer}
              onChange={(e) => setCurrentPlayer(parseInt(e.target.value) || 1)}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="remainingSpins">剩余抽奖次数</Label>
            <Input
              id="remainingSpins"
              type="number"
              min="0"
              value={remainingSpins}
              onChange={(e) => setRemainingSpins(parseInt(e.target.value) || 0)}
            />
          </FormGroup>
        </Section>

        {/* Actions */}
        <Section>
          <SectionTitle>操作</SectionTitle>
          <ButtonGroup>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存配置'}
            </Button>
            <Button $variant="danger" onClick={handleReset} disabled={saving}>
              重置游戏
            </Button>
            <Button
              $variant="secondary"
              onClick={() => window.open('/user', '_blank')}
            >
              打开用户界面
            </Button>
          </ButtonGroup>
        </Section>
      </ConfigForm>
    </AdminContainer>
  );
};

export default Admin;