import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AppLayout from '../../layouts/AppLayout'
import api from '../../services/api'
import SearchInput from '../../components/SearchInput'
import Pagination from '../../components/Pagination'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [resettingId, setResettingId] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/customers')
      setCustomers(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const deleteCustomer = async (customer) => {
    const confirmed = window.confirm(
      `Delete ${customer.full_name}'s account?\n\nThis will permanently remove the customer, vehicles, jobs, and related records tied to that account.`
    )

    if (!confirmed) return

    setDeletingId(customer.user_id)
    try {
      await api.delete(`/admin/customers/${customer.user_id}`)
      setCustomers((prev) => prev.filter((item) => item.user_id !== customer.user_id))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete customer')
    } finally {
      setDeletingId(null)
    }
  }

  const resetPassword = async (customer) => {
    const password = window.prompt(`Enter a new password for ${customer.full_name}:`)

    if (password == null) return

    if (String(password).trim().length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    setResettingId(customer.user_id)
    try {
      await api.put(`/admin/customers/${customer.user_id}/password`, {
        password: String(password).trim(),
      })
      toast.success(`Password updated for ${customer.full_name}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password')
    } finally {
      setResettingId(null)
    }
  }

  // Filter customers based on search term
  const filteredCustomers = customers.filter(c => 
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm))
  )

  // Pagination logic
  const totalItems = filteredCustomers.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  
  // Ensure current page is valid when filtering changes total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    } else if (totalPages === 0) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage)

  return (
    <AppLayout title="Customer Database">
      <div className="mb-6 max-w-md">
        <SearchInput 
          value={searchTerm} 
          onChange={setSearchTerm} 
          placeholder="Search by name, email, or phone..." 
        />
      </div>

      <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/60 shadow-2xl backdrop-blur-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 p-8">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-white">Customers</h3>
            <p className="text-sm font-semibold text-slate-400">Real registered users and their vehicle profiles</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-300">
            {filteredCustomers.length} Found
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-slate-400 font-bold">Loading...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-10 text-slate-500 font-bold">No customers found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[10px] uppercase tracking-widest text-slate-500 font-black">
                  <tr className="border-b border-white/10">
                    <th className="text-left p-5">Name</th>
                    <th className="text-left p-5">Email</th>
                    <th className="text-left p-5">Phone</th>
                    <th className="text-left p-5">Vehicles</th>
                    <th className="text-left p-5">Joined</th>
                    <th className="text-left p-5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCustomers.map((c) => (
                    <tr key={c.user_id} className="border-b border-white/5 transition-colors hover:bg-white/5">
                      <td className="p-5 font-bold text-white">{c.full_name}</td>
                      <td className="p-5 text-slate-300 font-semibold">{c.email}</td>
                      <td className="p-5 text-slate-300 font-semibold">{c.phone || '-'}</td>
                      <td className="p-5">
                        <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-300">
                          {c.vehicles_count}
                        </span>
                        {Array.isArray(c.vehicles) && c.vehicles.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {c.vehicles.slice(0, 3).map((v) => (
                              <p key={v.vehicle_id} className="text-[11px] text-slate-300 font-semibold">
                                {v.make} {v.model} ({v.registration_number || 'No reg'})
                              </p>
                            ))}
                            {c.vehicles.length > 3 && (
                              <p className="text-[10px] text-slate-500 font-bold">+{c.vehicles.length - 3} more</p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-5 text-slate-400 font-semibold">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td className="p-5">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => resetPassword(c)}
                            disabled={resettingId === c.user_id}
                            className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-60"
                          >
                            {resettingId === c.user_id ? 'Saving...' : 'Reset Password'}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCustomer(c)}
                            disabled={deletingId === c.user_id}
                            className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-300 transition hover:bg-red-500/20 disabled:opacity-60"
                          >
                            {deletingId === c.user_id ? 'Deleting...' : 'Delete Account'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="p-6 border-t border-white/5 flex justify-center">
                <Pagination 
                  currentPage={currentPage} 
                  totalPages={totalPages} 
                  onPageChange={setCurrentPage} 
                />
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
