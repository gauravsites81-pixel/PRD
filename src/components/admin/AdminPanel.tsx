'use client';

import { useState } from 'react';
import { toggleUserRole, verifyWinnerProof, markWinnerPaid } from '@/app/admin/actions';

export function AdminPanel({ initialUsers, initialDraws, initialProofs, metrics }: any) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRunDraw = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/draw/run', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to run draw');
      setMessage('Draw completed successfully!');
      window.location.reload();
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRole = async (userId: string, role: string) => {
    try {
      await toggleUserRole(userId, role);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleVerify = async (proofId: string, status: 'approved' | 'rejected') => {
    try {
      await verifyWinnerProof(proofId, status);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleMarkPaid = async (resultId: string) => {
    try {
      await markWinnerPaid(resultId);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200">
        {['overview', 'users', 'draws', 'verifications'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-1 text-sm font-medium capitalize ${activeTab === tab ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {message && (
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded border border-emerald-200">
          {message}
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded shadow-sm border">
              <h3 className="text-gray-500 text-sm font-medium">Active Subscribers</h3>
              <p className="text-3xl font-bold mt-2">{metrics.totalSubscribers}</p>
            </div>
            <div className="bg-white p-6 rounded shadow-sm border">
              <h3 className="text-gray-500 text-sm font-medium">Total Pool</h3>
              <p className="text-3xl font-bold mt-2">${metrics.totalPool.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded shadow-sm border">
              <h3 className="text-gray-500 text-sm font-medium">Rollover Jackpot</h3>
              <p className="text-3xl font-bold mt-2">${metrics.rollover.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded shadow-sm border">
              <h3 className="text-gray-500 text-sm font-medium">Pending Verifications</h3>
              <p className="text-3xl font-bold mt-2">{metrics.pendingProofs}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded shadow-sm border">
            <h2 className="text-xl font-bold mb-4">Run Monthly Draw</h2>
            <p className="text-gray-600 mb-4">Execute the algorithm to pick 5 numbers and find matches for the current month.</p>
            <button
              onClick={handleRunDraw}
              disabled={isLoading}
              className="bg-slate-900 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
            >
              {isLoading ? 'Running Draw...' : 'Execute Draw API'}
            </button>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="bg-white rounded shadow-sm border overflow-hidden">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-900">User</th>
                <th className="px-6 py-3 font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 font-semibold text-gray-900">Role</th>
                <th className="px-6 py-3 font-semibold text-gray-900">Sub Status</th>
                <th className="px-6 py-3 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {initialUsers.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{u.full_name || 'N/A'}</td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4 capitalize">{u.role}</td>
                  <td className="px-6 py-4">
                    {u.subscriptions?.[0]?.status === 'active' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleRole(u.id, u.role)}
                      className="text-emerald-600 hover:text-emerald-900 font-medium"
                    >
                      {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DRAWS TAB */}
      {activeTab === 'draws' && (
        <div className="bg-white rounded shadow-sm border overflow-hidden">
           <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-900">Date</th>
                <th className="px-6 py-3 font-semibold text-gray-900">Numbers</th>
                <th className="px-6 py-3 font-semibold text-gray-900">Winners</th>
                <th className="px-6 py-3 font-semibold text-gray-900">Rollover</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {initialDraws.map((d: any) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{d.month}/{d.year}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {d.drawn_numbers?.map((n: number, i: number) => (
                        <span key={i} className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">
                          {n}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {d.draw_results?.length || 0} winners
                  </td>
                  <td className="px-6 py-4">
                    {d.jackpot_carried_over ? `$${d.carried_over_amount}` : 'No'}
                  </td>
                </tr>
              ))}
              {initialDraws.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No draws run yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VERIFICATIONS TAB */}
      {activeTab === 'verifications' && (
        <div className="bg-white rounded shadow-sm border overflow-hidden">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-900">User</th>
                <th className="px-6 py-3 font-semibold text-gray-900">Match & Prize</th>
                <th className="px-6 py-3 font-semibold text-gray-900">Proof</th>
                <th className="px-6 py-3 font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {initialProofs.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{p.users?.full_name}</div>
                    <div className="text-gray-500 text-xs">{p.users?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>{p.draw_results?.match_type} Matches</div>
                    <div className="font-bold text-emerald-600">${p.draw_results?.prize_amount}</div>
                  </td>
                  <td className="px-6 py-4">
                    <a href={p.proof_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      View Document
                    </a>
                  </td>
                  <td className="px-6 py-4 capitalize">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      p.admin_status === 'approved' ? 'bg-green-100 text-green-800' :
                      p.admin_status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {p.admin_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    {p.admin_status === 'pending' && (
                      <>
                        <button onClick={() => handleVerify(p.id, 'approved')} className="text-green-600 hover:text-green-900 font-medium">Approve</button>
                        <button onClick={() => handleVerify(p.id, 'rejected')} className="text-red-600 hover:text-red-900 font-medium">Reject</button>
                      </>
                    )}
                    {p.admin_status === 'approved' && p.draw_results?.payment_status !== 'paid' && (
                      <button onClick={() => handleMarkPaid(p.draw_result_id)} className="text-emerald-600 hover:text-emerald-900 font-medium">
                        Mark Paid
                      </button>
                    )}
                    {p.draw_results?.payment_status === 'paid' && (
                      <span className="text-gray-500 font-medium italic">Paid</span>
                    )}
                  </td>
                </tr>
              ))}
              {initialProofs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No verifications pending.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}