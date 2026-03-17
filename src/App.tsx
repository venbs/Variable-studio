import { useState } from 'react'
import './App.css'
import FocusDemo from './components/FocusDemo'

const DEMOS = [
  { id: 'focus', name: 'Focus' }
]

function App() {
  const [activeDemo, setActiveDemo] = useState(DEMOS[0].id)

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Variable studio</h1>
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
        {activeDemo === 'focus' && <FocusDemo />}
      </main>
    </div>
  )
}

export default App
