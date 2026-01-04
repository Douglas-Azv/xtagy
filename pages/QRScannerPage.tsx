
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { analyticsService } from '../services/analyticsService';
import { EventType, CompanyRole } from '../types';

const QRScannerPage: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "qr-reader";

  const startScanner = async () => {
    setError(null);
    setScanning(true);
    
    try {
      const html5QrCode = new Html5Qrcode(regionId);
      scannerRef.current = html5QrCode;

      const qrCodeSuccessCallback = (decodedText: string) => {
        // Extract ID from URL if formatted like https://.../piece/{id}
        // or use the whole text if it's just the ID
        let pieceId = decodedText;
        if (decodedText.includes('/piece/')) {
          pieceId = decodedText.split('/piece/')[1];
        }

        analyticsService.logEvent(
          EventType.QR_CODE_SCANNED,
          'user-session', // simplified for prototype context
          CompanyRole.CLIENTE,
          pieceId
        );

        html5QrCode.stop().then(() => {
          navigate(`/piece/${pieceId}`);
        }).catch((err) => {
          console.error("Stop failed", err);
          navigate(`/piece/${pieceId}`);
        });
      };

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        undefined
      );
    } catch (err: any) {
      console.error("Camera access failed", err);
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
      setScanning(false);
    }
  };

  useEffect(() => {
    startScanner();
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="max-w-md mx-auto py-12 px-4 text-center">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Escanear QR Code</h1>
      <p className="text-slate-500 mb-8">Posicione a câmera sobre a etiqueta da peça XTAGY.</p>

      <div className="relative aspect-square w-full max-w-sm mx-auto bg-black rounded-3xl border-4 border-slate-200 overflow-hidden flex items-center justify-center">
        <div id={regionId} className="w-full h-full"></div>
        
        {error && (
          <div className="absolute inset-0 z-10 bg-white flex flex-col items-center justify-center p-8">
            <i className="fa-solid fa-circle-exclamation text-red-500 text-5xl mb-4"></i>
            <p className="text-slate-900 font-bold">{error}</p>
            <button 
              onClick={startScanner} 
              className="mt-6 bg-amber-500 text-slate-900 px-6 py-2 rounded-xl font-bold hover:bg-amber-600 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {scanning && !error && (
          <div className="absolute inset-0 pointer-events-none z-0">
             {/* Visual helper for scanning area */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-amber-500 rounded-2xl shadow-[0_0_0_100vw_rgba(0,0,0,0.4)]">
                <div className="absolute left-0 right-0 h-0.5 bg-amber-500 shadow-lg shadow-amber-500/50 animate-[scan_2s_ease-in-out_infinite]"></div>
             </div>
          </div>
        )}
      </div>

      <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-200">
        <h4 className="text-sm font-bold text-slate-700 mb-2">Dica de escaneamento</h4>
        <p className="text-xs text-slate-400">
          Mantenha a etiqueta em local iluminado e evite reflexos sobre o QR Code. A leitura é instantânea e segura.
        </p>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 0; }
          50% { top: 100%; }
        }
        #qr-reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
};

export default QRScannerPage;
