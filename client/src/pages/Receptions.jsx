import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { STORAGE_TYPES, labelFor } from '../constants';

function SuppliersTab() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', contact: '', phone: '', email: '' });
  const load = () => api.get('/suppliers').then(({ data }) => setItems(data));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.post('/suppliers', form);
    setForm({ name: '', contact: '', phone: '', email: '' });
    load();
  };
  const remove = async (id) => { await api.delete(`/suppliers/${id}`); load(); };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 card">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-slate-500"><th className="py-2">Nom</th><th className="py-2">Contact</th><th className="py-2">Telephone</th><th></th></tr></thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="py-2 font-medium text-slate-700">{s.name}</td>
                <td className="py-2 text-slate-500">{s.contact}</td>
                <td className="py-2 text-slate-500">{s.phone}</td>
                <td className="py-2 text-right"><button className="btn-danger" onClick={() => remove(s.id)}>Suppr.</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={submit} className="card space-y-3">
        <h2 className="font-semibold text-slate-700">Nouveau fournisseur</h2>
        <input className="input" placeholder="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input" placeholder="Contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
        <input className="input" placeholder="Telephone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <button className="btn-primary w-full" type="submit">Ajouter</button>
      </form>
    </div>
  );
}

function ProductsTab() {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({ name: '', category: '', storageType: 'FROID_POSITIF', defaultShelfLifeDays: '', supplierId: '' });
  const load = () => {
    api.get('/products').then(({ data }) => setItems(data));
    api.get('/suppliers').then(({ data }) => setSuppliers(data));
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.post('/products', form);
    setForm({ name: '', category: '', storageType: 'FROID_POSITIF', defaultShelfLifeDays: '', supplierId: '' });
    load();
  };
  const remove = async (id) => { await api.delete(`/products/${id}`); load(); };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 card">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-slate-500"><th className="py-2">Produit</th><th className="py-2">Categorie</th><th className="py-2">Stockage</th><th className="py-2">Fournisseur</th><th></th></tr></thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="py-2 font-medium text-slate-700">{p.name}</td>
                <td className="py-2 text-slate-500">{p.category}</td>
                <td className="py-2 text-slate-500">{labelFor(STORAGE_TYPES, p.storageType)}</td>
                <td className="py-2 text-slate-500">{p.supplier?.name || '-'}</td>
                <td className="py-2 text-right"><button className="btn-danger" onClick={() => remove(p.id)}>Suppr.</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={submit} className="card space-y-3">
        <h2 className="font-semibold text-slate-700">Nouveau produit</h2>
        <input className="input" placeholder="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input" placeholder="Categorie" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <select className="input" value={form.storageType} onChange={(e) => setForm({ ...form, storageType: e.target.value })}>
          {STORAGE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input className="input" type="number" placeholder="DLC par defaut (jours)" value={form.defaultShelfLifeDays} onChange={(e) => setForm({ ...form, defaultShelfLifeDays: e.target.value })} />
        <select className="input" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
          <option value="">Sans fournisseur</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button className="btn-primary w-full" type="submit">Ajouter</button>
      </form>
    </div>
  );
}

function ReceptionsTab() {
  const { activeSiteId, isMultiSiteRole } = useAuth();
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [sites, setSites] = useState([]);
  const [form, setForm] = useState({ siteId: '', supplierId: '', productId: '', lotNumber: '', dlc: '', quantity: '', unit: 'kg', temperatureAtReception: '', conform: true, nonConformityNote: '', receivedBy: '' });
  const [error, setError] = useState('');

  const load = () => {
    api.get('/receptions', { params: { siteId: activeSiteId || undefined } }).then(({ data }) => setItems(data));
  };
  useEffect(() => {
    load();
    api.get('/suppliers').then(({ data }) => setSuppliers(data));
    api.get('/products').then(({ data }) => setProducts(data));
    api.get('/sites').then(({ data }) => setSites(data));
  }, [activeSiteId]);

  useEffect(() => {
    setForm((f) => ({ ...f, siteId: activeSiteId || f.siteId }));
  }, [activeSiteId]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/receptions', form);
      setForm({ ...form, lotNumber: '', dlc: '', quantity: '', temperatureAtReception: '', conform: true, nonConformityNote: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    }
  };
  const remove = async (id) => { await api.delete(`/receptions/${id}`); load(); };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-slate-500">
            <th className="py-2">Date</th><th className="py-2">Produit</th><th className="py-2">Fournisseur</th><th className="py-2">Lot</th><th className="py-2">DLC</th><th className="py-2">Temp.</th><th className="py-2">Etat</th><th></th>
          </tr></thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-2 text-slate-500">{new Date(r.receivedAt).toLocaleDateString()}</td>
                <td className="py-2 font-medium text-slate-700">{r.product?.name}</td>
                <td className="py-2 text-slate-500">{r.supplier?.name}</td>
                <td className="py-2 text-slate-500">{r.lotNumber}</td>
                <td className="py-2 text-slate-500">{r.dlc ? new Date(r.dlc).toLocaleDateString() : '-'}</td>
                <td className="py-2 text-slate-500">{r.temperatureAtReception ?? '-'}°C</td>
                <td className="py-2">
                  <span className={`badge ${r.conform ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {r.conform ? 'Conforme' : 'Non conforme'}
                  </span>
                </td>
                <td className="py-2 text-right"><button className="btn-danger" onClick={() => remove(r.id)}>Suppr.</button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={8} className="py-4 text-center text-slate-400">Aucune reception</td></tr>}
          </tbody>
        </table>
      </div>
      <form onSubmit={submit} className="card space-y-3">
        <h2 className="font-semibold text-slate-700">Nouvelle reception</h2>
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {isMultiSiteRole && (
          <select className="input" value={form.siteId} onChange={(e) => setForm({ ...form, siteId: e.target.value })} required>
            <option value="">Choisir un etablissement</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <select className="input" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} required>
          <option value="">Fournisseur</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="input" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
          <option value="">Produit</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input className="input" placeholder="Numero de lot" value={form.lotNumber} onChange={(e) => setForm({ ...form, lotNumber: e.target.value })} required />
        <div className="grid grid-cols-2 gap-2">
          <input className="input" type="date" value={form.dlc} onChange={(e) => setForm({ ...form, dlc: e.target.value })} />
          <input className="input" type="number" step="0.1" placeholder="Temp. reception (°C)" value={form.temperatureAtReception} onChange={(e) => setForm({ ...form, temperatureAtReception: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className="input" type="number" placeholder="Quantite" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          <input className="input" placeholder="Unite" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={form.conform} onChange={(e) => setForm({ ...form, conform: e.target.checked })} />
          Livraison conforme
        </label>
        {!form.conform && (
          <input className="input" placeholder="Motif de non-conformite" value={form.nonConformityNote} onChange={(e) => setForm({ ...form, nonConformityNote: e.target.value })} />
        )}
        <input className="input" placeholder="Receptionne par" value={form.receivedBy} onChange={(e) => setForm({ ...form, receivedBy: e.target.value })} />
        <button className="btn-primary w-full" type="submit">Enregistrer</button>
      </form>
    </div>
  );
}

export default function Receptions() {
  const [tab, setTab] = useState('receptions');
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-800">Reception & tracabilite</h1>
      <div className="mb-4 flex gap-2">
        {[
          { key: 'receptions', label: 'Receptions' },
          { key: 'products', label: 'Produits' },
          { key: 'suppliers', label: 'Fournisseurs' },
        ].map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'receptions' && <ReceptionsTab />}
      {tab === 'products' && <ProductsTab />}
      {tab === 'suppliers' && <SuppliersTab />}
    </div>
  );
}
