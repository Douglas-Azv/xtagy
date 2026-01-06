import React, { useState } from 'react';
import { Order, Piece } from '../types';
import { apiService } from '../services/apiService';
import CameraCaptureModal from './CameraCaptureModal';

interface Props {
    order: Order;
    onClose: () => void;
    onPieceAdded: (piece: Piece) => void;
}

interface OCRData {
    peso_peca: number;
    valor_peca_bruta: number;
    internalCode: string;
    type: string;
    photo?: string;
}

const AddPieceModal: React.FC<Props> = ({ order, onClose, onPieceAdded }) => {
    const [showCamera, setShowCamera] = useState(false);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState<OCRData>({
        peso_peca: 0,
        valor_peca_bruta: 0,
        internalCode: '',
        type: 'Generic',
    });

    /* ======================================================
       OCR (stub seguro – você pluga IA depois)
    ====================================================== */
    const handleCapture = async (base64: string) => {
        /**
         * IMPORTANTE:
         * Aqui você NÃO quebra nada.
         * Por enquanto, só salva a imagem e permite edição manual.
         * Depois você conecta Gemini / Vision / OCR.
         */
        setForm(prev => ({
            ...prev,
            photo: base64,
        }));
    };

    /* ======================================================
       INPUT HANDLER
    ====================================================== */
    const updateField = (field: keyof OCRData, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    /* ======================================================
       CONFIRMAR
    ====================================================== */
    const handleConfirm = async () => {
        setLoading(true);
        try {
            const piece = await apiService.createPiece(
                {
                    photo: form.photo,
                    internalCode: form.internalCode || 'N/A',
                    type: form.type,
                    peso_peca: Number(form.peso_peca),
                    valor_peca_bruta: Number(form.valor_peca_bruta),
                },
                order
            );

            onPieceAdded(piece);
            onClose();
        } catch (err) {
            console.error('Erro ao criar peça', err);
            alert('Erro ao salvar a peça');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4">
                    <h2 className="text-xl font-black text-slate-900">
                        Incluir Peça no Lote
                    </h2>

                    {/* FOTO / OCR */}
                    <button
                        onClick={() => setShowCamera(true)}
                        className="w-full bg-slate-900 text-white py-2 rounded-xl font-bold"
                    >
                        Capturar etiqueta
                    </button>

                    {/* FORM */}
                    <div className="space-y-3 text-sm">
                        <div>
                            <label className="font-bold">Código da Peça</label>
                            <input
                                value={form.internalCode}
                                onChange={e => updateField('internalCode', e.target.value)}
                                className="w-full border rounded p-2"
                            />
                        </div>

                        <div>
                            <label className="font-bold">Tipo</label>
                            <select
                                value={form.type}
                                onChange={e => updateField('type', e.target.value)}
                                className="w-full border rounded p-2"
                            >
                                <option>Anel</option>
                                <option>Brinco</option>
                                <option>Corrente</option>
                                <option>Pulseira</option>
                                <option>Gargantilha</option>
                                <option>Tornozeleira</option>
                                <option>Generic</option>
                            </select>
                        </div>

                        <div>
                            <label className="font-bold">Peso (g)</label>
                            <input
                                type="number"
                                value={form.peso_peca}
                                onChange={e => updateField('peso_peca', e.target.value)}
                                className="w-full border rounded p-2"
                            />
                        </div>

                        <div>
                            <label className="font-bold">Valor Bruto (R$)</label>
                            <input
                                type="number"
                                value={form.valor_peca_bruta}
                                onChange={e => updateField('valor_peca_bruta', e.target.value)}
                                className="w-full border rounded p-2"
                            />
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-2 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 border rounded-xl py-2"
                            disabled={loading}
                        >
                            Cancelar
                        </button>

                        <button
                            onClick={handleConfirm}
                            className="flex-1 bg-amber-600 text-white rounded-xl py-2 font-black"
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' : 'Confirmar'}
                        </button>
                    </div>
                </div>
            </div>

            {/* CAMERA */}
            {showCamera && (
                <CameraCaptureModal
                    onCapture={handleCapture}
                    onClose={() => setShowCamera(false)}
                />
            )}
        </>
    );
};

export default AddPieceModal;