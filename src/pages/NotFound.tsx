import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-6xl font-bold text-slate-200 mb-4">404</p>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Página no encontrada</h2>
      <p className="text-sm text-slate-500 mb-6">La página que buscas no existe o fue movida.</p>
      <Link
        to="/dashboard/presupuesto"
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
      >
        <Home size={16} />
        Ir al Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
