import React, { useState, useEffect, useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { SpinResult } from '../services/api';

interface WinnerAnnouncementsProps {
  results: SpinResult[];
}

const scroll = keyframes`
  0% { transform: translateY(0%); }
  100% { transform: translateY(-50%); }
`;

const highlight = keyframes`
  0%, 100% { background: rgba(255, 215, 0, 0.3); }
  50% { background: rgba(255, 215, 0, 0.6); }
`;

const AnnouncementsContainer = styled.div`
  width: 280px;
  height: 500px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const SectionTitle = styled.div`
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 12px 16px;
  font-weight: 600;
  font-size: 16px;
  text-align: center;
`;

const LatestResultsSection = styled.div`
  flex-shrink: 0;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 8px;
  margin-bottom: 8px;
`;

const SectionHeader = styled.h4`
  margin: 0 0 6px 0;
  font-size: 14px;
  font-weight: 600;
  color: #555;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const HistorySection = styled.div<{ $needsScroll: boolean }>`
  flex: 1;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 4px 0;
  max-height: 280px;
  overflow-y: ${props => props.$needsScroll ? 'auto' : 'hidden'};
  position: relative;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #e9ecef;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #667eea;
    border-radius: 3px;
  }
`;

const ScrollContainer = styled.div<{ $itemCount: number; $needsScroll: boolean }>`
  ${props => props.$needsScroll && css`
    animation: ${scroll} ${Math.max(20, props.$itemCount * 2)}s linear infinite;
    animation-play-state: running;
  `}
  will-change: transform;
  
  /* Pause animation on hover */
  &:hover {
    animation-play-state: paused;
  }
`;

const WinnerItem = styled.div<{ $isLatest?: boolean; $isWin?: boolean }>`
  padding: 8px 12px;
  border-bottom: 1px solid #e9ecef;
  font-size: 14px;
  line-height: 1.3;
  
  ${props => props.$isLatest && css`
    animation: ${highlight} 2s ease-in-out 3;
    font-weight: 600;
  `}
  
  ${props => props.$isWin && css`
    color: #d63031;
    font-weight: 500;
  `}
  
  &:last-child {
    border-bottom: none;
  }
`;

const PlayerText = styled.span`
  color: #333;
  font-weight: 600;
`;

const PrizeText = styled.span<{ $isWin: boolean }>`
  color: ${props => props.$isWin ? '#d63031' : '#636e72'};
  margin-left: 4px;
`;

const TimeText = styled.span`
  color: #999;
  font-size: 12px;
  margin-left: 8px;
`;

const NoWinners = styled.div`
  padding: 30px 20px;
  text-align: center;
  color: #636e72;
  font-style: italic;
