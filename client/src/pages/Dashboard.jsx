import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

// Notifie une fois par jour et par etablissement affiche qu'il reste des saisies a faire,
// pour rappeler les controles du jour meme si personne ne pense a ouvrir le tableau de bord.
function notifyPendingReminders(count, siteId) {
  if (typeof Notification === 'undefined' || count === 0) return;
  const today = new Date().toISOString().slice(0, 10);
  const flagKey = `haccp_reminder_shown_${today}_${siteId || 'all'}`;
  if (localStorage.getItem(flagKey)) return;

  const fire = () => {
    new Notification('HACCP Manager - rappel du jour', {
      body: `${count} saisie${count > 1 ? 's' : ''} du jour en attente (temperatures / nettoyage).`,
    });
    localStorage.setItem(flagKey, '1');
  };

  if (Notification.permission === 'granted') {
    fire();
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') fire();
    });
  }
}

export default function Dashboard() {
  const { activeSiteId, user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard', { params: { siteId: activeSiteId || undefined } }).then(({ data }) => {
      setData(data);
      const pendingCount = (data.equipmentsWithoutReadingToday?.length || 0) + (data.pendingDailyCleaningTasks?.length || 0);
      notifyPendingReminders(pendingCount, activeSiteId);
    });
  }, [activeSiteId]);

  const remindersCount = (data?.equipmentsWithoutReadingToday?.length || 0) + (data?.pendingDailyCleaningTasks?.length || 0);

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-800">Tableau de bord</h1>
      <p className="mb-6 text-sm text-slate-500">Bonjour {user?.name}, voici la situation HACCP en un coup d'oeil.</p>

      {data && remindersCount > 0 && (
        <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <h2 className="mb-2 flex items-center gap-2 font-semibold text-orange-800">
            🔔 Rappels du jour ({remindersCount})
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {data.equipmentsWithoutReadingToday.length > 0 && (
              <div>
                <div className="mb-1 text-sm font-medium text-orange-800">
                  Temperatures non relevees aujourd'hui :
                </div>
                <ul className="list-inside list-disc text-sm text-orange-700">
                  {data.equipmentsWithoutReadingToday.map((e) => (
                    <li key={e.id}>{e.name}</li>
                  ))}
                </ul>
                <Link to="/temperatures" className="mt-2 inline-block text-sm font-medium text-orange-800 underline">
                  Faire les releves &rarr;
                </Link>
              </div>
            )}
            {data.pendingDailyCleaningTasks.length > 0 && (
              <div>
                <div className="mb-1 text-sm font-medium text-orange-800">
                  Nettoyage quotidien non valide aujourd'hui :
                </div>
                <ul className="list-inside list-disc text-sm text-orange-700">
                  {data.pendingDailyCleaningTasks.map((t) => (
                    <li key={t.id}>{t.name} ({t.zoneName})</li>
                  ))}
                </ul>
                <Link to="/nettoyage" className="mt-2 inline-block text-sm font-medium text-orange-800 underline">
                  Valider le nettoyage &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

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
