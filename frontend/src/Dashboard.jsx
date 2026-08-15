import { useState, useEffect } from 'react'

export default function Dashboard({ orgId, orgName, onLogout }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isCheckingPassword, setIsCheckingPassword] = useState(false)
  const [passwordResult, setPasswordResult] = useState(null)

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const res = await fetch(`http://127.0.0.1:8000/org-dashboard/${orgId}`)
      const result = await res.json()
      setData(result)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [orgId])

  const handleCheckPassword = async (e) => {
    e.preventDefault()
    setIsCheckingPassword(true)
    setPasswordResult(null)
    const password = e.target.password.value
    
    try {
      const res = await fetch(`http://127.0.0.1:8000/check-password?password=${encodeURIComponent(password)}`)
      if (res.ok) {
        const result = await res.json()
        setPasswordResult(result)
      } else {
        alert('Error checking password')
      }
    } catch (e) {
      console.error(e)
      alert('Error checking password')
    } finally {
      setIsCheckingPassword(false)
    }
  }

  const handleAddAccount = async (e) => {
    e.preventDefault()
    setIsAdding(true)
    const email = e.target.email.value
    
    try {
      const res = await fetch('http://127.0.0.1:8000/add-credential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, org_id: orgId })
      })
      if (res.ok) {
        fetchDashboard()
        e.target.reset()
      } else {
        const err = await res.json()
        alert(err.detail || 'Error adding account')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsAdding(false)
    }
  }

  if (loading && !data) {
    return <div className="text-center text-gray-400 mt-20">Loading workspace...</div>
  }

  return (
    <main className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-end">
        <button 
          onClick={onLogout}
          className="text-sm text-gray-400 hover:text-white cursor-pointer border border-gray-800 px-4 py-2 rounded-lg bg-gray-900"
        >
          Switch Workspace &rarr;
        </button>
      </div>

      {/* Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
          <p className="text-sm text-gray-400 mb-1">Organization</p>
          <p className="text-2xl font-bold text-white">{data?.org_name}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
          <p className="text-sm text-gray-400 mb-1">Total Accounts</p>
          <p className="text-3xl font-bold text-blue-400">{data?.total_accounts}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
          <p className="text-sm text-gray-400 mb-1">Avg Risk Score</p>
          <p className="text-3xl font-bold text-orange-400">{data?.average_risk_score}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
          <p className="text-sm text-gray-400 mb-1">High Risk</p>
          <p className="text-3xl font-bold text-red-500">{data?.high_risk_count}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column Forms */}
        <div className="lg:col-span-1 space-y-6">
          {/* Add Account Form */}
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Add Account to Monitor</h3>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                <input 
                  name="email" 
                  type="email" 
                  required 
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="user@company.com"
                />
              </div>
              <button 
                type="submit" 
                disabled={isAdding}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isAdding ? 'Scanning...' : 'Monitor Account'}
              </button>
            </form>
          </div>

          {/* Password Checker Form */}
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Password Checker</h3>
            <form onSubmit={handleCheckPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Test a Password</label>
                <input 
                  name="password" 
                  type="password" 
                  required 
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Enter a password"
                />
              </div>
              <button 
                type="submit" 
                disabled={isCheckingPassword}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isCheckingPassword ? 'Checking...' : 'Check Status'}
              </button>
            </form>

            {passwordResult && (
              <div className={`mt-4 p-4 rounded-lg border ${passwordResult.leaked ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                {passwordResult.leaked ? (
                  <>
                    <p className="font-bold flex items-center gap-2">⚠️ Pwned Password!</p>
                    <p className="text-sm mt-1 text-gray-300">This password was seen <span className="font-bold text-red-400">{passwordResult.times_seen.toLocaleString()}</span> times in data breaches. Do not use it.</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold flex items-center gap-2">✅ Safe Password</p>
                    <p className="text-sm mt-1 text-gray-300">This password hasn't been found in any known breaches.</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Accounts Table */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-800 flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Monitored Accounts</h3>
            <button onClick={fetchDashboard} className="text-sm text-gray-400 hover:text-white cursor-pointer">
              ↻ Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-950 text-gray-400 text-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Risk Score</th>
                  <th className="px-6 py-4 font-medium">Breaches Found</th>
                  <th className="px-6 py-4 font-medium">Last Checked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data?.accounts?.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      No accounts being monitored yet. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  data?.accounts?.map((acc) => (
                    <tr key={acc.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 text-gray-200">{acc.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          acc.risk_score > 50 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                          acc.risk_score > 25 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {acc.risk_score}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {acc.breaches?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {acc.breaches.map((b, i) => (
                              <span key={i} className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs border border-gray-700">
                                {b}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500 italic text-sm text-emerald-500">Clean</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(acc.last_checked).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
