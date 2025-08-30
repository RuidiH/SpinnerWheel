import React from 'react';
import styled from 'styled-components';
import { SpinResult } from '../services/api';

interface HistoryProps {
  results: SpinResult[];
}

const HistoryContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 400px;
  overflow-y: auto;
`;

const HistoryTitle = styled.h3`
  margin: 0 0 16px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 2px solid #667eea;
  padding-bottom: 8px;
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const HistoryItem = styled.div<{ $isWin: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: ${props => props.$isWin ? 'linear-gradient(135deg, #ffd700, #ffed4e)' : '#f8f9fa'};
  border-radius: 8px;
  border-left: 4px solid ${props => props.$isWin ? '#ff6b35' : '#dee2e6'};
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const HistoryInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const PlayerInfo = styled.span`
  font-weight: 600;
  color: #333;
  font-size: 14px;
`;

const PrizeInfo = styled.span<{ $isWin: boolean }>`
  color: ${props => props.$isWin ? '#d63031' : '#636e72'};
  font-size: 13px;
  font-weight: ${props => props.$isWin ? '600' : '400'};
`;

const TimeInfo = styled.span`
  color: #636e72;
  font-size: 12px;
  text-align: right;
`;

const NoHistory = styled.div`
  text-align: center;
  color: #636e72;
  font-style: italic;
  padding: 40px 20px;
`;

const WinBadge = styled.span`
  background: #00b894;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  margin-left: 8px;
`;

const History: React.FC<HistoryProps> = ({ results }) => {
  // Sort results by timestamp (newest first)
  const sortedResults = [...results].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays === 1) return '昨天';
    if (diffDays === 2) return '前天';
    
    return date.toLocaleDateString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isWinningPrize = (prize: string) => {
    return prize !== '没中奖' && prize !== '再接再厉' && prize !== '谢谢参与' && prize !== '再来一次';
  };

  return (
    <HistoryContainer>
      <HistoryTitle>抽奖历史 ({results.length})</HistoryTitle>
      
      {sortedResults.length === 0 ? (
        <NoHistory>
          暂无抽奖记录
        </NoHistory>
      ) : (
        <HistoryList>
          {sortedResults.map((result, index) => {
            const isWin = isWinningPrize(result.prize);
            
            return (
              <HistoryItem key={`${result.timestamp}-${index}`} $isWin={isWin}>
                <HistoryInfo>
                  <PlayerInfo>
                    玩家 {result.player}
                    {isWin && <WinBadge>中奖</WinBadge>}
                  </PlayerInfo>
                  <PrizeInfo $isWin={isWin}>
                    {result.prize}
                  </PrizeInfo>
                </HistoryInfo>
                <TimeInfo>
                  {formatTime(result.timestamp)}
                </TimeInfo>
              </HistoryItem>
            );
          })}
        </HistoryList>
      )}
    </HistoryContainer>
  );
};

export default History;