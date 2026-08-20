import { useState, useEffect } from 'react'
import { Building, Users, Activity, AlertTriangle, ShieldCheck, RefreshCw, Plus, Key, CheckCircle, XCircle, ShieldAlert, Calendar, Shield } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

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
      const res = await fetch(`${API_BASE_URL}/org-dashboard/${orgId}`)
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
      const res = await fetch(`${API_BASE_URL}/check-password?password=${encodeURIComponent(password)}`)
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
      const res = await fetch(`${API_BASE_URL}/account-detail/${accountId}`)
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
      const res = await fetch(`${API_BASE_URL}/add-credential`, {
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
    <main className="max-w-6xl mx-auto space-y-10 pb-12 animate-fade-in">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard</h2>
          <p className="text-gray-400 mt-1 text-sm">Monitor and manage security risks for your organization.</p>
        </div>
        <button
          onClick={onLogout}
          className="text-sm font-medium text-gray-300 hover:text-white cursor-pointer bg-gray-900/50 hover:bg-gray-800 px-5 py-2.5 rounded-xl border border-gray-800 transition-all flex items-center gap-2"
        >
          Switch Workspace &rarr;
        </button>
      </div>

      {/* Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-gray-900/95 border border-gray-800 p-6 rounded-2xl flex flex-col justify-between hover:bg-gray-800/90 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-medium text-gray-400">Organization</p>
            <Building className="w-5 h-5 text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-white truncate" title={data?.org_name}>{data?.org_name}</p>
        </div>
        <div className="bg-gray-900/95 border border-gray-800 p-6 rounded-2xl flex flex-col justify-between hover:bg-gray-800/90 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-medium text-gray-400">Total Accounts</p>
            <Users className="w-5 h-5 text-blue-500/80" />
          </div>
          <p className="text-3xl font-bold text-blue-400">{data?.total_accounts}</p>
        </div>
        <div className="bg-gray-900/95 border border-gray-800 p-6 rounded-2xl flex flex-col justify-between hover:bg-gray-800/90 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-medium text-gray-400">Avg Risk Score</p>
            <Activity className="w-5 h-5 text-orange-400/80" />
          </div>
          <p className="text-3xl font-bold text-orange-400">{data?.average_risk_score}</p>
        </div>
        <div className="bg-gray-900/95 border border-gray-800 p-6 rounded-2xl flex flex-col justify-between hover:bg-gray-800/90 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-medium text-gray-400">High Risk</p>
            <AlertTriangle className="w-5 h-5 text-red-500/80" />
          </div>
          <p className="text-3xl font-bold text-red-500">{data?.high_risk_count}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column Forms */}
        <div className="lg:col-span-1 space-y-6">
          {/* Add Account Form */}
          <div className="bg-gray-900/95 border border-gray-800 p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-5">
              <Plus className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-bold text-white tracking-tight">Add Account</h3>
            </div>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full bg-black/80 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/30 transition-all placeholder:text-gray-600"
                  placeholder="user@company.com"
                />
              </div>
              <button
                type="submit"
                disabled={isAdding}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 px-4 rounded-xl transition-colors cursor-pointer disabled:opacity-50 text-sm shadow-sm shadow-emerald-900/20"
              >
                {isAdding ? 'Scanning...' : 'Monitor Account'}
              </button>
            </form>
          </div>

          {/* Password Checker Form */}
          <div className="bg-gray-900/95 border border-gray-800 p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-5">
              <Key className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-bold text-white tracking-tight">Password Checker</h3>
            </div>
            <form onSubmit={handleCheckPassword} className="space-y-4">
              <div>
                <input
                  name="password"
                  type="password"
                  required
                  className="w-full bg-black/80 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all placeholder:text-gray-600"
                  placeholder="Enter a password to test"
                />
              </div>
              <button
                type="submit"
                disabled={isCheckingPassword}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-xl transition-colors cursor-pointer disabled:opacity-50 text-sm shadow-sm shadow-blue-900/20"
              >
                {isCheckingPassword ? 'Checking...' : 'Check Status'}
              </button>
            </form>

            {passwordResult && (
              <div className={`mt-5 p-4 rounded-xl border text-sm ${passwordResult.leaked ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                {passwordResult.leaked ? (
                  <>
                    <p className="font-semibold flex items-center gap-2 mb-1"><XCircle className="w-4 h-4" /> Pwned Password</p>
                    <p className="text-gray-400 leading-relaxed text-xs">Seen <span className="font-bold text-red-400">{passwordResult.times_seen.toLocaleString()}</span> times in data breaches. Do not use it.</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold flex items-center gap-2 mb-1"><CheckCircle className="w-4 h-4" /> Safe Password</p>
                    <p className="text-gray-400 leading-relaxed text-xs">Hasn't been found in any known breaches.</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Accounts Table */}
        {/* Accounts Table */}
        <div className="lg:col-span-2 bg-gray-900/95 border border-gray-800 rounded-2xl overflow-hidden flex flex-col shadow-sm">
          <div className="px-6 py-5 border-b border-gray-800/60 flex justify-between items-center bg-gray-900/20">
            <h3 className="text-lg font-bold text-white tracking-tight">Monitored Accounts</h3>
            <button onClick={fetchDashboard} className="text-xs font-medium text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors bg-black/80 hover:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-800 cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-black/20 text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Risk Score</th>
                  <th className="px-6 py-4 font-semibold">Breaches Found</th>
                  <th className="px-6 py-4 font-semibold">Last Checked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {data?.accounts?.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500 text-sm">
                      No accounts being monitored yet. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  data?.accounts?.map((acc) => (
                    <tr
                      key={acc.id}
                      onClick={() => fetchAccountDetail(acc.id)}
                      className="hover:bg-gray-800/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 text-sm text-gray-300 font-medium group-hover:text-white transition-colors">{acc.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${acc.risk_score > 50 ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          acc.risk_score > 25 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                          {acc.risk_score}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {acc.breaches?.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {acc.breaches.map((b, i) => (
                              <span key={i} className="px-2 py-0.5 bg-black text-gray-400 rounded-md text-[11px] border border-gray-800 shadow-sm truncate max-w-[120px]" title={b}>
                                {b}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-500 text-xs font-medium bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Clean</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
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
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 md:p-12 z-50 overflow-y-auto animate-fade-in"
          style={{ animationDuration: '0.2s' }}
          onClick={() => setSelectedAccountDetail(null)}
        >
          <div
            className="relative bg-gray-950 border border-gray-800 rounded-xl shadow-2xl w-full max-w-3xl mx-auto flex flex-col my-4 sm:my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-800 flex justify-between items-center bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10 rounded-t-xl">
              <div>
                <h2 className="text-xl font-semibold text-white tracking-tight">Security Report</h2>
                <p className="text-sm text-gray-400 mt-0.5">{selectedAccountDetail.email}</p>
              </div>
              <button
                onClick={() => setSelectedAccountDetail(null)}
                className="text-gray-500 hover:text-white hover:bg-gray-800 w-8 h-8 flex items-center justify-center rounded-md text-xl transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              {/* Risk Score */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Risk Assessment</h3>
                <div className="bg-gray-900/50 border border-gray-800 shadow-sm rounded-xl p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  {(() => {
                    const score = selectedAccountDetail.risk_score;
                    const colorClass = score > 50 ? 'text-red-500 bg-red-500/10 border-red-500/20' : score > 25 ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                    const iconColorClass = score > 50 ? 'text-red-500' : score > 25 ? 'text-orange-400' : 'text-emerald-400';

                    return (
                      <>
                        <div className={`flex flex-col items-center justify-center rounded-xl w-24 h-24 shrink-0 border ${colorClass}`}>
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Score</span>
                          <span className="text-4xl font-black">{score}</span>
                        </div>
                        <div className="flex-1 space-y-3">
                          {selectedAccountDetail.score_breakdowns?.length > 0 ? (
                            <ul className="space-y-2">
                              {selectedAccountDetail.score_breakdowns.map((sb, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-sm text-gray-300">
                                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${iconColorClass}`} />
                                  <span className="leading-relaxed font-medium">{sb.description}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-emerald-400 flex items-center gap-2 font-medium bg-emerald-500/10 px-3 py-2 rounded-lg w-fit border border-emerald-500/20">
                              <ShieldCheck className="w-4 h-4 text-emerald-500" />
                              No risk factors identified.
                            </p>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Recommended Actions</h3>
                <div className="grid grid-cols-1 gap-3">
                  {selectedAccountDetail.recommendations?.map((rec, idx) => (
                    <div key={idx} className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-blue-200 leading-relaxed">{rec.action}</p>
                    </div>
                  ))}
                  {(!selectedAccountDetail.recommendations || selectedAccountDetail.recommendations.length === 0) && (
                    <p className="text-gray-400 text-sm bg-gray-900/30 p-4 rounded-xl border border-gray-800">No actions required.</p>
                  )}
                </div>
              </div>

              {/* Breach List */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Detailed Breach History</h3>
                {selectedAccountDetail.breaches?.length === 0 ? (
                  <p className="text-gray-400 text-sm bg-gray-900/30 p-6 text-center rounded-xl border border-gray-800">No breaches found for this account.</p>
                ) : (
                  <div className="space-y-4">
                    {selectedAccountDetail.breaches.map((b, idx) => {
                      const isHighImpact = b.exposed_data?.toLowerCase().match(/password|credit|financial|ssn/);
                      const severityColor = isHighImpact ? 'border-l-red-500 border-gray-800' : 'border-l-orange-500 border-gray-800';
                      const badgeBg = isHighImpact ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20';

                      return (
                        <div key={idx} className={`bg-gray-900/95 border ${severityColor} border-l-4 shadow-sm p-5 rounded-xl`}>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-white text-base">{b.name}</h4>
                                <span className={`inline-flex text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${badgeBg}`}>
                                  {isHighImpact ? 'High Impact' : 'Medium Impact'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-950 px-2.5 py-1.5 rounded-md border border-gray-800 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-gray-500" />
                              {b.date ? new Date(b.date).toLocaleDateString() : 'Unknown Date'}
                            </div>
                          </div>

                          <div>
                            <strong className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">Exposed Data</strong>
                            <div className="flex flex-wrap gap-2">
                              {(b.exposed_data || 'Not specified').split(/[,;]\s*/).map((dataItem, i) => (
                                <span key={i} className="bg-black text-gray-300 text-xs px-2.5 py-1 rounded-md border border-gray-800 font-medium">
                                  {dataItem.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-900/50 border-t border-gray-800 flex justify-end rounded-b-xl">
              <button
                onClick={() => setSelectedAccountDetail(null)}
                className="bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 shadow-sm px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {isFetchingDetail && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 text-white p-4 rounded-xl shadow-lg border border-gray-800">
            Loading details...
          </div>
        </div>
      )}
    </main>
  )
}
