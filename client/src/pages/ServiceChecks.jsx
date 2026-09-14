import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { MEAL_SERVICES, labelFor } from '../constants';

export default function ServiceChecks() {
  const { activeSiteId, isMultiSiteRole } = useAuth();
  const [items, setItems] = useState([]);
  const [sites, setSites] = useState([]);
  const [form, setForm] = useState({ siteId: '', dishName: '', value: '', mealService: 'DEJEUNER', minRequired: '', maxRequired: '', checkedBy: '', notes: '' });
  const [error, setError] = useState('');

  const load = () => api.get('/service-checks', { params: { siteId: activeSiteId || undefined } }).then(({ data }) => setItems(data));

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
      await api.post('/service-checks', form);
      setForm({ ...form, dishName: '', value: '', notes: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    }
  };

  const remove = async (id) => { await api.delete(`/service-checks/${id}`); load(); };

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-800">Controle de temperature en service</h1>
      <p className="mb-4 text-sm text-slate-500">
        Verification de la liaison chaude/froide sur les plats servis (rappel : chaud ≥ 63°C, froid ≤ 4°C en general).
      </p>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500">
              <th className="py-2">Date</th><th className="py-2">Service</th><th className="py-2">Plat</th><th className="py-2">Temp.</th><th className="py-2">Etat</th><th></th>
            </tr></thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-2 text-slate-500">{new Date(c.checkedAt).toLocaleString()}</td>
                  <td className="py-2 text-slate-500">{labelFor(MEAL_SERVICES, c.mealService)}</td>
                  <td className="py-2 font-medium text-slate-700">{c.dishName}</td>
                  <td className="py-2 text-slate-500">{c.value}°C</td>
                  <td className="py-2">
                    <span className={`badge ${c.conform ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {c.conform ? 'Conforme' : 'Non conforme'}
                    </span>
                  </td>
                  <td className="py-2 text-right"><button className="btn-danger" onClick={() => remove(c.id)}>Suppr.</button></td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={6} className="py-4 text-center text-slate-400">Aucun controle enregistre</td></tr>}
            </tbody>
          </table>
        </div>
        <form onSubmit={submit} className="card space-y-3">
          <h2 className="font-semibold text-slate-700">Nouveau controle</h2>
          {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          {isMultiSiteRole && (
            <select className="input" value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value })} required>
              <option value="">Etablissement</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <select className="input" value={form.mealService} onChange={(e) => setForm({ ...form, mealService: e.target.value })}>
            {MEAL_SERVICES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <input className="input" placeholder="Nom du plat" value={form.dishName} onChange={(e) => setForm({ ...form, dishName: e.target.value })} required />
          <input className="input" type="number" step="0.1" placeholder="Temperature mesuree (°C)" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
          <div className="grid grid-cols-2 gap-2">
            <input className="input" type="number" step="0.1" placeholder="Min requis" value={form.minRequired} onChange={(e) => setForm({ ...form, minRequired: e.target.value })} />
            <input className="input" type="number" step="0.1" placeholder="Max requis" value={form.maxRequired} onChange={(e) => setForm({ ...form, maxRequired: e.target.value })} />
          </div>
          <input className="input" placeholder="Controle par" value={form.checkedBy} onChange={(e) => setForm({ ...form, checkedBy: e.target.value })} />
          <input className="input" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button className="btn-primary w-full" type="submit">Enregistrer</button>
        </form>
      </div>
    </div>
  );
}
