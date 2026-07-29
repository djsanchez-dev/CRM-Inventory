import React from 'react';

/**
 * Librería de iconos comerciales para CRM
 * Pictogramas profesionales sin letras, listos para producción
 * Paleta Salesforce-style: Azul primario, Verde éxito, Naranja atención, Rojo acción
 */

const SvgWrapper = ({ size = 20, children, ariaLabel, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden={ariaLabel ? 'false' : 'true'}
    role={ariaLabel ? 'img' : 'presentation'}
    aria-label={ariaLabel}
    className={className}
  >
    {children}
  </svg>
);

// ============ Control UI Icons ============

export const X = ({ size = 18 }) => (
  <SvgWrapper size={size}>
    <path d="M6 6l12 12M6 18L18 6" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </SvgWrapper>
);

export const Close = X;

export const Menu = ({ size = 20 }) => (
  <SvgWrapper size={size}>
    <rect x="3" y="6" width="18" height="2" rx="1" fill="#4b5563" />
    <rect x="3" y="11" width="18" height="2" rx="1" fill="#4b5563" />
    <rect x="3" y="16" width="18" height="2" rx="1" fill="#4b5563" />
  </SvgWrapper>
);

export const ChevronDown = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <path d="M7 10l5 5 5-5" fill="#6b7280" />
  </SvgWrapper>
);

export const ChevronLeft = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </SvgWrapper>
);

export const ChevronRight = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </SvgWrapper>
);

export const Plus = ({ size = 18 }) => (
  <SvgWrapper size={size}>
    <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </SvgWrapper>
);

export const Minus = ({ size = 18 }) => (
  <SvgWrapper size={size}>
    <path d="M5 12h14" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </SvgWrapper>
);

export const Search = ({ size = 18 }) => (
  <SvgWrapper size={size}>
    <circle cx="9" cy="9" r="6" fill="none" stroke="#6b7280" strokeWidth="1.5" />
    <path d="M14.5 14.5l3.5 3.5" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
  </SvgWrapper>
);

export const Edit = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <path d="M3 17.25V21h3.75L17.81 9.94M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#4b5563" stroke="#4b5563" strokeWidth="0.5" />
  </SvgWrapper>
);

export const Trash = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z" fill="#ef4444" />
    <path d="M19 4h-3.5l-1-1h-9l-1 1H5v2h14V4z" fill="#dc2626" />
  </SvgWrapper>
);

export const Eye = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-7c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5z" fill="#6b7280" />
  </SvgWrapper>
);

export const EyeOff = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <path d="M11.83 9L15.29 12.46c.04-.3.08-.59.08-.89 0-4.28-3.39-8.79-8.89-8.79-1.64 0-3.09.33-4.34.93l1.897 1.9c.75-.13 1.51-.2 2.43-.2 6.02 0 8.89 4.01 8.89 7.99 0 .64-.07 1.26-.16 1.88L23 22.41 21.9 23.5 3.5 4.1 4.6 3 11.83 9M2 4.27l2.28 2.28A8.35 8.35 0 001 11.1c1.46 4.26 5.3 7.78 10 7.78 2.5 0 4.8-.8 6.7-2.29l3.53 3.53 1.1-1.08L3.09 3.19 2 4.27z" fill="#ef4444" />
  </SvgWrapper>
);

// ============ Module Icons (Main sections) ============

export const Dashboard = ({ size = 20 }) => (
  <SvgWrapper size={size}>
    <rect x="3" y="3" width="8" height="8" rx="1" fill="#2563eb" />
    <rect x="13" y="3" width="8" height="8" rx="1" fill="#3b82f6" />
    <rect x="3" y="13" width="8" height="8" rx="1" fill="#60a5fa" />
    <rect x="13" y="13" width="8" height="8" rx="1" fill="#1e40af" />
  </SvgWrapper>
);

export const Products = ({ size = 20 }) => (
  <SvgWrapper size={size}>
    <path d="M12 2L3 7v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7l-9-5z" fill="#2563eb" />
    <path d="M3 7h18l-9 5-9-5z" fill="#3b82f6" />
    <path d="M21 7v10c0 1.1-.9 2-2 2v0M3 7v10c0 1.1.9 2 2 2v0" stroke="#1e40af" strokeWidth="0.5" />
  </SvgWrapper>
);

export const Categories = ({ size = 20 }) => (
  <SvgWrapper size={size}>
    <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
    <path d="M3 8h18" stroke="#d97706" strokeWidth="0.8" />
  </SvgWrapper>
);

