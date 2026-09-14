import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Sites() {
  const [sites, setSites] = useState([]);
  const [form, setForm] = useState({ name: '', address: '' });
  const [error, setError] = useState('');

  const load = () => api.get('/sites').then(({ data }) => setSites(data));

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/sites', form);
      setForm({ name: '', address: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    }
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
          <div className="card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2">Nom</th>
                  <th className="py-2">Adresse</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {sites.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-2 font-medium text-slate-700">{s.name}</td>
                    <td className="py-2 text-slate-500">{s.address}</td>
                    <td className="py-2 text-right">
                      <button className="btn-danger" onClick={() => remove(s.id)}>
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
                {sites.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-400">
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
            <h2 className="font-semibold text-slate-700">Ajouter un etablissement</h2>
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
              placeholder="Adresse"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <button className="btn-primary w-full" type="submit">
              Ajouter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
