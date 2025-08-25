import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { PrizeOption } from '../services/api';

interface SpinnerWheelProps {
  options: PrizeOption[];
  onSpin: () => void;
  isSpinning: boolean;
  winningIndex?: number;
  disabled?: boolean;
}

const WheelContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
`;

const WheelSvg = styled.svg<{ $isSpinning: boolean; $rotation: number }>`
  cursor: ${props => props.$isSpinning ? 'wait' : 'default'};
  transform: rotate(${props => props.$rotation}deg);
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3));
  transition: ${props => props.$isSpinning ? 'transform 6s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none'};
`;

const Arrow = styled.div`
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-top: 30px solid #ff4444;
  z-index: 10;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
`;

const CenterCircle = styled.circle`
  fill: #333;
  stroke: #fff;
  stroke-width: 3;
`;

const SegmentPath = styled.path<{ $color: string }>`
  fill: ${props => props.$color};
  stroke: #fff;
  stroke-width: 2;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.8;
  }
`;

const SegmentText = styled.text`
  fill: #fff;
  font-size: 14px;
  font-weight: 600;
  text-anchor: middle;
  dominant-baseline: middle;
  pointer-events: none;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
  font-family: 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif;
`;

// Color palette for segments
const SEGMENT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
];

const SpinnerWheel: React.FC<SpinnerWheelProps> = ({
  options,
  onSpin,
  isSpinning,
  winningIndex,
  disabled = false
}) => {
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const size = 400;
  const center = size / 2;
  const radius = 180;
  const segmentAngle = 360 / 12; // Always 12 segments
  
  // Update ref when rotation changes
  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  // Generate segments data
  const segments = Array.from({ length: 12 }, (_, index) => {
    const startAngle = index * segmentAngle - 90; // Start from top
    const endAngle = startAngle + segmentAngle;
    const option = options[index] || { text: '空', probability: 0 };
    const color = SEGMENT_COLORS[index % SEGMENT_COLORS.length];
    
    return {
      index,
      startAngle,
      endAngle,
      option,
      color,
      path: createSegmentPath(center, center, radius, startAngle, endAngle),
      textPosition: getTextPosition(center, center, radius * 0.7, startAngle + segmentAngle / 2)
    };
  });

  // Create SVG path for a segment
  function createSegmentPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = cx + r * Math.cos(startAngleRad);
    const y1 = cy + r * Math.sin(startAngleRad);
    const x2 = cx + r * Math.cos(endAngleRad);
    const y2 = cy + r * Math.sin(endAngleRad);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    
    return [
      `M ${cx} ${cy}`,
      `L ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
  }

  // Get text position for a segment
  function getTextPosition(cx: number, cy: number, r: number, angle: number) {
    const angleRad = (angle * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad)
    };
  }

  // Handle spin animation
  useEffect(() => {
    if (isSpinning && winningIndex !== undefined) {
      // Calculate target rotation to align winning segment CENTER with arrow
      // Segment i center is at (i * 30 - 75)°, arrow is at -90°
      // To align center with arrow: -90 - (i * 30 - 75) = -15 - i * 30
      const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.15);
      let targetAngle = -winningIndex * segmentAngle - 15 + randomOffset;
      
      // Normalize target angle to 0-360 range
      targetAngle = ((targetAngle % 360) + 360) % 360;
      
      // Calculate rotation relative to current position using ref
      const currentRotation = rotationRef.current;
      const currentNormalizedRotation = currentRotation % 360;
      let deltaRotation = targetAngle - currentNormalizedRotation;
      
      // Ensure we rotate forward
      if (deltaRotation < 0) {
        deltaRotation += 360;
      }
      
      // Add minimum 3 full rotations + extra for excitement (3-8 total)
      const minSpins = 3;
      const extraSpins = Math.floor(Math.random() * 6); // 0-5 extra spins
      const totalRotation = deltaRotation + (minSpins + extraSpins) * 360;
      const finalRotation = currentRotation + totalRotation;
      
      // Start smooth rotation animation
      setRotation(finalRotation);
    }
  }, [isSpinning, winningIndex, segmentAngle]);

  // Click handling disabled - spins are triggered by admin only

  // Truncate long text
  const truncateText = (text: string, maxLength: number = 6) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <WheelContainer>
      <Arrow />
      <WheelSvg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        $isSpinning={isSpinning}
        $rotation={rotation}
      >
        {segments.map((segment) => (
          <g key={segment.index}>
            <SegmentPath
              d={segment.path}
              $color={segment.color}
            />
            <SegmentText
              x={segment.textPosition.x}
              y={segment.textPosition.y}
            >
              {truncateText(segment.option.text)}
            </SegmentText>
          </g>
        ))}
        <CenterCircle
          cx={center}
          cy={center}
          r={30}
        />
      </WheelSvg>
    </WheelContainer>
  );
};

export default SpinnerWheel;