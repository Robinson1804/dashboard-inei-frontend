import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { login as loginApi, getMe } from '@/api/auth';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Attempt real API login
      const tokenData = await loginApi(username, password);
      localStorage.setItem('token', tokenData.access_token);

      // Fetch user profile after login
      try {
        const userProfile = await getMe();
        localStorage.setItem('user', JSON.stringify({
          ...userProfile,
          nombre: userProfile.nombre_completo || userProfile.username,
        }));
      } catch {
        // If getMe fails, store basic user data from form
        localStorage.setItem('user', JSON.stringify({ nombre: username, rol: 'Consultor' }));
      }

      navigate('/dashboard/presupuesto', { replace: true });
    } catch (apiError: unknown) {
      const err = apiError as { response?: { status?: number; data?: { detail?: string } } };
      if (err.response?.status === 401) {
        setError('Credenciales incorrectas. Por favor, intente de nuevo.');
      } else {
        setError('Error de conexión. Verifique que el servidor esté disponible.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#1a2332] to-[#1e3a5f]">
      <div className="w-full max-w-[420px]">
        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded flex items-center gap-3">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="p-8">
            {/* Logo and heading */}
            <div className="text-center mb-8">
              <img
                alt="INEI Logo"
                className="h-20 w-20 mx-auto mb-4 object-contain"
                src="/logo-inei.png"
              />
              <h1 className="text-xl font-bold text-[#1a2332]">Dashboard Presupuestal</h1>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
                Instituto Nacional de Estadística e Informática
              </p>
            </div>

            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username field */}
              <div>
                <label
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                  htmlFor="username"
                >
                  Usuario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={20} className="text-gray-400" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ingrese su usuario"
                    required
                    autoComplete="username"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                  htmlFor="password"
                >
                  Contrasena
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={20} className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember_me"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                  />
                  <label
                    className="ml-2 block text-xs text-gray-600 cursor-pointer"
                    htmlFor="remember_me"
                  >
                    Recordar sesion
                  </label>
                </div>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Olvido su contrasena?
                </button>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || !username || !password}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-[#2563eb] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 size={16} className="animate-spin mr-2" />}
                {loading ? 'Iniciando sesion...' : 'Iniciar Sesion'}
              </button>
            </form>
          </div>

          {/* Card footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
            <p className="text-[10px] text-center text-gray-400">
              Sistema de uso oficial. El acceso no autorizado esta prohibido y sera sancionado
              conforme a ley.
            </p>
          </div>
        </div>

        {/* Page footer */}
        <footer className="mt-8 text-center">
          <p className="text-[11px] text-gray-300/80 font-light">
            © 2026 INEI — Oficina Tecnica de Informatica
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Login;
