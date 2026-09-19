import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ROLES, labelFor } from '../constants';

export default function Personnel() {
  const { user } = useAuth();
  const canManage = ['SUPER_ADMIN', 'ORG_ADMIN'].includes(user?.role);
  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'EMPLOYEE', siteId: '' });
  const [error, setError] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [trainings, setTrainings] = useState([]);
  const [trainingForm, setTrainingForm] = useState({ title: '', obtainedAt: '', expiresAt: '', notes: '' });

  const load = () => api.get('/users').then(({ data }) => setUsers(data));
  useEffect(() => {
    load();
    api.get('/sites').then(({ data }) => setSites(data));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users', form);
      setForm({ email: '', password: '', name: '', role: 'EMPLOYEE', siteId: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    }
  };

  const remove = async (id) => {
    if (!confirm('Supprimer ce compte ?')) return;
    await api.delete(`/users/${id}`);
    load();
  };

  const toggleTrainings = async (userId) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      return;
    }
    setExpandedUser(userId);
    const { data } = await api.get(`/users/${userId}/trainings`);
    setTrainings(data);
  };

  const addTraining = async (userId) => {
    if (!trainingForm.title) return;
    await api.post(`/users/${userId}/trainings`, trainingForm);
    setTrainingForm({ title: '', obtainedAt: '', expiresAt: '', notes: '' });
    const { data } = await api.get(`/users/${userId}/trainings`);
    setTrainings(data);
  };

  const removeTraining = async (trainingId, userId) => {
    await api.delete(`/users/trainings/${trainingId}`);
    const { data } = await api.get(`/users/${userId}/trainings`);
    setTrainings(data);
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-800">Personnel & formations</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {users.map((u) => (
            <div key={u.id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-700">{u.name}</span>
                  <span className="ml-2 badge bg-slate-100 text-slate-600">{labelFor(ROLES, u.role)}</span>
                  {!u.active && <span className="ml-2 badge bg-red-100 text-red-700">Inactif</span>}
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary" onClick={() => toggleTrainings(u.id)}>
                    {expandedUser === u.id ? 'Fermer' : 'Formations'}
                  </button>
                  {canManage && <button className="btn-danger" onClick={() => remove(u.id)}>Suppr.</button>}
                </div>
              </div>
              <div className="text-xs text-slate-500">{u.email}</div>

              {expandedUser === u.id && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <div className="mb-2 space-y-1">
                    {trainings.map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">
                          {t.title} {t.obtainedAt && `(obtenue le ${new Date(t.obtainedAt).toLocaleDateString()})`}
                          {t.expiresAt && ` - expire le ${new Date(t.expiresAt).toLocaleDateString()}`}
                        </span>
                        <button className="btn-danger" onClick={() => removeTraining(t.id, u.id)}>x</button>
                      </div>
                    ))}
                    {trainings.length === 0 && <div className="text-sm text-slate-400">Aucune formation enregistree</div>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input className="input max-w-xs" placeholder="Intitule (ex: Formation HACCP)" value={trainingForm.title} onChange={(e) => setTrainingForm({ ...trainingForm, title: e.target.value })} />
                    <input className="input max-w-xs" type="date" value={trainingForm.obtainedAt} onChange={(e) => setTrainingForm({ ...trainingForm, obtainedAt: e.target.value })} />
                    <input className="input max-w-xs" type="date" value={trainingForm.expiresAt} onChange={(e) => setTrainingForm({ ...trainingForm, expiresAt: e.target.value })} />
                    <button className="btn-primary" onClick={() => addTraining(u.id)}>Ajouter</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {users.length === 0 && <div className="text-slate-400">Aucun utilisateur</div>}
        </div>

        {canManage && (
          <form onSubmit={submit} className="card space-y-3">
            <h2 className="font-semibold text-slate-700">Nouveau compte</h2>
            {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <input className="input" placeholder="Nom complet" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <input className="input" type="password" placeholder="Mot de passe" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            {form.role !== 'SUPER_ADMIN' && form.role !== 'ORG_ADMIN' && (
              <select className="input" value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value })} required>
                <option value="">Etablissement</option>
                {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
            <button className="btn-primary w-full" type="submit">Creer le compte</button>
          </form>
        )}
      </div>
    </div>
  );
}
