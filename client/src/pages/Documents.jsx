import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Documents() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', category: '', content: '', version: '1.0' });
  const [editingId, setEditingId] = useState(null);

  const load = () => api.get('/documents').then(({ data }) => setItems(data));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await api.put(`/documents/${editingId}`, form);
    } else {
      await api.post('/documents', form);
    }
    setForm({ title: '', category: '', content: '', version: '1.0' });
    setEditingId(null);
    load();
  };

  const edit = (doc) => {
    setEditingId(doc.id);
    setForm({ title: doc.title, category: doc.category || '', content: doc.content || '', version: doc.version });
  };

  const remove = async (id) => { await api.delete(`/documents/${id}`); load(); };

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-800">Gestion documentaire</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {items.map((doc) => (
            <div key={doc.id} className="card">
              <div className="mb-1 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-700">{doc.title}</span>
                  <span className="ml-2 badge bg-slate-100 text-slate-600">v{doc.version}</span>
                  {doc.category && <span className="ml-2 text-xs text-slate-400">{doc.category}</span>}
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary" onClick={() => edit(doc)}>Editer</button>
                  <button className="btn-danger" onClick={() => remove(doc.id)}>Suppr.</button>
                </div>
              </div>
              {doc.content && <p className="whitespace-pre-wrap text-sm text-slate-600">{doc.content}</p>}
              <div className="mt-1 text-xs text-slate-400">Mis a jour le {new Date(doc.updatedAt).toLocaleString()}</div>
            </div>
          ))}
          {items.length === 0 && <div className="text-slate-400">Aucun document</div>}
        </div>
        <form onSubmit={submit} className="card space-y-3">
          <h2 className="font-semibold text-slate-700">{editingId ? 'Modifier le document' : 'Nouveau document'}</h2>
          <input className="input" placeholder="Titre" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <input className="input" placeholder="Categorie (ex: PMS, Procedure, Fiche technique)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input className="input" placeholder="Version" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
          <textarea className="input" rows={6} placeholder="Contenu / notes de procedure" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <div className="flex gap-2">
            <button className="btn-primary flex-1" type="submit">{editingId ? 'Enregistrer' : 'Ajouter'}</button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setForm({ title: '', category: '', content: '', version: '1.0' }); }}>
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
