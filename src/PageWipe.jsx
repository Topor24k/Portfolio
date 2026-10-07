import './page-wipe.css'

export default function PageWipe({ active, label }) {
  if (!active) return null

  return (
    <div className="page-wipe" aria-hidden="true">
      <span className="page-wipe-panel panel-coral" />
      <span className="page-wipe-panel panel-gold" />
      <span className="page-wipe-panel panel-ink" />
      <span className="page-wipe-panel panel-paper" />
      <div className="page-wipe-caption">
        <small>Now entering</small>
        <strong>
          {[...label].map((char, i) => (
            <span className="page-wipe-char" style={{ '--i': i }} key={i}>{char === ' ' ? ' ' : char}</span>
          ))}
        </strong>
        <span className="page-wipe-line" />
      </div>
    </div>
  )
}
