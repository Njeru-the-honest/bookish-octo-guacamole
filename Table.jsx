/**
 * Table
 *
 * Clean, borderless table with tonal alternating rows.
 *
 * Usage:
 *   <Table
 *     columns={[
 *       { key: 'name',   label: 'Name'   },
 *       { key: 'role',   label: 'Role',   hidden: 'md' },
 *       { key: 'status', label: 'Status', hidden: 'lg' },
 *     ]}
 *     rows={users}
 *     renderCell={(row, col) => {
 *       if (col.key === 'status') return <Badge status={row.status} />
 *       return row[col.key]
 *     }}
 *     keyExtractor={(row) => row.id}
 *   />
 *
 * Responsive hiding:
 *   hidden: 'md'  → hidden on mobile, visible md+
 *   hidden: 'lg'  → hidden on mobile+tablet, visible lg+
 */

const HIDDEN_CLASS = {
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
}

function Table({
  columns      = [],
  rows         = [],
  renderCell,
  keyExtractor = (row) => row.id,
  loading      = false,
  skeletonRows = 5,
  className    = '',
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <div key={i} className="skeleton h-14 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className={`card p-0 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="table-root">

          {/* Head */}
          <thead className="table-head">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`table-th
                    ${col.hidden
                      ? HIDDEN_CLASS[col.hidden] || ''
                      : ''
                    }
                    ${col.className || ''}
                  `}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={keyExtractor(row)}
                className={i % 2 === 0
                  ? 'table-row'
                  : 'bg-surface-low'
                }
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`table-td
                      ${col.hidden
                        ? HIDDEN_CLASS[col.hidden] || ''
                        : ''
                      }
                      ${col.tdClassName || ''}
                    `}
                  >
                    {renderCell
                      ? renderCell(row, col)
                      : row[col.key] ?? '—'
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  )
}

export default Table