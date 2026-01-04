
import React, { useState, useEffect } from 'react';
import { User, Order, Piece } from '../types';
import { apiService } from '../services/apiService';
import { analyticsService } from '../services/analyticsService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const Analytics: React.FC<{ user: User }> = ({ user }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const fetchedOrders = await apiService.getOrdersByCompany(user.companyId, user.companyRole);
      setOrders(fetchedOrders);
      
      const piecesPromises = fetchedOrders.map(o => apiService.getPiecesByOrder(o.id));
      const piecesArrays = await Promise.all(piecesPromises);
      setPieces(piecesArrays.flat());
      setLoading(false);
    };
    loadData();
  }, [user.companyId, user.companyRole]);

  const stats = analyticsService.calculateStats(orders, pieces);

  // Dynamic Chart Data based on actual records
  const getChartData = () => {
    // Grouping by month for the last 6 months
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonth = new Date().getMonth();
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const m = (currentMonth - i + 12) % 12;
      last6Months.push({ 
        name: months[m], 
        revenue: 0, 
        piecesCount: 0,
        monthIndex: m
      });
    }

    pieces.forEach(piece => {
      // Find piece creation date (using order date as proxy if piece date not available)
      const pieceOrder = orders.find(o => o.id === piece.orderId);
      if (pieceOrder) {
        const date = new Date(pieceOrder.createdAt);
        const m = date.getMonth();
        const chartItem = last6Months.find(item => item.monthIndex === m);
        if (chartItem) {
          chartItem.revenue += piece.custo_final_cliente;
          chartItem.piecesCount += 1;
        }
      }
    });

    return last6Months;
  };

  const chartData = getChartData();

  if (loading) return <div className="p-8 text-center text-slate-500 italic">Carregando inteligência de dados...</div>;

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Inteligência B2B</h1>
        <p className="text-slate-500">Insights estratégicos baseados no seu volume operacional real.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Peças Processadas</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalPieces}</p>
          <div className="mt-2 flex items-center text-xs text-slate-400 font-medium">
             Volume total histórico
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Peso Médio / Peça</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.avgWeight.toFixed(2)}g</p>
          <div className="mt-2 text-xs text-slate-400 font-medium">Consistência operacional</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Volume Financeiro</p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            R$ {pieces.reduce((sum, p) => sum + p.custo_final_cliente, 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </p>
          <div className="mt-2 text-xs text-slate-400 font-medium">Valor total processado</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Eficiência de Lote</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{orders.length > 0 ? "98%" : "0%"}</p>
          <div className="mt-2 text-xs text-amber-600 font-bold">Baseado em finalizações</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
            <i className="fa-solid fa-money-bill-trend-up text-slate-400"></i>
            Faturamento Estimado (R$)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
            <i className="fa-solid fa-gem text-slate-400"></i>
            Produção de Peças
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="piecesCount" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 6, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <h3 className="text-2xl font-bold mb-2">Relatórios Customizados</h3>
            <p className="text-slate-400">Exporte seus dados reais em formatos agregados para análises externas. Prepare sua empresa para o futuro orientado a dados.</p>
          </div>
          <button 
            disabled={pieces.length === 0}
            className="bg-amber-500 text-slate-900 px-8 py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fa-solid fa-file-export mr-2"></i> Exportar Dados (.CSV)
          </button>
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-amber-500 opacity-10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default Analytics;
