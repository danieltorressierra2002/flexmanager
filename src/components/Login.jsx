import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { iniciarSesion } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await iniciarSesion(email.trim(), password);
    } catch {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen bg-carbon flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-flex rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="font-display text-white text-2xl">FM</span>
          </div>
          <h1 className="font-display text-3xl text-bone tracking-wide uppercase">
            Flex<span className="text-flex-glow">Manager</span>
          </h1>
          <p className="text-bone-dim text-sm mt-2">Panel de administración central</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-carbon-surface border border-steel/40 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-bone-dim uppercase tracking-wide mb-1.5">Correo</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="campo-input" placeholder="tucorreo@ejemplo.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-bone-dim uppercase tracking-wide mb-1.5">Contraseña</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="campo-input" placeholder="••••••••" />
          </div>
          {error && <p className="text-sm text-blood-glow bg-blood/10 border border-blood/30 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={cargando}
            className="w-full bg-flex hover:bg-flex-glow disabled:opacity-50 text-white font-display font-semibold uppercase tracking-wide py-3 rounded-lg transition-all active:scale-[0.98]">
            {cargando ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
