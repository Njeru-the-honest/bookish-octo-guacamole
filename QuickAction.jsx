import { useNavigate } from 'react-router-dom'

function QuickAction({ label, icon: Icon, to, bgClass, colorClass }) {
  const navigate = useNavigate()
  const handleClick = () => navigate(to)

  return (
    <button
      onClick={handleClick}
      className={`quick-action ${bgClass} ${colorClass}`}
      type="button"
    >
      <div className={`quick-action-icon ${bgClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-xs font-600 text-center leading-tight">{label}</span>
    </button>
  )
}

export default QuickAction