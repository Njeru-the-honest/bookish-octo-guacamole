import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { PageHeader, Card, EmptyState } from '../../components/ui'
import { renderStars } from '../../utils/roleUtils'

function Reports() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [topTutors, setTopTutors] = useState([])
  const [subjectDemand, setSubjectDemand] = useState([])

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)
      setError('')
      try {
        const [tutorsRes, demandRes] = await Promise.all([
          api.get('/admin/reports/top-tutors?limit=6'),
          api.get('/admin/reports/subject-demand')
        ])
        setTopTutors(tutorsRes.data.data || [])
        setSubjectDemand(demandRes.data.data || [])
      } catch {
        setError('Failed to load reports.')
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [])

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 fade-in">
      <PageHeader title="Reports" subtitle="In-depth system insights and analytics." />

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl my-2" />
          ))}
        </div>
      ) : (
        <>
          {/* Top Tutors */}
          <section>
            <h3 className="section-title mb-4">Top Rated Tutors</h3>
            {topTutors.length === 0 ? (
              <EmptyState
                title="No rated tutors available"
                body="Complete sessions to gather tutor ratings."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {topTutors.map((tutor, index) => (
                  <Card key={tutor.user_id} className="p-6">
                    <div className="flex items-center mb-3">
                      <div className="font-bold text-xl w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-warning-400 to-warning-600 text-white flex-shrink-0">
                        #{index + 1}
                      </div>
                      <div className="ml-4 min-w-0">
                        <p className="font-display font-semibold text-ink truncate">{tutor.full_name}</p>
                        <p className="caption-text text-ink-secondary truncate">
                          {tutor.school_or_department}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-warning-500 text-lg">
                        {renderStars(Math.round(tutor.average_rating))}
                      </span>
                      <span className="font-display font-bold text-ink">{tutor.average_rating.toFixed(1)}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tutor.subjects.slice(0, 3).map((subject) => (
                        <Badge key={subject} color="neutral" className="text-xs px-3 py-1 rounded-pill">{subject}</Badge>
                      ))}
                      {tutor.subjects.length > 3 && (
                        <Badge color="neutral" className="text-xs px-3 py-1 rounded-pill">+{tutor.subjects.length - 3} more</Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Subject Demand */}
          <section>
            <h3 className="section-title mb-4">Most Requested Subjects</h3>
            {subjectDemand.length === 0 ? (
              <EmptyState
                title="No subject demand data"
                body="Requests will populate the subject demand report."
              />
            ) : (
              <Card className="p-6">
                <div className="divide-y divide-surface-high">
                  {subjectDemand.map((subj, i) => (
                    <div key={subj.subject} className="py-3 flex justify-between items-center">
                      <p className="font-600 text-ink">{i+1}. {subj.subject}</p>
                      <p className="caption-text text-ink-secondary">{subj.total_requests} requests</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default Reports