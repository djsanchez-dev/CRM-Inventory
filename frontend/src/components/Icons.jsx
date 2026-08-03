/**
 * Icons.jsx — Re-export bridge from lucide-react
 * 
 * Maintains backward compatibility with ALL existing imports
 * (Layout.jsx, pages, components) while eliminating hand-rolled SVG icons.
 */

// UI Controls
export { 
  X,
  Menu,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Search,
  Trash2 as Trash,
  Eye,
  EyeOff,
  Edit3 as Edit,
  Save,
} from 'lucide-react';

// Navigation / Module icons — exact names expected by Layout.jsx
export {
  LayoutDashboard as Dashboard,
  Box as Products,
  Tags as Tags,
  Users as Customers,
  Truck as Suppliers,
  ShoppingCart as Sales,
  ShoppingBag as Purchases,
  BarChart3 as Reports,
} from 'lucide-react';

// Users (people group icon) — for nav and customers page
export { Users } from 'lucide-react';

// Actions & status icons
export {
  Download,
  DollarSign as Money,
  DollarSign as Dollar,
  CheckCircle,
  CheckCircle2,
  AlertTriangle as Alert,
  AlertCircle,
  Bell,
  TrendingUp as Trending,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  ShieldOff,
  Star,
  Phone,
  Mail,
  MapPin,
  Clock,
  FileDown,
  FileText,
  LogOut,
  User,
  Package,
  ShoppingCart,
  Truck,
} from 'lucide-react';

// Aliases for backward compatibility
export { X as Close } from 'lucide-react';
export { Printer, StickyNote } from 'lucide-react';
export { ClipboardList as Categories } from 'lucide-react';
export { ShieldCheck, ShieldAlert, Building2, Calendar, Activity, Key } from 'lucide-react';// Delivery tracking
export {  Link2 as LinkIcon,  Share2 as Share,  RefreshCw as Refresh,  Store,  Crosshair,  AlertTriangle,  Navigation,  Loader,} from 'lucide-react';

// Services (Car Wash / Mecánica)
export {  Car,  CarFront as Services,  Wrench,  Droplets,  CalendarDays,  Bike,  Tractor,  BusFront,  Truck as Van,} from 'lucide-react';
