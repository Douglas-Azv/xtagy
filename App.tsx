
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './services/firebase';
import { apiService } from './services/apiService';
import { User, CompanyRole, SubscriptionStatus, Company } from './types.ts';
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import OrderList from './pages/OrderList.tsx';
import OrderDetails from './pages/OrderDetails.tsx';
import PieceDetails from './pages/PieceDetails.tsx';
import Analytics from './pages/Analytics.tsx';
import QRScannerPage from './pages/QRScannerPage.tsx';
import OnboardingPayment from './pages/OnboardingPayment.tsx';
import Billing from './pages/Billing.tsx';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadUserProfile = async (uid: string, retries = 3) => {
    try {
      const profile = await apiService.getUserProfile(uid);
      if (profile) {
        setCurrentUser(profile);
        const companyData = await apiService.getCompanyById(profile.companyId);
        setCompany(companyData || null);
        setAuthError(null);
        return true;
      }
      return false;
    } catch (error: any) {
      if (retries > 0 && error.code === 'permission-denied') {
        console.warn(`[XTAGY] Erro de permissão ao carregar perfil. Tentando novamente... (${retries} restantes)`);
        await new Promise(resolve => setTimeout(resolve, 800));
        return loadUserProfile(uid, retries - 1);
      }
      throw error;
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      try {
        if (firebaseUser) {
          // Pequena espera inicial para propagação de token
          await new Promise(resolve => setTimeout(resolve, 500));
          await loadUserProfile(firebaseUser.uid);
        } else {
          setCurrentUser(null);
          setCompany(null);
        }
      } catch (error: any) {
        console.error("Auth state change error:", error);
        setAuthError("Erro ao carregar perfil: " + (error.code === 'permission-denied' ? 'Permissão negada (verifique as regras do Firestore)' : error.message));
      } finally {
        setLoading(false);
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setCompany(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl max-w-md shadow-2xl">
          <i className="fa-solid fa-triangle-exclamation text-red-500 text-5xl mb-4"></i>
          <h2 className="text-xl font-black text-slate-900 mb-2">Problema de Acesso</h2>
          <p className="text-slate-500 text-sm mb-6">{authError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-amber-500 text-slate-900 rounded-2xl font-black hover:bg-amber-600 transition-all"
          >
            Tentar Novamente
          </button>
          <button 
            onClick={handleLogout}
            className="w-full py-4 text-slate-400 font-bold mt-2"
          >
            Sair da Conta
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={(user) => setCurrentUser(user)} />;
  }

  const isBanho = currentUser.companyRole === CompanyRole.BANHO;
  const isPending = company?.subscription?.status === SubscriptionStatus.PAYMENT_PENDING;

  return (
    <HashRouter>
      {!isOnline && (
        <div className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest py-1 text-center fixed top-0 left-0 right-0 z-[10000] no-print">
          <i className="fa-solid fa-wifi-slash mr-2"></i> Você está offline. O XTAGY está operando com dados em cache.
        </div>
      )}
      
      <div className={`min-h-screen flex flex-col md:flex-row ${!isOnline ? 'pt-6' : ''}`}>
        <nav className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col no-print">
          <div className="p-6">
            <h1 className="text-2xl font-bold tracking-tighter flex items-center gap-2">
              <span className="bg-amber-500 text-slate-900 px-2 py-0.5 rounded italic">X</span>
              TAGY
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">B2B Gold Plating</p>
          </div>

          <div className="mt-4 flex-grow space-y-1 px-3">
            <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors">
              <i className="fa-solid fa-chart-line w-5"></i> Dashboard
            </Link>
            <Link to="/orders" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors">
              <i className="fa-solid fa-boxes-stacked w-5"></i> Pedidos
            </Link>
             <Link to="/scanner" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors">
              <i className="fa-solid fa-qrcode w-5"></i> Escanear Peça
            </Link>
            {isBanho && (
              <Link to="/billing" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors">
                <i className="fa-solid fa-credit-card w-5"></i> Faturamento
              </Link>
            )}
          </div>

          <div className="p-4 bg-slate-950/50 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-slate-900 font-bold">
                {currentUser.name[0]}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-400 truncate capitalize">{currentUser.companyRole}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full text-left text-xs text-slate-400 hover:text-white flex items-center gap-2 px-1"
            >
              <i className="fa-solid fa-right-from-bracket"></i> Sair do sistema
            </button>
          </div>
        </nav>

        <main className="flex-grow overflow-y-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <Routes>
              {isBanho && isPending && <Route path="*" element={<OnboardingPayment user={currentUser} />} />}
              
              <Route path="/" element={<Dashboard user={currentUser} />} />
              <Route path="/orders" element={<OrderList user={currentUser} />} />
              <Route path="/order/:id" element={<OrderDetails user={currentUser} />} />
              <Route path="/piece/:id" element={<PieceDetails user={currentUser} />} />
              <Route path="/analytics" element={<Analytics user={currentUser} />} />
              <Route path="/scanner" element={<QRScannerPage />} />
              <Route path="/billing" element={<Billing user={currentUser} />} />
              <Route path="/onboarding" element={<OnboardingPayment user={currentUser} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
