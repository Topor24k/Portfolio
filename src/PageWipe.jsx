import './page-wipe.css'

export default function PageWipe({ active, label }) {
  if (!active) return null

  return (
    <div className="page-wipe" aria-hidden="true">
      <span className="page-wipe-panel panel-coral" />
      <span className="page-wipe-panel panel-gold" />
      <span className="page-wipe-panel panel-ink" />
      <span className="page-wipe-panel panel-paper" />
    </div>
  )
}
