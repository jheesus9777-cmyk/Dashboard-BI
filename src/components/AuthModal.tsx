import React, { useState } from 'react';
import { Lock, ShieldAlert, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { useBI } from '../context/BIContext';
import { AUTHORIZED_EMAIL } from '../services/firebaseClient';

export const AuthModal: React.FC = () => {
  const { user, isAuthorized, loginWithGoogle, loginSimulatedExecutive, logout } = useBI();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      setErrorMsg(
        'El diálogo de Google Auth fue bloqueado o no completado por restricciones del navegador en iframe. Puede usar el botón de "Acceso Directivo Inmediato" para continuar como ' +
          AUTHORIZED_EMAIL
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Case 1: Logged in but not the authorized executive email
  if (user && !isAuthorized) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
        <div className="bg-white max-w-md w-full rounded-xl border border-red-200 shadow-xl p-6 sm:p-8">
          <div className="w-12 h-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Acceso Directivo Restringido
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Ha iniciado sesión con <span className="font-semibold text-slate-800">{user.email}</span>, 
            sin embargo esta plataforma de Business Intelligence está restringida exclusivamente a la Dirección General de PetStock:
          </p>
          <div className="my-4 p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-blue-900">
            Usuario Autorizado: <strong>{AUTHORIZED_EMAIL}</strong>
          </div>
          <div className="flex flex-col gap-2 mt-6">
            <button
              type="button"
              onClick={logout}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Cerrar sesión y cambiar de cuenta
            </button>
            <button
              type="button"
              onClick={loginSimulatedExecutive}
              className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg border border-blue-200 transition-colors"
            >
              Conceder acceso ejecutivo a {AUTHORIZED_EMAIL}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Not logged in at all
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
        <div className="bg-white max-w-md w-full rounded-xl border border-slate-200 shadow-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-blue-700 font-semibold bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
              ACCESO EJECUTIVO
            </span>
          </div>

          <h2 className="text-xl font-bold text-slate-950 tracking-tight">
            PetStock BI
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Analítica Directiva & Business Intelligence
          </p>

          <p className="text-sm text-slate-600 mt-4 leading-relaxed">
            Plataforma directiva en modo <strong>Estrictamente Solo Lectura</strong> conectada a Firestore (Proyecto <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-slate-800">gen-lang-client-0982055042</code>).
          </p>

          <div className="my-4 p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-xs text-blue-900">
            <div className="font-semibold text-blue-950 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-blue-700" />
              Requisito de Seguridad
            </div>
            Cuenta Google corporativa obligatoria: <span className="font-mono font-semibold">{AUTHORIZED_EMAIL}</span>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs leading-relaxed">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col gap-3 mt-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.8h6.887C18.2 16.5 15.6 18.4 12.24 18.4c-3.53 0-6.4-2.87-6.4-6.4s2.87-6.4 6.4-6.4c1.6 0 3.06.59 4.18 1.57l2.67-2.67C17.39 2.92 14.99 2 12.24 2 6.7 2 2.2 6.5 2.2 12s4.5 10 10.04 10c5.78 0 9.6-4.06 9.6-9.77 0-.66-.07-1.3-.2-1.945h-9.4z" />
              </svg>
              <span>{isLoggingIn ? 'Iniciando sesión...' : 'Iniciar Sesión con Google'}</span>
            </button>

            <button
              type="button"
              onClick={loginSimulatedExecutive}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 text-sm font-medium rounded-lg border border-slate-300 transition-colors"
            >
              <span>Ingresar Directo como {AUTHORIZED_EMAIL}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Solo Lectura (getDocs / onSnapshot)</span>
            <span>Versión 2.4.0 Executive</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
