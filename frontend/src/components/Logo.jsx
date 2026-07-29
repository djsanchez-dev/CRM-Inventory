import React from 'react';

export default function Logo({ variant = 'full', size = 40, label }) {
  // Professional commercial CRM logo with blue gradient (Salesforce-style)
  if (variant === 'glyph') {
    const s = size;
    return (
      <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <defs>
          <linearGradient id="glyphGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1e40af" />
            <stop offset="1" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="12" fill="url(#glyphGrad)" />
        {/* Dashboard/chart icon inside */}
        <rect x="10" y="10" width="16" height="16" rx="2" fill="#fff" opacity="0.85" />
        <rect x="30" y="16" width="16" height="24" rx="2" fill="#fff" opacity="0.7" />
        <rect x="18" y="28" width="8" height="12" rx="1" fill="#fff" opacity="0.6" />
      </svg>
    );
  }

  if (variant === 'menu') {
    const s = size;
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect x="3" y="6" width="18" height="2" rx="1" fill="#1e40af" />
        <rect x="3" y="11" width="18" height="2" rx="1" fill="#1e40af" />
        <rect x="3" y="16" width="18" height="2" rx="1" fill="#1e40af" />
      </svg>
    );
  }

  if (variant === 'close') {
    const s = size;
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M6 6L18 18M6 18L18 6" stroke="#1e40af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (variant === 'chev') {
    const s = size;
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M6 9l6 6 6-6" stroke="#1e40af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // full logo - professional CRM branding
  const s = size;
  return (
    <svg width={s*3} height={s} viewBox="0 0 300 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1e40af" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      {/* Logo icon - commercial dashboard/chart design */}
      <rect x="8" y="8" width="64" height="64" rx="12" fill="url(#lg)" />
      <rect x="18" y="18" width="14" height="14" rx="2" fill="#fff" opacity="0.85" />
      <rect x="36" y="22" width="14" height="20" rx="2" fill="#fff" opacity="0.7" />
      <rect x="27" y="32" width="7" height="10" rx="1" fill="#fff" opacity="0.6" />
      
      {/* Text: CRM Inventario */}
      <text x="100" y="44" fill="#1e40af" fontSize="26" fontFamily="Inter, sans-serif" fontWeight="700">CRM</text>
      <text x="150" y="44" fill="#0f172a" fontSize="26" fontFamily="Inter, sans-serif" fontWeight="600">Inventario</text>
      
      {/* Subtitle */}
      <text x="100" y="62" fill="#64748b" fontSize="11" fontFamily="Inter, sans-serif">Sistema de Gestión Comercial</text>
    </svg>
  );
}
