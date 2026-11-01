'use client';

import { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Shield,
  Key,
  Building2,
  Mail,
  Phone,
  CheckCircle,
  X,
  Search,
  Lock,
} from 'lucide-react';
import { api } from '../../../lib/api';

export default function EmployeesPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadEmployees() {
    try {
      setLoading(true);
      const res = await api.getEmployees();
      setUsers(res.users || []);
      setRoles(res.roles || []);
      setBranches(res.branches || []);
      if (res.roles?.length > 0 && !roleId) {
        setRoleId(res.roles[0].id);
      }
      if (res.branches?.length > 0 && !branchId) {
        setBranchId(res.branches[0].id);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const res = await api.getEmployees();
        if (isMounted) {
          setUsers(res.users || []);
          setRoles(res.roles || []);
          setBranches(res.branches || []);
          if (res.roles?.length > 0 && !roleId) {
            setRoleId(res.roles[0].id);
          }
          if (res.branches?.length > 0 && !branchId) {
            setBranchId(res.branches[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load employees:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateStaff(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password || !roleId) return;

    try {
      setSubmitting(true);
      await api.createEmployee({
        name: name.trim(),
        email: email.trim(),
        password,
        roleId,
        branchId: branchId || undefined,
        phone: phone.trim() || undefined,
      });

      setIsAddOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      loadEmployees();
      alert('Staff member registered successfully.');
    } catch (err) {
      alert(err.message || 'Failed to register staff');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Staff & Role-Based Access Control</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold">
              {users.length} Users
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Super Admin, Store Manager, Cashier, and Inventory Manager user credentials and branch assignments.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-rose-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        {[
          { role: 'Super Admin', desc: 'Full system, P&L, settings access', badge: 'bg-rose-500/10 text-rose-600' },
          { role: 'Store Manager', desc: 'Shift oversight, discounts, returns', badge: 'bg-purple-500/10 text-purple-600' },
          { role: 'Cashier', desc: 'Fast checkout, barcode scan, bills', badge: 'bg-emerald-500/10 text-emerald-600' },
          { role: 'Inventory Manager', desc: 'Stock receiving, transfers, counts', badge: 'bg-amber-500/10 text-amber-600' },
        ].map((r, i) => (
          <div key={i} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.badge}`}>
              {r.role}
            </span>
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 pt-1">
              {r.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 dark:bg-zinc-850/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold text-[11px]">
              <tr>
                <th className="py-3 px-4">Staff Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Branch Assignment</th>
                <th className="py-3 px-4">Email Login</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-rose-500 text-white font-extrabold flex items-center justify-center text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{u.name}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      {u.role?.name || u.roleId}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-semibold text-zinc-600 dark:text-zinc-400">
                    {u.branch?.name || 'All Branches'}
                  </td>

                  <td className="py-3 px-4 font-mono text-zinc-500">{u.email}</td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD STAFF MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateStaff}
            className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 space-y-3.5 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Register Staff Member</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sana Mir"
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                Email Address (Login Username) *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@boutique.com"
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                System Role *
              </label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-medium"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                Branch Assignment
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-medium"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition"
              >
                {submitting ? 'Registering...' : 'Save Staff User'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
