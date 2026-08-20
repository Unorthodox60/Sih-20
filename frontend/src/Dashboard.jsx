import { useState, useEffect } from 'react'

export default function Dashboard({ orgId, orgName, onLogout }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isCheckingPassword, setIsCheckingPassword] = useState(false)
  const [passwordResult, setPasswordResult] = useState(null)
  const [selectedAccountDetail, setSelectedAccountDetail] = useState(null)
  const [isFetchingDetail, setIsFetchingDetail] = useState(false)

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/org-dashboard/${orgId}`)
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
      const res = await fetch(`/api/check-password?password=${encodeURIComponent(password)}`)
      if (res.ok) {
        const result = await res.json()
        setPasswordResult(result)
      } else {
        const errorText = await res.text()
        alert(`Error checking password: ${res.status} ${res.statusText} - ${errorText}`)
      }
    } catch (e) {
      console.error(e)
      alert(`Error checking password: ${e.message}`)
    } finally {
      setIsCheckingPassword(false)
    }
  }

  const fetchAccountDetail = async (accountId) => {
    setIsFetchingDetail(true)
    try {
      const res = await fetch(`/api/account-detail/${accountId}`)
      if (res.ok) {
        const result = await res.json()
        setSelectedAccountDetail(result)
      } else {
        const errorText = await res.text()
        alert(`Error fetching details: ${res.status} ${errorText}`)
      }
    } catch (e) {
      console.error(e)
      alert(`Error fetching details: ${e.message}`)
    } finally {
      setIsFetchingDetail(false)
    }
  }

  const handleAddAccount = async (e) => {
    e.preventDefault()
    setIsAdding(true)
    const email = e.target.email.value
    
    try {
      const res = await fetch('/api/add-credential', {
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-slide-up delay-100">
        <div className="glass-panel p-6 rounded-2xl">
          <p className="text-sm text-gray-400 mb-1">Organization</p>
          <p className="text-2xl font-bold text-white truncate">{data?.org_name}</p>
        </div>
        <div className="glass-panel p-6 rounded-2xl">
          <p className="text-sm text-gray-400 mb-1">Total Accounts</p>
          <p className="text-4xl font-retro text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]">{data?.total_accounts}</p>
        </div>
        <div className="glass-panel p-6 rounded-2xl">
          <p className="text-sm text-gray-400 mb-1">Avg Risk Score</p>
          <p className="text-4xl font-retro text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]">{data?.average_risk_score}</p>
        </div>
        <div className="glass-panel p-6 rounded-2xl">
          <p className="text-sm text-gray-400 mb-1">High Risk</p>
          <p className="text-4xl font-retro text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">{data?.high_risk_count}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column Forms */}
        <div className="lg:col-span-1 space-y-6 animate-slide-up delay-200">
          {/* Add Account Form */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Add Account to Monitor</h3>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                <input 
                  name="email" 
                  type="email" 
                  required 
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-gray-500"
                  placeholder="user@company.com"
                />
              </div>
              <button 
                type="submit" 
                disabled={isAdding}
                className="w-full bg-white text-black font-bold py-3 px-4 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.6)] hover:scale-105 transition-all cursor-pointer disabled:opacity-50 disabled:hover:scale-100"
              >
                {isAdding ? 'Scanning...' : 'Monitor Account'}
              </button>
            </form>
          </div>

          {/* Password Checker Form */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Password Checker</h3>
            <form onSubmit={handleCheckPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Test a Password</label>
                <input 
                  name="password" 
                  type="password" 
                  required 
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-gray-500"
                  placeholder="Enter a password"
                />
              </div>
              <button 
                type="submit" 
                disabled={isCheckingPassword}
                className="w-full bg-white text-black font-bold py-3 px-4 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.6)] hover:scale-105 transition-all cursor-pointer disabled:opacity-50 disabled:hover:scale-100"
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
        <div className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden animate-slide-up delay-300">
          <div className="p-6 border-b border-gray-700/50 flex justify-between items-center bg-gray-900/20">
            <h3 className="text-xl font-bold text-white">Monitored Accounts</h3>
            <button onClick={fetchDashboard} className="text-sm text-gray-400 hover:text-white cursor-pointer">
              ↻ Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-900/40 text-gray-400 text-sm">
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
                    <tr 
                      key={acc.id} 
                      onClick={() => fetchAccountDetail(acc.id)}
                      className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 text-gray-200">{acc.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          acc.risk_score > 50 ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 
                          acc.risk_score > 25 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
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

      {/* Detail Modal overlay */}
      {selectedAccountDetail && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm">
          <div className="glass-panel rounded-2xl w-full max-w-3xl my-8 overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
            <div className="p-6 border-b border-gray-700/50 flex justify-between items-center bg-gray-900/40 sticky top-0 z-10">
              <h2 className="text-2xl font-bold text-white">Security Report: {selectedAccountDetail.email}</h2>
              <button 
                onClick={() => setSelectedAccountDetail(null)} 
                className="text-gray-400 hover:text-white text-3xl font-light px-2 cursor-pointer leading-none"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-8 bg-gray-900/20">
              {/* Risk Score */}
              <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700/50">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-sm text-gray-400 uppercase font-bold tracking-wider">Risk Score</div>
                  <div className={`text-6xl font-retro ${
                    selectedAccountDetail.risk_score > 50 ? 'text-red-500' : 
                    selectedAccountDetail.risk_score > 25 ? 'text-orange-400' : 
                    'text-emerald-400'
                  }`}>
                    {selectedAccountDetail.risk_score}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-300">Score Breakdown:</h4>
                  {selectedAccountDetail.score_breakdowns?.length > 0 ? (
                    <ul className="list-disc pl-5 text-sm text-gray-400 space-y-1">
                      {selectedAccountDetail.score_breakdowns.map((sb, idx) => (
                        <li key={idx}>{sb.description}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-emerald-500 italic">No risk factors identified.</p>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Recommended Actions</h3>
                <div className="grid grid-cols-1 gap-3">
                  {selectedAccountDetail.recommendations?.map((rec, idx) => (
                    <div key={idx} className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl flex items-start gap-3 text-blue-300">
                      <span className="text-xl">👉</span>
                      <p className="text-sm mt-0.5">{rec.action}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Breach List */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Detailed Breach History</h3>
                {selectedAccountDetail.breaches?.length === 0 ? (
                  <p className="text-gray-400 text-sm">No breaches found for this account.</p>
                ) : (
                  <div className="space-y-4">
                    {selectedAccountDetail.breaches.map((b, idx) => (
                      <div key={idx} className="bg-gray-950 border border-gray-800 p-5 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg text-white">{b.name}</h4>
                          <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-md">
                            {b.date ? new Date(b.date).toLocaleDateString() : 'Unknown Date'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-2"><strong className="text-gray-300">Exposed Data:</strong> {b.exposed_data || 'Not specified'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isFetchingDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 text-white p-4 rounded-xl shadow-lg border border-gray-800">
            Loading details...
          </div>
        </div>
      )}
    </main>
  )
}
