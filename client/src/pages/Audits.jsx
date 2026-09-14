import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

function TemplatesTab({ templates, reload }) {
  const [form, setForm] = useState({ name: '', questions: [{ id: 'q1', label: '', category: '' }] });

  const updateQuestion = (idx, field, value) => {
    const questions = [...form.questions];
    questions[idx] = { ...questions[idx], [field]: value };
    setForm({ ...form, questions });
  };
  const addQuestion = () => setForm({ ...form, questions: [...form.questions, { id: `q${form.questions.length + 1}`, label: '', category: '' }] });
  const removeQuestion = (idx) => setForm({ ...form, questions: form.questions.filter((_, i) => i !== idx) });

  const submit = async (e) => {
    e.preventDefault();
    const questions = form.questions.filter((q) => q.label.trim());
    if (!form.name || questions.length === 0) return;
    await api.post('/audits/templates', { name: form.name, questions });
    setForm({ name: '', questions: [{ id: 'q1', label: '', category: '' }] });
    reload();
  };

  const remove = async (id) => { await api.delete(`/audits/templates/${id}`); reload(); };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="card">
        <h2 className="mb-3 font-semibold text-slate-700">Grilles existantes</h2>
        <div className="space-y-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-md border border-slate-100 p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium text-slate-700">{t.name}</span>
                <button className="btn-danger" onClick={() => remove(t.id)}>Suppr.</button>
              </div>
              <ul className="list-inside list-disc text-sm text-slate-500">
                {t.questions.map((q) => <li key={q.id}>{q.label}</li>)}
              </ul>
            </div>
          ))}
          {templates.length === 0 && <div className="text-slate-400">Aucune grille definie</div>}
        </div>
      </div>
      <form onSubmit={submit} className="card space-y-3">
        <h2 className="font-semibold text-slate-700">Nouvelle grille d'autocontrole</h2>
        <input className="input" placeholder="Nom de la grille" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <div className="space-y-2">
          {form.questions.map((q, idx) => (
            <div key={idx} className="flex gap-2">
              <input className="input" placeholder={`Question ${idx + 1}`} value={q.label} onChange={(e) => updateQuestion(idx, 'label', e.target.value)} />
              <input className="input max-w-[120px]" placeholder="Categorie" value={q.category} onChange={(e) => updateQuestion(idx, 'category', e.target.value)} />
              <button type="button" className="btn-danger" onClick={() => removeQuestion(idx)}>x</button>
            </div>
          ))}
        </div>
        <button type="button" className="btn-secondary" onClick={addQuestion}>+ Ajouter une question</button>
        <button className="btn-primary w-full" type="submit">Creer la grille</button>
      </form>
    </div>
  );
}

function RunAuditTab({ templates, sites, isMultiSiteRole, activeSiteId, reload }) {
  const [siteId, setSiteId] = useState(activeSiteId || '');
  const [templateId, setTemplateId] = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const [answers, setAnswers] = useState({});

  const template = templates.find((t) => t.id === templateId);

  const submit = async (e) => {
    e.preventDefault();
    if (!template) return;
    const payload = template.questions.map((q) => ({ questionId: q.id, ok: !!answers[q.id]?.ok, comment: answers[q.id]?.comment || '' }));
    await api.post('/audits', { siteId, templateId, performedBy, answers: payload });
    setAnswers({});
    reload();
    alert('Audit enregistre');
  };

  return (
    <form onSubmit={submit} className="card space-y-4">
      <h2 className="font-semibold text-slate-700">Realiser un autocontrole</h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {isMultiSiteRole && (
          <select className="input" value={siteId} onChange={(e) => setSiteId(e.target.value)} required>
            <option value="">Etablissement</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <select className="input" value={templateId} onChange={(e) => setTemplateId(e.target.value)} required>
          <option value="">Grille d'audit</option>
          {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <input className="input" placeholder="Realise par" value={performedBy} onChange={(e) => setPerformedBy(e.target.value)} />
      </div>

      {template && (
        <div className="space-y-2">
          {template.questions.map((q) => (
            <div key={q.id} className="rounded-md border border-slate-100 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-slate-700">{q.label}</span>
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={!!answers[q.id]?.ok}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: { ...a[q.id], ok: e.target.checked } }))}
                  />
                  Conforme
                </label>
              </div>
              <input
                className="input"
                placeholder="Commentaire (optionnel)"
                value={answers[q.id]?.comment || ''}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: { ...a[q.id], comment: e.target.value } }))}
              />
            </div>
          ))}
        </div>
      )}

      <button className="btn-primary" type="submit" disabled={!template}>Enregistrer l'audit</button>
    </form>
  );
}

function HistoryTab({ audits }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b text-left text-slate-500">
          <th className="py-2">Date</th><th className="py-2">Grille</th><th className="py-2">Realise par</th><th className="py-2">Score</th>
        </tr></thead>
        <tbody>
          {audits.map((a) => (
            <tr key={a.id} className="border-b last:border-0">
              <td className="py-2 text-slate-500">{new Date(a.performedAt).toLocaleString()}</td>
              <td className="py-2 font-medium text-slate-700">{a.template?.name}</td>
              <td className="py-2 text-slate-500">{a.performedBy || '-'}</td>
              <td className="py-2">
                <span className={`badge ${a.score >= 80 ? 'bg-green-100 text-green-800' : a.score >= 50 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                  {a.score}%
                </span>
              </td>
            </tr>
          ))}
          {audits.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-slate-400">Aucun audit realise</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export default function Audits() {
  const { activeSiteId, isMultiSiteRole } = useAuth();
  const [tab, setTab] = useState('run');
  const [templates, setTemplates] = useState([]);
  const [audits, setAudits] = useState([]);
  const [sites, setSites] = useState([]);

  const load = () => {
    api.get('/audits/templates').then(({ data }) => setTemplates(data));
    api.get('/audits', { params: { siteId: activeSiteId || undefined } }).then(({ data }) => setAudits(data));
  };

  useEffect(() => {
    load();
    api.get('/sites').then(({ data }) => setSites(data));
  }, [activeSiteId]);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-800">Autocontroles & audits internes</h1>
      <div className="mb-4 flex gap-2">
        {[
          { key: 'run', label: 'Realiser un audit' },
          { key: 'history', label: 'Historique' },
          { key: 'templates', label: 'Grilles' },
        ].map((t) => (
          <button key={t.key} className={tab === t.key ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'run' && <RunAuditTab templates={templates} sites={sites} isMultiSiteRole={isMultiSiteRole} activeSiteId={activeSiteId} reload={load} />}
      {tab === 'history' && <HistoryTab audits={audits} />}
      {tab === 'templates' && <TemplatesTab templates={templates} reload={load} />}
    </div>
  );
}