export const Tags = ({ size = 20 }) => (
  <SvgWrapper size={size}>
    <path d="M4 4h8l8 8-8 8-8-8V4z" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
    <circle cx="8" cy="8" r="1.2" fill="#fff" />
  </SvgWrapper>
);

export const Customers = ({ size = 20 }) => (
  <SvgWrapper size={size}>
    <circle cx="8" cy="6" r="2.5" fill="#10b981" />
    <path d="M4 11c0-2.2 1.8-4 4-4s4 1.8 4 4v4H4v-4z" fill="#10b981" />
    <circle cx="16" cy="5.5" r="2" fill="#10b981" opacity="0.7" />
    <path d="M13 10c0-1.7 1.3-3 3-3s3 1.3 3 3v3h-6v-3z" fill="#10b981" opacity="0.7" />
  </SvgWrapper>
);

export const Suppliers = ({ size = 20 }) => (
  <SvgWrapper size={size}>
    <rect x="1" y="8" width="12" height="6" rx="1" fill="#8b5cf6" />
    <path d="M13 8h4v4l2-2v2" fill="#8b5cf6" />
    <circle cx="4" cy="16" r="1.5" fill="#7c3aed" />
    <circle cx="11" cy="16" r="1.5" fill="#7c3aed" />
    <path d="M3 7h9V5H3z" fill="#a78bfa" />
  </SvgWrapper>
);

export const Sales = ({ size = 20 }) => (
  <SvgWrapper size={size}>
    <path d="M6 2h12l2 4H2l2-4z" fill="#ef4444" />
    <path d="M4 6h14c1 0 1.5 1 1.2 2l-1.5 6c-.3 1.2-1.2 2-2.2 2H6c-1 0-1.9-.8-2.2-2L2 8c-.3-1 .2-2 1.2-2z" fill="#dc2626" />
    <circle cx="18" cy="15" r="1.5" fill="#7f1d1d" />
    <circle cx="8" cy="15" r="1.5" fill="#7f1d1d" />
    <path d="M12 8v4" stroke="#fff" strokeWidth="0.8" />
  </SvgWrapper>
);

export const Purchases = ({ size = 20 }) => (
  <SvgWrapper size={size}>
    <rect x="2" y="4" width="14" height="12" rx="1" fill="#06b6d4" />
    <path d="M2 8h14" stroke="#0891b2" strokeWidth="0.8" />
    <path d="M16 8l2-2v4l-2-2z" fill="#06b6d4" />
    <circle cx="6" cy="10" r="1" fill="#0891b2" />
    <circle cx="12" cy="10" r="1" fill="#0891b2" />
    <path d="M8 12l2 2 4-4" stroke="#067e8d" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
  </SvgWrapper>
);

export const Reports = ({ size = 20 }) => (
  <SvgWrapper size={size}>
    <rect x="2" y="2" width="20" height="18" rx="1" fill="none" stroke="#7c3aed" strokeWidth="1" />
    <path d="M4 16l4-6 4 4 6-8 2 4" stroke="#7c3aed" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 2v16h16" stroke="#a78bfa" strokeWidth="0.8" />
  </SvgWrapper>
);

export const Users = ({ size = 20 }) => (
  <SvgWrapper size={size}>
    <circle cx="12" cy="8" r="3" fill="#6b7280" />
    <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" fill="#6b7280" />
  </SvgWrapper>
);

// ============ Action Icons ============

export const Download = ({ size = 18 }) => (
  <SvgWrapper size={size}>
    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18h14v2H5z" fill="#10b981" />
  </SvgWrapper>
);

export const Money = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <circle cx="12" cy="12" r="10" fill="none" stroke="#10b981" strokeWidth="1.2" />
    <path d="M12 7v10M14.5 9h-5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5" stroke="#10b981" strokeWidth="1" strokeLinecap="round" />
  </SvgWrapper>
);

export const CheckCircle = ({ size = 18 }) => (
  <SvgWrapper size={size}>
    <circle cx="12" cy="12" r="10" fill="#10b981" />
    <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </SvgWrapper>
);

export const Alert = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <path d="M12 2L2 20h20L12 2zm1 15h-2v-2h2v2zm0-4h-2V9h2v4z" fill="#f59e0b" />
  </SvgWrapper>
);

export const AlertCircle = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <circle cx="12" cy="12" r="10" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
    <path d="M12 8v4M12 16h.01" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
  </SvgWrapper>
);

export const Bell = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.93 6 11v5l-2 2v1h16v-1l-2-2z" fill="#f59e0b" />
  </SvgWrapper>
);

export const Trending = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke="#10b981" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="17 6 23 6 23 12" stroke="#10b981" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </SvgWrapper>
);

