import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const NAV_ITEMS = [
  { to: '/', label: 'Tableau de bord', icon: '📊' },
  { to: '/receptions', label: 'Reception & tracabilite', icon: '📦' },
  { to: '/temperatures', label: 'Temperatures', icon: '🌡️' },
  { to: '/service', label: 'Controle en service', icon: '🍽️' },
  { to: '/nettoyage', label: 'Plan de nettoyage', icon: '🧽' },
  { to: '/non-conformites', label: 'Non-conformites', icon: '⚠️' },
  { to: '/audits', label: 'Autocontroles / audits', icon: '✅' },
  { to: '/documents', label: 'Documentation', icon: '📄' },
  { to: '/personnel', label: 'Personnel & formations', icon: '👥' },
  { to: '/etablissements', label: 'Etablissements', icon: '🏠', roles: ['SUPER_ADMIN', 'ORG_ADMIN'] },
];

export default function Layout() {
  const { user, logout, activeSiteId, changeSite, isMultiSiteRole } = useAuth();
  const [sites, setSites] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/sites').then(({ data }) => setSites(data)).catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-4">
          <div className="text-lg font-bold text-brand-700">HACCP Manager</div>
          <div className="text-xs text-slate-500">Plan de maitrise sanitaire</div>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user?.role)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `mb-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <div className="mb-2 text-sm font-medium text-slate-700">{user?.name}</div>
          <div className="mb-3 text-xs text-slate-500">{user?.role}</div>
          <button className="btn-secondary w-full" onClick={handleLogout}>
            Se deconnecter
          </button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="text-sm text-slate-500">
            {isMultiSiteRole ? 'Vue chaine - selectionnez un etablissement' : 'Etablissement'}
          </div>
          <select
            className="input max-w-xs"
            value={activeSiteId}
            onChange={(e) => changeSite(e.target.value)}
          >
            {isMultiSiteRole && <option value="">Tous les etablissements</option>}
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet context={{ sites }} />
        </main>
      </div>
    </div>
  );
}
