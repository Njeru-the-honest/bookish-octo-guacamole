import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { formatDateTime, getStatusBadgeClass } from '../../utils/roleUtils'
import { Table, Badge, EmptyState, Button, PageHeader, FilterTabs } from '../../components/ui'

const ROLE_OPTIONS = ['', 'student', 'tutor', 'admin']

function UserManagement() {
  const [users, setUsers] = useState([])
  const [roleFilter, setRoleFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [togglingUserId, setTogglingUserId] = useState('')

  const fetchUsers = async () => {
    if (loading) return
    setLoading(true)
    setError('')
    try {
      let url = '/users/'
      const params = []
      if (roleFilter) params.push(`role=${roleFilter}`)
      if (searchTerm) params.push(`search=${encodeURIComponent(searchTerm)}`)
      if (params.length) url += `?${params.join('&')}`
      const res = await api.get(url)
      setUsers(res.data.data || [])
    } catch {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [roleFilter])

  const handleSearchSubmit = e => {
    e.preventDefault()
    fetchUsers()
  }

  const toggleActive = async (user) => {
    setTogglingUserId(user.id)
    setError('')
    setSuccess('')
    try {
      await api.patch(`/users/${user.id}/toggle-active`)
      setSuccess(`User ${user.is_active ? 'deactivated' : 'activated'} successfully.`)
      fetchUsers()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update user status')
    } finally {
      setTogglingUserId('')
    }
  }

  const roleBadges = {
    student: 'badge-student',
    tutor: 'badge-tutor',
    admin: 'badge-admin',
  }

  const columns = [
    {
      key: 'user',
      label: 'User',
      render: user => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 text-white font-bold text-xs flex-shrink-0 flex items-center justify-center">
            {user.full_name[0].toUpperCase()}
          </div>
          <div className="truncate">
            <p className="font-semibold text-ink">{user.full_name}</p>
            <p className="caption-text">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: user => <Badge status={user.role} />,
      className: 'text-center',
    },
    {
      key: 'school_or_department',
      label: 'Department',
      className: 'text-center',
    },
    {
      key: 'is_active',
      label: 'Status',
      render: user => <Badge status={user.is_active ? 'active' : 'inactive'} />,
      className: 'text-center',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: user => (
        <Button
          size="sm"
          variant={user.is_active ? 'danger' : 'success'}
          loading={togglingUserId === user.id}
          onClick={() => toggleActive(user)}
        >
          {user.is_active ? 'Deactivate' : 'Activate'}
        </Button>
      ),
      className: 'text-center',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 fade-in">

      <PageHeader
        title="User Management"
        subtitle="Manage and adjust student and tutor user accounts."
      />

      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="search"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="input-field flex-grow"
        />
        <Button variant="primary" type="submit">Search</Button>
      </form>

      <FilterTabs 
        options={ROLE_OPTIONS.map(role => ({
          value: role,
          label: role ? role.charAt(0).toUpperCase() + role.slice(1) : 'All'
        }))}
        value={roleFilter}
        onChange={setRoleFilter}
      />

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      {loading ? (
        <>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl mb-2" />
          ))}
        </>
      ) : users.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No users found"
          body="Try adjusting your filters or search query above."
        />
      ) : (
        <Table
          columns={columns}
          rows={users}
          keyExtractor={(user) => user.id}
          renderCell={(user, column) => (column.render ? column.render(user) : user[column.key] ?? '—')}
        />
      )}
    </div>
  )
}

export default UserManagement