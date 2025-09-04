import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { PrizeOption } from '../services/api';

interface SpinnerWheelProps {
  options: PrizeOption[];
  onSpin: () => void;
  isSpinning: boolean;
  winningIndex?: number;
  spinStartTime?: number | null;
  disabled?: boolean;
}

const WheelContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
`;

const LightStrip = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 5;
`;

const LightBulb = styled.circle<{ $delay: number }>`
  fill: #ffd700;
  stroke: #ffeb3b;
  stroke-width: 2;
  filter: drop-shadow(0 0 8px #ffd700);
  animation: flicker 2s ease-in-out infinite;
  animation-delay: ${props => props.$delay}s;
  
  @keyframes flicker {
    0%, 100% { 
      opacity: 1;
      fill: #ffd700;
      filter: drop-shadow(0 0 12px #ffd700);
    }
    25% {
      opacity: 0.3;
      fill: #ffeb3b;
      filter: drop-shadow(0 0 4px #ffeb3b);
    }
    50% { 
      opacity: 1;
      fill: #ff6f00;
      filter: drop-shadow(0 0 16px #ff6f00);
    }
    75% {
      opacity: 0.6;
      fill: #ffd700;
      filter: drop-shadow(0 0 8px #ffd700);
    }
  }
`;

const ArrowOverlay = styled.svg`
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 10;
`;

const WheelSvg = styled.svg<{ $isSpinning: boolean; $rotation: number }>`
  cursor: ${props => props.$isSpinning ? 'wait' : 'default'};
  transform: rotate(${props => props.$rotation}deg);
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3));
`;

// Arrow now moved inside SVG to prevent z-index conflicts

const CenterCircle = styled.circle`
  fill: #333;
  stroke: #fff;
  stroke-width: 3;
`;

const SegmentPath = styled.path<{ $color: string }>`
  fill: ${props => props.$color};
  stroke: #d0d0d0;
  stroke-width: 3;
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
  font-family: 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif;
  filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.7));
`;

// Color palette optimized for Chinese red background
const SEGMENT_COLORS = [
  '#FFD700', '#4FD1C7', '#4A90E2', '#7ED321',
  '#F8C471', '#FFA500', '#50C8C8', '#F5A623',
  '#BD7EDD', '#5AC8FA', '#FFEB3B', '#6CC04A'
];

