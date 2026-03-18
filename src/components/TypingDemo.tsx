import React, { useState, useRef, useEffect } from 'react';
import './TypingDemo.css';

interface TextChar {
  id: string;
  char: string;
  insertedAt: number;
}

const calculateNewTextArray = (
  oldArr: TextChar[],
  newVal: string
): TextChar[] => {
  const oldVal = oldArr.map(x => x.char).join('');
  if (oldVal === newVal) return oldArr;

  let start = 0;
  while (start < oldVal.length && start < newVal.length && oldVal[start] === newVal[start]) {
    start++;
  }

  let oldEnd = oldVal.length - 1;
  let newEnd = newVal.length - 1;
  while (oldEnd >= start && newEnd >= start && oldVal[oldEnd] === newVal[newEnd]) {
    oldEnd--;
    newEnd--;
  }

  const replacedLength = oldEnd - start + 1;
  const newCharsLength = newEnd - start + 1;

  const newArr = [...oldArr];
  const now = Date.now();
  const insertedItems = newVal.slice(start, start + newCharsLength).split('').map(char => ({
    id: Math.random().toString(36).substring(2, 11),
    char,
    insertedAt: now
  }));

  newArr.splice(start, replacedLength, ...insertedItems);
  return newArr;
};

export default function TypingDemo() {
  const [textArr, setTextArr] = useState<TextChar[]>([]);
  const [cursorPos, setCursorPos] = useState(0);
  
  const [fontSize, setFontSize] = useState(42);
  const [weightTransition, setWeightTransition] = useState(true);
  const [cursorBump, setCursorBump] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  
  const cursorMovedAtRef = useRef(0);
  const lastCursorPosRef = useRef(0);
  const weightTransitionRef = useRef(weightTransition);
  const cursorBumpRef = useRef(cursorBump);

  useEffect(() => {
    weightTransitionRef.current = weightTransition;
    cursorBumpRef.current = cursorBump;
  }, [weightTransition, cursorBump]);

  // Track cursor movement for the hill effect
  useEffect(() => {
    // Only trigger bump if actually moved
    if (cursorPos !== lastCursorPosRef.current) {
      cursorMovedAtRef.current = Date.now();
      lastCursorPosRef.current = cursorPos;
    }
  }, [cursorPos]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const validValue = rawValue.replace(/[^a-zA-Z0-9\s.,!?'"()\-=_+*&^%$#@;:<>/{}[\]\\|`~]/g, '');
    
    if (validValue !== rawValue) {
      e.target.value = validValue;
    }

    setTextArr(prev => calculateNewTextArray(prev, validValue));
    setCursorPos(e.target.selectionStart || 0);

    // Bump effect also triggers on typing
    cursorMovedAtRef.current = Date.now();
    lastCursorPosRef.current = e.target.selectionStart || 0;
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setCursorPos(target.selectionStart || 0);
  };

  // The Master Render Loop
  useEffect(() => {
    let animationFrameId: number;

    const renderFrame = () => {
      const now = Date.now();
      const cursorAge = now - cursorMovedAtRef.current;
      
      const bumpEnabled = cursorBumpRef.current;
      // Cursor Hill Effect decays linearly from 1 to 0 over 1000ms
      const bumpFactor = bumpEnabled ? Math.max(0, 1 - cursorAge / 1000) : 0;
      const wEnabled = weightTransitionRef.current;
          
      charRefs.current.forEach((el, index) => {
        if (!el) return;
        const insertedAt = parseFloat(el.dataset.insertedat || "0");
        const age = now - insertedAt;
        
        // Base resting state
        let targetWeight = 100;
        let targetWidth = 100;
        let targetR = 136, targetG = 136, targetB = 136; // #888888
        let shadowOp = 0;
        
        // Typing Decay Effect (2500ms)
        if (wEnabled) {
           const typeProgress = Math.min(1, age / 2500); 
           // Ease-out cubic
           const easeOutProgress = 1 - Math.pow(1 - typeProgress, 3);
           
           targetWeight = 1000 - easeOutProgress * 900;
           targetWidth = 150 - easeOutProgress * 50;
           
           const colVal = 255 - easeOutProgress * (255 - 136);
           targetR = colVal; targetG = colVal; targetB = colVal;
           
           if (typeProgress < 0.15) {
              shadowOp = 0.6 * (1 - typeProgress / 0.15);
           }
        }
        
        // Cursor Hill Bump Effect (Strictly targets ONLY the one character preceding the cursor)
        if (bumpFactor > 0) {
           const isDirectlyInFront = index === lastCursorPosRef.current - 1;
           
           if (isDirectlyInFront) {
              const distFactor = 1.0; // Max focus on this single character
              
              const bumpWeight = 100 + bumpFactor * distFactor * 900;
              const bumpWidth = 100 + bumpFactor * distFactor * 50;
              
              const bumpCol = 136 + bumpFactor * distFactor * 119; // 136 to 255
              
              targetWeight = Math.max(targetWeight, bumpWeight);
              targetWidth = Math.max(targetWidth, bumpWidth);
              targetR = Math.max(targetR, bumpCol);
              targetG = Math.max(targetG, bumpCol);
              targetB = Math.max(targetB, bumpCol);
              
              // Only add text shadow if the bump is really strong
              if (bumpFactor > 0.5) {
                 shadowOp = Math.max(shadowOp, (bumpFactor - 0.5) * 2 * 0.4);
              }
           }
        }
        
        // Clamping bounds
        targetWeight = Math.min(1000, Math.max(100, targetWeight));
        targetWidth = Math.min(150, Math.max(100, targetWidth));
        targetR = Math.min(255, Math.max(0, targetR));
        targetG = Math.min(255, Math.max(0, targetG));
        targetB = Math.min(255, Math.max(0, targetB));
        
        // Final styles
        const fvs = `"wght" ${targetWeight.toFixed(0)}, "wdth" ${targetWidth.toFixed(0)}`;
        const col = `rgb(${targetR.toFixed(0)}, ${targetG.toFixed(0)}, ${targetB.toFixed(0)})`;
        const ts = shadowOp > 0 ? `0 0 15px rgba(255, 255, 255, ${shadowOp.toFixed(2)})` : 'none';
        
        const combinedHash = `${fvs}|${col}|${ts}`;
        if (el.dataset.current !== combinedHash) {
           el.style.fontVariationSettings = fvs;
           el.style.color = col;
           el.style.textShadow = ts;
           el.dataset.current = combinedHash;
        }
      });
      
      animationFrameId = requestAnimationFrame(renderFrame);
    };
    
    animationFrameId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animationFrameId);
  }, [textArr]); // Rebind refs array map when text changes

  return (
    <div className="typing-demo-container" onClick={handleContainerClick}>
      
      <div className="typing-glass-box">
        <input
          ref={inputRef}
          type="text"
          className="typing-hidden-input"
          onChange={handleChange}
          onSelect={handleSelect}
          onKeyUp={handleSelect}
          onMouseUp={handleSelect}
          spellCheck={false}
          autoComplete="off"
        />

        <div className="typing-display" style={{ fontSize: `${fontSize}px` }}>
          {textArr.length === 0 && (
            <span className="typing-placeholder">Type something...</span>
          )}
          
          {textArr.map((item, idx) => (
            <React.Fragment key={item.id}>
              {idx === cursorPos && <span className="typing-cursor" />}
              <span 
                className="typing-char" 
                data-insertedat={item.insertedAt}
                ref={el => { charRefs.current[idx] = el; }}
              >
                {item.char}
              </span>
            </React.Fragment>
          ))}
          {cursorPos === textArr.length && <span className="typing-cursor" />}
        </div>
      </div>
      
      <div className="controls-panel">
        <h3 className="controls-title">Typing Controls</h3>
        
        <div className="control-slider-group">
          <div className="control-label-row">
            <span>Font Size</span>
            <span>{fontSize}px</span>
          </div>
          <input 
            type="range" 
            min="24" 
            max="80" 
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="control-slider"
          />
        </div>

        <label className="control-label" style={{ marginTop: '20px' }}>
          <input 
            type="checkbox"
            checked={weightTransition}
            onChange={(e) => setWeightTransition(e.target.checked)}
            className="control-checkbox"
          />
          <span className="control-text">Weight Decay</span>
        </label>
        
        <label className="control-label">
          <input 
            type="checkbox"
            checked={cursorBump}
            onChange={(e) => setCursorBump(e.target.checked)}
            className="control-checkbox"
          />
          <span className="control-text">Cursor Bump</span>
        </label>
      </div>

    </div>
  );
}
