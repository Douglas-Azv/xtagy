
import React, { useState, useEffect } from 'react';
import { User, CompanyRole, Order, OrderStatus, Company } from '../types';
import { apiService } from '../services/apiService';
import { goldService } from '../services/goldService';
import { Link } from 'react-router-dom';

const OrderList: React.FC<{ user: User }> = ({ user }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [goldPrice, setGoldPrice] = useState(355.20);
  const [camadas, setCamadas] = useState(5);
  const [maoDeObra, setMaoDeObra] = useState(2);
  const [isUpdatingGold, setIsUpdatingGold] = useState(false);
  
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [linkStatus, setLinkStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Fix: Load orders and companies asynchronously in useEffect
  useEffect(() => {
    const loadData = async () => {
      const fetchedOrders = await apiService.getOrdersByCompany(user.companyId, user.companyRole);
      setOrders(fetchedOrders);
      const fetchedCompanies = await apiService.getCompanies();
      setCompanies(fetchedCompanies);
    };
    loadData();
  }, [user.companyId, user.companyRole]);

  const clients = companies.filter(c => c.role === CompanyRole.CLIENTE);

  const handleUpdateGoldPrice = async () => {
    setIsUpdatingGold(true);
    const quote = await goldService.getCurrentPrice();
    setGoldPrice(quote.price);
    setIsUpdatingGold(false);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    // Fix: Await order creation
    const newOrder = await apiService.createOrder({
      banhoCompanyId: user.companyId,
      clienteCompanyId: selectedClient || null,
      goldPrice: goldPrice,
      camadas: camadas,
      mao_de_obra: maoDeObra,
      defaultMargin: 2.5
    });

    setOrders([newOrder, ...orders]);
    setShowNewOrderModal(false);
  };

  const handleLinkByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    // Fix: Await linking order
    const result = await apiService.linkOrderToClient(accessCodeInput.toUpperCase(), user.companyId);
    if (result) {
      setLinkStatus({ type: 'success', message: 'Lote vinculado com sucesso!' });
      const updatedOrders = await apiService.getOrdersByCompany(user.companyId, user.companyRole);
      setOrders(updatedOrders);
      setAccessCodeInput('');
      setTimeout(() => setLinkStatus(null), 3000);
    } else {
      setLinkStatus({ type: 'error', message: 'Código inválido ou expirado.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Seus Lotes</h1>
          <p className="text-slate-500">
            {user.companyRole === CompanyRole.BANHO 
              ? 'Gerencie ordens de serviço e compartilhe códigos com clientes.' 
              : 'Acesse seus pedidos vinculados via código de acesso.'}
          </p>
        </div>
        {user.companyRole === CompanyRole.BANHO && (
          <button 
            onClick={() => setShowNewOrderModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 py-3 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
          >
            <i className="fa-solid fa-plus"></i> Novo Lote
          </button>
        )}
      </div>

      {user.companyRole === CompanyRole.CLIENTE && (
        <div className="bg-white p-8 rounded-3xl border border-blue-100 shadow-sm shadow-blue-50">
          <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-key text-blue-500"></i>
            Vincular novo lote por código
          </h3>
          <form onSubmit={handleLinkByCode} className="flex flex-col sm:flex-row gap-3">
            <input 
              className="flex-grow px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xl tracking-widest focus:ring-2 focus:ring-blue-500 outline-none uppercase"
              placeholder="CÓDIGO DO LOTE (Ex: X7K2L9)"
              value={accessCodeInput}
              onChange={(e) => setAccessCodeInput(e.target.value)}
            />
            <button type="submit" className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-colors">
              Acessar Lote
            </button>
          </form>
          {linkStatus && (
            <p className={`mt-3 text-sm font-bold flex items-center gap-2 ${linkStatus.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
              <i className={`fa-solid ${linkStatus.type === 'success' ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
              {linkStatus.message}
            </p>
          )}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lote</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entidade Vinculada</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ouro/g</th>
                {user.companyRole === CompanyRole.BANHO && (
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Código Acesso</th>
                )}
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map(order => {
                // Fix: Lookup company details from local state instead of calling async methods in render
                const client = companies.find(c => c.id === order.clienteCompanyId);
                const banho = companies.find(c => c.id === order.banhoCompanyId);
                return (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-900">#{order.id.slice(1, 8)}</p>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                        order.status === OrderStatus.FINISHED ? 'bg-emerald-100 text-emerald-700' : 
                        order.status === OrderStatus.PROCESSING ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-slate-700 font-bold">{user.companyRole === CompanyRole.BANHO ? (client?.tradingName || 'Nenhum cliente') : banho?.tradingName}</p>
                      <p className="text-xs text-slate-400">{user.companyRole === CompanyRole.BANHO ? client?.email : banho?.email}</p>
                    </td>
                    <td className="px-6 py-5 text-slate-500 text-sm font-medium">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-5 text-slate-900 font-black">R$ {order.goldPrice.toFixed(2)}</td>
                    {user.companyRole === CompanyRole.BANHO && (
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                           <code className="bg-amber-100 text-amber-800 px-3 py-1 rounded-lg font-black text-sm">{order.accessCode}</code>
                           <button 
                            onClick={() => navigator.clipboard.writeText(order.accessCode)}
                            className="text-slate-300 hover:text-amber-600 transition-colors"
                            title="Copiar código"
                          >
                            <i className="fa-solid fa-copy"></i>
                          </button>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-5 text-right">
                      <Link to={`/order/${order.id}`} className="bg-slate-100 text-slate-700 font-black text-xs px-4 py-2 rounded-xl group-hover:bg-amber-500 group-hover:text-slate-900 transition-all uppercase tracking-widest">
                        Abrir Lote
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic font-medium">
                    Nenhum lote encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showNewOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Novo Lote</h3>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Abertura de ordem de serviço</p>
              </div>
              <button onClick={() => setShowNewOrderModal(false)} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleCreateOrder} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Vincular Cliente (Opcional)</label>
                <select 
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all shadow-sm font-bold text-slate-900"
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                >
                  <option value="">Apenas gerar código (Vincular depois)</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.tradingName || c.name}</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cotação Ouro (g)</label>
                    <button 
                      type="button"
                      onClick={handleUpdateGoldPrice}
                      className="text-[10px] text-amber-600 font-black uppercase hover:underline flex items-center gap-1"
                      disabled={isUpdatingGold}
                    >
                      {isUpdatingGold ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-rotate"></i>}
                      Buscador IA
                    </button>
                  </div>
                  <input 
                    type="number" step="0.01" 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all shadow-sm font-black text-xl text-slate-900"
                    value={goldPrice}
                    onChange={(e) => setGoldPrice(parseFloat(e.target.value))}
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Milésimos (Camadas)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all shadow-sm font-bold text-slate-900"
                    value={camadas}
                    onChange={(e) => setCamadas(parseInt(e.target.value))}
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Mão de Obra (mil.)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all shadow-sm font-bold text-slate-900"
                    value={maoDeObra}
                    onChange={(e) => setMaoDeObra(parseInt(e.target.value))}
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl mt-4 hover:bg-slate-800 transition-colors shadow-xl shadow-slate-200 flex items-center justify-center gap-2 text-lg">
                Gerar Lote e Código
                <i className="fa-solid fa-key"></i>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;
