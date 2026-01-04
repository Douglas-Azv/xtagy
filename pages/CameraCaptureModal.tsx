import React, { useRef } from 'react';

interface Props {
    onCapture: (base64: string) => void;
    onClose: () => void;
}

const CameraCaptureModal: React.FC<Props> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const startCamera = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    };

    const capture = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg');

        onCapture(base64);
        onClose();
    };

    React.useEffect(() => {
        startCamera();
        return () => {
            const tracks = (videoRef.current?.srcObject as MediaStream)?.getTracks();
            tracks?.forEach(t => t.stop());
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-xl space-y-4 w-full max-w-md">
                <video ref={videoRef} autoPlay playsInline className="w-full rounded" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-2">
                    <button
                        onClick={capture}
                        className="flex-1 bg-amber-600 text-white py-2 rounded font-bold"
                    >
                        Capturar etiqueta
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CameraCaptureModal;