import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

function Kpi({ label, value, tone = 'default' }) {
  const tones = {
    default: 'text-slate-800',
    danger: 'text-red-600',
    warning: 'text-orange-600',
    success: 'text-green-600',
  };
  return (
    <div className="card">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`mt-1 text-3xl font-bold ${tones[tone]}`}>{value ?? '-'}</div>
    </div>
  );
}

export default function Dashboard() {
  const { activeSiteId, user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard', { params: { siteId: activeSiteId || undefined } }).then(({ data }) => setData(data));
  }, [activeSiteId]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-800">Tableau de bord</h1>
      <p className="mb-6 text-sm text-slate-500">Bonjour {user?.name}, voici la situation HACCP en un coup d'oeil.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Non-conformites ouvertes" value={data?.openNonConformities} tone={data?.openNonConformities > 0 ? 'warning' : 'success'} />
        <Kpi label="Dont critiques" value={data?.criticalNonConformities} tone={data?.criticalNonConformities > 0 ? 'danger' : 'success'} />
        <Kpi label="Alertes temperature (24h)" value={data?.tempAlerts24h} tone={data?.tempAlerts24h > 0 ? 'danger' : 'success'} />
        <Kpi label="Actions correctives en attente" value={data?.pendingActions} tone={data?.pendingActions > 0 ? 'warning' : 'success'} />
        <Kpi label="Score moyen autocontroles" value={data?.avgAuditScore !== null && data?.avgAuditScore !== undefined ? `${data.avgAuditScore}%` : '-'} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-2 font-semibold text-slate-700">A propos du plan de maitrise sanitaire</h2>
          <p className="text-sm text-slate-600">
            Cette application couvre les points cles du PMS : tracabilite des receptions, surveillance des
            temperatures (stockage et service), plan de nettoyage/desinfection, gestion des non-conformites
            et actions correctives, autocontroles/audits internes, gestion documentaire et suivi des
            habilitations du personnel.
          </p>
        </div>
        <div className="card">
          <h2 className="mb-2 font-semibold text-slate-700">Etablissements ({data?.sitesCount ?? '-'})</h2>
          <p className="text-sm text-slate-600">
            {user && ['SUPER_ADMIN', 'ORG_ADMIN'].includes(user.role)
              ? 'Utilisez le selecteur en haut a droite pour filtrer les donnees par etablissement, ou laissez sur "Tous les etablissements" pour une vue consolidee de la chaine.'
              : 'Vous consultez les donnees de votre etablissement.'}
          </p>
        </div>
      </div>
    </div>
  );
}
