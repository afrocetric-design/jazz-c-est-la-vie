import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Sites() {
  const [sites, setSites] = useState([]);
  const [form, setForm] = useState({ name: '', establishmentNumber: '', address: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.get('/sites').then(({ data }) => setSites(data));

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/sites/${editingId}`, form);
      } else {
        await api.post('/sites', form);
      }
      setForm({ name: '', establishmentNumber: '', address: '' });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    }
  };

  const edit = (site) => {
    setEditingId(site.id);
    setForm({ name: site.name, establishmentNumber: site.establishmentNumber || '', address: site.address || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: '', establishmentNumber: '', address: '' });
  };

  const remove = async (id) => {
    if (!confirm('Supprimer cet etablissement et toutes ses donnees ?')) return;
    await api.delete(`/sites/${id}`);
    load();
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-800">Etablissements</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2">Nom</th>
                  <th className="py-2">N&deg; etablissement</th>
                  <th className="py-2">Adresse</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {sites.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-2 font-medium text-slate-700">{s.name}</td>
                    <td className="py-2 text-slate-500">{s.establishmentNumber || '-'}</td>
                    <td className="py-2 text-slate-500">{s.address}</td>
                    <td className="py-2 text-right space-x-2">
                      <button className="btn-secondary" onClick={() => edit(s)}>
                        Editer
                      </button>
                      <button className="btn-danger" onClick={() => remove(s.id)}>
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
                {sites.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400">
                      Aucun etablissement
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <form onSubmit={submit} className="card space-y-3">
            <h2 className="font-semibold text-slate-700">
              {editingId ? 'Modifier l\'etablissement' : 'Ajouter un etablissement'}
            </h2>
            {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <input
              className="input"
              placeholder="Nom"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="Numero d'etablissement"
              value={form.establishmentNumber}
              onChange={(e) => setForm({ ...form, establishmentNumber: e.target.value })}
            />
            <input
              className="input"
              placeholder="Adresse"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <div className="flex gap-2">
              <button className="btn-primary flex-1" type="submit">
                {editingId ? 'Enregistrer' : 'Ajouter'}
              </button>
              {editingId && (
                <button type="button" className="btn-secondary" onClick={cancelEdit}>
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
