import { useEffect, useRef, useMemo, useState } from 'react';
import './FocusDemo.css';

const TEXT_LINES = [
  "Typography is the craft of endowing",
  "human language with a durable visual form.",
  "Variable fonts open up a new dimension",
  "of responsive design, allowing text to",
  "seamlessly adapt to its environment, creating",
  "fluid and deeply engaging reading experiences."
];

export default function FocusDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const [enabledAxes, setEnabledAxes] = useState({
    wght: true,
    YTAS: true,
    YTDE: true,
    YOPQ: true
  });
  
  const [fontSize, setFontSize] = useState(60);

  const enabledAxesRef = useRef(enabledAxes);
  useEffect(() => {
    enabledAxesRef.current = enabledAxes;
  }, [enabledAxes]);

  // Split lines, then words, then characters to strictly prevent automatic reflow bounds
  const textElements = useMemo(() => {
    let charIndex = 0;

    return TEXT_LINES.map((lineText, lineIdx) => {
      const words = lineText.split(' ').map((word, wIdx) => {
        const chars = word.split('').map((char) => {
          const id = charIndex++;
          return { id, char };
        });
        return { id: `${lineIdx}-${wIdx}`, chars, word };
      });
      return { id: `line-${lineIdx}`, words };
    });
  }, []);

  useEffect(() => {
    // We only need to calculate the bounding boxes once, but if window resizes, we might need to recalculate
    let cached = false;
    let animationFrameId: number | null = null;

    const calculatePositions = () => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();

      charRefs.current.forEach((el) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        el.dataset.centerX = String(rect.left + rect.width / 2 - containerRect.left);
        el.dataset.centerY = String(rect.top + rect.height / 2 - containerRect.top);
      });
      cached = true;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      if (!cached) {
        calculatePositions();
      }

      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;

      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        const axes = enabledAxesRef.current;

        charRefs.current.forEach((el) => {
          if (!el) return;

          const charX = parseFloat(el.dataset.centerX || "0");
          const charY = parseFloat(el.dataset.centerY || "0");

          const dx = mouseX - charX;
          const dy = mouseY - charY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Default state values
          const maxDist = 200;
          let weight = 300;
          let ytas = 649;
          let ytde = -98;
          let yopq = 50;
          let colorVal = 150; // default dimmer gray out of hover radius

          if (distance < maxDist) {
            const progress = 1 - (distance / maxDist);
            const easedProgress = Math.pow(progress, 1.2);
            
            if (axes.wght) weight = 300 + (easedProgress * 600);
            if (axes.YTAS) ytas = 649 + (easedProgress * 205); // 649 to 854
            if (axes.YTDE) ytde = -98 - (easedProgress * 207); // -98 to -305
            if (axes.YOPQ) yopq = 50 + (easedProgress * 85); // 50 to 135
            
            // Map the white glow intensity (from rgb 150 to rgb 255)
            colorVal = 150 + (easedProgress * 105);
          }

          const finalWeight = Math.max(300, Math.min(900, weight));

          // Cache checking to prevent React/DOM from doing useless style repaints!
          const newSettings = `"wght" ${finalWeight.toFixed(0)}, "YTAS" ${ytas.toFixed(0)}, "YTDE" ${ytde.toFixed(0)}, "YOPQ" ${yopq.toFixed(0)}`;
          const newColor = `rgb(${colorVal.toFixed(0)}, ${colorVal.toFixed(0)}, ${colorVal.toFixed(0)})`;

          if (el.dataset.currentFvs !== newSettings || el.dataset.currentColor !== newColor) {
            el.style.fontVariationSettings = newSettings;
            el.style.color = newColor;
            
            el.dataset.currentFvs = newSettings;
            el.dataset.currentColor = newColor;
          }
        });
      });
    };

    const handleMouseLeave = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      charRefs.current.forEach((el) => {
        if (el) {
          const resetSettings = `"wght" 300, "YTAS" 649, "YTDE" -98, "YOPQ" 50`;
          const resetColor = `rgb(150, 150, 150)`; // Must match the default 150 color class
          
          if (el.dataset.currentFvs !== resetSettings || el.dataset.currentColor !== resetColor) {
            el.style.fontVariationSettings = resetSettings;
            el.style.color = resetColor;
            
            el.dataset.currentFvs = resetSettings;
            el.dataset.currentColor = resetColor;
          }
        }
      });
    };

    const handleResize = () => {
      cached = false;
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
        window.removeEventListener('resize', handleResize);
      }
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div className="focus-demo-container" ref={containerRef}>
      <div className="focus-text-content" style={{ fontSize: `${fontSize}px` }}>
        {textElements.map((lineObj) => (
          <div key={lineObj.id} className="focus-line">
            {lineObj.words.map((wordObj) => (
              <span key={wordObj.id} className="focus-word">
                {wordObj.chars.map((charObj) => (
                  <span
                    key={charObj.id}
                    ref={(el) => { charRefs.current[charObj.id] = el; }}
                    className="focus-char"
                  >
                    {charObj.char}
                  </span>
                ))}
                {/* Add space after word */}
                <span className="focus-space">&nbsp;</span>
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className="controls-panel">
        <h3 className="controls-title">Active Axes</h3>
        
        <div className="control-slider-group" style={{ marginBottom: '24px' }}>
          <div className="control-label-row">
            <span>Font Size</span>
            <span>{fontSize}px</span>
          </div>
          <input 
            type="range" 
            min="24" 
            max="120" 
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="control-slider"
          />
        </div>

        {Object.entries(enabledAxes).map(([axis, isEnabled]) => (
          <label key={axis} className="control-label">
            <input 
              type="checkbox"
              checked={isEnabled}
              onChange={() => setEnabledAxes(prev => ({...prev, [axis]: !prev[axis as keyof typeof enabledAxes]}))}
              className="control-checkbox"
            />
            <span className="control-text">{axis}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
