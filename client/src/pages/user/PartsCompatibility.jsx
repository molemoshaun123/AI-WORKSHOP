import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Wrench, ChevronDown, CheckCircle2, PackageSearch } from 'lucide-react'
import AppLayout from '../../layouts/AppLayout'
import api from '../../services/api'

export default function PartsCompatibility() {
  const [parts, setParts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedPart, setExpandedPart] = useState(null)

  useEffect(() => {
    const fetchParts = async () => {
      try {
        const res = await api.get('/parts/catalog')
        setParts(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        console.error('Failed to load parts')
      } finally {
        setLoading(false)
      }
    }
    fetchParts()
  }, [])

  const filteredParts = useMemo(() => {
    if (!searchTerm) return parts
    const term = searchTerm.toLowerCase()
    return parts.filter(
      (p) =>
        p.name?.toLowerCase().includes(term) ||
        p.compatible_cars?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term)
    )
  }, [parts, searchTerm])

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900/40 to-slate-900/80 border border-white/10 p-8 sm:p-12">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm font-medium">
                <PackageSearch className="w-4 h-4" />
                Compatibility Alternatives
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Find the Right Parts for Your Car
              </h1>
              <p className="text-slate-400 max-w-xl text-lg">
                Search our extensive inventory to find parts that are compatible with your specific make and model.
              </p>
            </div>
            
            <div className="w-full md:w-96 relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-violet-400 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search by part name, SKU, or car model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Parts Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
          </div>
        ) : filteredParts.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-white/5">
            <Wrench className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-300 mb-2">No parts found</h3>
            <p className="text-slate-500">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredParts.map((part, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={part.part_id}
                className="group relative bg-slate-900/60 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden hover:border-violet-500/30 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.15)]"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1 group-hover:text-violet-300 transition-colors">
                        {part.name}
                      </h3>
                      <p className="text-sm text-slate-500 font-mono">SKU: {part.sku || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-950/50 px-3 py-1 rounded-full border border-white/5 text-emerald-400 font-semibold shadow-inner">
                      R{Number(part.unit_price).toFixed(2)}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${part.quantity > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      <span className={part.quantity > 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {part.quantity > 0 ? `${part.quantity} in stock` : 'Out of stock'}
                      </span>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                      <button
                        onClick={() => setExpandedPart(expandedPart === part.part_id ? null : part.part_id)}
                        className="flex items-center justify-between w-full text-sm font-medium text-slate-300 hover:text-white transition-colors group/btn"
                      >
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-violet-400" />
                          Compatible Vehicles
                        </span>
                        <ChevronDown 
                          className={`w-4 h-4 transition-transform duration-300 text-slate-500 group-hover/btn:text-white ${
                            expandedPart === part.part_id ? 'rotate-180' : ''
                          }`} 
                        />
                      </button>
                      
                      <motion.div
                        initial={false}
                        animate={{ height: expandedPart === part.part_id ? 'auto' : 0, opacity: expandedPart === part.part_id ? 1 : 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 p-4 bg-slate-950/50 rounded-2xl border border-white/5 shadow-inner">
                          {part.compatible_cars ? (
                            <ul className="space-y-2">
                              {part.compatible_cars.split(',').map((car, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500/50 mt-1.5 shrink-0"></div>
                                  <span className="leading-relaxed">{car.trim()}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-slate-500 italic">No compatibility information available.</p>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
