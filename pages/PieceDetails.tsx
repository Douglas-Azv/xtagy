import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Piece, Order, LabelLayout, LabelSnapshot, EventType } from '../types';
import { apiService } from '../services/apiService';
import { analyticsService } from '../services/analyticsService';
import { QRCodeSVG } from 'qrcode.react';

// Componente de etiqueta (usado na visualização de impressão)
const LabelComponent: React.FC<{ piece: Piece, layout: LabelLayout }> = ({ piece, layout }) => {
  const qrUrl = `${window.location.origin}${window.location.pathname}#/piece/${piece.id}`;

  const containerClasses: Record<LabelLayout, string> = {
    [LabelLayout.A4]: "w-[210px] h-[140px] border border-slate-300 p-4 bg-white flex flex-col justify-between mb-4 relative",
    [LabelLayout.COMPACT]: "w-[150px] h-[100px] border border-slate-300 p-3 bg-white flex flex-col justify-between mb-2 relative",
    [LabelLayout.THERMAL]: "w-[180px] h-[280px] border border-slate-300 p-4 bg-white flex flex-col justify-between mb-4 relative"
  };

  return (
    <div className={containerClasses[layout]}>
      {/* QR Code */}
      <div className="absolute top-2 right-2">
        <QRCodeSVG value={qrUrl} size={50} />
      </div>

      <div className="flex flex-col h-full justify-between">
        <div>
          <p className="text-[10px] font-black">XTAGY</p>
          <p className="text-[8px] uppercase">{piece.type}</p>
          <p className="text-[10px] font-bold">{piece.internalCode.slice(0, 6)}</p>
        </div>

        <div className="text-xs space-y-1">
          <div>Peso: {piece.peso_peca}g</div>
          <div>Valor Bruto: R$ {piece.valor_peca_bruta.toFixed(2)}</div>
          {piece.camadas !== undefined && <div>Camadas: {piece.camadas}</div>}
          {piece.mao_de_obra !== undefined && <div>Mão de obra: {piece.mao_de_obra}</div>}
          <div>Ouro: R$ {piece.cotacao_ouro_dia.toFixed(2)}/g</div>
        </div>

        <div className="mt-2 font-bold text-base text-amber-600">
          Total: R$ {piece.custo_final_cliente.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

// Detalhes da peça
const PieceDetails: React.FC<{ user: User }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const [piece, setPiece] = useState<Piece | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [localMargin, setLocalMargin] = useState(2.5);
  const [loading, setLoading] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState<LabelLayout>(LabelLayout.A4);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const loadData = async () => {
      try {
        const fetchedPiece = await apiService.getPieceById(id);
        setPiece(fetchedPiece || null);

        if (fetchedPiece) {
          const fetchedOrder = await apiService.getOrderById(fetchedPiece.orderId);
          setOrder(fetchedOrder || null);
          if (fetchedOrder) setLocalMargin(fetchedOrder.defaultMargin);
        }
      } catch (err) {
        console.error('Erro ao carregar a peça:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Impressão individual
  const handlePrint = () => {
    if (!piece) return;

    const sizeStyles: Record<LabelLayout, { w: number; h: number; qr: number }> = {
      [LabelLayout.A4]: { w: 210, h: 140, qr: 50 },
      [LabelLayout.COMPACT]: { w: 150, h: 100, qr: 40 },
      [LabelLayout.THERMAL]: { w: 180, h: 280, qr: 50 }
    };
    const { w, h, qr } = sizeStyles[selectedLayout];

    const html = `
      <html>
        <head>
          <title>Etiqueta ${piece.internalCode}</title>
          <style>
            body { font-family: sans-serif; margin: 10px; }
            .label { position: relative; border: 1px solid #ccc; padding: 8px; background: #fff; width: ${w}px; height: ${h}px; display: flex; flex-direction: column; justify-content: space-between; }
            .qrcode { position: absolute; top: 4px; right: 4px; }
            .total { font-weight: bold; color: #d97706; font-size: 1.1em; }
            .info { font-size: 0.75em; }
            .internalCode { font-size: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="label">
            <div>
              <p><strong>XTAGY</strong></p>
              <p>${piece.type}</p>
              <p class="internalCode">${piece.internalCode.slice(0, 6)}</p>
            </div>
            <div class="info">
              <div>Peso: ${piece.peso_peca}g</div>
              <div>Valor Bruto: R$ ${piece.valor_peca_bruta.toFixed(2)}</div>
              ${piece.camadas !== undefined ? `<div>Camadas: ${piece.camadas}</div>` : ''}
              ${piece.mao_de_obra !== undefined ? `<div>Mão de obra: ${piece.mao_de_obra}</div>` : ''}
              <div>Ouro: R$ ${piece.cotacao_ouro_dia.toFixed(2)}/g</div>
            </div>
            <div class="total">Total: R$ ${piece.custo_final_cliente.toFixed(2)}</div>
            <div class="qrcode">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=${qr}x${qr}&data=${encodeURIComponent(window.location.origin + '/#/piece/' + piece.id)}" alt="QR Code" />
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();

    // Salvar snapshot no piece
    const snapshot: LabelSnapshot = {
      layout: selectedLayout,
      generatedAt: new Date().toISOString(),
      internalCode: piece.internalCode,
      peso: piece.peso_peca,
      valorBruto: piece.valor_peca_bruta,
      camadas: piece.camadas,
      maoDeObra: piece.mao_de_obra,
      cotacaoOuro: piece.cotacao_ouro_dia,
      custoFinal: piece.custo_final_cliente
    };
    apiService.updatePiece(piece.id, { label: snapshot });
    analyticsService.logEvent(EventType.LABEL_PRINTED, user.companyId, user.companyRole, piece.id, { layout: selectedLayout });

    setShowPrintModal(false);
  };

  if (loading) return <div className="p-8 text-center">Carregando detalhes da peça...</div>;
  if (!piece) return <div className="p-8 text-center">Peça não encontrada.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Botão voltar */}
      <div className="no-print">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-900 font-bold flex items-center gap-2 mb-4 transition-colors">
          <i className="fa-solid fa-arrow-left"></i> Voltar para o lote
        </button>
      </div>

      {/* Conteúdo principal */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col md:flex-row no-print">
        <div className="md:w-1/2 p-4">
          <div className="aspect-square rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 mb-4">
            <img src={piece.photo} alt={piece.type} className="w-full h-full object-cover" />
          </div>

          {/* QR Code */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
            <div className="w-20 h-20 bg-white border border-slate-200 rounded-2xl p-2 flex items-center justify-center">
              <QRCodeSVG value={`${window.location.origin}${window.location.pathname}#/piece/${piece.id}`} size={64} level="M" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Código Único XTAGY</p>
              <p className="text-xl font-black text-slate-900">#{piece.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-xs font-bold text-amber-600 mt-1 uppercase">Identidade Verificada</p>
            </div>
          </div>
        </div>

        {/* Dados da peça e botões */}
        <div className="md:w-1/2 p-8 flex flex-col space-y-6">
          <header className="flex justify-between items-start">
            <div>
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded-full tracking-widest mb-2">
                {piece.type}
              </span>
              <h1 className="text-4xl font-black text-slate-900">{piece.internalCode}</h1>
            </div>
            <button
              onClick={() => setShowPrintModal(true)}
              className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-all shadow-lg active:scale-95"
              title="Imprimir Etiqueta"
            >
              <i className="fa-solid fa-print"></i>
            </button>
          </header>

          {/* Blocos de preço e cálculo */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 border-t border-slate-100 pt-2 w-full">
            <div className="text-[7px] text-slate-400 font-bold uppercase">Peso Bruto: <span className="text-slate-900">{piece.peso_peca}g</span></div>
            <div className="text-[7px] text-slate-400 font-bold uppercase">Bruto: <span className="text-slate-900">R${piece.valor_peca_bruta.toFixed(2)}</span></div>
            <div className="text-[7px] text-slate-400 font-bold uppercase">Camada: <span className="text-slate-900">{piece.camadas}</span></div>
            <div className="text-[7px] text-slate-400 font-bold uppercase">M. Obra: <span className="text-slate-900">{piece.mao_de_obra}</span></div>
            <div className="col-span-2 text-[7px] text-slate-400 font-bold uppercase">Ouro: <span className="text-slate-900">R${piece.cotacao_ouro_dia.toFixed(2)}/g</span></div>
          </div>

          <div className="mt-2 pt-2 border-t-2 border-slate-900 w-full flex justify-between items-end">
            <div>
              <p className="text-[6px] font-black text-slate-400 uppercase">Custo Final</p>
              <p className="text-[16px] font-black text-slate-900 leading-none">R$ {piece.custo_final_cliente.toFixed(2)}</p>
            </div>
            <p className="text-[5px] text-slate-300 italic">#{piece.id.slice(0, 6)}</p>
          </div>
        </div>
      </div>

      {/* Modal de impressão */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white p-6 rounded-3xl w-full max-w-lg space-y-6">
            <h2 className="text-xl font-black">Confirme impressão</h2>
            <select
              value={selectedLayout}
              onChange={(e) => setSelectedLayout(e.target.value as LabelLayout)}
              className="border rounded px-2 py-1 w-full text-sm"
            >
              <option value={LabelLayout.A4}>A4</option>
              <option value={LabelLayout.COMPACT}>Compacta</option>
              <option value={LabelLayout.THERMAL}>Térmica</option>
            </select>

            <button
              onClick={handlePrint}
              className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-3"
            >
              Confirmar e imprimir <i className="fa-solid fa-print"></i>
            </button>

            <button
              onClick={() => setShowPrintModal(false)}
              className="py-3 w-full text-sm border rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Visualização da impressão (para preview, igual OrderDetails) */}
      <div className="print-only hidden">
        <LabelComponent piece={piece} layout={selectedLayout} />
      </div>
    </div>
  );
};

export default PieceDetails;