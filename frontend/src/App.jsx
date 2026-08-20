import { useState, useEffect } from 'react'
import Dashboard from './Dashboard'
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
    } else {
      alert(data.detail || 'Error registering organization')
    }
  }

  const handleSelectOrg = (id, name) => {
    setOrgId(id)
    setOrgName(name)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans p-6">
      <header className="max-w-6xl mx-auto mb-10 text-center mt-8">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
          Dark Web Exposure Monitor
        </h1>
        <p className="text-gray-400">Track credential leaks and breaches across your organization</p>
      </header>

      {!orgId ? (
        <main className="max-w-md mx-auto mt-20 p-8 bg-gray-900 border border-gray-800 rounded-2xl shadow-xl">
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
                    className="w-full text-left bg-gray-950 border border-gray-800 hover:border-blue-500 rounded-lg px-4 py-3 text-white transition-all cursor-pointer"
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
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="e.g. Hackathon Team"
                />
                <p className="text-xs text-gray-500 mt-2">If the name already exists, you will be logged into it.</p>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors cursor-pointer"
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
  )
}

export default App
