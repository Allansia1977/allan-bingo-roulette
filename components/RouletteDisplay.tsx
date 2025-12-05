import React, { useEffect, useState, useMemo, useRef } from 'react';
import { GameStatus } from '../types';
import { generateRange, shuffleArray } from '../utils/random';

interface RouletteDisplayProps {
  status: GameStatus;
  targetNumber: number | null;
  history: number[];
  onSpinComplete: () => void;
  resetTrigger: number;
  onRoll: () => void;
  canRoll: boolean;
}

const RouletteDisplay: React.FC<RouletteDisplayProps> = ({
  status,
  targetNumber,
  history,
  onSpinComplete,
  resetTrigger,
  onRoll,
  canRoll
}) => {
  const [rotation, setRotation] = useState(0);
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);
  
  // Wheel Configuration
  const TOTAL_NUMBERS = 75;
  const SLICE_ANGLE = 360 / TOTAL_NUMBERS;
  const RADIUS = 450;
  const CENTER = 500;

  // Generate randomized wheel order (1 is fixed, 2-75 shuffled)
  const wheelOrder = useMemo(() => {
    // 1 is always first (index 0)
    const fixed = 1;
    // Generate 2..75
    const rest = generateRange(2, 75);
    // Shuffle the rest
    const shuffledRest = shuffleArray(rest);
    return [fixed, ...shuffledRest];
  }, [resetTrigger]);
  
  // Generate slices based on wheelOrder
  const slices = useMemo(() => {
    return wheelOrder.map((num, i) => {
      const startAngle = i * SLICE_ANGLE;
      const endAngle = (i + 1) * SLICE_ANGLE;
      
      const startRad = (startAngle - 90) * (Math.PI / 180);
      const endRad = (endAngle - 90) * (Math.PI / 180);
      
      const x1 = CENTER + RADIUS * Math.cos(startRad);
      const y1 = CENTER + RADIUS * Math.sin(startRad);
      const x2 = CENTER + RADIUS * Math.cos(endRad);
      const y2 = CENTER + RADIUS * Math.sin(endRad);
      
      const d = `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 0 1 ${x2} ${y2} Z`;
      
      // Text Position
      const midAngle = startAngle + (SLICE_ANGLE / 2);
      const midRad = (midAngle - 90) * (Math.PI / 180);
      const textRadius = RADIUS - 20; 
      const tx = CENTER + textRadius * Math.cos(midRad);
      const ty = CENTER + textRadius * Math.sin(midRad);
      
      return { num, d, midAngle, tx, ty };
    });
  }, [wheelOrder]);

  // Update display number when not spinning
  useEffect(() => {
    if (status !== GameStatus.SPINNING) {
      setDisplayNumber(targetNumber);
    }
  }, [targetNumber, status]);

  // Sound Effect Logic
  const playTick = () => {
    if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600 + Math.random() * 200, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  };

  // Spinning Animation Loop (Visual + Sound + Display Number)
  useEffect(() => {
    let startTime: number;
    let lastTickIndex = -1;
    
    // Total duration matches the CSS transition equivalent
    const DURATION = 6000;
    
    if (status === GameStatus.SPINNING && targetNumber !== null) {
      // 1. Calculate Target Angle
      // Find index of target number in the randomized wheelOrder
      const targetIndex = wheelOrder.indexOf(targetNumber);
      
      // Slice centers are at (index * SLICE_ANGLE) + (SLICE_ANGLE / 2).
      const sliceCenterAngle = targetIndex * SLICE_ANGLE + (SLICE_ANGLE / 2);
      
      // Ensure we spin at least 5 times
      const minSpins = 5; 
      let targetR = -sliceCenterAngle;
      
      const currentRotationMod = rotation % 360;
      let nextTarget = -sliceCenterAngle;
      while (nextTarget < rotation + (360 * minSpins)) {
        nextTarget += 360;
      }

      const deltaRotation = nextTarget - rotation;
      const startRotation = rotation;

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / DURATION, 1);
        
        // Cubic Ease Out
        const ease = 1 - Math.pow(1 - progress, 3);
        const currentAngle = startRotation + deltaRotation * ease;
        
        setRotation(currentAngle);

        // Calculate Number under pointer
        const angleInWheelSpace = (360 - (currentAngle % 360)) % 360;
        const sliceIndex = Math.floor(angleInWheelSpace / SLICE_ANGLE);
        // Valid indices 0 to 74.
        const safeIndex = Math.min(Math.max(sliceIndex, 0), 74);
        
        // Get number from wheelOrder at this index
        const currentNum = wheelOrder[safeIndex];
        
        setDisplayNumber(currentNum);

        // Sound Tick
        if (safeIndex !== lastTickIndex && lastTickIndex !== -1) {
            playTick();
        }
        lastTickIndex = safeIndex;

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          onSpinComplete();
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [status, targetNumber, wheelOrder]); 

  // Reset rotation on hard reset
  useEffect(() => {
    // Force reset visual state when resetTrigger increments
    setRotation(0);
    setDisplayNumber(null);
  }, [resetTrigger]);

  const renderSlice = (slice: typeof slices[0], index: number, isWinner: boolean) => {
    const isUsed = history.includes(slice.num) && !isWinner;
    
    // Color Logic: 1 is green, others red/black based on position index
    let fillColor;
    let strokeColor = '#1e293b';
    let strokeWidth = '1';
    let glowFilter = 'none';
    let className = "";

    if (isWinner) {
        // Winner State (Neon Glow)
        className = "animate-pulse"; // Subtle pulse animation
        strokeColor = '#ffffff';
        strokeWidth = '3';
        
        if (slice.num === 1) {
             fillColor = '#22c55e'; // Brighter Green
             glowFilter = 'drop-shadow(0 0 15px rgba(74, 222, 128, 0.9))';
        } else {
            const isRed = index % 2 !== 0;
            if (isRed) {
                fillColor = '#ef4444'; // Brighter Red
                glowFilter = 'drop-shadow(0 0 15px rgba(248, 113, 113, 0.9))';
            } else {
                fillColor = '#1f2937'; // Slightly lighter black
                glowFilter = 'drop-shadow(0 0 15px rgba(56, 189, 248, 0.6))'; // Cyan glow for black
            }
        }
    } else if (isUsed) {
        // Used State (Grey)
        fillColor = '#475569'; 
    } else if (slice.num === 1) {
        // Standard State #1
        fillColor = '#16a34a'; 
    } else {
        // Standard State Red/Black
        // Index 0 is #1 (Green)
        // Index 1 (Odd) -> Red
        // Index 2 (Even) -> Black
        const isRed = index % 2 !== 0; 
        fillColor = isRed ? '#dc2626' : '#111827'; 
    }

    return (
        <g key={slice.num} className={className} style={{ filter: glowFilter }}>
            <path 
                d={slice.d} 
                fill={fillColor} 
                stroke={strokeColor} 
                strokeWidth={strokeWidth}
            />
            <text
                x={slice.tx}
                y={slice.ty}
                fill={isUsed ? '#94a3b8' : (isWinner ? '#ffffff' : 'white')}
                fontSize={isWinner ? "20" : "16"}
                fontWeight="bold"
                fontFamily="Inter, sans-serif"
                textAnchor="middle"
                alignmentBaseline="middle"
                transform={`rotate(${slice.midAngle + 90}, ${slice.tx}, ${slice.ty})`}
                style={{
                    textShadow: isWinner ? '0 0 5px rgba(0,0,0,0.8)' : 'none'
                }}
            >
                {slice.num}
            </text>
        </g>
    );
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="relative w-full max-w-[min(90vw,50vh)] aspect-square">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[10%] z-20 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-emerald-400 drop-shadow-xl filter"></div>

        <svg 
          viewBox="0 0 1000 1000" 
          className="w-full h-full drop-shadow-2xl"
          style={{ overflow: 'visible' }}
        >
            {/* Outer Rim */}
            <circle cx="500" cy="500" r="460" fill="#0f172a" stroke="#334155" strokeWidth="20" />

            {/* Wheel Group */}
            <g 
            style={{ 
                transformOrigin: '500px 500px',
                transform: `rotate(${rotation}deg)`,
            }}
            >
            {/* Render Non-Winners First */}
            {slices.map((slice, index) => {
                const isWinner = status !== GameStatus.SPINNING && targetNumber === slice.num;
                if (isWinner) return null;
                return renderSlice(slice, index, false);
            })}
            
            {/* Render Winner Last (on top) */}
            {slices.map((slice, index) => {
                const isWinner = status !== GameStatus.SPINNING && targetNumber === slice.num;
                if (!isWinner) return null;
                return renderSlice(slice, index, true);
            })}
            </g>
        </svg>

        {/* Center Button / Display Overlay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
            <button
                onClick={onRoll}
                disabled={!canRoll}
                className={`
                    rounded-full flex flex-col items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] border-[8px] border-slate-800
                    transition-all duration-300 hover:scale-105 active:scale-95
                    ${status === GameStatus.SPINNING ? 'w-48 h-48 bg-slate-900' : 'w-48 h-48 bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600'}
                    ${!canRoll && status !== GameStatus.SPINNING ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                {status === GameStatus.SPINNING ? (
                    <>
                         <span className="text-white text-7xl leading-none font-black drop-shadow-md tabular-nums">{displayNumber}</span>
                         <span className="text-emerald-500 font-bold text-[10px] tracking-widest animate-pulse mt-2">SPINNING</span>
                    </>
                ) : displayNumber ? (
                    <>
                        <span className="text-white text-7xl leading-none font-black drop-shadow-md">{displayNumber}</span>
                        <span className="text-emerald-100 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Click to Roll</span>
                    </>
                ) : (
                    <>
                         <span className="text-white text-4xl font-black uppercase tracking-widest">ROLL</span>
                         <span className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mt-1">Start Game</span>
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default RouletteDisplay;