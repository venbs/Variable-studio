import { useEffect, useRef, useMemo } from 'react';
import './FocusDemo.css';

const TEXT_CONTENT = "Aa"; // We'll repeat this
const ROWS = 15;
const COLS = 20;

export default function FocusDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Generate grid items
  const gridItems = useMemo(() => {
    return Array.from({ length: ROWS * COLS }, (_, i) => ({
      id: i,
      text: TEXT_CONTENT
    }));
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;

      charRefs.current.forEach((el) => {
        if (!el) return;

        // Cache center coordinates if not done yet
        if (!el.dataset.centerX) {
          const rect = el.getBoundingClientRect();
          // Relative to container
          el.dataset.centerX = String(rect.left + rect.width / 2 - containerRect.left);
          el.dataset.centerY = String(rect.top + rect.height / 2 - containerRect.top);
        }

        const charX = parseFloat(el.dataset.centerX || "0");
        const charY = parseFloat(el.dataset.centerY || "0");

        const dx = mouseX - charX;
        const dy = mouseY - charY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Map distance to font weight (100 to 1000)
        // Max distance effect radius: 400px
        const maxDist = 400;
        let weight = 100;

        if (distance < maxDist) {
          // Closer to cursor = higher weight
          // Use a smooth easing function, e.g., cosine or simple quadratic
          const progress = 1 - (distance / maxDist);
          // Ease out
          const easedProgress = Math.pow(progress, 1.5);
          weight = 100 + (easedProgress * 900);
        }

        // Clamp values
        const finalWeight = Math.max(100, Math.min(1000, weight));

        // Update via fontVariationSettings for performance
        el.style.fontVariationSettings = `"wght" ${finalWeight.toFixed(0)}`;
      });
    };

    const handleMouseLeave = () => {
      // Reset weights to default when mouse leaves
      charRefs.current.forEach((el) => {
        if (el) {
          el.style.fontVariationSettings = `"wght" 100`;
        }
      });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <div className="focus-demo-container" ref={containerRef}>
      <div className="focus-grid">
        {gridItems.map((item, index) => (
          <span
            key={item.id}
            ref={(el) => { charRefs.current[index] = el; }}
            className="focus-char"
          >
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}
