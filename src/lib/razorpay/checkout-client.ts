"use client";

/**
 * Razorpay Checkout SDK loader and typed wrapper.
 * Loads https://checkout.razorpay.com/v1/checkout.js on demand,
 * caches the load promise so repeat calls are free.
 */

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
let scriptLoadPromise: Promise<void> | null = null;

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayFailureResponse {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata?: { order_id?: string; payment_id?: string };
  };
}

interface RazorpayInstance {
  open(): void;
  close(): void;
  on(event: 'payment.failed', handler: (response: RazorpayFailureResponse) => void): void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

export function loadRazorpayCheckout(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('loadRazorpayCheckout must run in browser'));
  }
  if (window.Razorpay) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => {
        scriptLoadPromise = null;
        reject(new Error('Razorpay script failed to load'));
      });
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error('Razorpay script failed to load'));
    };
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

export function openCheckout(
  options: RazorpayCheckoutOptions,
  onFailure?: (response: RazorpayFailureResponse) => void,
): RazorpayInstance {
  if (typeof window === 'undefined' || !window.Razorpay) {
    throw new Error('Razorpay SDK not loaded - call loadRazorpayCheckout() first');
  }
  const rzp = new window.Razorpay(options);
  if (onFailure) {
    rzp.on('payment.failed', onFailure);
  }
  rzp.open();
  return rzp;
}
