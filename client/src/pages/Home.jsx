import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Car, FileText, Wrench, BarChart3, CheckCircle2 } from 'lucide-react'

export default function Home() {
  const workflow = [
    {
      title: 'Customer & Vehicle Intake',
      desc: 'Capture customer details, vehicle profile, and service needs the moment they arrive.',
      stat: 'Fast onboarding',
      icon: <Car className="w-6 h-6" />
    },
    {
      title: 'Job Card Creation',
      desc: 'Turn symptoms and inspection notes into structured job cards with clear priorities.',
      stat: 'Organized workflow',
      icon: <FileText className="w-6 h-6" />
    },
    {
      title: 'Workshop Job Management',
      desc: 'Track every repair, assign mechanics, monitor progress, and reduce delays.',
      stat: 'Live visibility',
      icon: <Wrench className="w-6 h-6" />
    },
    {
      title: 'Repair Planning & Tracking',
      desc: 'Support repair decisions, customer updates, and better turnaround times.',
      stat: 'Better outcomes',
      icon: <BarChart3 className="w-6 h-6" />
    },
  ]

  const aiModules = [
    'Fault Diagnosis',
    'Repair Time Estimation',
    'Car Colour Identification',
    'Parts Decision (Photo)',
    'Tire Condition Assessment',
    'Smart Scheduling',
  ]

  const metrics = [
    { label: 'Smarter job flow', value: '24/7' },
    { label: 'Workshop tools', value: '6+' },
    { label: 'Clearer updates', value: '100%' },
  ]

  return (
    /*
     * Landing page colours (this file only):
     * Root + hero glow orbs → slate-950 / cyan / blue / indigo
     * Nav → sticky bar, logo gradient, login buttons
     * Sections → workflow band, AI cards, customer/workshop CTAs, footer
     */
    <div className="min-h-screen overflow-hidden bg-slate-950 text-white selection:bg-cyan-500/30">
      {/* Landing page: animated background blobs + gradient overlay */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute left-[-6rem] top-[-6rem] h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl"></div>
        <div className="absolute right-[-8rem] top-[8rem] h-96 w-96 rounded-full bg-blue-600/15 blur-3xl"></div>
        <div className="absolute bottom-[-8rem] left-[20%] h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.4),transparent_45%),linear-gradient(to_bottom,rgba(2,6,23,1),rgba(3,7,18,1))]"></div>
      </div>

      {/* Landing page: top navigation bar + logo + portal buttons */}
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 font-black text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.35)]">
              K
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">Workshop Platform</p>
              <h1 className="text-lg font-black tracking-tight sm:text-xl">AUTO TUNE</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/user/login"
              className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm font-bold transition duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-lg"
            >
              User Login
            </Link>
            <Link
              to="/admin/login"
              className="rounded-xl sm:rounded-2xl bg-cyan-400 px-3 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm font-black text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.25)] transition duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-cyan-300"
            >
              Workshop
            </Link>
          </div>
        </div>
      </nav>

      {/* Landing page: hero + metrics + “Workshop Intelligence” preview card */}
      <section className="relative mx-auto max-w-7xl px-6 pb-24 pt-16 sm:pt-20 lg:pt-24">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-7"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400"></span>
              </span>
              Smart workshop operating system
            </div>

            <h2 className="max-w-4xl text-3xl font-black leading-[0.95] tracking-tight sm:text-5xl lg:text-7xl">
              Modern vehicle service,
              <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent">
                from first booking to final handover.
              </span>
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300/80 sm:text-lg">
              AUTO TUNE helps workshops manage customers, vehicles, job cards, repair progress, inventory, and diagnostics in one modern platform.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/user/register"
                className="group rounded-3xl bg-white px-7 py-4 text-base font-black text-slate-950 shadow-xl transition duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-slate-100"
              >
                <span className="inline-flex items-center gap-2">
                  Enter Customer Portal
                  <span className="transition-transform duration-300 group-hover:translate-x-1"></span>
                </span>
              </Link>

              <Link
                to="/admin/register"
                className="group rounded-3xl border border-white/10 bg-white/5 px-7 py-4 text-base font-black transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/10"
              >
                <span className="inline-flex items-center gap-2">
                  Enter Workshop Portal
                  <span className="transition-transform duration-300 group-hover:translate-x-1"></span>
                </span>
              </Link>
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="mt-12 grid gap-4 sm:grid-cols-3"
            >
              {metrics.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/[0.06]"
                >
                  <div className="text-3xl font-black text-white">{item.value}</div>
                  <div className="mt-2 text-sm font-semibold text-slate-400">{item.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="lg:col-span-5"
          >
            <div className="relative group">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-cyan-400/20 via-blue-500/20 to-indigo-500/20 blur-2xl transition duration-500 group-hover:from-cyan-400/30 group-hover:via-blue-500/30 group-hover:to-indigo-500/30"></div>

              <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900/60 p-6 backdrop-blur-2xl shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Live Platform View</p>
                    <h3 className="mt-2 text-xl font-black">Workshop Intelligence</h3>
                  </div>
                  <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                    Online
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    'Faster diagnosis and better repair decisions',
                    'Smarter scheduling and repair planning',
                    'Better inventory awareness and fewer delays',
                    'Customer updates with less confusion',
                  ].map((line, index) => (
                    <div
                      key={line}
                      className="group flex items-start gap-4 rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/20 hover:bg-slate-950/70"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 text-sm font-black text-cyan-300">
                        0{index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-white">{line}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          Better workflow, cleaner organization, and a modern customer experience.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Link
                    to="/user/login"
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xs font-black uppercase tracking-[0.18em] transition hover:-translate-y-0.5 hover:bg-white/10"
                  >
                    User Login
                  </Link>
                  <Link
                    to="/admin/login"
                    className="rounded-2xl bg-cyan-400 px-4 py-3 text-center text-xs font-black uppercase tracking-[0.18em] text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-300"
                  >
                    Workshop Login
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Landing page: workflow cards strip (muted slate band) */}
      <section className="border-y border-white/5 bg-slate-900/30 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">End-to-End Workflow</p>
            <h3 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">A complete workshop web platform</h3>
            <p className="mt-4 max-w-2xl text-slate-300/70">
              Built to support the full service journey while keeping the experience modern, clean, and easy to understand.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {workflow.map((item, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                key={item.title}
                className="group rounded-[2rem] border border-white/10 bg-slate-950/50 p-6 transition duration-300 hover:-translate-y-2 hover:border-cyan-400/20 hover:bg-slate-900/70 shadow-lg hover:shadow-cyan-500/10"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 text-cyan-300">
                  {item.icon}
                </div>
                <h4 className="text-lg font-black">{item.title}</h4>
                <p className="mt-3 text-sm leading-7 text-slate-300/70">{item.desc}</p>
                <div className="mt-5 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                  {item.stat}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Landing page: AI tools grid (accent bars + cyan icons) */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 lg:grid-cols-12">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Workshop Tools Suite</p>
              <h3 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Real tools for real workshop work
              </h3>
              <p className="mt-4 max-w-xl text-slate-300/70">
                These tools are made for daily operations, not just for demo purposes.
              </p>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
              {aiModules.map((item, i) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  key={item}
                  className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/20 hover:bg-white/[0.05]"
                >
                  <div className="mb-4 h-2 w-full rounded-full bg-gradient-to-r from-cyan-400/40 via-blue-500/40 to-indigo-500/40"></div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                    <h4 className="text-lg font-black">{item}</h4>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    Built to improve speed, consistency, and decision-making across the workshop.
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Landing page: customer vs workshop dual panels (cyan vs emerald bullet accents) */}
      <section className="border-t border-white/5 bg-slate-900/20 py-24">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-2">
          <div className="rounded-[2.5rem] border border-white/10 bg-slate-950/60 p-8 backdrop-blur-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">For Customers</p>
            <h3 className="mt-3 text-3xl font-black">Track your vehicle with confidence</h3>
            <div className="mt-6 space-y-3">
              {[
                'Create an account and save vehicle details',
                'Submit service requests and symptoms easily',
                'Estimate your car\'s market value with AI',
                'Stay connected with the workshop through messages',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/[0.03] p-4">
                  <span className="mt-1 h-2 w-2 rounded-full bg-cyan-400"></span>
                  <p className="text-sm leading-7 text-slate-300/80">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/user/register"
                className="rounded-2xl bg-white px-5 py-3 font-black text-slate-950 transition hover:bg-slate-100"
              >
                Create Account
              </Link>
              <Link
                to="/user/login"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-black transition hover:bg-white/10"
              >
                Login
              </Link>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-[2.5rem] border border-white/10 bg-slate-950/60 p-8 backdrop-blur-xl"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">For Workshop Teams</p>
            <h3 className="mt-3 text-3xl font-black">Run the workshop like a modern system</h3>
            <div className="mt-6 space-y-3">
              {[
                'Manage jobs and update statuses in one place',
                'Use workshop tools to support diagnostics and inspections',
                'Improve scheduling and reduce wasted time',
                'Handle inventory and customer communication better',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/[0.03] p-4">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400"></span>
                  <p className="text-sm leading-7 text-slate-300/80">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/admin/register"
                className="rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-300"
              >
                Join Workshop Portal
              </Link>
              <Link
                to="/admin/login"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-black transition hover:bg-white/10"
              >
                Workshop Login
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Landing page: footer text colour */}
      <footer className="border-t border-white/5 py-10 text-center text-sm text-slate-500">
        <p>Â© 2026 AUTO TUNE. Smart vehicle workshop platform.</p>
      </footer>
    </div>
  )
}
