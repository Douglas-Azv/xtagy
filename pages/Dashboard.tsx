import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  CompanyRole,
  OrderStatus,
  Order,
  Piece,
  StripeTestPayment,
  SubscriptionStatus
} from '../types';

import { apiService } from '../services/apiService';
import { analyticsService } from '../services/analyticsService';
import { goldService, GoldQuote } from '../services/goldService';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

/* -------------------- COMPONENTES AUXILIARES -------------------- */

const StatCard = ({
  title,
  value,
  icon,
  color
}: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white text-xl`}>
        <i className={`fa-solid ${icon}`} />
      </div>
    </div>
    <p className="text-slate-500 text-sm font-medium">{title}</p>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </div>
);

const PaymentGate = ({
  onPay,
  onSkip,
  isProcessing
}: {
  onPay: () => void;
  onSkip: () => void;
  isProcessing: boolean;
}) => (
  <div className="fixed inset-0 bg-slate-900/90 z-[9999] flex items-center justify-center">
    <div className="bg-white max-w-md w-full rounded-2xl p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Ative seu Banho</h2>
      <p className="text-slate-500 mb-6">
        Para acessar todas as funcionalidades, é necessário ativar a licença.
      </p>

      <button
        onClick={onPay}
        disabled={isProcessing}
        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold mb-3"
      >
        {isProcessing ? 'Processando...' : 'Testar Pagamento'}
      </button>

      <button
        onClick={onSkip}
        disabled={isProcessing}
        className="w-full border py-3 rounded-xl text-slate-500"
      >
        Pular por enquanto
      </button>
    </div>
  </div>
);

/* -------------------- DASHBOARD -------------------- */

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [goldQuote, setGoldQuote] = useState<GoldQuote | null>(null);
  const [loadingGold, setLoadingGold] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showPaymentGate, setShowPaymentGate] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const navigate = useNavigate();

  const stats = analyticsService.calculateStats(orders, pieces);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingStats(true);

      const company = await apiService.getCompanyById(user.companyId);

      if (
        user.companyRole === CompanyRole.BANHO &&
        company?.subscription?.status === SubscriptionStatus.PAYMENT_PENDING
      ) {
        navigate('/onboarding');
        return;
      }

      const fetchedOrders = await apiService.getOrdersByCompany(
        user.companyId,
        user.companyRole
      );
      setOrders(fetchedOrders);

      const piecesArrays = await Promise.all(
        fetchedOrders.map(o => apiService.getPiecesByOrder(o.id))
      );
      setPieces(piecesArrays.flat());

      const quote = await goldService.getCurrentPrice();
      setGoldQuote(quote);
      setLoadingGold(false);
      setLoadingStats(false);
    };

    fetchData();
  }, [user, navigate]);

  const chartData = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(
    (day, idx) => ({
      name: day,
      volume: orders.filter(
        o => new Date(o.createdAt).getDay() === idx
      ).length
    })
  );

  return (
    <div className="space-y-8">
      {showPaymentGate && (
        <PaymentGate
          onPay={async () => {
            setProcessingPayment(true);
            await new Promise(r => setTimeout(r, 2000));
            setShowPaymentGate(false);
            setProcessingPayment(false);
          }}
          onSkip={() => setShowPaymentGate(false)}
          isProcessing={processingPayment}
        />
      )}

      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Olá, {user.name}</h1>
          <p className="text-slate-500">Gestão operacional</p>
        </div>

        <div className="bg-white p-4 rounded-xl border flex items-center gap-3">
          <i className="fa-solid fa-coins text-amber-600" />
          <div>
            <p className="text-xs text-slate-500">Ouro (g)</p>
            <p className="font-bold">
              {loadingGold ? '...' : `R$ ${goldQuote?.price.toFixed(2)}`}
            </p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Pedidos" value={stats.totalOrders} icon="fa-box" color="bg-blue-600" />
        <StatCard title="Peças" value={stats.totalPieces} icon="fa-gem" color="bg-emerald-600" />
        <StatCard title="Peso Médio" value={stats.avgWeight.toFixed(1)} icon="fa-weight-hanging" color="bg-slate-600" />
        <StatCard title="Coletas" value={stats.waitingCollection} icon="fa-truck" color="bg-amber-600" />
      </section>

      <div className="bg-white p-6 rounded-2xl border">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="volume" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-2xl border">
        <h3 className="font-bold mb-4">Últimos Lotes</h3>
        {orders.slice(0, 5).map(o => (
          <Link key={o.id} to={`/order/${o.id}`} className="block py-2 border-b">
            Lote #{o.id.slice(1, 6)} — {new Date(o.createdAt).toLocaleDateString()}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;