import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/Login";
import SuperAdminPanel from "./components/SuperAdminPanel";

function AppContent() {
  const { firebaseUser, perfil, cargando, esSuperAdmin } = useAuth();

  if (cargando) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-flex rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="font-display text-white">FM</span>
          </div>
          <p className="text-bone-dim font-display tracking-wide">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) return <Login />;

  if (!perfil || !esSuperAdmin) {
    return (
      <div className="min-h-screen bg-carbon flex items-center justify-center px-4 text-center">
        <div>
          <p className="text-bone-dim">No tienes acceso a este panel.</p>
          <p className="text-bone-dim text-sm mt-1">Contacta al administrador de FlexManager.</p>
        </div>
      </div>
    );
  }

  return <SuperAdminPanel />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
