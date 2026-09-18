import { useEffect, useRef, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { MEAL_SERVICES, SERVICE_STAGES, labelFor } from '../constants';

export default function ServiceChecks() {
  const { activeSiteId, isMultiSiteRole } = useAuth();
  const [items, setItems] = useState([]);
  const [sites, setSites] = useState([]);
  const [form, setForm] = useState({
    siteId: '',
    dishName: '',
    value: '',
    mealService: 'DEJEUNER',
    stage: 'DEBUT',
    minRequired: '',
    maxRequired: '',
    checkedBy: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const valueInputRef = useRef(null);

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
      // On ne reinitialise que la temperature et les notes : le plat, le service, le
      // moment et le controleur restent remplis pour enchainer les releves rapidement
      // (ex: meme plat controle en debut / milieu / fin de service).
      setForm((f) => ({ ...f, value: '', notes: '' }));
      valueInputRef.current?.focus();
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
        Le plat, le service et le controleur restent remplis apres chaque enregistrement : il suffit de changer le
        moment du service et la temperature.
      </p>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500">
              <th className="py-2">Date</th><th className="py-2">Service</th><th className="py-2">Moment</th><th className="py-2">Plat</th><th className="py-2">Temp.</th><th className="py-2">Etat</th><th></th>
            </tr></thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-2 text-slate-500">{new Date(c.checkedAt).toLocaleString()}</td>
                  <td className="py-2 text-slate-500">{labelFor(MEAL_SERVICES, c.mealService)}</td>
                  <td className="py-2 text-slate-500">{c.stage ? labelFor(SERVICE_STAGES, c.stage) : '-'}</td>
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
              {items.length === 0 && <tr><td colSpan={7} className="py-4 text-center text-slate-400">Aucun controle enregistre</td></tr>}
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
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Moment du service</label>
            <div className="flex gap-2">
              {SERVICE_STAGES.map((s) => (
                <button
                  type="button"
                  key={s.value}
                  onClick={() => setForm({ ...form, stage: s.value })}
                  className={form.stage === s.value ? 'btn-primary flex-1' : 'btn-secondary flex-1'}
                >
                  {s.label.replace(' de service', '')}
                </button>
              ))}
            </div>
          </div>
          <input className="input" placeholder="Nom du plat" value={form.dishName} onChange={(e) => setForm({ ...form, dishName: e.target.value })} required />
          <input
            ref={valueInputRef}
            className="input"
            type="number"
            step="0.1"
            placeholder="Temperature mesuree (°C)"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            required
          />
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
