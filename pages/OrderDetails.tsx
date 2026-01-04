import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { apiService } from '../services/apiService';
import { Order, Piece, LabelData } from '../types';

const OrderDetails: React.FC = () => {
  const { id: orderId } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrint, setShowPrint] = useState(false);
  const [printLabels, setPrintLabels] = useState<LabelData[]>([]);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) return;
      setLoading(true);
      try {
        const fetchedOrder = await apiService.getOrderById(orderId);
        if (!fetchedOrder) {
          setOrder(null);
          setPieces([]);
          return;
        }
        setOrder(fetchedOrder);

        const fetchedPieces = await apiService.getPiecesByOrder(fetchedOrder.id);
        setPieces(fetchedPieces || []);
      } catch (err) {
        console.error('Erro ao carregar pedido', err);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  if (loading) return <p className="text-center mt-10">Carregando pedido...</p>;
  if (!order) return <p className="text-center mt-10 text-red-500">Pedido não encontrado.</p>;

  const handlePrint = () => {
    if (pieces.length === 0) return;

    const labels: LabelData[] = pieces.map((piece) => ({
      title: `Peça #${piece.internalCode || piece.id.slice(0, 6)}`,
      description: `
        Peso: ${piece.peso_peca} g | Valor Bruto: R$ ${piece.valor_peca_bruta.toFixed(2)}
        | Camadas: ${piece.camadas} | Mão de obra: ${piece.mao_de_obra}
        | Preço Final: R$ ${piece.custo_final_cliente.toFixed(2)}
      `,
      extraInfo: piece.id, // vamos usar o QRCodeSVG na renderização de impressão
    }));

    setPrintLabels(labels);
    setShowPrint(true);
  };

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900">Detalhes do Lote #{order.id.slice(0, 8)}</h1>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <p><strong>Status:</strong> {order.status}</p>
        <p><strong>Cliente:</strong> {order.clienteCompanyId}</p>
        <p><strong>Banho:</strong> {order.banhoCompanyId}</p>
        <p><strong>Código de Acesso:</strong> {order.accessCode}</p>
        <p><strong>Cotação Ouro (g):</strong> R$ {order.goldPrice.toFixed(2)}</p>
        <p><strong>Camadas:</strong> {order.camadas}</p>
        <p><strong>Mão de Obra:</strong> {order.mao_de_obra}</p>
        <p><strong>Data de Criação:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Peças do Lote</h2>
        {pieces.length > 0 && (
          <button
            onClick={handlePrint}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl transition-colors"
          >
            Imprimir Etiquetas
          </button>
        )}
      </div>

      {pieces.length > 0 ? (
        <div className="space-y-4">
          {pieces.map(piece => (
            <div key={piece.id} className="border border-slate-300 rounded-xl p-4 flex justify-between items-center bg-white shadow-sm">
              <div className="flex flex-col gap-1">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Peça #{piece.internalCode || piece.id.slice(0, 6)}</p>
                <p className="text-sm text-slate-700">Peso: <span className="font-black">{piece.peso_peca} g</span></p>
                <p className="text-sm text-slate-700">Valor Bruto: <span className="font-black">R$ {piece.valor_peca_bruta.toFixed(2)}</span></p>
                <p className="text-sm text-slate-700">Camadas: <span className="font-black">{piece.camadas}</span></p>
                <p className="text-sm text-slate-700">Mão de obra: <span className="font-black">{piece.mao_de_obra}</span></p>
                <p className="text-lg text-amber-600 font-extrabold">Preço Final: R$ {piece.custo_final_cliente.toFixed(2)}</p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <QRCodeSVG value={piece.id} size={80} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500 italic mt-4">Nenhuma peça cadastrada para este lote.</p>
      )}

      {/* Impressão */}
      {showPrint && (
        <div id="print-root" className="hidden">
          {printLabels.map((label, idx) => (
            <div key={idx} className="label mb-4 p-2 border border-slate-300">
              <p><strong>{label.title}</strong></p>
              <p>{label.description}</p>
              <QRCodeSVG value={label.extraInfo || ''} size={80} />
            </div>
          ))}
        </div>
      )}

      {showPrint && setTimeout(() => {
        const printRoot = document.getElementById('print-root');
        if (!printRoot) return;
        printRoot.classList.add('active');
        window.print();
        printRoot.classList.remove('active');
        setShowPrint(false);
      }, 200)}
    </div>
  );
};

export default OrderDetails;