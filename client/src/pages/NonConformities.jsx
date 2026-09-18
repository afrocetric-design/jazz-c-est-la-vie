import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { NC_SEVERITIES, NC_STATUSES, ACTION_STATUSES, labelFor, colorFor } from '../constants';

export default function NonConformities() {
  const { activeSiteId, isMultiSiteRole } = useAuth();
  const [items, setItems] = useState([]);
  const [sites, setSites] = useState([]);
  const [form, setForm] = useState({ siteId: '', title: '', description: '', category: '', severity: 'MINEURE', declaredBy: '' });
  const [actionDrafts, setActionDrafts] = useState({});
  const [error, setError] = useState('');

  const load = () => api.get('/non-conformities', { params: { siteId: activeSiteId || undefined } }).then(({ data }) => setItems(data));

  useEffect(() => {
    load();
    api.get('/sites').then(({ data }) => setSites(data));
  }, [activeSiteId]);

  useEffect(() => {
    setForm((f) => ({ ...f, siteId: activeSiteId || f.siteId }));
  }, [activeSiteId]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/non-conformities', form);
      setForm({ ...form, title: '', description: '', category: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    }
  };

  const updateStatus = async (id, status) => {
    await api.put(`/non-conformities/${id}`, { status });
    load();
  };

  const remove = async (id) => { await api.delete(`/non-conformities/${id}`); load(); };

  const addAction = async (ncId) => {
    const draft = actionDrafts[ncId];
    if (!draft?.description) return;
    await api.post(`/non-conformities/${ncId}/actions`, draft);
    // La personne assignee reste remplie (souvent la meme sur plusieurs actions de suite)
    setActionDrafts((d) => ({ ...d, [ncId]: { description: '', assignedTo: draft.assignedTo || '', dueDate: '' } }));
    load();
  };

  const updateActionStatus = async (actionId, status) => {
    await api.put(`/non-conformities/actions/${actionId}`, { status });
    load();
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-800">Non-conformites & actions correctives</h1>

      <form onSubmit={submit} className="mb-6 card space-y-3">
        <h2 className="font-semibold text-slate-700">Declarer une non-conformite</h2>
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
          {isMultiSiteRole && (
            <select className="input" value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value })} required>
              <option value="">Etablissement</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <input className="input sm:col-span-2" placeholder="Titre" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <select className="input" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
            {NC_SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <input className="input" placeholder="Categorie (ex: Reception, Temperature, Nettoyage...)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <textarea className="input" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="input" placeholder="Declare par" value={form.declaredBy} onChange={(e) => setForm({ ...form, declaredBy: e.target.value })} />
        <button className="btn-primary" type="submit">Declarer</button>
      </form>

      <div className="space-y-4">
        {items.map((nc) => (
          <div key={nc.id} className="card">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-700">{nc.title}</h3>
                  <span className={`badge ${colorFor(NC_SEVERITIES, nc.severity)}`}>{labelFor(NC_SEVERITIES, nc.severity)}</span>
                  <span className={`badge ${colorFor(NC_STATUSES, nc.status)}`}>{labelFor(NC_STATUSES, nc.status)}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {nc.category && `${nc.category} - `}declare le {new Date(nc.declaredAt).toLocaleDateString()} {nc.declaredBy && `par ${nc.declaredBy}`}
                </div>
                {nc.description && <p className="mt-1 text-sm text-slate-600">{nc.description}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <select className="input" value={nc.status} onChange={(e) => updateStatus(nc.id, e.target.value)}>
                  {NC_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <button className="btn-danger" onClick={() => remove(nc.id)}>Suppr.</button>
              </div>
            </div>

            <div className="mt-3 border-t border-slate-100 pt-3">
              <h4 className="mb-2 text-sm font-medium text-slate-600">Actions correctives</h4>
              <div className="space-y-2">
                {nc.actions.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                    <div>
                      <span className="text-slate-700">{a.description}</span>
                      {a.assignedTo && <span className="ml-2 text-xs text-slate-400">-&gt; {a.assignedTo}</span>}
                      {a.dueDate && <span className="ml-2 text-xs text-slate-400">echeance {new Date(a.dueDate).toLocaleDateString()}</span>}
                    </div>
                    <select className="input max-w-[140px]" value={a.status} onChange={(e) => updateActionStatus(a.id, e.target.value)}>
                      {ACTION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                ))}
                {nc.actions.length === 0 && <div className="text-sm text-slate-400">Aucune action pour le moment</div>}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  className="input max-w-xs"
                  placeholder="Nouvelle action corrective"
                  value={actionDrafts[nc.id]?.description || ''}
                  onChange={(e) => setActionDrafts((d) => ({ ...d, [nc.id]: { ...d[nc.id], description: e.target.value } }))}
                />
                <input
                  className="input max-w-xs"
                  placeholder="Assigne a"
                  value={actionDrafts[nc.id]?.assignedTo || ''}
                  onChange={(e) => setActionDrafts((d) => ({ ...d, [nc.id]: { ...d[nc.id], assignedTo: e.target.value } }))}
                />
                <input
                  className="input max-w-xs"
                  type="date"
                  value={actionDrafts[nc.id]?.dueDate || ''}
                  onChange={(e) => setActionDrafts((d) => ({ ...d, [nc.id]: { ...d[nc.id], dueDate: e.target.value } }))}
                />
                <button className="btn-secondary" onClick={() => addAction(nc.id)}>Ajouter l'action</button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-slate-400">Aucune non-conformite declaree.</div>}
      </div>
    </div>
  );
}