export const TrendingDown = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" stroke="#ef4444" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="17 18 23 18 23 12" stroke="#ef4444" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </SvgWrapper>
);

export const ArrowUpRight = ({ size = 14 }) => (
  <SvgWrapper size={size}>
    <path d="M5 12l7-7m0 0H7m5 0v5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </SvgWrapper>
);

export const ArrowDownRight = ({ size = 14 }) => (
  <SvgWrapper size={size}>
    <path d="M5 5l7 7m0 0H7m5 0v-5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </SvgWrapper>
);

export const Shield = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <path d="M12 1L3 5v7c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="#10b981" />
  </SvgWrapper>
);

export const ShieldOff = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <path d="M12 1L3 5v7c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.6" />
    <path d="M3 3l18 18" stroke="#ef4444" strokeWidth="1.5" />
  </SvgWrapper>
);

// ============ Contact Icons ============

export const Phone = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#6b7280" />
  </SvgWrapper>
);

export const Mail = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="#6b7280" strokeWidth="1.2" />
    <path d="M22 6L12 13 2 6" stroke="#6b7280" strokeWidth="1.2" fill="none" strokeLinecap="round" />
  </SvgWrapper>
);

export const Location = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.94 8.75 8.75 8.75.36 0 .72-.02 1.07-.07-1.94-3.63-2.49-8.16-.98-12.19C11.35 5.82 11.7 2 12 2zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" fill="#ef4444" />
  </SvgWrapper>
);

export const MapPin = Location;

export const Clock = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <circle cx="12" cy="12" r="10" fill="none" stroke="#6b7280" strokeWidth="1.5" />
    <path d="M12 6v6l4 2" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
  </SvgWrapper>
);

export const User = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <circle cx="12" cy="8" r="3" fill="#6b7280" />
    <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" fill="#6b7280" />
  </SvgWrapper>
);

export const Dollar = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <path d="M12 1v22M17 5c0 2.2-1.8 4-4 4H9c-2.2 0-4 1.8-4 4s1.8 4 4 4h4c2.2 0 4 1.8 4 4s-1.8 4-4 4h-2" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
  </SvgWrapper>
);

export const Package = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <path d="M12 2 3 7v10l9 5 9-5V7l-9-5z" fill="#2563eb" />
    <path d="M3 7l9 5 9-5M12 12v10" stroke="#1d4ed8" strokeWidth="1" />
  </SvgWrapper>
);

export const Truck = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <path d="M1 5h12v8H1z" fill="#2563eb" />
    <path d="M13 8h4l3 3v3h-7V8z" fill="#3b82f6" />
    <circle cx="5" cy="15" r="2" fill="#6b7280" />
    <circle cx="16" cy="15" r="2" fill="#6b7280" />
  </SvgWrapper>
);

export const Star = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#f59e0b" />
  </SvgWrapper>
);

export const ShoppingCart = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <circle cx="9" cy="20" r="1.5" fill="#6b7280" />
    <circle cx="18" cy="20" r="1.5" fill="#6b7280" />
    <path d="M3 3h2l2.4 8.4a1 1 0 0 0 1 .6h8.8a1 1 0 0 0 1-.8L18 5H7" stroke="#6b7280" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </SvgWrapper>
);

// ============ File Icons ============

export const FileDown = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="#10b981" />
  </SvgWrapper>
);

export const FileText = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="none" stroke="#6b7280" strokeWidth="2" />
    <path d="M14 2v6h6M10 9h4M10 13h4M10 17h4" stroke="#6b7280" strokeWidth="1" />
  </SvgWrapper>
);

// ============ Other Icons ============

export const LogOut = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="#6b7280" />
  </SvgWrapper>
);

export const Save = ({ size = 16 }) => (
  <SvgWrapper size={size}>
    <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4z" fill="none" stroke="#2563eb" strokeWidth="1" />
    <path d="M12 19c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" fill="none" stroke="#2563eb" strokeWidth="1" />
    <path d="M6 8h5v4H6z" fill="none" stroke="#2563eb" strokeWidth="1" />
  </SvgWrapper>
);

// ============ Default Export ============

export default {
  X,
  Close,
  Menu,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Search,
  Edit,
  Trash,
  Eye,
  EyeOff,
  Dashboard,
  Products,
  Categories,
  Customers,
  Suppliers,
  Sales,
  Purchases,
  Reports,
  Users,
  Download,
  Money,
  CheckCircle,
  Alert,
  AlertCircle,
  Bell,
  Trending,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  ShieldOff,
  Star,
  Phone,
  Mail,
  Location,
  Clock,
  FileDown,
  FileText,
  LogOut,
  Save,
};
