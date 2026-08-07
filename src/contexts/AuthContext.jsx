import { createContext, useContext, useEffect, useState } from "react";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const snap = await getDoc(doc(db, "flexPerfiles", user.uid));
          if (snap.exists()) setPerfil({ id: user.uid, ...snap.data() });
          else setPerfil(null);
        } catch { setPerfil(null); }
      } else { setPerfil(null); }
      setCargando(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    firebaseUser, perfil, cargando,
    esSuperAdmin: perfil?.rol === "superadmin",
    iniciarSesion: (email, password) => signInWithEmailAndPassword(auth, email, password),
    cerrarSesion: () => signOut(auth),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
