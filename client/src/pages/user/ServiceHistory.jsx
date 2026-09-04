import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import UserLayout from '../../layouts/UserLayout'
import api from '../../services/api'
import Pagination from '../../components/Pagination'
import { Calendar, CheckCircle2, ChevronRight, FileText } from 'lucide-react'

export default function ServiceHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  const { user } = useAuth()

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.user_id) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const res = await api.get(`/jobs/user/${user.user_id}`)
        const allJobs = Array.isArray(res.data) ? res.data : []
        // Filter for completed/archived/cancelled jobs that represent history
        const completedJobs = allJobs.filter(job => job.status === 'completed' || job.status === 'archived' || job.status === 'cancelled')
        setHistory(completedJobs)
      } catch (err) {
        toast.error('Failed to load service history')
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalPages = Math.ceil(history.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedHistory = history.slice(startIndex, startIndex + itemsPerPage)

  return (
    <UserLayout title="Service History">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Past Services</h2>
            <p className="text-sm font-semibold text-slate-500">A record of all your completed jobs and repairs.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-600 shadow-sm">
            {history.length} Records
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">Loading your history...</div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-black text-slate-900">No history yet</h3>
            <p className="text-sm text-slate-500 mt-2">Your completed service records will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginatedHistory.map((job) => (
              <div key={job.job_id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${
                    job.status === 'completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                    job.status === 'cancelled' ? 'bg-red-50 border-red-200 text-red-600' :
                    'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                    {job.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-lg font-black text-slate-900">{job.title}</h4>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                        #{job.job_id}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-600 mb-2">
                      {job.make} {job.model} ({job.year})
                    </p>
                    <p className="text-xs text-slate-500 max-w-2xl line-clamp-2">
                      {job.symptoms}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 border-t border-slate-100 md:border-t-0 pt-4 md:pt-0">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Date</p>
                    <p className="text-sm font-bold text-slate-900">
                      {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {job.status === 'completed' && (
                    <Link 
                      to={`/user/invoice/${job.job_id}`}
                      className="flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-100 transition-all"
                    >
                      <FileText className="w-4 h-4" />
                      Invoice
                    </Link>
                  )}
                  {job.status !== 'completed' && (
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                      {job.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-6 border-t border-slate-100 flex justify-center bg-slate-50">
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </UserLayout>
  )
}
