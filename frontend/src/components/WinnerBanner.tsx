import React from 'react';
import styled, { keyframes } from 'styled-components';

const slideIn = keyframes`
  from {
    transform: translateY(-100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

const Banner = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #ff6b6b, #ee5a52, #ff8a4c);
  color: white;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(255, 107, 107, 0.4);
  z-index: 10000;
  text-align: center;
  animation: ${slideIn} 0.5s ease-out;
  max-width: 400px;
  min-width: 300px;
`;

const Title = styled.h1`
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
`;

const Prize = styled.h2`
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #fff3cd;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
`;

const Button = styled.button`
  background: rgba(255, 255, 255, 0.9);
  color: #ff6b6b;
  border: none;
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
  
  &:hover {
    background: white;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`;


interface WinnerBannerProps {
  player: number;
  prize: string;
  mode: number;
  onClose: () => void;
}

const WinnerBanner: React.FC<WinnerBannerProps> = ({ player, prize, mode, onClose }) => {
  // Auto-dismiss after 5 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);
  const handlePlayAudio = () => {
    console.log('🎵 Playing audio for:', { player, prize, mode });
    if (window.AudioManager) {
      window.AudioManager.announce(player, prize, mode);
    } else {
      console.error('AudioManager not available');
    }
  };

  const handleEnableAudio = () => {
    console.log('🎵 Enabling audio');
    if (window.AudioManager) {
      window.AudioManager.enableAudio();
      // Play this announcement after enabling
      setTimeout(() => {
        window.AudioManager.announce(player, prize, mode);
      }, 500);
    } else {
      console.error('AudioManager not available');
    }
  };

  const isAudioEnabled = window.AudioManager?.isEnabled() || false;

  return (
    <Banner>
      <Title>🎉 恭喜第{player}桌!</Title>
      
      <Prize>
        {mode === 1 ? `抽中了: ${prize}` : prize}
      </Prize>
      
      <ButtonContainer>
        {isAudioEnabled ? (
          <Button onClick={handlePlayAudio}>
            🔊 播放语音
          </Button>
        ) : (
          <Button onClick={handleEnableAudio}>
            🎵 启用语音播报
          </Button>
        )}
        
        <Button onClick={onClose}>
          ✅ 确认
        </Button>
      </ButtonContainer>
    </Banner>
  );
};

export default WinnerBanner;