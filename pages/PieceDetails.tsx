import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import { User, Piece, Order, LabelLayout, LabelSnapshot, EventType } from '../types';
import { apiService } from '../services/apiService';
import { analyticsService } from '../services/analyticsService';
import { QRCodeSVG } from 'qrcode.react';

/* =========================================================
   COMPONENTE DA ETIQUETA (MODELO ANTIGO – PRESERVADO)
========================================================= */
const LabelComponent: React.FC<{ piece: Piece; layout: LabelLayout }> = ({ piece, layout }) => {
  const qrUrl = `${window.location.origin}/#/piece/${piece.id}`;

  const containerClasses: Record<LabelLayout, string> = {
    [LabelLayout.A4]:
      'w-[210px] h-[140px] border border-slate-300 p-3 bg-white flex flex-col justify-between',
    [LabelLayout.COMPACT]:
      'w-[150px] h-[100px] border border-slate-300 p-2 bg-white flex flex-col justify-between',
    [LabelLayout.THERMAL]:
      'w-[180px] h-[280px] border border-slate-300 p-4 bg-white flex flex-col justify-between',
  };

  return (
    <div className={containerClasses[layout]}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-black">XTAGY</p>
          <p className="text-[8px] uppercase">{piece.type}</p>
          <p className="text-[10px] font-bold">{piece.internalCode.slice(0, 6)}</p>
        </div>

        <QRCodeSVG value={qrUrl} size={layout === LabelLayout.COMPACT ? 36 : 48} />
      </div>

      <div className="text-[9px] space-y-0.5">
        <div>Peso: {piece.peso_peca}g</div>
        <div>Valor Bruto: R$ {piece.valor_peca_bruta.toFixed(2)}</div>
        {piece.camadas !== undefined && <div>Camadas: {piece.camadas}</div>}
        {piece.mao_de_obra !== undefined && <div>Mão de obra: {piece.mao_de_obra}</div>}
        <div>Ouro: R$ {piece.cotacao_ouro_dia.toFixed(2)}/g</div>
      </div>

      <div className="font-bold text-amber-600 text-sm">
        Total: R$ {piece.custo_final_cliente.toFixed(2)}
      </div>
    </div>
  );
};

/* =========================================================
   PAGE
========================================================= */
const PieceDetails: React.FC<{ user: User }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [piece, setPiece] = useState<Piece | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<LabelLayout>(LabelLayout.A4);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const p = await apiService.getPieceById(id);
        setPiece(p);

        if (p) {
          const o = await apiService.getOrderById(p.orderId);
          setOrder(o);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  /* =========================================================
     IMPRESSÃO — MOBILE + DESKTOP
  ========================================================= */
  const handlePrint = () => {
    if (!piece) return;

    const printRoot = document.getElementById('print-root');
    if (!printRoot) return;

    printRoot.innerHTML = '';
    printRoot.classList.add('active');

    const container = document.createElement('div');
    printRoot.appendChild(container);

    const root = ReactDOM.createRoot(container);
    root.render(<LabelComponent piece={piece} layout={selectedLayout} />);

    setTimeout(() => {
      window.print();

      printRoot.classList.remove('active');
      printRoot.innerHTML = '';

      const snapshot: LabelSnapshot = {
        layout: selectedLayout,
        generatedAt: new Date().toISOString(),
        internalCode: piece.internalCode,
        peso: piece.peso_peca,
        valorBruto: piece.valor_peca_bruta,
        camadas: piece.camadas,
        maoDeObra: piece.mao_de_obra,
        cotacaoOuro: piece.cotacao_ouro_dia,
        custoFinal: piece.custo_final_cliente,
      };

      apiService.updatePiece(piece.id, { label: snapshot });
      analyticsService.logEvent(
        EventType.LABEL_PRINTED,
        user.companyId,
        user.companyRole,
        piece.id,
        { layout: selectedLayout }
      );

      setShowPrintModal(false);
    }, 300);
  };

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (!piece) return <div className="p-8 text-center">Peça não encontrada</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="text-slate-400 hover:text-slate-900 font-bold flex items-center gap-2"
      >
        ← Voltar
      </button>

      {/* CARD PRINCIPAL — NÃO ALTERADO */}
      <div className="bg-white rounded-3xl border shadow-xl p-6 flex flex-col md:flex-row gap-6">
        <div className="md:w-1/2 space-y-4">
          <img
            src={piece.photo}
            className="rounded-3xl border object-cover aspect-square"
          />

          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
            <QRCodeSVG value={`${window.location.origin}/#/piece/${piece.id}`} size={64} />
            <div className="text-right">
              <p className="text-xs font-bold">#{piece.id.slice(0, 8)}</p>
              <p className="text-[10px] text-amber-600 font-black">IDENTIDADE XTAGY</p>
            </div>
          </div>
        </div>

        <div className="md:w-1/2 space-y-4">
          <h1 className="text-3xl font-black">{piece.internalCode}</h1>

          <div className="grid grid-cols-2 text-xs gap-1">
            <div>Peso: {piece.peso_peca}g</div>
            <div>Bruto: R$ {piece.valor_peca_bruta.toFixed(2)}</div>
            <div>Camadas: {piece.camadas}</div>
            <div>M. Obra: {piece.mao_de_obra}</div>
            <div className="col-span-2">
              Ouro: R$ {piece.cotacao_ouro_dia.toFixed(2)}/g
            </div>
          </div>

          <div className="border-t pt-3 flex justify-between items-end">
            <div>
              <p className="text-xs uppercase">Custo Final</p>
              <p className="text-xl font-black">
                R$ {piece.custo_final_cliente.toFixed(2)}
              </p>
            </div>

            <button
              onClick={() => setShowPrintModal(true)}
              className="bg-slate-900 text-white px-4 py-3 rounded-xl font-black"
            >
              Imprimir
            </button>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl space-y-4 w-full max-w-sm">
            <h2 className="font-black text-lg">Escolha o layout</h2>

            <select
              value={selectedLayout}
              onChange={(e) => setSelectedLayout(e.target.value as LabelLayout)}
              className="w-full border p-2 rounded"
            >
              <option value={LabelLayout.A4}>A4</option>
              <option value={LabelLayout.COMPACT}>Compacta</option>
              <option value={LabelLayout.THERMAL}>Térmica</option>
            </select>

            <button
              onClick={handlePrint}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-black"
            >
              Confirmar impressão
            </button>

            <button
              onClick={() => setShowPrintModal(false)}
              className="w-full border py-2 rounded"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PieceDetails;