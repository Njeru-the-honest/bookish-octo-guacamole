/**
 * FilterTabs
 *
 * Pill-container tab row for filtering lists.
 *
 * Usage:
 *   <FilterTabs
 *     options={[
 *       { value: '',          label: 'All'       },
 *       { value: 'pending',   label: 'Pending'   },
 *       { value: 'accepted',  label: 'Accepted'  },
 *       { value: 'rejected',  label: 'Rejected'  },
 *     ]}
 *     value={filter}
 *     onChange={setFilter}
 *   />
 *
 * With counts:
 *   <FilterTabs
 *     options={[
 *       { value: 'pending', label: 'Pending', count: 3 },
 *       { value: 'all',     label: 'All',     count: 12 },
 *     ]}
 *     value={filter}
 *     onChange={setFilter}
 *   />
 */

function FilterTabs({
  options   = [],
  value,
  onChange,
  className = '',
}) {
  return (
    <div className={`filter-tabs ${className}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={value === opt.value
            ? 'filter-tab-active'
            : 'filter-tab'
          }
        >
          {opt.label}
          {opt.count !== undefined && (
            <span
              className={`ml-1.5 px-1.5 py-0.5 rounded-pill
                          text-xs font-700
                          ${value === opt.value
                            ? 'bg-brand-100 text-brand-700'
                            : 'bg-surface-high text-ink-tertiary'
                          }`}
            >
              {opt.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

export default FilterTabs