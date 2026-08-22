import { useEffect, useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import AppLayout from '../../layouts/AppLayout'
import api from '../../services/api'
import { Camera, FileText, CheckSquare, MessageCircle, MoreVertical, Wrench } from 'lucide-react'
import SearchInput from '../../components/SearchInput'
import SlidePanel from '../../components/SlidePanel'
import ConfirmModal from '../../components/ConfirmModal'

export default function JobList() {
  const [jobs, setJobs] = useState([])
  const [staff, setStaff] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modals & Panels state
  const [activeJob, setActiveJob] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [draggingId, setDraggingId] = useState(null)

  const loadJobs = async () => {
    try {
      const res = await api.get('/jobs')
      setJobs(res.data)
    } catch (err) {
      toast.error('Failed to load jobs')
    }
  }

  const loadStaff = async () => {
    try {
      const res = await api.get('/admin/staff')
      setStaff(res.data)
    } catch (e) {
      setStaff([])
    }
  }

  useEffect(() => {
    loadJobs()
    loadStaff()
  }, [])

  // Drag and Drop Logic
  const handleDragStart = (e, jobId) => {
    e.dataTransfer.setData('jobId', jobId)
    setDraggingId(jobId)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
  }

  const handleDragOver = (e) => {
    e.preventDefault() // Necessary to allow dropping
  }

  const handleDrop = async (e, newStatus) => {
    e.preventDefault()
    setDraggingId(null)
    const jobId = e.dataTransfer.getData('jobId')
    if (!jobId) return

    const job = jobs.find(j => String(j.job_id) === String(jobId))
    if (!job || job.status === newStatus) return

    // Optimistic UI update
    setJobs(jobs.map(j => String(j.job_id) === String(jobId) ? { ...j, status: newStatus } : j))
    
    try {
      const admin = JSON.parse(localStorage.getItem('adminUser') || 'null')
      await api.put(`/jobs/${jobId}`, { status: newStatus, changed_by: admin?.user_id || null })
      toast.success(`Job moved to ${newStatus.replace('_', ' ')}`)
    } catch (err) {
      toast.error('Failed to move job')
      loadJobs() // Revert on failure
    }
  }

  // Quote & Invoice Generation
  const generateQuote = async (jobId) => {
    const amountStr = prompt('Enter quote amount (e.g. 1500.50):')
    if (!amountStr) return
    const amount = parseFloat(amountStr)
    if (isNaN(amount)) return toast.error('Invalid amount')

    try {
      await api.post('/finance/quote', { job_id: jobId, amount })
      toast.success('Quote generated and sent to customer')
    } catch (e) {
      toast.error('Failed to generate quote')
    }
  }

  const generateInvoice = async (jobId) => {
    const amountStr = prompt('Enter final invoice amount (e.g. 2100.00):')
    if (!amountStr) return
    const amount = parseFloat(amountStr)
    if (isNaN(amount)) return toast.error('Invalid amount')

    try {
      await api.post('/finance/invoice', { job_id: jobId, amount })
      toast.success('Invoice generated and sent to customer')
    } catch (e) {
      toast.error('Failed to generate invoice')
    }
  }

  const assignMechanic = async (jobId, mechanicId) => {
    try {
      await api.put(`/jobs/${jobId}/assign`, { mechanic_id: mechanicId || null })
      toast.success('Mechanic assigned')
      loadJobs()
    } catch (e) {
      toast.error('Failed to assign mechanic')
    }
  }

  // Image Upload Logic
  const fileInputRef = useRef(null)
  
  const handlePhotoUpload = (job) => {
    setActiveJob(job)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !activeJob) return

    setUploadingImage(true)
    const toastId = toast.loading('Uploading timeline photo...')
    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onloadend = async () => {
        try {
          const base64data = reader.result
          const admin = JSON.parse(localStorage.getItem('adminUser') || 'null')
          await api.put(`/jobs/${activeJob.job_id}`, { 
            status: activeJob.status, // keep current status
            changed_by: admin?.user_id || null,
            notes: 'Mechanic uploaded a photo.',
            image_url: base64data
          })
          toast.success('Photo added to job timeline', { id: toastId })
        } catch (err) {
          toast.error('Failed to save photo', { id: toastId })
        } finally {
          setUploadingImage(false)
          fileInputRef.current.value = ''
          setActiveJob(null)
        }
      }
    } catch (err) {
      toast.error('Failed to read image file', { id: toastId })
      setUploadingImage(false)
    }
  }

  const openJobDetails = (job) => {
    setActiveJob(job)
    setIsPanelOpen(true)
  }

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    j.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(j.job_id).includes(searchTerm)
  )

  // Board Columns
  const columns = [
    { id: 'pending', title: 'Pending', color: 'border-orange-500/30 bg-orange-500/5', headerColor: 'text-orange-400' },
    { id: 'diagnosed', title: 'Diagnosed', color: 'border-purple-500/30 bg-purple-500/5', headerColor: 'text-purple-400' },
    { id: 'in_progress', title: 'In Progress', color: 'border-blue-500/30 bg-blue-500/5', headerColor: 'text-blue-400' },
    { id: 'completed', title: 'Completed', color: 'border-emerald-500/30 bg-emerald-500/5', headerColor: 'text-emerald-400' },
  ]

  return (
    <AppLayout title="Workshop Kanban Board">
      
      {/* Hidden File Input for Camera Uploads */}
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />

      <div className="mb-6 w-full max-w-md">
        <SearchInput 
          value={searchTerm} 
          onChange={setSearchTerm} 
          placeholder="Search jobs by ID, title, customer, or vehicle..." 
        />
      </div>

      <div className="flex gap-6 overflow-x-auto pb-8 h-[calc(100vh-200px)]">
        {columns.map(col => {
          const columnJobs = filteredJobs.filter(j => j.status === col.id)
          
          return (
            <div 
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex-shrink-0 w-80 md:w-96 flex flex-col rounded-[2rem] border ${col.color} transition-colors ${draggingId ? 'border-dashed border-cyan-500/50 bg-cyan-500/5' : ''}`}
            >
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-900/40 rounded-t-[2rem]">
                <h3 className={`font-black text-lg ${col.headerColor}`}>{col.title}</h3>
                <div className="bg-slate-950 px-3 py-1 rounded-full text-xs font-bold text-slate-300 border border-white/10">
                  {columnJobs.length}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {columnJobs.map(job => (
                  <div 
                    key={job.job_id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, job.job_id)}
                    onDragEnd={handleDragEnd}
                    className={`bg-slate-900/80 backdrop-blur-md p-5 rounded-[1.5rem] border border-white/10 shadow-xl cursor-grab active:cursor-grabbing transition-all ${draggingId === job.job_id ? 'opacity-50 scale-95' : 'hover:border-cyan-500/50 hover:shadow-cyan-500/10'}`}
                  >
                    <div className="flex justify-between items-start mb-3 cursor-pointer" onClick={() => openJobDetails(job)}>
                      <div>
                        <span className="bg-slate-950 text-slate-400 border border-white/5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest">
                          #{job.job_id}
                        </span>
                        <h4 className="font-bold text-white mt-2 leading-tight">{job.title}</h4>
                      </div>
                      {job.priority === 'urgent' || job.priority === 'high' ? (
                        <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-500/30">
                          {job.priority}
                        </span>
                      ) : null}
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 bg-slate-950/50 p-2 rounded-lg border border-white/5 italic">
                      {job.symptoms}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-xs text-slate-300 font-semibold mb-1">
                          👤 {job.customer_name}
                        </div>
                        <div className="text-xs text-slate-400 font-medium">
                          🚗 {job.make} {job.model}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-slate-500" />
                        <select
                          className="bg-slate-950 text-xs text-slate-300 border border-white/10 rounded-lg px-2 py-1 outline-none focus:border-cyan-500"
                          value={job.mechanic_id || ''}
                          onChange={(e) => assignMechanic(job.job_id, e.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {staff.map(s => (
                            <option key={s.user_id} value={s.user_id}>{s.full_name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Quick Actions Footer */}
                    <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handlePhotoUpload(job)}
                          className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-cyan-500 hover:text-slate-950 transition-colors"
                          title="Add Photo to Timeline"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <Link 
                          to="/inbox"
                          className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-cyan-500 hover:text-slate-950 transition-colors"
                          title="Message Customer"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Link>
                      </div>

                      <div className="flex gap-2">
                        {col.id !== 'completed' ? (
                          <button 
                            onClick={() => generateQuote(job.job_id)}
                            className="bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5"
                          >
                            <FileText className="w-3 h-3" /> Quote
                          </button>
                        ) : (
                          <button 
                            onClick={() => generateInvoice(job.job_id)}
                            className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5"
                          >
                            <CheckSquare className="w-3 h-3" /> Invoice
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {columnJobs.length === 0 && (
                  <div className="h-24 border-2 border-dashed border-white/10 rounded-[1.5rem] flex items-center justify-center text-slate-500 text-sm font-semibold">
                    {searchTerm ? 'No matches' : 'Drop jobs here'}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <SlidePanel 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)}
        title={`Job #${activeJob?.job_id} Details`}
      >
        {activeJob && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Customer Info</h3>
              <p className="text-white font-medium">{activeJob.customer_name}</p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Vehicle Info</h3>
              <p className="text-white font-medium">{activeJob.year} {activeJob.make} {activeJob.model}</p>
              {activeJob.registration_number && (
                <p className="text-slate-300 text-sm mt-1">Reg: {activeJob.registration_number}</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Issue Description</h3>
              <div className="bg-slate-900 p-4 rounded-xl border border-white/5 text-slate-300 text-sm">
                {activeJob.symptoms}
              </div>
            </div>
            {activeJob.predicted_problem && (
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">AI Diagnosis</h3>
                <div className="bg-purple-900/20 p-4 rounded-xl border border-purple-500/20 text-purple-200 text-sm">
                  {activeJob.predicted_problem}
                </div>
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Status & Assignment</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-400 text-sm">Status</span>
                  <span className="text-white font-bold capitalize">{activeJob.status.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-400 text-sm">Mechanic</span>
                  <select
                    className="bg-slate-950 text-sm text-slate-300 border border-white/10 rounded-lg px-2 py-1 outline-none focus:border-cyan-500"
                    value={activeJob.mechanic_id || ''}
                    onChange={(e) => assignMechanic(activeJob.job_id, e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {staff.map(s => (
                      <option key={s.user_id} value={s.user_id}>{s.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </SlidePanel>
    </AppLayout>
  )
}
