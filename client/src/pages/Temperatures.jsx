import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { EQUIPMENT_TYPES, labelFor } from '../constants';

export default function Temperatures() {
  const { activeSiteId, isMultiSiteRole } = useAuth();
  const [equipments, setEquipments] = useState([]);
  const [sites, setSites] = useState([]);
  const [newEquip, setNewEquip] = useState({ siteId: '', name: '', type: 'FRIGO', targetMin: 0, targetMax: 4 });
  const [readingDrafts, setReadingDrafts] = useState({});
  const [error, setError] = useState('');

  const load = () => api.get('/equipments', { params: { siteId: activeSiteId || undefined } }).then(({ data }) => setEquipments(data));

  useEffect(() => {
    load();
    api.get('/sites').then(({ data }) => setSites(data));
  }, [activeSiteId]);

  useEffect(() => {
    setNewEquip((f) => ({ ...f, siteId: activeSiteId || f.siteId }));
  }, [activeSiteId]);

  const addEquipment = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/equipments', newEquip);
      setNewEquip({ ...newEquip, name: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    }
  };

  const removeEquipment = async (id) => {
    if (!confirm('Supprimer cet equipement ?')) return;
    await api.delete(`/equipments/${id}`);
    load();
  };

  const recordReading = async (equipmentId) => {
    const draft = readingDrafts[equipmentId];
    if (!draft?.value) return;
    await api.post(`/equipments/${equipmentId}/readings`, draft);
    setReadingDrafts((d) => ({ ...d, [equipmentId]: { value: '', recordedBy: draft.recordedBy || '' } }));
    load();
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-800">Suivi des temperatures</h1>

      <div className="mb-6 card">
        <h2 className="mb-3 font-semibold text-slate-700">Ajouter un equipement</h2>
        {error && <div className="mb-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <form onSubmit={addEquipment} className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          {isMultiSiteRole && (
            <select className="input" value={newEquip.siteId} onChange={(e) => setNewEquip({ ...newEquip, siteId: e.target.value })} required>
              <option value="">Etablissement</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <input className="input" placeholder="Nom (ex: Frigo cuisine)" value={newEquip.name} onChange={(e) => setNewEquip({ ...newEquip, name: e.target.value })} required />
          <select className="input" value={newEquip.type} onChange={(e) => setNewEquip({ ...newEquip, type: e.target.value })}>
            {EQUIPMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input className="input" type="number" step="0.1" placeholder="Seuil min" value={newEquip.targetMin} onChange={(e) => setNewEquip({ ...newEquip, targetMin: e.target.value })} />
          <input className="input" type="number" step="0.1" placeholder="Seuil max" value={newEquip.targetMax} onChange={(e) => setNewEquip({ ...newEquip, targetMax: e.target.value })} />
          <button className="btn-primary sm:col-span-5" type="submit">Ajouter l'equipement</button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {equipments.map((eq) => (
          <div key={eq.id} className="card">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-700">{eq.name}</div>
                <div className="text-xs text-slate-500">{labelFor(EQUIPMENT_TYPES, eq.type)} - seuils {eq.targetMin}°C a {eq.targetMax}°C</div>
              </div>
              <button className="btn-danger" onClick={() => removeEquipment(eq.id)}>Suppr.</button>
            </div>

            <div className="mb-3 space-y-1">
              {eq.readings.length === 0 && <div className="text-sm text-slate-400">Aucun releve</div>}
              {eq.readings.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{new Date(r.recordedAt).toLocaleString()}</span>
                  <span className={r.alert ? 'font-semibold text-red-600' : 'text-slate-700'}>
                    {r.value}°C {r.alert && '⚠️ hors seuil'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                className="input"
                type="number"
                step="0.1"
                placeholder="Nouveau releve (°C)"
                value={readingDrafts[eq.id]?.value || ''}
                onChange={(e) => setReadingDrafts((d) => ({ ...d, [eq.id]: { ...d[eq.id], value: e.target.value } }))}
              />
              <input
                className="input"
                placeholder="Par"
                value={readingDrafts[eq.id]?.recordedBy || ''}
                onChange={(e) => setReadingDrafts((d) => ({ ...d, [eq.id]: { ...d[eq.id], recordedBy: e.target.value } }))}
              />
              <button className="btn-primary shrink-0" onClick={() => recordReading(eq.id)}>Enregistrer</button>
            </div>
          </div>
        ))}
        {equipments.length === 0 && <div className="text-slate-400">Aucun equipement pour le moment.</div>}
      </div>
    </div>
  );
}