`;

const WinnerAnnouncements: React.FC<WinnerAnnouncementsProps> = ({ results }) => {
  const [newWinnerIndex, setNewWinnerIndex] = useState<number>(-1);

  // Define isWinningPrize function first (before useMemo)
  const isWinningPrize = (prize: string) => {
    return prize !== '没中奖' && 
           prize !== '再接再厉' && 
           prize !== '谢谢参与' && 
           prize !== '再来一次';
  };

  // Get all results and sort by timestamp
  const allResults = useMemo(() => {
    if (!results || !Array.isArray(results)) {
      return [];
    }
    
    return results
      .filter(result => result && result.prize && result.timestamp)
      // Filter out Mode 2 losses from history to reduce clutter
      .filter(result => {
        // Mode 2: Only show wins (index 11), hide losses
        if (result.mode === 2) {
          return result.index === 11; // Only show wins
        }
        // Mode 1: Show all results
        return true;
      })
      .sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      });
  }, [results]);
  
  // Separate winning results for special display
  const winningResults = allResults.filter(result => isWinningPrize(result.prize));

  // Split into latest (top 3) and older results
  const latestResults = allResults.slice(0, 3);
  const olderResults = allResults.slice(3);
  
  // Calculate if history section needs scrolling
  const ITEM_HEIGHT = 50; // Approximate height per item (reduced)
  const MAX_VISIBLE_ITEMS = Math.floor(280 / ITEM_HEIGHT); // ~5-6 items
  const needsScroll = olderResults.length > MAX_VISIBLE_ITEMS;

  // Detect new winner
  useEffect(() => {
    if (winningResults.length > 0) {
      const latestTimestamp = new Date(winningResults[0].timestamp).getTime();
      const now = new Date().getTime();
      
      // If latest winner is within last 10 seconds, highlight it
      if (now - latestTimestamp < 10000) {
        setNewWinnerIndex(0);
        const timer = setTimeout(() => setNewWinnerIndex(-1), 6000);
        return () => clearTimeout(timer);
      }
    }
  }, [winningResults]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    
    return date.toLocaleDateString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTableNumber = (player: number) => {
    // Convert player number to table number (could be same or different logic)
    return player;
  };

  const renderResultText = (result: SpinResult, isLatest = false, keyPrefix = '') => {
    if (!result || !result.prize || !result.timestamp) {
      return null;
    }
    
    const isWin = isWinningPrize(result.prize);
    const key = keyPrefix ? `${keyPrefix}-${result.timestamp}` : `${result.timestamp}-${result.player}`;
    
    return (
      <WinnerItem 
        key={key}
        $isLatest={isLatest && newWinnerIndex === 0}
        $isWin={isWin}
      >
        {isWin ? (
          <>
            <PlayerText>🎉 恭喜第{getTableNumber(result.player || 1)}桌</PlayerText>
            <PrizeText $isWin={true}>获得{result.prize}一份</PrizeText>
          </>
        ) : (
          <>
            <PlayerText>第{getTableNumber(result.player || 1)}桌</PlayerText>
            <PrizeText $isWin={false}>{result.prize}</PrizeText>
          </>
        )}
        <TimeText>{formatTime(result.timestamp)}</TimeText>
      </WinnerItem>
    );
  };

  // Create duplicate of older results for seamless loop
  const duplicatedOlderResults = olderResults.length > 0 
    ? [...olderResults, ...olderResults] 
    : [];

  if (allResults.length === 0) {
    return (
      <AnnouncementsContainer>
        <SectionTitle>🎯 抽奖结果</SectionTitle>
        <NoWinners>
          暂无抽奖记录
        </NoWinners>
      </AnnouncementsContainer>
    );
  }

  return (
    <AnnouncementsContainer>
      <SectionTitle>🎯 抽奖结果</SectionTitle>
      
      {/* Latest Results Section */}
      <LatestResultsSection>
        <SectionHeader>
          📌 最新结果
        </SectionHeader>
        {latestResults.length === 0 ? (
          <div style={{ 
            color: '#999', 
            fontStyle: 'italic', 
            padding: '12px', 
            textAlign: 'center',
            fontSize: '14px'
          }}>
            暂无结果
          </div>
        ) : (
          latestResults.map((result, index) => 
            renderResultText(result, index === 0)
          )
        )}
      </LatestResultsSection>

      {/* History Section - Conditional Scrolling */}
      {olderResults.length > 0 && (
        <div style={{ flex: 1 }}>
          <SectionHeader>
            📜 历史记录 {needsScroll && <small style={{ color: '#999' }}>({olderResults.length})</small>}
          </SectionHeader>
          <HistorySection $needsScroll={needsScroll}>
            <ScrollContainer 
              $itemCount={olderResults.length} 
              $needsScroll={needsScroll}
            >
              {(needsScroll ? duplicatedOlderResults : olderResults).map((result, index) => 
                renderResultText(result, false, needsScroll ? `scroll-${index}` : `history-${index}`)
              )}
            </ScrollContainer>
          </HistorySection>
        </div>
      )}
    </AnnouncementsContainer>
  );
};

export default WinnerAnnouncements;