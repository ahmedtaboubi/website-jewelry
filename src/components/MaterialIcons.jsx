import React from 'react';

export const SteelIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M12 2.5L4.5 5.5V11.5C4.5 16.5 7.8 20.8 12 22C16.2 20.8 19.5 16.5 19.5 11.5V5.5L12 2.5Z" fill="rgba(71, 85, 105, 0.12)" stroke="#475569" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M12 2.5V22" stroke="#64748b" strokeWidth="1.2" strokeDasharray="1.5 1.5" />
    <path d="M8 8.5L12 6.5L16 8.5V12C16 14.8 14.3 17.4 12 18.5C9.7 17.4 8 14.8 8 12V8.5Z" fill="rgba(71, 85, 105, 0.2)" stroke="#334155" strokeWidth="1.2" />
  </svg>
);

export const XpAlloyIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M12 2L14.2 7.8L20 10L14.2 12.2L12 18L9.8 12.2L4 10L9.8 7.8L12 2Z" fill="url(#xpGoldGrad)" stroke="#c59b27" strokeWidth="1.3" strokeLinejoin="round" />
    <circle cx="12" cy="10" r="2.2" fill="#fffbeb" stroke="#b45309" strokeWidth="0.8" />
    <path d="M12 19V22M10 20.5H14" stroke="#d97706" strokeWidth="1.3" strokeLinecap="round" />
    <defs>
      <linearGradient id="xpGoldGrad" x1="4" y1="2" x2="20" y2="18" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fef08a" />
        <stop offset="0.5" stopColor="#eab308" />
        <stop offset="1" stopColor="#b45309" />
      </linearGradient>
    </defs>
  </svg>
);

export const ZirconiaIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M6 3.5H18L22 9.5L12 21.5L2 9.5L6 3.5Z" fill="rgba(56, 189, 248, 0.15)" stroke="#0284c7" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M2 9.5H22" stroke="#0284c7" strokeWidth="1.1" />
    <path d="M6 3.5L10 9.5L12 21.5" stroke="#0284c7" strokeWidth="1.1" />
    <path d="M18 3.5L14 9.5L12 21.5" stroke="#0284c7" strokeWidth="1.1" />
    <path d="M10 9.5L12 3.5L14 9.5" fill="rgba(255, 255, 255, 0.6)" stroke="#38bdf8" strokeWidth="1.1" />
  </svg>
);

export const LapisIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <rect x="5" y="5" width="14" height="14" rx="3.5" transform="rotate(45 12 12)" fill="url(#lapisGrad2)" stroke="#1e3a8a" strokeWidth="1.4" />
    <rect x="7.5" y="7.5" width="9" height="9" rx="2" transform="rotate(45 12 12)" stroke="rgba(255, 255, 255, 0.65)" strokeWidth="0.9" />
    <circle cx="12" cy="12" r="1.6" fill="#fef08a" stroke="#d97706" strokeWidth="0.5" />
    <defs>
      <linearGradient id="lapisGrad2" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3b82f6" />
        <stop offset="0.6" stopColor="#1d4ed8" />
        <stop offset="1" stopColor="#0f172a" />
      </linearGradient>
    </defs>
  </svg>
);
