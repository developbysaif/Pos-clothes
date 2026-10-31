'use client';

import { useEffect, useRef } from 'react';
import { playBeep } from '../lib/audio';

/**
 * Custom hook to capture inputs from USB / Bluetooth hardware barcode scanners.
 * Hardware scanners emulate keyboard input, typing characters with <50ms delay between keys,
 * followed by an Enter key.
 *
 * @param {Function} onScan - Callback when a valid barcode is scanned (sku/barcode string)
 * @param {Object} options - Options { minLength: 3, maxIntervalMs: 50, enabled: true }
 */
export function useBarcodeScanner(onScan, options = {}) {
  const {
    minLength = 3,
    maxIntervalMs = 60,
    enabled = true,
    playSound = true
  } = options;

  const bufferRef = useRef('');
  const lastTimeRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e) {
      // Ignore if user is actively typing in a standard input or textarea (unless tagged with data-barcode-target)
      const target = e.target;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInput && !target.dataset.barcodeTarget) {
        return;
      }

      const now = Date.now();
      const interval = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Handle Enter (scanner transmission terminator)
      if (e.key === 'Enter') {
        const barcode = bufferRef.current.trim();
        if (barcode.length >= minLength) {
          e.preventDefault();
          if (playSound) playBeep('success');
          onScan(barcode);
        }
        bufferRef.current = '';
        return;
      }

      // If the time between keystrokes is too long (>60ms), reset buffer (likely human typing)
      if (interval > maxIntervalMs && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      // Append printable single characters
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan, enabled, minLength, maxIntervalMs, playSound]);
}
