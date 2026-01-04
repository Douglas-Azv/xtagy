import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { User, CompanyRole } from '../types';
import { apiService } from '../services/apiService';

interface LoginProps {
  onLogin: (user: User) => void;
}

type Screen = 'choice' | 'register-banho' | 'register-cliente' | 'login-form';

const InputField = ({ label, value, onChange, type = "text", placeholder = "" }: any) => (
  <div>
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">{label}</label>
    <input
      required
      type={type}
      placeholder={placeholder}
      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all text-sm"
      value={value}
      onChange={onChange}
    />
  </div>
);

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [screen, setScreen] = useState<Screen>('choice');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    tradingName: '',
    taxId: '',
    phone: '',
    email: '',
    address: '',
    password: ''
  });

  const handleRegister = async (role: CompanyRole) => {
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const newUser = await apiService.registerCompany(userCredential.user.uid, {
        ...formData,
        role
      });

      onLogin(newUser);

      // Se for banho, o fluxo de onboarding de pagamento deve ser acionado
      if (role === CompanyRole.BANHO) {
        window.location.hash = '#/onboarding';
      }
    } catch (err: any) {
      setError('Erro ao cadastrar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const profile = await apiService.getUserProfile(userCredential.user.uid);
      if (profile) onLogin(profile);
      else setError('Perfil não encontrado no Firestore.');
    } catch (err: any) {
      setError('Credenciais inválidas ou erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">

        {/* ESCOLHA DE PERFIL */}
        {screen === 'choice' && (
          <div className="p-8 md:p-12">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-black tracking-tighter text-slate-900 flex justify-center items-center gap-2 mb-2">
                <span className="bg-amber-500 text-slate-900 px-3 py-1 rounded-xl italic">X</span>
                TAGY
              </h1>
              <p className="text-slate-500">A plataforma definitiva para banho de semijoias.</p>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Selecione seu perfil para começar</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button onClick={() => setScreen('register-banho')} className="group p-8 border-2 border-slate-100 rounded-3xl hover:border-amber-500 hover:bg-amber-50 transition-all text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-industry"></i>
                </div>
                <h3 className="text-xl font-black text-slate-900">Sou Banho</h3>
                <p className="text-xs text-slate-500 mt-2">Prestador de serviço, cataloga peças e gera custos.</p>
              </button>
              <button onClick={() => setScreen('register-cliente')} className="group p-8 border-2 border-slate-100 rounded-3xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-shop"></i>
                </div>
                <h3 className="text-xl font-black text-slate-900">Sou Cliente</h3>
                <p className="text-xs text-slate-500 mt-2">Revendedor, acessa pedidos e precifica peças.</p>
              </button>
            </div>

            <div className="mt-12 text-center">
              <button onClick={() => setScreen('login-form')} className="text-sm font-bold text-slate-400 hover:text-amber-600 transition-colors">
                Já tenho uma conta cadastrada
              </button>
            </div>
          </div>
        )}

        {/* FORMULÁRIOS DE CADASTRO */}
        {(screen === 'register-banho' || screen === 'register-cliente') && (
          <div className="flex flex-col h-[85vh] md:h-auto">

            {/* HEADER FIXO COM BOTÃO VOLTAR */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <button
                onClick={() => setScreen('choice')}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span className="text-sm font-bold">Voltar</span>
              </button>

              <h2 className="text-xl font-black text-slate-900">
                Cadastro: {screen === 'register-banho' ? 'Empresa de Banho' : 'Empresa Cliente'}
              </h2>

              <div className="w-6" />
            </div>

            {/* FORMULÁRIO COM SCROLL */}
            <div className="p-8 overflow-y-auto flex-1 space-y-6">
              {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold">{error}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Razão Social" value={formData.name} onChange={(e: any) => updateField('name', e.target.value)} />
                <InputField label="Nome Fantasia" value={formData.tradingName} onChange={(e: any) => updateField('tradingName', e.target.value)} />
                <InputField label="CNPJ / CPF" value={formData.taxId} onChange={(e: any) => updateField('taxId', e.target.value)} />
                <InputField label="Telefone" value={formData.phone} onChange={(e: any) => updateField('phone', e.target.value)} />
                <div className="md:col-span-2">
                  <InputField label="Endereço Completo" value={formData.address} onChange={(e: any) => updateField('address', e.target.value)} />
                </div>
                <InputField label="E-mail" value={formData.email} onChange={(e: any) => updateField('email', e.target.value)} type="email" />
                <InputField label="Senha" value={formData.password} onChange={(e: any) => updateField('password', e.target.value)} type="password" />
              </div>

              <button
                disabled={loading}
                onClick={() => handleRegister(screen === 'register-banho' ? CompanyRole.BANHO : CompanyRole.CLIENTE)}
                className={`w-full py-4 ${screen === 'register-banho' ? 'bg-amber-500' : 'bg-blue-600 text-white'} rounded-2xl font-black text-lg hover:opacity-90 disabled:opacity-50 transition-all`}
              >
                {loading ? 'Cadastrando...' : 'Concluir Cadastro'}
              </button>
            </div>
          </div>
        )}

        {/* LOGIN */}
        {screen === 'login-form' && (
          <form onSubmit={handleLogin} className="p-12">
            <button type="button" onClick={() => setScreen('choice')} className="text-slate-400 hover:text-slate-900 transition-colors mb-8">
              <i className="fa-solid fa-arrow-left"></i> Voltar
            </button>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-slate-900">Acesse sua conta</h2>
              <p className="text-slate-400">Credenciais corporativas XTAGY.</p>
            </div>
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold mb-4">{error}</div>}
            <div className="space-y-4">
              <InputField label="E-mail" value={formData.email} onChange={(e: any) => updateField('email', e.target.value)} type="email" />
              <InputField label="Senha" value={formData.password} onChange={(e: any) => updateField('password', e.target.value)} type="password" />
              <button
                disabled={loading}
                type="submit"
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg mt-4 disabled:opacity-50"
              >
                {loading ? 'Entrando...' : 'Entrar no Sistema'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default Login;