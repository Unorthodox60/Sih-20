import { useState, useEffect } from 'react'
import Dashboard from './Dashboard'
import { Building2, ArrowRight } from 'lucide-react'
import './index.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function App() {
  const [orgId, setOrgId] = useState(null)
  const [orgName, setOrgName] = useState('')
  const [orgs, setOrgs] = useState([])
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  const fetchOrgs = () => {
    fetch(`${API_BASE_URL}/organizations`)
      .then(res => res.json())
      .then(data => {
        setOrgs(data)
        if (data.length === 0) {
          setIsCreatingNew(true)
        }
      })
      .catch(err => console.error('Failed to load orgs', err))
  }

  useEffect(() => {
    fetchOrgs()
  }, [orgId]) // Refetch when orgId changes (e.g. after logout or register)

  const handleRegister = async (e) => {
    e.preventDefault()
    const name = e.target.orgName.value
    const res = await fetch(`${API_BASE_URL}/register-org`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    const data = await res.json()
    if (res.ok) {
      setOrgId(data.id)
      setOrgName(data.name)
    } else if (res.status === 409) {
      alert('An organization with that name already exists. Please choose a different name.')
    } else {
      alert(data.detail || 'Error registering organization')
    }
  }

  const handleSelectOrg = (id, name) => {
    setOrgId(id)
    setOrgName(name)
  }

  return (
    <>
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-[-2] pointer-events-none"
        style={{ filter: 'brightness(0.4) saturate(0.3) contrast(1.1)' }}
      >
        <source 
          src="/bg-video.mp4" 
          type="video/mp4" 
        />
      </video>
      <div className="fixed inset-0 z-[-1] bg-black/80 pointer-events-none"></div>

      <nav className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center bg-transparent pointer-events-none">
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
          <div className="text-white text-xl font-bold tracking-tight">Wero</div>
        </div>
      </nav>

      <div className="relative z-0 pt-24 pb-6 px-6 flex flex-col">
        <div className="min-h-[calc(100vh-8rem)] w-full flex flex-col justify-center">
          {!orgId ? (
            <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

              {/* Left Column (60% roughly = col-span-7) */}
              <header className="lg:col-span-7 text-left space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest mb-2 animate-fade-up" style={{ animationDelay: '0.1s' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  SYSTEM ACTIVE
                </div>
                <h1 className="text-[clamp(2.5rem,5vw,5rem)] font-extrabold tracking-tight uppercase leading-[1.05] animate-fade-up" style={{ animationDelay: '0.16s' }}>
                  <span className="text-white">DARK WEB</span><br />
                  <span className="text-primary">MONITOR</span>
                </h1>
                <p className="text-gray-400 text-lg max-w-xl font-medium tracking-wide animate-fade-up" style={{ animationDelay: '0.22s' }}>
                  Track credential leaks, analyze breach exposure, and secure your organizational identities in real-time.
                </p>
              </header>

              {/* Right Column (Workspace Card) */}
              <main className="lg:col-span-5 w-full max-w-md mx-auto lg:ml-auto bg-gray-950/95 border border-white/10 rounded-2xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.7),0_0_20px_-10px_rgba(34,197,94,0.1)] backdrop-blur-md p-8 animate-fade-up relative" style={{ animationDelay: '0.28s' }}>
                {/* Vertical thin line anchor */}
                <div className="absolute -left-12 top-10 bottom-10 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent hidden lg:block"></div>

                <h2 className="text-2xl font-bold mb-6 text-white tracking-tight animate-fade-up" style={{ animationDelay: '0.34s' }}>
                  {isCreatingNew ? 'Create New Workspace' : 'Select a Workspace'}
                </h2>

                {!isCreatingNew && orgs.length > 0 ? (
                  <div className="space-y-4">
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar animate-fade-up" style={{ animationDelay: '0.4s' }}>
                      {orgs.map((org, i) => (
                        <button
                          key={org.id}
                          onClick={() => handleSelectOrg(org.id, org.name)}
                          className="w-full text-left bg-gray-900/95 border border-gray-800 hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-foreground transition-all duration-150 cursor-pointer flex items-center justify-between group animate-fade-up"
                          style={{ animationDelay: `${0.4 + (i * 0.06)}s` }}
                        >
                          <span className="font-medium text-gray-300 group-hover:text-white transition-colors">{org.name}</span>
                          <ArrowRight className="w-4 h-4 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150" />
                        </button>
                      ))}
                    </div>
                    <div className="mt-6 pt-5 border-t border-gray-800/50 animate-fade-up" style={{ animationDelay: '0.5s' }}>
                      <button
                        onClick={() => setIsCreatingNew(true)}
                        className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors cursor-pointer group font-medium"
                      >
                        Or create a new organization
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-5">
                    <div className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Organization Name</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Building2 className="h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors duration-150" />
                        </div>
                        <input
                          name="orgName"
                          type="text"
                          required
                          className="w-full bg-black/80 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white shadow-inner focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all duration-150 placeholder:text-gray-600"
                          placeholder="e.g. Acme Corp"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-primary text-primary-foreground font-semibold py-3 px-4 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all duration-150 cursor-pointer flex justify-center items-center gap-2 group animate-fade-up"
                      style={{ animationDelay: '0.46s' }}
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" />
                    </button>

                    {orgs.length > 0 && (
                      <div className="text-center mt-5 pt-4 border-t border-gray-800/50 animate-fade-up" style={{ animationDelay: '0.52s' }}>
                        <button
                          type="button"
                          onClick={() => setIsCreatingNew(false)}
                          className="text-sm text-gray-500 hover:text-white cursor-pointer transition-colors font-medium"
                        >
                          &larr; Back to existing
                        </button>
                      </div>
                    )}
                  </form>
                )}
              </main>
            </div>
          ) : (
            <div className="w-full animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <Dashboard orgId={orgId} orgName={orgName} onLogout={() => setOrgId(null)} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default App
