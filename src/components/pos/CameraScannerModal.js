'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { playBeep } from '../../lib/audio';

export default function CameraScannerModal({ isOpen, onClose, onDetected }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  async function startCamera() {
    setError(null);
    setIsScanning(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported by your browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Check if native BarcodeDetector API exists (Modern Chrome, Edge, Android Webview)
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a'],
        });

        const detectLoop = async () => {
          if (!streamRef.current || !videoRef.current) return;
          try {
            if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const code = barcodes[0].rawValue;
                handleCodeDetected(code);
                return;
              }
            }
          } catch (e) {
            // detection frame skipped
          }
          if (isOpen) {
            requestAnimationFrame(detectLoop);
          }
        };
        requestAnimationFrame(detectLoop);
      }
    } catch (err) {
      console.warn('Camera initiation notice:', err);
      setError(err.message || 'Unable to access webcam. Please verify camera permissions.');
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }

  function handleCodeDetected(code) {
    playBeep('success');
    setLastScanned(code);
    onDetected(code);
    setTimeout(() => {
      onClose();
    }, 600);
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeDetected(manualCode.trim());
    setManualCode('');
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Live Camera Barcode Scanner
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Viewport / Viewfinder */}
        <div className="relative bg-black h-72 flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Scanner Overlay Sight Guide */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-36 border-2 border-indigo-400/80 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-indigo-500"></div>
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-indigo-500"></div>
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-indigo-500"></div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-indigo-500"></div>
              {/* Animated laser scan line */}
              <div className="w-full h-0.5 bg-rose-500/90 shadow-[0_0_8px_#f43f5e] animate-pulse absolute top-1/2 -translate-y-1/2"></div>
            </div>
          </div>

          {lastScanned && (
            <div className="absolute inset-0 bg-emerald-600/90 flex flex-col items-center justify-center text-white p-4">
              <CheckCircle className="w-12 h-12 mb-2 animate-bounce" />
              <p className="font-semibold text-lg">Barcode Recognized!</p>
              <p className="text-sm font-mono tracking-widest mt-1 bg-white/20 px-3 py-1 rounded">
                {lastScanned}
              </p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 bg-zinc-900/95 flex flex-col items-center justify-center p-6 text-center text-zinc-300">
              <AlertCircle className="w-10 h-10 text-amber-500 mb-2" />
              <p className="text-sm font-medium mb-1">{error}</p>
              <p className="text-xs text-zinc-400 mb-4">
                You can still type the barcode below or click one of the quick test barcodes.
              </p>
              <button
                onClick={startCamera}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs rounded-lg text-white transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
              </button>
            </div>
          )}
        </div>

        {/* Quick simulator / Manual Fallback */}
        <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 space-y-3">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Or enter barcode SKU manually (e.g. 890123456001)"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
            >
              Add
            </button>
          </form>

          <div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 block mb-1">
              Sample Ladies Wear Barcodes (Click to simulate scan):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Silk Kurti', sku: '890123456001' },
                { label: 'Bridal Lehenga', sku: '890123456003' },
                { label: 'Chiffon Dupatta', sku: '890123456005' },
                { label: '3-Pc Suit', sku: '890123456007' },
              ].map((b) => (
                <button
                  key={b.sku}
                  type="button"
                  onClick={() => handleCodeDetected(b.sku)}
                  className="px-2.5 py-1 text-xs bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-700 dark:text-zinc-300 font-mono transition"
                >
                  {b.label} ({b.sku.slice(-4)})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
