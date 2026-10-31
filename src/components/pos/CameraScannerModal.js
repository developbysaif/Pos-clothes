'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle, AlertCircle, RefreshCw, Upload, FlipHorizontal, Sparkles } from 'lucide-react';
import { playBeep } from '../../lib/audio';
import { INITIAL_PRODUCTS } from '../../lib/data';

export default function CameraScannerModal({ isOpen, onClose, onDetected }) {
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' or 'user'
  const html5QrCodeRef = useRef(null);
  const scannerContainerId = 'interactive-barcode-viewport';
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    // Give the DOM element a moment to mount
    const timer = setTimeout(() => {
      setLastScanned(null);
      setScannedProduct(null);
      setError(null);
      startScanner();
    }, 150);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, cameraFacing]);

  async function startScanner() {
    setError(null);
    setIsScanning(true);

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

      // Stop any existing instance
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
          html5QrCodeRef.current.clear();
        } catch (_) {}
      }

      const scanner = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });

      html5QrCodeRef.current = scanner;

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const width = Math.min(viewfinderWidth * 0.85, 320);
          const height = Math.min(viewfinderHeight * 0.55, 180);
          return { width, height };
        },
        aspectRatio: 1.333333,
      };

      await scanner.start(
        { facingMode: cameraFacing },
        config,
        (decodedText) => {
          handleCodeDetected(decodedText);
        },
        () => {
          // Frame scan error / no barcode in current frame
        }
      );
    } catch (err) {
      console.warn('Camera scanner start warning:', err);
      setIsScanning(false);
      setError(
        err?.message?.includes('Permission')
          ? 'Camera permission was denied. Please allow camera access in browser settings.'
          : 'Unable to start camera stream. You can still upload a barcode image or enter the SKU below.'
      );
    }
  }

  async function stopScanner() {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Scanner stop err:', e);
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  }

  function handleCodeDetected(code) {
    if (!code) return;
    const cleanCode = code.trim();
    playBeep('success');
    setLastScanned(cleanCode);

    // Look up product to display nice confirmation
    const matched = INITIAL_PRODUCTS.find(
      (p) => p.sku.toLowerCase() === cleanCode.toLowerCase() || p.id === cleanCode
    );
    setScannedProduct(matched || null);

    onDetected(cleanCode);

    // Briefly show success confirmation then close
    setTimeout(() => {
      onClose();
    }, 1200);
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const tempScanner = new Html5Qrcode('file-scanner-temp');
      const result = await tempScanner.scanFile(file, true);
      tempScanner.clear();
      handleCodeDetected(result);
    } catch (err) {
      playBeep('error');
      setError('Could not detect a clear barcode in this photo. Try another image or enter manually.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function toggleCameraDirection() {
    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeDetected(manualCode.trim());
    setManualCode('');
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Hidden container for file scan */}
        <div id="file-scanner-temp" className="hidden"></div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Barcode Scanner
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                  Live HD
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Point camera at garment tag barcode or upload image
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            aria-label="Close scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative bg-zinc-950 min-h-[280px] max-h-[340px] flex items-center justify-center overflow-hidden">
          {/* html5-qrcode element */}
          <div id={scannerContainerId} className="w-full h-full min-h-[280px]"></div>

          {/* Scanner Overlay Sight Guide & Animated Laser Line */}
          {!error && !lastScanned && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-64 h-36 border-2 border-indigo-400/80 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-pink-500"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-pink-500"></div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-pink-500"></div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-pink-500"></div>

                {/* Animated laser line */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_12px_#f43f5e] animate-laser absolute"></div>
              </div>
            </div>
          )}

          {/* Controls Overlay */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            <button
              onClick={toggleCameraDirection}
              title="Flip camera"
              className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition text-xs flex items-center gap-1"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              title="Upload barcode image"
              className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition text-xs flex items-center gap-1"
            >
              <Upload className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Scanned Success Confirmation Overlay */}
          {lastScanned && (
            <div className="absolute inset-0 bg-emerald-600/95 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 z-20 animate-in fade-in duration-150">
              <CheckCircle className="w-14 h-14 mb-2 animate-bounce" />
              <p className="font-bold text-xl">Barcode Scanned!</p>
              <p className="text-sm font-mono tracking-widest mt-1 bg-white/20 px-4 py-1.5 rounded-lg border border-white/30">
                {lastScanned}
              </p>
              {scannedProduct ? (
                <div className="mt-3 text-center bg-black/20 p-3 rounded-xl max-w-xs">
                  <p className="text-xs font-semibold">{scannedProduct.name}</p>
                  <p className="text-xs font-bold text-emerald-200 mt-0.5">
                    ${scannedProduct.price.toFixed(2)} • {scannedProduct.category}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-white/80 mt-2">Added to checkout cart</p>
              )}
            </div>
          )}

          {/* Error / Fallback State */}
          {error && (
            <div className="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center p-6 text-center text-zinc-300 z-10">
              <AlertCircle className="w-12 h-12 text-amber-400 mb-3" />
              <p className="text-sm font-semibold mb-1 text-white">{error}</p>
              <p className="text-xs text-zinc-400 mb-4 max-w-xs">
                You can upload a barcode picture, use a USB handheld scanner, or type the SKU below.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={startScanner}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-medium rounded-xl text-white transition shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium rounded-xl text-zinc-200 transition"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Image
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Manual Barcode & Quick Simulator Chips */}
        <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 space-y-3.5">
          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Or enter SKU / Barcode (e.g. 890123456001)"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            <button
              type="submit"
              className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-600/20 active:scale-95"
            >
              Add Item
            </button>
          </form>

          {/* Quick Click-to-Scan Simulator Chips for Testing */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-pink-500" /> Quick Ladies Wear Barcodes (Test Click):
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { label: 'Silk Kurti', sku: '890123456001', price: '$34.99' },
                { label: 'Bridal Lehenga', sku: '890123456003', price: '$189.99' },
                { label: 'Chiffon Dupatta', sku: '890123456005', price: '$18.00' },
                { label: '3-Pc Suit', sku: '890123456007', price: '$49.99' },
              ].map((b) => (
                <button
                  key={b.sku}
                  type="button"
                  onClick={() => handleCodeDetected(b.sku)}
                  className="p-2 text-left bg-white dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 transition group hover:border-indigo-400"
                >
                  <div className="font-semibold text-[11px] truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {b.label}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400 flex justify-between mt-0.5">
                    <span>{b.sku.slice(-4)}</span>
                    <span className="font-semibold text-indigo-500">{b.price}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