const SpinnerWheel: React.FC<SpinnerWheelProps> = ({
  options,
  onSpin,
  isSpinning,
  winningIndex,
  spinStartTime,
  disabled = false
}) => {
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const targetRotationRef = useRef(0);
  const animationStartTimeRef = useRef<number | null>(null);
  const size = 680; // Enlarged for better visibility  
  const center = size / 2; // Now 340
  const radius = 260; // Proportionally increased wheel radius
  const segmentAngle = 360 / 12; // Always 12 segments
  const ANIMATION_DURATION = 6000; // 6 seconds
  
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
      textPosition: getTextPosition(center, center, radius, startAngle + segmentAngle / 2)
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

  // Get text position for a segment (closer to center for better visibility)
  function getTextPosition(cx: number, cy: number, r: number, angle: number) {
    const angleRad = (angle * Math.PI) / 180;
    // Use shorter radius for better text visibility
    const textRadius = r * 0.65; // Moved closer to center
    return {
      x: cx + textRadius * Math.cos(angleRad),
      y: cy + textRadius * Math.sin(angleRad)
    };
  }

  // Note: Text rotation now handled per-character to maintain readability

  // Easing function for smooth animation
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  // Handle timestamp-based spin animation
  useEffect(() => {
    if (isSpinning && winningIndex !== undefined && spinStartTime) {
      // Calculate target rotation to align winning segment CENTER with arrow
      const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.05);
      let targetAngle = -15 - winningIndex * segmentAngle + randomOffset;
      targetAngle = ((targetAngle % 360) + 360) % 360;
      
      const currentRotation = rotationRef.current;
      const currentNormalizedRotation = currentRotation % 360;
      let deltaRotation = targetAngle - currentNormalizedRotation;
      
      if (deltaRotation < 0) {
        deltaRotation += 360;
      }
      
      // Add 3-8 full rotations for excitement
      const minSpins = 3;
      const extraSpins = Math.floor(Math.random() * 6);
      const totalRotation = deltaRotation + (minSpins + extraSpins) * 360;
      const finalRotation = currentRotation + totalRotation;
      
      // Store target for animation
      targetRotationRef.current = finalRotation;
      animationStartTimeRef.current = spinStartTime;
      
      // Start JavaScript animation loop
      const animate = () => {
        const now = Date.now();
        const elapsed = now - spinStartTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        
        if (progress < 1) {
          // Calculate current rotation with easing
          const easedProgress = easeInOutCubic(progress);
          const currentAnimationRotation = currentRotation + (totalRotation * easedProgress);
          
          setRotation(currentAnimationRotation);
          rotationRef.current = currentAnimationRotation;
          
          // Continue animation
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Animation complete
          setRotation(finalRotation);
          rotationRef.current = finalRotation;
          animationRef.current = null;
        }
      };
      
      // Handle tab visibility changes - catch up animation when tab becomes visible
      const handleVisibilityChange = () => {
        if (!document.hidden && animationRef.current === null && spinStartTime) {
          const now = Date.now();
          const elapsed = now - spinStartTime;
          const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
          
          if (progress < 1) {
            // Tab became visible mid-animation - catch up and continue
            const easedProgress = easeInOutCubic(progress);
            const catchUpRotation = currentRotation + (totalRotation * easedProgress);
            
            setRotation(catchUpRotation);
            rotationRef.current = catchUpRotation;
            
            // Continue animation from current position
            animationRef.current = requestAnimationFrame(animate);
          }
        }
      };
      
      // Listen for visibility changes
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Start animation immediately
      animationRef.current = requestAnimationFrame(animate);
      
      // Cleanup function
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isSpinning, winningIndex, spinStartTime, segmentAngle]);

  // Click handling disabled - spins are triggered by admin only

  // Note: Removed truncateText function as we now display full text vertically

  return (
    <WheelContainer>
      <WheelSvg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        $isSpinning={isSpinning}
        $rotation={rotation}
      >
        {/* Decorative golden rings - adjusted to fit in viewBox */}
        <circle 
          cx={center} 
          cy={center} 
          r={275} 
          fill="none" 
          stroke="url(#goldGradient)" 
          strokeWidth="10" 
          opacity="0.8"
        />
        <circle 
          cx={center} 
          cy={center} 
          r={285} 
          fill="none" 
          stroke="rgba(255, 255, 255, 0.9)" 
          strokeWidth="4"
        />
        {/* Subtle gray outer rim */}
        <circle 
          cx={center} 
          cy={center} 
          r={295} 
          fill="none" 
          stroke="#c0c0c0" 
          strokeWidth="2"
          opacity="0.7"
        />
        
        {/* Gradient definition for golden ring */}
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffd700" />
            <stop offset="25%" stopColor="#ffed4e" />
            <stop offset="50%" stopColor="#ffd700" />
            <stop offset="75%" stopColor="#ffed4e" />
            <stop offset="100%" stopColor="#ffd700" />
          </linearGradient>
          <filter id="arrowShadow">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="rgba(0,0,0,0.4)"/>
          </filter>
        </defs>
        
        {segments.map((segment) => (
          <g key={segment.index}>
            <SegmentPath
              d={segment.path}
              $color={segment.color}
            />
            {/* Radial text - pointing outward from center */}
            {segment.option && segment.option.text && typeof segment.option.text === 'string' && (
              <g>
                {segment.option.text.trim().split('').reverse().map((char, i) => {
                  const text = segment.option.text.trim();
                  const textLength = text.length;
                  const segmentCenterAngle = (segment.startAngle + segment.endAngle) / 2;
                  const textRadius = radius * 0.65; // Distance from center
                  
                  // Characters positioned individually along the radius (reversed array for correct reading)
                  const characterOffset = (i - (textLength - 1) / 2) * 16;
                  const charAngle = segmentCenterAngle;
                  const charAngleRad = (charAngle * Math.PI) / 180;
                  
                  // Calculate position for this character
                  const charX = center + (textRadius + characterOffset) * Math.cos(charAngleRad);
                  const charY = center + (textRadius + characterOffset) * Math.sin(charAngleRad);
                  
                  return (
                    <SegmentText
                      key={`${segment.index}-${i}`}
                      x={charX}
                      y={charY}
                      textAnchor="middle"
                      transform={`rotate(${charAngle + 90} ${charX} ${charY})`}
                    >
                      {char}
                    </SegmentText>
                  );
                })}
              </g>
            )}
          </g>
        ))}
        <CenterCircle
          cx={center}
          cy={center}
          r={40}
        />
        
      </WheelSvg>

      {/* Flickering Light Strip around wheel */}
      <LightStrip
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {Array.from({ length: 24 }, (_, index) => {
          const angle = (index * 15) - 90; // 24 lights, 15 degrees apart, starting from top
          const lightRadius = 310; // Outside the golden rings
          const angleRad = (angle * Math.PI) / 180;
          const x = center + lightRadius * Math.cos(angleRad);
          const y = center + lightRadius * Math.sin(angleRad);
          
          return (
            <LightBulb
              key={index}
              cx={x}
              cy={y}
              r={8}
              $delay={index * 0.1} // Stagger the animations
            />
          );
        })}
      </LightStrip>
      
      {/* Fixed Arrow Overlay - stays at top */}
      <ArrowOverlay
        width={size}
        height={100}
        viewBox={`0 0 ${size} 100`}
      >
        <defs>
          <filter id="arrowShadowFixed">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="rgba(0,0,0,0.4)"/>
          </filter>
        </defs>
        <g filter="url(#arrowShadowFixed)">
          <polygon 
            points={`${center},85 ${center-20},45 ${center+20},45`}
            fill="#ff3333"
            stroke="#fff"
            strokeWidth="3"
          />
        </g>
      </ArrowOverlay>
    </WheelContainer>
  );
};

export default SpinnerWheel;