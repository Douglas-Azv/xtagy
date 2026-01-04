
import React, { useState, useEffect } from 'react';
import { User, Company, SubscriptionStatus, StripeTestPayment } from '../types';
import { apiService } from '../services/apiService';

const Billing: React.FC<{ user: User }> = ({ user }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Escuta em tempo real as mudanças no documento da empresa
    const unsubscribe = apiService.subscribeToCompany(user.companyId, (updatedCompany) => {
      setCompany(updatedCompany);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.companyId]);

  const handleActivate = async () => {
    setIsProcessing(true);
    // Simulação ou redirecionamento para onboarding de pagamento real
    window.location.hash = '#/onboarding';
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
    </div>
  );

  const status = company?.subscription?.status;
  const billing = company?.billingStatus;

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Faturamento</h1>
          <p className="text-slate-500">Gerencie sua assinatura e visualize recibos digitais.</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID da Empresa</p>
          <p className="text-xs font-mono text-slate-400">{user.companyId}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex justify-between items-start mb-10">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status do Plano</p>
                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase inline-flex items-center gap-2 ${
                  status === SubscriptionStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700' :
                  status === SubscriptionStatus.TRIAL ? 'bg-blue-100 text-blue-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full animate-pulse ${status === SubscriptionStatus.ACTIVE ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  {status === SubscriptionStatus.ACTIVE ? 'Conta Ativada' : status === SubscriptionStatus.TRIAL ? 'Período Trial' : 'Aguardando Ativação'}
                </span>
              </div>
              <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-2xl text-slate-400">
                <i className="fa-solid fa-gem"></i>
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Assinatura Plenitude</h3>
              <p className="text-slate-500 font-medium">Controle total de banho e custos.</p>
              <p className="text-3xl font-black text-slate-900 mt-4">R$ 199,90<span className="text-sm font-medium text-slate-400">/mês</span></p>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-100">
            {status !== SubscriptionStatus.ACTIVE ? (
              <button 
                onClick={handleActivate}
                disabled={isProcessing}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200 active:scale-95"
              >
                {isProcessing ? <i className="fa-solid fa-circle-notch animate-spin"></i> : (
                  <>
                    Ativar Assinatura
                    <i className="fa-solid fa-arrow-right text-sm"></i>
                  </>
                )}
              </button>
            ) : (
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                   <i className="fa-solid fa-check-double"></i>
                </div>
                <div>
                   <p className="text-xs font-black text-emerald-800 uppercase tracking-wide leading-none mb-1">Pagamento Confirmado</p>
                   <p className="text-[10px] text-emerald-600 font-bold">Próximo ciclo em 30 dias.</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-1/2 -translate-y-1/2 -z-0 opacity-50"></div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
           <div className="relative z-10">
             <h3 className="text-xl font-black mb-6 flex items-center gap-2">
               <i className="fa-solid fa-receipt text-slate-500"></i>
               Recibo da Transação
             </h3>
             
             <div className="space-y-6">
                {billing || company?.stripeTestPayment ? (
                  <div className="space-y-4">
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Detalhes Stripe</p>
                        <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded font-black uppercase">Sucesso</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">ID Pagamento:</span>
                          <span className="font-mono text-xs text-slate-300">{(billing?.paymentIntentId || company?.stripeTestPayment?.paymentIntentId)?.slice(0, 18)}...</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Data do Processamento:</span>
                          <span className="text-slate-300 font-bold">{new Date(billing?.paidAt || company?.stripeTestPayment?.paidAt || "").toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-white/5 pt-3">
                          <span className="text-slate-500">Valor Cobrado:</span>
                          <span className="text-emerald-400 font-black">R$ 199,90</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-slate-500 text-center uppercase font-black tracking-widest leading-relaxed">
                      Sua conta está operando sob o ambiente <br/>
                      <span className="text-amber-500 font-black text-xs">Verified B2B Infrastructure</span>
                    </p>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600 text-2xl">
                      <i className="fa-solid fa-ghost"></i>
                    </div>
                    <p className="text-slate-500 font-bold text-sm">Nenhum histórico disponível.</p>
                    <p className="text-[10px] text-slate-600 uppercase mt-2">Ative seu plano para começar.</p>
                  </div>
                )}
             </div>
           </div>
           
           <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row items-center gap-6">
         <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-xl shrink-0">
            <i className="fa-solid fa-shield-halved"></i>
         </div>
         <div className="grow">
            <h4 className="font-black text-slate-900">Segurança de Dados Financeiros</h4>
            <p className="text-sm text-slate-500">O XTAGY não armazena dados de cartão. Todo o processamento é feito via Stripe, líder mundial em pagamentos seguros.</p>
         </div>
         <div className="flex items-center gap-4 grayscale opacity-50">
            <i className="fa-brands fa-cc-visa text-3xl"></i>
            <i className="fa-brands fa-cc-mastercard text-3xl"></i>
            <i className="fa-brands fa-stripe text-4xl"></i>
         </div>
      </div>
    </div>
  );
};

export default Billing;
