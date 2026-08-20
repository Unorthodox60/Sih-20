import { useState, useEffect } from 'react'
import Dashboard from './Dashboard'

function App() {
  const [orgId, setOrgId] = useState(null)
  const [orgName, setOrgName] = useState('')
  const [orgs, setOrgs] = useState([])
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  const fetchOrgs = () => {
    fetch('/organizations')
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
    const res = await fetch('/register-org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    const data = await res.json()
    if (res.ok) {
      setOrgId(data.id)
      setOrgName(data.name)
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
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
      
      <div className="relative z-10 min-h-screen text-gray-100 font-sans p-6">
        <header className="max-w-6xl mx-auto mb-10 text-center mt-8 animate-slide-up">
          <h1 className="font-retro text-5xl sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-400 to-emerald-400 mb-4 drop-shadow-sm tracking-wide">
            Dark Web Exposure Monitor
          </h1>
          <p className="text-gray-400 text-lg">Track credential leaks and breaches across your organization</p>
        </header>

        {!orgId ? (
          <main className="max-w-md mx-auto mt-20 p-8 glass-panel rounded-2xl animate-slide-up delay-100">
            <h2 className="text-2xl font-bold mb-6 text-white text-center">
              {isCreatingNew ? 'Create New Workspace' : 'Select a Workspace'}
            </h2>
            
            {!isCreatingNew && orgs.length > 0 ? (
              <div className="space-y-4">
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {orgs.map(org => (
                    <button 
                      key={org.id}
                      onClick={() => handleSelectOrg(org.id, org.name)}
                      className="w-full text-left bg-gray-900/50 border border-gray-700 hover:border-blue-400 hover:bg-gray-800/80 rounded-lg px-4 py-3 text-white transition-all cursor-pointer"
                    >
                      {org.name}
                    </button>
                  ))}
                </div>
                <div className="text-center mt-6 pt-4 border-t border-gray-800">
                  <button 
                    onClick={() => setIsCreatingNew(true)}
                    className="text-sm text-blue-400 hover:text-blue-300 underline cursor-pointer"
                  >
                    Or create a new organization
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Organization Name</label>
                  <input 
                    name="orgName" 
                    type="text" 
                    required 
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-gray-500"
                    placeholder="e.g. Hackathon Team"
                  />
                  <p className="text-xs text-gray-400 mt-2">If the name already exists, you will be logged into it.</p>
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-white text-black font-bold py-3 px-4 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.6)] hover:scale-105 transition-all cursor-pointer"
                >
                  Continue
                </button>
                
                {orgs.length > 0 && (
                  <div className="text-center mt-4">
                    <button 
                      type="button"
                      onClick={() => setIsCreatingNew(false)}
                      className="text-sm text-gray-400 hover:text-white cursor-pointer"
                    >
                      &larr; Back to existing organizations
                    </button>
                  </div>
                )}
              </form>
            )}
          </main>
        ) : (
          <Dashboard orgId={orgId} orgName={orgName} onLogout={() => setOrgId(null)} />
        )}
      </div>
    </>
  )
}

export default App
