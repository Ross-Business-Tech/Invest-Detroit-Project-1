import { briefingItems, shift } from './sampleData.js'
import './App.css'

const priorityLabel = {
  safety: 'SAFETY',
  high: 'Watch',
  normal: 'Follow-up',
}

function App() {
  const safetyCount = briefingItems.filter((i) => i.priority === 'safety').length
  const openCount = briefingItems.length
  const sorted = [...briefingItems].sort((a, b) => {
    const rank = { safety: 0, high: 1, normal: 2 }
    return rank[a.priority] - rank[b.priority]
  })

  return (
    <main className="app">
      <header className="top">
        <p className="eyebrow">{shift.plant}</p>
        <h1>Incoming briefing</h1>
        <p className="subtle">
          {shift.area} · Starting {shift.incoming}
        </p>
      </header>

      <section className="stats" aria-label="Summary">
        <div className="stat">
          <span className="stat-num">{openCount}</span>
          <span className="stat-label">Items to know</span>
        </div>
        <div className="stat stat-safety">
          <span className="stat-num">{safetyCount}</span>
          <span className="stat-label">Safety items</span>
        </div>
        <div className="stat">
          <span className="stat-num">Day</span>
          <span className="stat-label">Shift handing off</span>
        </div>
      </section>

      <section className="list" aria-label="Items for this shift">
        {sorted.map((item) => (
          <article key={item.id} className={`card card-${item.priority}`}>
            <div className="card-head">
              <span className={`badge badge-${item.priority}`}>
                {priorityLabel[item.priority]}
              </span>
              <span className="due">Due: {item.due}</span>
            </div>
            <h2>{item.title}</h2>
            <p>{item.detail}</p>
            <p className="owner">Owner: {item.owner}</p>
          </article>
        ))}
      </section>

      <footer className="foot">Sample data for demo only.</footer>
    </main>
  )
}

export default App
