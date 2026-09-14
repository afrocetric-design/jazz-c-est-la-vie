import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('admin@jazzbistrot.fr');
  const [password, setPassword] = useState('haccp2024');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Connexion impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-brand-700">HACCP Manager</h1>
          <p className="text-sm text-slate-500">Plan de maitrise sanitaire - connexion</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Mot de passe</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn-primary w-full" type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <div className="mt-4 rounded-md bg-slate-100 p-3 text-xs text-slate-500">
          <div className="font-medium text-slate-600">Comptes de demonstration (mdp: haccp2024)</div>
          <div>admin@jazzbistrot.fr — chaine complete</div>
          <div>paris@jazzbistrot.fr — etablissement Saint-Germain</div>
          <div>lyon@jazzbistrot.fr — etablissement Presqu'ile</div>
        </div>
      </div>
    </div>
  );
}
