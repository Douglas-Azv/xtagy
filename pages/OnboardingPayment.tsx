
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, SubscriptionStatus } from '../types';
import { apiService } from '../services/apiService';
import { functions } from '../services/firebase';
import { httpsCallable } from 'firebase/functions';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_51SjOPoIqS3rkEYsqAmePS6KgecxCM4oGHbYnSFAtOpQ6CB5C16tWYwL3etozpFDUegUurVJ76vGQEh0bEM7HV42f009ZHf5fQo');

const CheckoutForm = ({ user, onSkip }: { user: User, onSkip: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/#/dashboard?payment=success`,
      },
    });

    if (error) {
      setErrorMessage(error.message || "Erro no processamento do pagamento.");
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        window.location.hash = '#/dashboard';
      }, 2000);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12 animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg">
          <i className="fa-solid fa-check"></i>
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">Sucesso!</h3>
        <p className="text-slate-500 mb-8">Sua conta foi ativada. Redirecionando...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
        <PaymentElement />
      </div>
      
      {errorMessage && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
          {errorMessage}
        </div>
      )}

      <button 
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {loading ? <i className="fa-solid fa-circle-notch animate-spin text-2xl"></i> : "Ativar Assinatura"}
      </button>

      <button 
        type="button"
        onClick={onSkip}
        disabled={loading}
        className="w-full py-4 text-slate-400 hover:text-slate-600 font-black text-sm transition-all"
      >
        Pular por enquanto (Modo Trial)
      </button>
    </form>
  );
};

const OnboardingPayment: React.FC<{ user: User }> = ({ user }) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSecret = async () => {
      try {
        console.log("[XTAGY] Solicitando Intent de Pagamento...");
        const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
        
        const response = await createPaymentIntent({ 
          amount: 199.90, 
          companyId: user.companyId 
        });
        
        const data = response.data as any;
        if(data?.clientSecret) {
            console.log("[XTAGY] Intent recebido com sucesso.");
            setClientSecret(data.clientSecret);
        } else {
            console.warn("[XTAGY] Resposta da função sem clientSecret", data);
            setErrorDetails("Resposta inválida do servidor de pagamento.");
        }
      } catch (e: any) {
        console.error("[XTAGY] Erro ao chamar Cloud Function:", e);
        // Exibe detalhes específicos para o desenvolvedor
        const message = e.message || e.toString();
        setErrorDetails(message.includes("internal") 
          ? "Erro Interno: Verifique se o Firebase está no Plano Blaze e se a Cloud Function está implantada." 
          : message);
      }
    };
    fetchSecret();
  }, [user.companyId]);

  const handleSkip = async () => {
    try {
      await apiService.updateSubscriptionStatus(user.companyId, SubscriptionStatus.TRIAL);
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-100">
        <div className="md:w-1/2 bg-slate-900 p-12 text-white flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tighter mb-4 italic">XTAGY</h1>
            <p className="text-slate-400 font-medium mb-8">Plano Plenitude B2B</p>
            <h2 className="text-5xl font-black">R$ 199,90</h2>
            <p className="text-slate-500 text-sm mt-2">Assinatura Mensal</p>
          </div>
          <div className="space-y-4">
             <div className="flex items-center gap-3 text-sm text-slate-300">
               <i className="fa-solid fa-check text-amber-500"></i> Gestão Completa de Lotes
             </div>
             <div className="flex items-center gap-3 text-sm text-slate-300">
               <i className="fa-solid fa-check text-amber-500"></i> IA de Catalogação
             </div>
          </div>
        </div>

        <div className="md:w-1/2 p-12 bg-white">
          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
              <CheckoutForm user={user} onSkip={handleSkip} />
            </Elements>
          ) : (
            <div className="text-center py-12">
               {errorDetails ? (
                 <div className="animate-in fade-in slide-in-from-top-4">
                   <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                      <i className="fa-solid fa-triangle-exclamation"></i>
                   </div>
                   <h3 className="text-slate-900 font-black mb-2 uppercase tracking-tighter">Falha na Comunicação</h3>
                   <p className="text-slate-500 text-xs mb-6 italic px-4 leading-relaxed">
                     {errorDetails}
                   </p>
                   <button onClick={handleSkip} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold mb-4 hover:bg-slate-200 transition-colors">Acessar em modo Trial</button>
                   <button onClick={() => window.location.reload()} className="text-amber-600 font-black text-xs uppercase hover:underline">Tentar Novamente</button>
                 </div>
               ) : (
                 <div className="space-y-4">
                   <div className="w-12 h-12 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin mx-auto"></div>
                   <p className="text-slate-400 font-bold text-sm">Iniciando checkout seguro...</p>
                   <p className="text-[10px] text-slate-300 uppercase tracking-widest font-black">Conectando ao Stripe</p>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPayment;
