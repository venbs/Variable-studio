import { useEffect, useRef, useMemo } from 'react';
import './FocusDemo.css';

const TEXT_CONTENT = "Typography is the craft of endowing human language with a durable visual form. Variable fonts open up a new dimension of responsive design, allowing text to seamlessly adapt to its environment, creating fluid and deeply engaging reading experiences.";

export default function FocusDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Split text into words, then words into characters for fluid layout
  const textElements = useMemo(() => {
    let charIndex = 0;
    const words = TEXT_CONTENT.split(' ');
    
    return words.map((word, wIdx) => {
      const chars = word.split('').map((char) => {
        const id = charIndex++;
        return { id, char };
      });
      return { id: wIdx, chars, word };
    });
  }, []);

  useEffect(() => {
    // We only need to calculate the bounding boxes once, but if window resizes, we might need to recalculate
    // For simplicity, we calculate on the fly or cache them. Let's recalculate on first hover and on resize.
    let cached = false;
    
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

      // Calculate global slant based on horizontal mouse position (0 on left, -10 on right)
      const slantRatio = e.clientX / window.innerWidth;
      const slantVal = slantRatio * -10;

      charRefs.current.forEach((el) => {
        if (!el) return;
        
        const charX = parseFloat(el.dataset.centerX || "0");
        const charY = parseFloat(el.dataset.centerY || "0");

        const dx = mouseX - charX;
        const dy = mouseY - charY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Map distance to font weight (100 to 900)
        // Max distance effect radius: 250px
        const maxDist = 250;
        let weight = 100;
        
        if (distance < maxDist) {
          // Closer to cursor = higher weight
          const progress = 1 - (distance / maxDist);
          const easedProgress = Math.pow(progress, 1.2);
          weight = 100 + (easedProgress * 800); 
        }

        const finalWeight = Math.max(100, Math.min(900, weight));
        
        // Use a slight width expansion to make it feel more dynamic
        const widthVal = 100 + (weight - 100) / 800 * 25; // 100 to 125 wdth
        
        el.style.fontVariationSettings = `"wght" ${finalWeight.toFixed(0)}, "wdth" ${widthVal.toFixed(0)}, "slnt" ${slantVal.toFixed(2)}`;
      });
    };

    const handleMouseLeave = () => {
      charRefs.current.forEach((el) => {
        if (el) {
          el.style.fontVariationSettings = `"wght" 100, "wdth" 100, "slnt" 0`;
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
    };
  }, []);

  return (
    <div className="focus-demo-container" ref={containerRef}>
      <div className="focus-text-content">
        {textElements.map((wordObj) => (
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
    </div>
  );
}
