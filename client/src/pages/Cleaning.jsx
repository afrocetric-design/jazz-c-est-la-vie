import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { TASK_FREQUENCIES, labelFor } from '../constants';

export default function Cleaning() {
  const { activeSiteId, isMultiSiteRole } = useAuth();
  const [zones, setZones] = useState([]);
  const [sites, setSites] = useState([]);
  const [newZone, setNewZone] = useState({ siteId: '', name: '' });
  const [taskDrafts, setTaskDrafts] = useState({});
  const [logDrafts, setLogDrafts] = useState({});

  const load = () => api.get('/cleaning/zones', { params: { siteId: activeSiteId || undefined } }).then(({ data }) => setZones(data));

  useEffect(() => {
    load();
    api.get('/sites').then(({ data }) => setSites(data));
  }, [activeSiteId]);

  useEffect(() => {
    setNewZone((z) => ({ ...z, siteId: activeSiteId || z.siteId }));
  }, [activeSiteId]);

  const addZone = async (e) => {
    e.preventDefault();
    await api.post('/cleaning/zones', newZone);
    setNewZone({ ...newZone, name: '' });
    load();
  };
  const removeZone = async (id) => {
    if (!confirm('Supprimer cette zone et ses taches ?')) return;
    await api.delete(`/cleaning/zones/${id}`);
    load();
  };

  const addTask = async (zoneId) => {
    const draft = taskDrafts[zoneId];
    if (!draft?.name) return;
    await api.post(`/cleaning/zones/${zoneId}/tasks`, { name: draft.name, frequency: draft.frequency || 'QUOTIDIEN', product: draft.product });
    setTaskDrafts((d) => ({ ...d, [zoneId]: { name: '', frequency: 'QUOTIDIEN', product: '' } }));
    load();
  };
  const removeTask = async (id) => { await api.delete(`/cleaning/tasks/${id}`); load(); };

  const validateTask = async (taskId) => {
    const draft = logDrafts[taskId] || { doneBy: '', conform: true };
    await api.post(`/cleaning/tasks/${taskId}/logs`, draft);
    setLogDrafts((d) => ({ ...d, [taskId]: { doneBy: draft.doneBy, conform: true } }));
    load();
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-800">Plan de nettoyage & desinfection</h1>

      <form onSubmit={addZone} className="mb-6 card flex flex-wrap items-end gap-2">
        {isMultiSiteRole && (
          <select className="input max-w-xs" value={newZone.siteId} onChange={(e) => setNewZone({ ...newZone, siteId: e.target.value })} required>
            <option value="">Etablissement</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <input className="input max-w-xs" placeholder="Nouvelle zone (ex: Cuisine)" value={newZone.name} onChange={(e) => setNewZone({ ...newZone, name: e.target.value })} required />
        <button className="btn-primary" type="submit">Ajouter une zone</button>
      </form>

      <div className="space-y-4">
        {zones.map((zone) => (
          <div key={zone.id} className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-700">{zone.name}</h2>
              <button className="btn-danger" onClick={() => removeZone(zone.id)}>Supprimer la zone</button>
            </div>

            <div className="space-y-2">
              {zone.tasks.map((task) => (
                <div key={task.id} className="rounded-md border border-slate-100 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-slate-700">{task.name}</span>
                      <span className="ml-2 badge bg-slate-100 text-slate-600">{labelFor(TASK_FREQUENCIES, task.frequency)}</span>
                      {task.product && <span className="ml-2 text-xs text-slate-400">Produit: {task.product}</span>}
                    </div>
                    <button className="btn-danger" onClick={() => removeTask(task.id)}>Suppr.</button>
                  </div>
                  <div className="mb-2 text-xs text-slate-500">
                    Dernieres validations : {task.logs.length === 0 ? 'aucune' : task.logs.map((l) => `${new Date(l.doneAt).toLocaleDateString()} (${l.conform ? 'OK' : 'NC'})`).join(', ')}
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="input"
                      placeholder="Valide par"
                      value={logDrafts[task.id]?.doneBy || ''}
                      onChange={(e) => setLogDrafts((d) => ({ ...d, [task.id]: { ...d[task.id], doneBy: e.target.value, conform: d[task.id]?.conform ?? true } }))}
                    />
                    <label className="flex items-center gap-1 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={logDrafts[task.id]?.conform ?? true}
                        onChange={(e) => setLogDrafts((d) => ({ ...d, [task.id]: { ...d[task.id], conform: e.target.checked } }))}
                      />
                      Conforme
                    </label>
                    <button className="btn-secondary shrink-0" onClick={() => validateTask(task.id)}>Valider execution</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              <input
                className="input max-w-xs"
                placeholder="Nouvelle tache"
                value={taskDrafts[zone.id]?.name || ''}
                onChange={(e) => setTaskDrafts((d) => ({ ...d, [zone.id]: { ...d[zone.id], name: e.target.value } }))}
              />
              <select
                className="input max-w-xs"
                value={taskDrafts[zone.id]?.frequency || 'QUOTIDIEN'}
                onChange={(e) => setTaskDrafts((d) => ({ ...d, [zone.id]: { ...d[zone.id], frequency: e.target.value } }))}
              >
                {TASK_FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              <input
                className="input max-w-xs"
                placeholder="Produit utilise"
                value={taskDrafts[zone.id]?.product || ''}
                onChange={(e) => setTaskDrafts((d) => ({ ...d, [zone.id]: { ...d[zone.id], product: e.target.value } }))}
              />
              <button className="btn-primary" onClick={() => addTask(zone.id)}>Ajouter la tache</button>
            </div>
          </div>
        ))}
        {zones.length === 0 && <div className="text-slate-400">Aucune zone de nettoyage definie.</div>}
      </div>
    </div>
  );
}
