
import React, { useEffect, useRef, useState } from 'react';
import type { TermSignOff } from '../types';

interface SignOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signerName: string, signatureImage?: string) => void;
  signerName: string;
  existingSignOff: TermSignOff | null;
}

const SignOffModal: React.FC<SignOffModalProps> = ({ isOpen, onClose, onConfirm, signerName, existingSignOff }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [name, setName] = useState(signerName);
  const [mode, setMode] = useState<'type' | 'draw'>('type');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
      setName(signerName);
      setHasDrawn(false);
      setMode('type');
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen, signerName]);

  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#111827'; // gray-900
        ctx.lineWidth = 3;
      }
    }
  }, [mode]);

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e.nativeEvent instanceof MouseEvent) {
      return { x: e.nativeEvent.clientX - rect.left, y: e.nativeEvent.clientY - rect.top };
    }
    if (e.nativeEvent instanceof TouchEvent && e.nativeEvent.touches.length > 0) {
      return { x: e.nativeEvent.touches[0].clientX - rect.left, y: e.nativeEvent.touches[0].clientY - rect.top };
    }
    return { x: 0, y: 0 };
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  
  const stopDrawing = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
  };
  
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if(canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
    }
  };

  const handleConfirm = () => {
    if (!name.trim()) return;
    if (mode === 'draw' && hasDrawn && canvasRef.current) {
        const signatureImage = canvasRef.current.toDataURL('image/png');
        onConfirm(name.trim(), signatureImage);
    } else {
        onConfirm(name.trim());
    }
  };
  
  const handleClose = () => {
    dialogRef.current?.close();
    onClose();
  }

  const isConfirmDisabled = !name.trim() || (mode === 'draw' && !hasDrawn);

  return (
    <dialog ref={dialogRef} onClose={handleClose} className="p-0 rounded-lg shadow-xl w-11/12 max-w-lg backdrop:bg-black backdrop:opacity-50 border border-gray-300">
      <div className="p-6 bg-white text-gray-900">
        <h3 className="text-lg font-bold text-gray-900">{existingSignOff?.date ? 'Review Sign Off' : 'Confirm Sign Off'}</h3>
        {existingSignOff?.date ? (
            <div className="mt-4 text-sm text-gray-700 text-center">
                <p>This document was signed off by:</p>
                 {existingSignOff.signatureImage ? (
                    <img src={existingSignOff.signatureImage} alt="Signature" className="my-2 mx-auto h-20 w-auto bg-gray-100 border rounded-md p-1" />
                ) : (
                    <p className="font-caveat text-4xl my-2">{existingSignOff.teacherName}</p>
                )}
                <p className="font-semibold mt-1">{existingSignOff.teacherName}</p>
                <p>on {new Date(existingSignOff.date).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}.</p>
            </div>
        ) : (
            <>
                <div className="mt-4">
                    <label htmlFor="signerNameInput" className="block text-sm font-medium text-gray-700">Your Name (Required)</label>
                    <input 
                        type="text"
                        id="signerNameInput"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full p-2 bg-white rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Enter your full name"
                    />
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Signature</label>
                    <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 my-2 w-min">
                        <button onClick={() => setMode('type')} className={`px-3 py-1 text-sm font-semibold rounded-md ${mode === 'type' ? 'bg-white shadow' : 'text-gray-600'}`}>Type</button>
                        <button onClick={() => setMode('draw')} className={`px-3 py-1 text-sm font-semibold rounded-md ${mode === 'draw' ? 'bg-white shadow' : 'text-gray-600'}`}>Draw</button>
                    </div>

                    {mode === 'type' ? (
                        <div className="p-4 border rounded-md bg-gray-50 flex items-center justify-center h-48">
                            <p className="font-caveat text-4xl text-gray-800">{name || 'Your Signature'}</p>
                        </div>
                    ) : (
                        <div className="relative">
                            <canvas
                                ref={canvasRef}
                                width="450"
                                height="190"
                                className="border rounded-md bg-gray-50 cursor-crosshair touch-none"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            />
                            <button onClick={clearCanvas} className="absolute top-2 right-2 px-2 py-1 bg-white text-gray-600 border rounded-md text-xs hover:bg-gray-100">Clear</button>
                        </div>
                    )}
                </div>
                
                <p className="mt-4 text-sm text-gray-600">
                    By confirming, you certify that you have completed and/or reviewed the required documentation and that it is accurate.
                </p>
            </>
        )}
      </div>
      <div className="p-4 bg-gray-50 flex justify-end gap-2 border-t">
        <button onClick={handleClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">
            {existingSignOff?.date ? 'Close' : 'Cancel'}
        </button>
        {!existingSignOff?.date && (
            <button 
                onClick={handleConfirm} 
                disabled={isConfirmDisabled}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                Confirm and Sign
            </button>
        )}
      </div>
    </dialog>
  );
};

export default SignOffModal;