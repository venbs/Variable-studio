import { useState, useMemo } from 'react'
import './App.css'
import FocusDemo from './components/FocusDemo'
import TypingDemo from './components/TypingDemo'

const DEMOS = [
  { id: 'Focus', name: 'Focus' },
  { id: 'Typing', name: 'Typing' }
]

function App() {
  const [activeDemo, setActiveDemo] = useState(DEMOS[0].id)
  const [randomTrigger, setRandomTrigger] = useState(0)

  const TITLE = "Variable studio"
  const titleChars = useMemo(() => {
    return TITLE.split('').map((char, index) => {
      // random params for variable fonts
      const wght = 100 + Math.random() * 800; // 100 - 900
      const wdth = 25 + Math.random() * 125;  // 25 - 150
      const slnt = Math.random() * -10;       // -10 - 0

      return {
        char,
        id: index,
        style: {
          fontFamily: "'Roboto Flex Local', sans-serif",
          fontVariationSettings: `"wght" ${wght.toFixed(0)}, "wdth" ${wdth.toFixed(0)}, "slnt" ${slnt.toFixed(2)}`,
          display: 'inline-block',
          transition: 'font-variation-settings 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
          whiteSpace: 'pre',
          willChange: 'font-variation-settings'
        }
      };
    });
  }, [randomTrigger]);

  const handleTitleClick = () => {
    setRandomTrigger((prev) => prev + 1);
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 onClick={handleTitleClick} title="Click to randomize variable axes!">
            {titleChars.map((item) => (
              <span key={item.id} style={item.style as any}>
                {item.char}
              </span>
            ))}
          </h1>
        </div>
        <ul className="menu-list">
          {DEMOS.map(demo => (
            <li
              key={demo.id}
              className={`menu-item ${activeDemo === demo.id ? 'active' : ''}`}
              onClick={() => setActiveDemo(demo.id)}
            >
              {demo.name}
            </li>
          ))}
        </ul>
      </aside>
      <main className="demo-area">
        {activeDemo === 'Focus' && <FocusDemo />}
        {activeDemo === 'Typing' && <TypingDemo />}
        {/* Placeholder for other demos */}
      </main>

      <div className="global-footer">
        © 2026 <b>venbs</b> & <b>Antigravity</b> <span style={{ opacity: 0.5, marginLeft: '6px' }}>— Vibecoding Partners</span>
      </div>
    </div>
  )
}

export default App
