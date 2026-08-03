import { LayoutDashboard, Menu, X, ChevronDown, Bell } from 'lucide-react';

export default function Logo({ variant = 'full', size = 40, label }) {
  if (variant === 'glyph') {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 10,
          background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <LayoutDashboard size={size * 0.55} />
      </div>
    );
  }

  if (variant === 'menu') {
    return <Menu size={size} strokeWidth={2} />;
  }

  if (variant === 'close') {
    return <X size={size} strokeWidth={2} />;
  }

  if (variant === 'chev') {
    return <ChevronDown size={size} strokeWidth={2.5} />;
  }

  if (variant === 'bell') {
    return <Bell size={size} strokeWidth={2} />;
  }

  // full logo - professional CRM branding
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <LayoutDashboard size={22} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', lineHeight: 1.2 }}>
          {label || 'CRM Inventario'}
        </span>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>
          Sistema de Gestión Comercial
        </span>
      </div>
    </div>
  );
}
