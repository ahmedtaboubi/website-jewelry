import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Package, ShoppingBag, Plus, Trash2, Edit, Save, X, FlaskConical, BarChart3, 
  RotateCw, TrendingUp, TrendingDown, Calendar, Clock, ArrowUpRight, ArrowDownRight,
  Flame, Target, Zap, Award, DollarSign, Users, Repeat, Sparkles, Filter, 
  CalendarDays, Sliders, ChevronRight, Info, CheckCircle2, Sun, Moon, HelpCircle,
  MapPin, Globe, ShieldCheck, ShieldAlert, Navigation, Layers, Boxes, Tag, Truck,
  Star, MessageSquare, ThumbsUp, CheckCircle, Check, XCircle, AlertCircle, Camera,
  UserPlus, Key, Lock, UserCheck, Shield, Phone, ExternalLink
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, AreaChart, Area, 
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import './AdminDashboard.css';

const AdminDashboard = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [timeRange, setTimeRange] = useState('all'); // 'today', 'week', 'month', 'year', 'all'
  const [products, setProducts] = useState([]);
  const [ingredientsList, setIngredientsList] = useState([]);
  
  // --- REVIEWS MODERATION STATE ---
  const [adminReviews, setAdminReviews] = useState([]);
  const [adminReviewCounts, setAdminReviewCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [reviewFilterStatus, setReviewFilterStatus] = useState('all');
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);

  // --- ADMIN TEAM MANAGEMENT STATE ---
  const [adminTeam, setAdminTeam] = useState([]);
  const [currentLoggedInAdminId, setCurrentLoggedInAdminId] = useState(null);
  const [isAdminTeamLoading, setIsAdminTeamLoading] = useState(false);
  const [isCreateAdminModalOpen, setIsCreateAdminModalOpen] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  
  // Real-time table search filters
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [citySearchQuery, setCitySearchQuery] = useState('');
  
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Product form state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [productStockFilter, setProductStockFilter] = useState('all'); // 'all', 'in_stock', 'low_stock', 'out_of_stock'

  const defaultFormState = {
    name: '',
    inspiredBy: '',
    notes: '',
    price: '',
    image: '',
    category: 'Rings',
    isNew: false,
    gender: 'Unisex',
    scentFamily: 'Geometric',
    luxuryPrice: '',
    scentDescription: '',
    topNotes: '',
    middleNotes: '',
    baseNotes: '',
    ingredients: '',
    stock: 50,
    mainNotesIds: [], // Array of selected ingredient IDs
    images: [] // Array of additional gallery image URLs
  };

  const [productForm, setProductForm] = useState(defaultFormState);

  // Order details modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]); // Multiple files for gallery

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders/all', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (res.ok) setOrders(await res.json());
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products'); // Products list is public
      if (res.ok) setProducts(await res.json());
    } catch (e) {
      console.error('Failed to fetch products:', e);
    }
  };

  const fetchIngredients = async () => {
    try {
      const res = await fetch('/api/ingredients');
      if (res.ok) setIngredientsList(await res.json());
    } catch (e) {
      console.error('Failed to fetch ingredients:', e);
    }
  };

  // --- AD SPEND STATE & API HANDLERS ---
  const [adSpends, setAdSpends] = useState([]);
  const [isAdSpendModalOpen, setIsAdSpendModalOpen] = useState(false);
  const [adSpendForm, setAdSpendForm] = useState({
    date: new Date().toISOString().split('T')[0],
    platform: 'Meta Ads',
    amount: '',
    impressions: '',
    clicks: '',
    notes: ''
  });
  const [productCogsPercent, setProductCogsPercent] = useState(35); // 35% default product cost
  const [estShippingPerOrder, setEstShippingPerOrder] = useState(30); // 30 DH default shipping in Morocco

  const fetchAdSpends = async () => {
    try {
      const res = await fetch('/api/ad-spend', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (res.ok) setAdSpends(await res.json());
    } catch (e) {
      console.error('Failed to fetch ad spend records:', e);
    }
  };

  const handleSaveAdSpend = async (e) => {
    e.preventDefault();
    const cleanAmount = parseFloat(adSpendForm.amount.toString().replace(/[^0-9.]/g, ''));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      showToast('Please enter a valid positive spend amount', 'error');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      showToast('No active admin session found. Please log in as admin.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/ad-spend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...adSpendForm,
          amount: cleanAmount
        })
      });

      if (res.ok) {
        showToast('Ad spend logged successfully!');
        setIsAdSpendModalOpen(false);
        setAdSpendForm({
          date: new Date().toISOString().split('T')[0],
          platform: 'Meta Ads',
          amount: '',
          impressions: '',
          clicks: '',
          notes: ''
        });
        fetchAdSpends();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Failed to save ad spend (Status: ' + res.status + ')', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while saving ad spend', 'error');
    }
  };

  const handleDeleteAdSpend = async (id) => {
    if (!window.confirm('Delete this ad spend record?')) return;
    try {
      const res = await fetch(`/api/ad-spend/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (res.ok) {
        showToast('Ad spend record deleted');
        fetchAdSpends();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminReviews = async (statusOverride, searchOverride) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      setIsReviewsLoading(true);
      const st = statusOverride !== undefined ? statusOverride : reviewFilterStatus;
      const sr = searchOverride !== undefined ? searchOverride : reviewSearchQuery;
      
      const params = new URLSearchParams();
      if (st && st !== 'all') params.append('status', st);
      if (sr && sr.trim()) params.append('search', sr.trim());

      const res = await fetch(`/api/admin/reviews?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminReviews(data.reviews || []);
        setAdminReviewCounts(data.counts || { total: 0, pending: 0, approved: 0, rejected: 0 });
      }
    } catch (e) {
      console.error('Failed to fetch admin reviews:', e);
    } finally {
      setIsReviewsLoading(false);
    }
  };

  const handleUpdateReviewStatus = async (reviewId, newStatus) => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/admin/reviews/${reviewId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Review successfully marked as ${newStatus}`);
        fetchAdminReviews();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to update review status', 'error');
      }
    } catch (e) {
      console.error('Update review error:', e);
      showToast('Error updating review status', 'error');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Review permanently deleted');
        fetchAdminReviews();
      } else {
        showToast('Failed to delete review', 'error');
      }
    } catch (e) {
      console.error('Delete review error:', e);
      showToast('Error deleting review', 'error');
    }
  };

  // --- ADMIN TEAM HANDLERS ---
  const fetchAdminTeam = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      setIsAdminTeamLoading(true);
      const res = await fetch('/api/admin/team', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminTeam(data.admins || []);
        setCurrentLoggedInAdminId(data.currentAdminId);
      }
    } catch (err) {
      console.error('Failed to fetch admin team:', err);
    } finally {
      setIsAdminTeamLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (newAdminForm.password !== newAdminForm.confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (newAdminForm.password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    setIsSubmittingAdmin(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/admin/team/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newAdminForm.name,
          email: newAdminForm.email,
          password: newAdminForm.password
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message || 'Admin successfully created!');
        setIsCreateAdminModalOpen(false);
        setNewAdminForm({ name: '', email: '', password: '', confirmPassword: '' });
        fetchAdminTeam();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to create admin', 'error');
      }
    } catch (err) {
      console.error('Create admin error:', err);
      showToast('Network error creating admin', 'error');
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleRevokeAdmin = async (adminId, adminName) => {
    if (!window.confirm(`Are you sure you want to revoke admin permissions for ${adminName}?`)) return;
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/admin/team/${adminId}/revoke`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast(`Admin permissions revoked for ${adminName}`);
        fetchAdminTeam();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to revoke admin', 'error');
      }
    } catch (err) {
      console.error('Revoke admin error:', err);
    }
  };

  const handleDeleteAdmin = async (adminId, adminName) => {
    if (!window.confirm(`Are you sure you want to permanently delete the account of ${adminName}?`)) return;
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/admin/team/${adminId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast(`Admin account deleted.`);
        fetchAdminTeam();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to delete admin', 'error');
      }
    } catch (err) {
      console.error('Delete admin error:', err);
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    await fetchProducts();
    await fetchIngredients();
    await fetchAdSpends();
    await fetchAdminReviews();
    await fetchAdminTeam();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    fetchProducts();
    fetchIngredients();

    if (currentUser?.is_admin) {
      fetchOrders();
      fetchAdSpends();
      fetchAdminReviews();

      const interval = setInterval(() => {
        fetchOrders();
        fetchAdSpends();
        fetchProducts();
        fetchAdminReviews();
      }, 4000); // Live poll every 4s for instant stock, order & review updates

      return () => clearInterval(interval);
    }
  }, [currentUser, reviewFilterStatus]);

  if (!currentUser?.is_admin) {
    return (
      <div className="container text-center" style={{ padding: '4rem 0' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  // --- TIME PERIOD & CALENDAR ANALYTICS STATE & CALCULATIONS ---
  const now = new Date();
  
  // Custom Date range state (default to last 30 days)
  const defaultStartStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const defaultEndStr = new Date().toISOString().split('T')[0];
  const [customStartDate, setCustomStartDate] = useState(defaultStartStr);
  const [customEndDate, setCustomEndDate] = useState(defaultEndStr);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [analyticsSubTab, setAnalyticsSubTab] = useState('all'); // 'all', 'roas', 'dayparting', 'seasons', 'mediabuyer'
  const [targetMargin, setTargetMargin] = useState(50); // % Gross margin for Target CPA calculation
  const [targetRoasGoal, setTargetRoasGoal] = useState(3.0); // Target ROAS multiplier
  const [chartViewMode, setChartViewMode] = useState('both'); // 'both', 'revenue', 'orders'

  // Safe date parser for orders (handles SQLite UTC timestamps correctly)
  const parseOrderDate = (d) => {
    if (!d) return new Date();
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(d)) {
      return new Date(d.replace(' ', 'T') + 'Z');
    }
    return new Date(d);
  };

  // Helper to filter orders by time range
  const getOrdersForRange = (range, startCustom = customStartDate, endCustom = customEndDate) => {
    if (range === 'all') return orders;
    const nowTime = new Date();

    if (range === 'today') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return orders.filter(o => parseOrderDate(o.created_at) >= start);
    }

    if (range === 'yesterday') {
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return orders.filter(o => {
        const d = new Date(o.created_at);
        return d >= start && d <= end;
      });
    }

    if (range === 'week') {
      const start = new Date(nowTime.getTime() - 7 * 24 * 60 * 60 * 1000);
      return orders.filter(o => new Date(o.created_at) >= start);
    }

    if (range === 'month') {
      const start = new Date(nowTime.getTime() - 30 * 24 * 60 * 60 * 1000);
      return orders.filter(o => new Date(o.created_at) >= start);
    }

    if (range === 'this_month') {
      const start = new Date(nowTime.getFullYear(), nowTime.getMonth(), 1, 0, 0, 0);
      return orders.filter(o => new Date(o.created_at) >= start);
    }

    if (range === 'last_month') {
      const start = new Date(nowTime.getFullYear(), nowTime.getMonth() - 1, 1, 0, 0, 0);
      const end = new Date(nowTime.getFullYear(), nowTime.getMonth(), 0, 23, 59, 59, 999);
      return orders.filter(o => {
        const d = new Date(o.created_at);
        return d >= start && d <= end;
      });
    }

    if (range === 'year') {
      const start = new Date(nowTime.getTime() - 365 * 24 * 60 * 60 * 1000);
      return orders.filter(o => new Date(o.created_at) >= start);
    }

    if (range === 'custom') {
      if (!startCustom || !endCustom) return orders;
      const start = new Date(`${startCustom}T00:00:00`);
      const end = new Date(`${endCustom}T23:59:59.999`);
      return orders.filter(o => {
        const d = new Date(o.created_at);
        return d >= start && d <= end;
      });
    }

    return orders;
  };

  // Helper to get orders for the previous period to calculate growth rates
  const getPreviousPeriodOrders = (range, startCustom = customStartDate, endCustom = customEndDate) => {
    if (range === 'all') return [];
    const nowTime = new Date();

    if (range === 'today') {
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return orders.filter(o => {
        const d = new Date(o.created_at);
        return d >= start && d <= end;
      });
    }

    if (range === 'yesterday') {
      const start = new Date();
      start.setDate(start.getDate() - 2);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setDate(end.getDate() - 2);
      end.setHours(23, 59, 59, 999);
      return orders.filter(o => {
        const d = new Date(o.created_at);
        return d >= start && d <= end;
      });
    }

    if (range === 'week') {
      const start = new Date(nowTime.getTime() - 14 * 24 * 60 * 60 * 1000);
      const end = new Date(nowTime.getTime() - 7 * 24 * 60 * 60 * 1000);
      return orders.filter(o => {
        const d = new Date(o.created_at);
        return d >= start && d < end;
      });
    }

    if (range === 'month') {
      const start = new Date(nowTime.getTime() - 60 * 24 * 60 * 60 * 1000);
      const end = new Date(nowTime.getTime() - 30 * 24 * 60 * 60 * 1000);
      return orders.filter(o => {
        const d = new Date(o.created_at);
        return d >= start && d < end;
      });
    }

    if (range === 'this_month') {
      const start = new Date(nowTime.getFullYear(), nowTime.getMonth() - 1, 1, 0, 0, 0);
      const end = new Date(nowTime.getFullYear(), nowTime.getMonth() - 1, nowTime.getDate(), 23, 59, 59, 999);
      return orders.filter(o => {
        const d = new Date(o.created_at);
        return d >= start && d <= end;
      });
    }

    if (range === 'last_month') {
      const start = new Date(nowTime.getFullYear(), nowTime.getMonth() - 2, 1, 0, 0, 0);
      const end = new Date(nowTime.getFullYear(), nowTime.getMonth() - 1, 0, 23, 59, 59, 999);
      return orders.filter(o => {
        const d = new Date(o.created_at);
        return d >= start && d <= end;
      });
    }

    if (range === 'year') {
      const start = new Date(nowTime.getTime() - 730 * 24 * 60 * 60 * 1000);
      const end = new Date(nowTime.getTime() - 365 * 24 * 60 * 60 * 1000);
      return orders.filter(o => {
        const d = new Date(o.created_at);
        return d >= start && d < end;
      });
    }

    if (range === 'custom') {
      if (!startCustom || !endCustom) return [];
      const start = new Date(`${startCustom}T00:00:00`);
      const end = new Date(`${endCustom}T23:59:59.999`);
      const spanMs = end.getTime() - start.getTime();
      const prevStart = new Date(start.getTime() - spanMs);
      const prevEnd = new Date(start.getTime() - 1);
      return orders.filter(o => {
        const d = new Date(o.created_at);
        return d >= prevStart && d <= prevEnd;
      });
    }

    return [];
  };

  const periodOrders = getOrdersForRange(timeRange);
  const prevPeriodOrders = getPreviousPeriodOrders(timeRange);

  const nonCancelledOrders = periodOrders.filter(o => o.status !== 'Cancelled' && o.status !== 'Returned');
  const prevNonCancelled = prevPeriodOrders.filter(o => o.status !== 'Cancelled' && o.status !== 'Returned');

  const totalRevenue = nonCancelledOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const prevRevenue = prevNonCancelled.reduce((sum, order) => sum + (order.total || 0), 0);

  const totalOrdersCount = periodOrders.length;
  const prevOrdersCount = prevPeriodOrders.length;

  const deliveredOrdersCount = periodOrders.filter(o => o.status === 'Delivered').length;
  const deliveryRate = totalOrdersCount > 0 ? Math.round((deliveredOrdersCount / totalOrdersCount) * 100) : 0;
  
  const cancelledOrdersCount = periodOrders.filter(o => o.status === 'Cancelled' || o.status === 'Returned').length;
  const cancellationRate = totalOrdersCount > 0 ? Math.round((cancelledOrdersCount / totalOrdersCount) * 100) : 0;
  
  const aov = nonCancelledOrders.length > 0 ? (totalRevenue / nonCancelledOrders.length).toFixed(2) : '0.00';
  const prevAov = prevNonCancelled.length > 0 ? (prevRevenue / prevNonCancelled.length).toFixed(2) : '0.00';

  // Growth percentage calculations
  const calculateGrowth = (curr, prev) => {
    if (!prev || prev === 0) return null;
    return (((curr - prev) / prev) * 100).toFixed(1);
  };

  const revenueGrowth = calculateGrowth(totalRevenue, prevRevenue);
  const ordersGrowth = calculateGrowth(totalOrdersCount, prevOrdersCount);
  const aovGrowth = calculateGrowth(parseFloat(aov), parseFloat(prevAov));

  // Date range label
  const getDateRangeLabel = () => {
    if (timeRange === 'today') return 'Today (Last 24 Hours)';
    if (timeRange === 'yesterday') return 'Yesterday';
    if (timeRange === 'week') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return `Past 7 Days (${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`;
    }
    if (timeRange === 'month') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return `Past 30 Days (${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`;
    }
    if (timeRange === 'this_month') {
      return `This Month (${now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })})`;
    }
    if (timeRange === 'last_month') {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return `Last Month (${prev.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })})`;
    }
    if (timeRange === 'year') {
      return `Past 12 Months (${now.getFullYear() - 1} – ${now.getFullYear()})`;
    }
    if (timeRange === 'custom') {
      const s = new Date(`${customStartDate}T00:00:00`);
      const e = new Date(`${customEndDate}T00:00:00`);
      const diffDays = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1);
      return `Custom: ${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} – ${e.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} (${diffDays} days)`;
    }
    return `All-Time Store History (${orders.length} total recorded orders)`;
  };

  const statusCounts = periodOrders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});
  
  const pieData = Object.keys(statusCounts).map(status => ({
    name: status,
    value: statusCounts[status]
  }));
  
  const STATUS_COLORS = {
    'Delivered': '#10b981',   // Emerald Green (Success / Delivered)
    'Shipped': '#3b82f6',     // Bright Royal Blue (In Transit / Shipped)
    'Processing': '#f59e0b',  // Warm Amber (In Progress / Processing)
    'Cancelled': '#ef4444',   // Rose Red (Cancelled / Alert)
    'Returned': '#8b5cf6'     // Purple (Returned)
  };

  const revenueByDateMap = nonCancelledOrders.reduce((acc, order) => {
    const date = new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (!acc[date]) {
      acc[date] = { revenue: 0, orders: 0 };
    }
    acc[date].revenue += (order.total || 0);
    acc[date].orders += 1;
    return acc;
  }, {});
  
  const revenueChartData = Object.keys(revenueByDateMap).map(date => ({
    date,
    revenue: parseFloat(revenueByDateMap[date].revenue.toFixed(2)),
    orders: revenueByDateMap[date].orders
  }));

  // --- 1. AD DAYPARTING & BEST DAYS OF WEEK ---
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const ORDERED_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const dayOfWeekMap = ORDERED_DAYS.reduce((acc, day) => {
    acc[day] = { day, shortDay: day.substring(0, 3), revenue: 0, orders: 0 };
    return acc;
  }, {});

  nonCancelledOrders.forEach(o => {
    const d = new Date(o.created_at);
    const dayName = DAY_NAMES[d.getDay()];
    if (dayOfWeekMap[dayName]) {
      dayOfWeekMap[dayName].revenue += (o.total || 0);
      dayOfWeekMap[dayName].orders += 1;
    }
  });

  const dayOfWeekData = ORDERED_DAYS.map(day => {
    const item = dayOfWeekMap[day];
    const aovVal = item.orders > 0 ? (item.revenue / item.orders).toFixed(2) : '0.00';
    const revShare = totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(1) : '0.0';
    return {
      day: item.day,
      shortDay: item.shortDay,
      revenue: parseFloat(item.revenue.toFixed(2)),
      orders: item.orders,
      aov: parseFloat(aovVal),
      revShare: parseFloat(revShare)
    };
  });

  const sortedDaysByRev = [...dayOfWeekData].sort((a, b) => b.revenue - a.revenue);
  const bestDay = sortedDaysByRev[0]?.revenue > 0 ? sortedDaysByRev[0] : null;
  const secondBestDay = sortedDaysByRev[1]?.revenue > 0 ? sortedDaysByRev[1] : null;
  const lowestDay = sortedDaysByRev.length > 0 ? sortedDaysByRev[sortedDaysByRev.length - 1] : null;

  // --- 2. PEAK BUYING HOURS & TIME OF DAY HEATMAP ---
  const hourlyMap = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    hourNum: i,
    revenue: 0,
    orders: 0
  }));

  const timeBlocks = {
    morning: { label: 'Morning (06:00 - 12:00)', icon: '🌅', orders: 0, revenue: 0 },
    afternoon: { label: 'Afternoon (12:00 - 18:00)', icon: '☀️', orders: 0, revenue: 0 },
    evening: { label: 'Prime Evening (18:00 - 00:00)', icon: '🌙', orders: 0, revenue: 0 },
    night: { label: 'Late Night (00:00 - 06:00)', icon: '🌌', orders: 0, revenue: 0 },
  };

  nonCancelledOrders.forEach(o => {
    const d = new Date(o.created_at);
    const hour = d.getHours();
    if (hourlyMap[hour]) {
      hourlyMap[hour].revenue += (o.total || 0);
      hourlyMap[hour].orders += 1;
    }
    if (hour >= 6 && hour < 12) {
      timeBlocks.morning.orders += 1;
      timeBlocks.morning.revenue += (o.total || 0);
    } else if (hour >= 12 && hour < 18) {
      timeBlocks.afternoon.orders += 1;
      timeBlocks.afternoon.revenue += (o.total || 0);
    } else if (hour >= 18 && hour < 24) {
      timeBlocks.evening.orders += 1;
      timeBlocks.evening.revenue += (o.total || 0);
    } else {
      timeBlocks.night.orders += 1;
      timeBlocks.night.revenue += (o.total || 0);
    }
  });

  const peakHour = [...hourlyMap].sort((a, b) => b.revenue - a.revenue)[0];
  const sortedBlocks = Object.entries(timeBlocks).sort((a, b) => b[1].revenue - a[1].revenue);
  const bestTimeBlock = sortedBlocks[0] ? sortedBlocks[0][1] : null;

  // --- 3. SEASONALITY & "HOT SEASONS" TRENDS ---
  const monthlySeasonMap = {};
  nonCancelledOrders.forEach(o => {
    const d = new Date(o.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthName = d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    if (!monthlySeasonMap[key]) {
      monthlySeasonMap[key] = { key, monthName, rawDate: d, revenue: 0, orders: 0 };
    }
    monthlySeasonMap[key].revenue += (o.total || 0);
    monthlySeasonMap[key].orders += 1;
  });

  const sortedMonthKeys = Object.keys(monthlySeasonMap).sort();
  const monthlySeasonData = sortedMonthKeys.map((key, index) => {
    const curr = monthlySeasonMap[key];
    const prevKey = sortedMonthKeys[index - 1];
    let momGrowth = null;
    if (prevKey && monthlySeasonMap[prevKey].revenue > 0) {
      momGrowth = (((curr.revenue - monthlySeasonMap[prevKey].revenue) / monthlySeasonMap[prevKey].revenue) * 100).toFixed(1);
    }
    const aovVal = curr.orders > 0 ? (curr.revenue / curr.orders).toFixed(2) : '0.00';
    return {
      ...curr,
      revenue: parseFloat(curr.revenue.toFixed(2)),
      aov: parseFloat(aovVal),
      momGrowth: momGrowth ? parseFloat(momGrowth) : null
    };
  });

  const avgMonthlyRev = monthlySeasonData.length > 0 
    ? monthlySeasonData.reduce((s, m) => s + m.revenue, 0) / monthlySeasonData.length 
    : 0;

  const monthlySeasonWithStatus = monthlySeasonData.map(m => {
    let status = 'active'; // 'hot', 'active', 'cooldown'
    if (m.revenue >= avgMonthlyRev * 1.2 || (m.momGrowth && m.momGrowth >= 20)) {
      status = 'hot';
    } else if (m.revenue < avgMonthlyRev * 0.75 && m.momGrowth !== null && m.momGrowth < -15) {
      status = 'cooldown';
    }
    return { ...m, status };
  });

  const peakMonth = [...monthlySeasonWithStatus].sort((a, b) => b.revenue - a.revenue)[0];
  const fastestGrowthMonth = [...monthlySeasonWithStatus].filter(m => m.momGrowth !== null).sort((a, b) => b.momGrowth - a.momGrowth)[0];

  // Quarterly Breakdown
  const quarterMap = {
    'Q1': { name: 'Q1 (Jan-Mar)', label: 'Q1', revenue: 0, orders: 0, theme: 'Valentine & Spring Refresh' },
    'Q2': { name: 'Q2 (Apr-Jun)', label: 'Q2', revenue: 0, orders: 0, theme: 'Eid, Weddings & Summer Glow' },
    'Q3': { name: 'Q3 (Jul-Sep)', label: 'Q3', revenue: 0, orders: 0, theme: 'Late Summer & Back-to-Routine' },
    'Q4': { name: 'Q4 (Oct-Dec)', label: 'Q4', revenue: 0, orders: 0, theme: 'Black Friday & Holiday Peak 🔥' }
  };

  nonCancelledOrders.forEach(o => {
    const d = new Date(o.created_at);
    const m = d.getMonth();
    let q = 'Q1';
    if (m >= 3 && m <= 5) q = 'Q2';
    else if (m >= 6 && m <= 8) q = 'Q3';
    else if (m >= 9 && m <= 11) q = 'Q4';
    quarterMap[q].revenue += (o.total || 0);
    quarterMap[q].orders += 1;
  });

  const quarterData = Object.values(quarterMap).map(q => ({
    ...q,
    revenue: parseFloat(q.revenue.toFixed(2)),
    revShare: totalRevenue > 0 ? ((q.revenue / totalRevenue) * 100).toFixed(1) : '0.0'
  }));

  // --- 4. MEDIA BUYER SUITE: CPA, ROAS, FUNNEL & HERO CREATIVES ---
  const numericAov = parseFloat(aov) || 0;
  const breakEvenCpa = (numericAov * (targetMargin / 100)).toFixed(2);
  const targetCpa2x = (numericAov / 2).toFixed(2);
  const targetCpa3x = (numericAov / 3).toFixed(2);
  const targetCpa4x = (numericAov / 4).toFixed(2);
  const customTargetCpa = targetRoasGoal > 0 ? (numericAov / targetRoasGoal).toFixed(2) : '0.00';

  // Customer Acquisition vs Retention
  const customerOrderMap = {};
  nonCancelledOrders.forEach(o => {
    const identifier = o.user_email || o.customer_phone || o.user_name || `customer-${o.id}`;
    if (!customerOrderMap[identifier]) {
      customerOrderMap[identifier] = { count: 0, totalSpend: 0, name: o.user_name || 'Customer', email: o.user_email || '' };
    }
    customerOrderMap[identifier].count += 1;
    customerOrderMap[identifier].totalSpend += (o.total || 0);
  });

  const uniqueCustomersCount = Object.keys(customerOrderMap).length;
  const returningCustomers = Object.values(customerOrderMap).filter(c => c.count > 1);
  const firstTimeCustomers = Object.values(customerOrderMap).filter(c => c.count === 1);
  
  const repeatCustomerRate = uniqueCustomersCount > 0 
    ? Math.round((returningCustomers.length / uniqueCustomersCount) * 100) 
    : 0;

  const repeatRevenue = returningCustomers.reduce((s, c) => s + c.totalSpend, 0);
  const firstTimeRevenue = firstTimeCustomers.reduce((s, c) => s + c.totalSpend, 0);

  // Top Buyers
  const topBuyers = Object.entries(customerOrderMap)
    .map(([email, data]) => ({ email, name: data.name, spend: data.totalSpend, orders: data.count }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  // Top Sellers & Ad Hero Creatives
  const productSales = nonCancelledOrders.reduce((acc, order) => {
    (order.items || []).forEach(item => {
      if (!acc[item.product_name]) {
        acc[item.product_name] = { name: item.product_name, quantity: 0, revenue: 0 };
      }
      acc[item.product_name].quantity += item.quantity;
      acc[item.product_name].revenue += (item.quantity * item.price);
    });
    return acc;
  }, {});

  const sortedByQuantity = Object.values(productSales).sort((a, b) => b.quantity - a.quantity);
  const sortedByRevenue = Object.values(productSales).sort((a, b) => b.revenue - a.revenue);

  const topSellers = sortedByQuantity.slice(0, 5);
  const tofHeroProduct = sortedByQuantity[0] || null; // Cold Traffic Hero
  const valueHeroProduct = sortedByRevenue[0] || null; // High AOV Scaler

  // Repurchase Time
  const userOrderDates = nonCancelledOrders.reduce((acc, order) => {
    const key = order.user_email || order.user_name;
    if (key) {
      if (!acc[key]) {
        acc[key] = { name: order.user_name || 'Customer', dates: [] };
      }
      acc[key].dates.push(new Date(order.created_at));
    }
    return acc;
  }, {});

  const repurchaseData = Object.entries(userOrderDates)
    .filter(([email, data]) => data.dates.length > 1)
    .map(([email, data]) => {
      const sortedDates = data.dates.sort((a, b) => a - b);
      let totalDiffMs = 0;
      for (let i = 1; i < sortedDates.length; i++) {
        totalDiffMs += (sortedDates[i] - sortedDates[i-1]);
      }
      const avgDiffDays = totalDiffMs / (sortedDates.length - 1) / (1000 * 60 * 60 * 24);
      return { email, name: data.name, avgDays: avgDiffDays.toFixed(1), totalOrders: data.dates.length };
    })
    .sort((a, b) => parseFloat(a.avgDays) - parseFloat(b.avgDays))
    .slice(0, 10);

  // --- 5. AD SPEND, BLENDED ROAS, MER & NET PROFIT CALCULATIONS ---
  const getAdSpendsForRange = (range, startCustom = customStartDate, endCustom = customEndDate) => {
    if (range === 'all') return adSpends;
    const nowTime = new Date();

    if (range === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      return adSpends.filter(s => s.date === todayStr);
    }

    if (range === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      return adSpends.filter(s => s.date === yStr);
    }

    if (range === 'week') {
      const start = new Date(nowTime.getTime() - 7 * 24 * 60 * 60 * 1000);
      return adSpends.filter(s => new Date(s.date) >= start);
    }

    if (range === 'month') {
      const start = new Date(nowTime.getTime() - 30 * 24 * 60 * 60 * 1000);
      return adSpends.filter(s => new Date(s.date) >= start);
    }

    if (range === 'this_month') {
      const currentPrefix = `${nowTime.getFullYear()}-${String(nowTime.getMonth() + 1).padStart(2, '0')}`;
      return adSpends.filter(s => s.date && s.date.startsWith(currentPrefix));
    }

    if (range === 'last_month') {
      const prevDate = new Date(nowTime.getFullYear(), nowTime.getMonth() - 1, 1);
      const prevPrefix = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      return adSpends.filter(s => s.date && s.date.startsWith(prevPrefix));
    }

    if (range === 'year') {
      const start = new Date(nowTime.getTime() - 365 * 24 * 60 * 60 * 1000);
      return adSpends.filter(s => new Date(s.date) >= start);
    }

    if (range === 'custom') {
      return adSpends.filter(s => s.date >= startCustom && s.date <= endCustom);
    }

    return adSpends;
  };

  const periodAdSpends = getAdSpendsForRange(timeRange);
  const totalAdSpend = periodAdSpends.reduce((sum, item) => sum + (item.amount || 0), 0);
  
  const metaSpend = periodAdSpends.filter(s => s.platform === 'Meta Ads').reduce((sum, item) => sum + (item.amount || 0), 0);
  const tiktokSpend = periodAdSpends.filter(s => s.platform === 'TikTok Ads').reduce((sum, item) => sum + (item.amount || 0), 0);
  const googleSpend = periodAdSpends.filter(s => s.platform === 'Google Ads').reduce((sum, item) => sum + (item.amount || 0), 0);
  const snapSpend = periodAdSpends.filter(s => s.platform === 'Snapchat Ads').reduce((sum, item) => sum + (item.amount || 0), 0);
  const otherSpend = periodAdSpends.filter(s => !['Meta Ads', 'TikTok Ads', 'Google Ads', 'Snapchat Ads'].includes(s.platform)).reduce((sum, item) => sum + (item.amount || 0), 0);

  // Blended ROAS (Revenue / Ad Spend)
  const blendedRoas = totalAdSpend > 0 ? (totalRevenue / totalAdSpend).toFixed(2) : null;
  // MER % (Ad Spend / Revenue)
  const merPercent = totalRevenue > 0 && totalAdSpend > 0 ? ((totalAdSpend / totalRevenue) * 100).toFixed(1) : null;
  // Unit Economics Waterfall
  const cogsTotal = totalRevenue * (productCogsPercent / 100);
  const grossProfit = totalRevenue - cogsTotal;
  const poas = totalAdSpend > 0 ? (grossProfit / totalAdSpend).toFixed(2) : null;
  const shippingTotal = nonCancelledOrders.length * estShippingPerOrder;
  const netProfit = totalRevenue - cogsTotal - totalAdSpend - shippingTotal;
  const netMarginPercent = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';
  const blendedCac = nonCancelledOrders.length > 0 && totalAdSpend > 0 ? (totalAdSpend / nonCancelledOrders.length).toFixed(2) : null;

  // --- 6. TOP CITIES & REGIONAL GEO-TARGETING CALCULATIONS ---
  const cityStatsMap = {};

  periodOrders.forEach(order => {
    let cityName = 'Unspecified';
    if (order.shipping_details) {
      try {
        const ship = JSON.parse(order.shipping_details);
        if (ship.city && ship.city.trim()) {
          cityName = ship.city.trim();
          cityName = cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase();
        }
      } catch (e) {}
    }

    if (!cityStatsMap[cityName]) {
      cityStatsMap[cityName] = {
        city: cityName,
        totalOrders: 0,
        delivered: 0,
        cancelled: 0,
        processing: 0,
        revenue: 0,
      };
    }

    cityStatsMap[cityName].totalOrders += 1;
    if (order.status === 'Delivered') {
      cityStatsMap[cityName].delivered += 1;
    } else if (order.status === 'Cancelled' || order.status === 'Returned') {
      cityStatsMap[cityName].cancelled += 1;
    } else {
      cityStatsMap[cityName].processing += 1;
    }

    if (order.status !== 'Cancelled' && order.status !== 'Returned') {
      cityStatsMap[cityName].revenue += (order.total || 0);
    }
  });

  const cityPerformanceData = Object.values(cityStatsMap)
    .map(c => {
      const deliveryRate = c.totalOrders > 0 ? Math.round((c.delivered / c.totalOrders) * 100) : 0;
      const cancellationRate = c.totalOrders > 0 ? Math.round((c.cancelled / c.totalOrders) * 100) : 0;
      const validOrdersCount = c.totalOrders - c.cancelled;
      const aov = validOrdersCount > 0 ? (c.revenue / validOrdersCount).toFixed(2) : '0.00';
      const share = totalRevenue > 0 ? ((c.revenue / totalRevenue) * 100).toFixed(1) : '0.0';
      
      let tier = 'Tier 2 (Moderate)';
      let badgeColor = '#f59e0b';
      let actionTag = 'Maintain ⚡';
      if (deliveryRate >= 80 || (c.cancelled === 0 && c.totalOrders >= 2)) {
        tier = 'Tier 1 (High Scale)';
        badgeColor = '#10b981';
        actionTag = 'Scale Bids 🚀';
      } else if (cancellationRate >= 35 && c.totalOrders >= 2) {
        tier = 'Tier 3 (High Return Risk)';
        badgeColor = '#ef4444';
        actionTag = 'Exclude / Verify 🛑';
      }

      return {
        ...c,
        revenue: parseFloat(c.revenue.toFixed(2)),
        aov: parseFloat(aov),
        deliveryRate,
        cancellationRate,
        share: parseFloat(share),
        tier,
        badgeColor,
        actionTag
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const topCity = cityPerformanceData[0] || null;
  const bestDeliveryCity = [...cityPerformanceData].filter(c => c.totalOrders >= 2).sort((a, b) => b.deliveryRate - a.deliveryRate)[0] || null;
  const highRiskCities = cityPerformanceData.filter(c => c.cancellationRate >= 30 && c.totalOrders >= 2);
  const citiesCount = cityPerformanceData.length;

  // --- 7. BUNDLE & PRODUCT AFFINITY MATRIX ("FREQUENTLY BOUGHT TOGETHER") ---
  const productCoOccurrenceMap = {};
  const productFrequencyMap = {};
  let singleItemOrdersCount = 0;
  let multiItemOrdersCount = 0;
  let totalItemsInMultiOrders = 0;
  let multiOrderRevenueTotal = 0;

  nonCancelledOrders.forEach(order => {
    const items = order.items || [];
    const distinctProducts = [];
    const seen = new Set();

    items.forEach(it => {
      if (it.product_name && !seen.has(it.product_name)) {
        seen.add(it.product_name);
        distinctProducts.push({
          name: it.product_name,
          price: it.price || 0,
          image: it.product_image || ''
        });
      }
    });

    const totalDistinct = distinctProducts.length;
    const totalQuantity = items.reduce((s, it) => s + (it.quantity || 1), 0);

    if (totalDistinct <= 1 && totalQuantity <= 1) {
      singleItemOrdersCount += 1;
    } else {
      multiItemOrdersCount += 1;
      totalItemsInMultiOrders += totalQuantity;
      multiOrderRevenueTotal += (order.total || 0);
    }

    distinctProducts.forEach(p => {
      productFrequencyMap[p.name] = (productFrequencyMap[p.name] || 0) + 1;
    });

    for (let i = 0; i < distinctProducts.length; i++) {
      for (let j = 0; j < distinctProducts.length; j++) {
        if (i !== j) {
          const prodA = distinctProducts[i];
          const prodB = distinctProducts[j];
          const pairKey = `${prodA.name}::${prodB.name}`;

          if (!productCoOccurrenceMap[pairKey]) {
            productCoOccurrenceMap[pairKey] = {
              itemA: prodA.name,
              itemB: prodB.name,
              priceA: prodA.price,
              priceB: prodB.price,
              pairCount: 0
            };
          }
          productCoOccurrenceMap[pairKey].pairCount += 1;
        }
      }
    }
  });

  const totalValidOrders = nonCancelledOrders.length;
  const multiItemOrderRate = totalValidOrders > 0 
    ? Math.round((multiItemOrdersCount / totalValidOrders) * 100) 
    : 0;

  const multiOrderAov = multiItemOrdersCount > 0 
    ? (multiOrderRevenueTotal / multiItemOrdersCount).toFixed(2) 
    : '0.00';

  const bundleAffinityList = Object.values(productCoOccurrenceMap)
    .map(pair => {
      const freqA = productFrequencyMap[pair.itemA] || 1;
      const affinityPercent = Math.round((pair.pairCount / freqA) * 100);
      const combinedBundlePrice = (pair.priceA + pair.priceB).toFixed(2);
      const discountBundlePrice10 = ((pair.priceA + pair.priceB) * 0.9).toFixed(2);
      const discountBundlePrice15 = ((pair.priceA + pair.priceB) * 0.85).toFixed(2);

      let recommendation = '⚡ Cross-Sell Upsell';
      if (affinityPercent >= 50 && pair.pairCount >= 2) {
        recommendation = '🔥 Top Winning Meta Ad Bundle';
      } else if (affinityPercent >= 30) {
        recommendation = '✨ Recommended PDP Add-On';
      }

      return {
        ...pair,
        freqA,
        affinityPercent,
        combinedBundlePrice,
        discountBundlePrice10,
        discountBundlePrice15,
        recommendation
      };
    })
    .sort((a, b) => b.pairCount - a.pairCount || b.affinityPercent - a.affinityPercent);

  const topWinningBundle = bundleAffinityList[0] || null;

  const basketSizeData = [
    { name: '1 Item (Single)', count: singleItemOrdersCount, percentage: totalValidOrders > 0 ? Math.round((singleItemOrdersCount / totalValidOrders) * 100) : 0, fill: '#94a3b8' },
    { name: '2 Items (Bundle)', count: nonCancelledOrders.filter(o => (o.items || []).length === 2).length, percentage: totalValidOrders > 0 ? Math.round((nonCancelledOrders.filter(o => (o.items || []).length === 2).length / totalValidOrders) * 100) : 0, fill: '#3b82f6' },
    { name: '3+ Items (Heavy Cart)', count: nonCancelledOrders.filter(o => (o.items || []).length >= 3).length, percentage: totalValidOrders > 0 ? Math.round((nonCancelledOrders.filter(o => (o.items || []).length >= 3).length / totalValidOrders) * 100) : 0, fill: '#10b981' }
  ];
  // --- END ANALYTICS CALCULATIONS ---

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        fetchProducts();
        showToast(`Order #${orderId} marked as "${newStatus}". Real-world stock updated!`, 'success');
      } else {
        showToast('Failed to update order status. Please try again.', 'error');
      }
    } catch (e) {
      console.error('Failed to update status', e);
      showToast('An error occurred while updating the order status.', 'error');
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    
    let imageUrl = productForm.image;
    
    // Upload file if selected
    if (selectedFile) {
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      try {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
          body: formData
        });
        
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          imageUrl = data.imageUrl;
        } else {
          console.error('Failed to upload image');
          return; // Stop form submission if upload fails
        }
      } catch (err) {
        console.error('Upload error', err);
        return;
      }
    }

    // Upload gallery files if selected
    let uploadedGallery = [...productForm.images];
    if (galleryFiles && galleryFiles.length > 0) {
      for (const file of galleryFiles) {
        const formData = new FormData();
        formData.append('image', file);
        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
            body: formData
          });
          if (uploadRes.ok) {
            const data = await uploadRes.json();
            uploadedGallery.push(data.imageUrl);
          }
        } catch (err) {
          console.error('Gallery upload error', err);
        }
      }
    }
    
    // Update product form before sending
    productForm.images = uploadedGallery;

    const details = {
      gender: productForm.gender,
      scentFamily: productForm.scentFamily,
      luxuryPrice: productForm.luxuryPrice,
      scentDescription: productForm.scentDescription,
      topNotes: productForm.topNotes,
      middleNotes: productForm.middleNotes,
      baseNotes: productForm.baseNotes,
      ingredients: productForm.ingredients,
      mainNotesIds: productForm.mainNotesIds,
      images: productForm.images
    };

    const payload = { ...productForm, image: imageUrl, details };
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setIsProductModalOpen(false);
        setEditingProduct(null);
        setSelectedFile(null);
        setGalleryFiles([]);
        setProductForm(defaultFormState);
        fetchProducts();
      } else {
        const errData = await res.json();
        alert('Failed to save product: ' + (errData.error || 'Unknown error'));
      }
    } catch (e) {
      console.error('Failed to save product', e);
      alert('Failed to save product: Network error');
    }
  };

  const handleQuickStockUpdate = async (productId, newStock) => {
    const stockNum = parseInt(newStock);
    if (isNaN(stockNum) || stockNum < 0) return;

    // Optimistic UI update
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: stockNum } : p));

    try {
      const res = await fetch(`/api/products/${productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ stock: stockNum })
      });
      if (!res.ok) {
        fetchProducts(); // revert on failure
        showToast('Failed to update stock', 'error');
      } else {
        showToast('Stock inventory updated');
      }
    } catch (e) {
      console.error(e);
      fetchProducts();
    }
  };

  const openEditProduct = (prod) => {
    setEditingProduct(prod);
    setSelectedFile(null);
    setGalleryFiles([]);
    
    let parsedDetails = {};
    try {
      if (prod.details) parsedDetails = JSON.parse(prod.details);
    } catch (e) {}

    setProductForm({
      name: prod.name,
      inspiredBy: prod.inspiredBy || '',
      notes: prod.notes || '',
      price: prod.price.toString().replace(/[^0-9.]/g, ''),
      image: prod.image,
      category: prod.category || 'Rings',
      isNew: Boolean(prod.isNew),
      gender: parsedDetails.gender || 'Unisex',
      scentFamily: parsedDetails.scentFamily || prod.category || 'Geometric',
      luxuryPrice: parsedDetails.luxuryPrice || '',
      scentDescription: parsedDetails.scentDescription || '',
      topNotes: parsedDetails.topNotes || '',
      middleNotes: parsedDetails.middleNotes || '',
      baseNotes: parsedDetails.baseNotes || '',
      ingredients: parsedDetails.ingredients || '',
      stock: prod.stock !== undefined && prod.stock !== null ? prod.stock : 50,
      mainNotesIds: parsedDetails.mainNotesIds || [],
      images: parsedDetails.images || []
    });
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (res.ok) {
        fetchProducts();
        setProductToDelete(null);
      } else {
        const errData = await res.json();
        alert('Failed to delete product: ' + (errData.error || 'Unknown error'));
      }
    } catch (e) {
      console.error('Delete failed', e);
      alert('Failed to delete product: Network error');
    }
  };

  // Ingredient handlers
  const [ingredientForm, setIngredientForm] = useState({ name: '' });
  const [ingredientFile, setIngredientFile] = useState(null);

  const handleIngredientSubmit = async (e) => {
    e.preventDefault();
    if (!ingredientFile) {
      alert('Please select an icon image');
      return;
    }
    
    const formData = new FormData();
    formData.append('image', ingredientFile);
    
    try {
      // 1. Upload the icon
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        body: formData
      });
      
      if (uploadRes.ok) {
        const { imageUrl } = await uploadRes.json();
        
        // 2. Save ingredient
        const res = await fetch('/api/ingredients', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({ name: ingredientForm.name, icon: imageUrl })
        });
        
        if (res.ok) {
          setIngredientForm({ name: '' });
          setIngredientFile(null);
          // Reset file input visually
          document.getElementById('ingredient-file-input').value = '';
          fetchIngredients();
        }
      }
    } catch (err) {
      console.error('Failed to create ingredient', err);
    }
  };

  const handleDeleteIngredient = async (id) => {
    if (window.confirm('Are you sure you want to delete this ingredient?')) {
      try {
        const res = await fetch(`/api/ingredients/${id}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        if (res.ok) {
          fetchIngredients();
        }
      } catch (e) {
        console.error('Failed to delete ingredient', e);
      }
    }
  };

  return (
    <div className="admin-dashboard container animate-fade-in">
      <div className="admin-header">
        <div className="admin-header-flex">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Manage your jewelry store content, live sales, and fulfillment.</p>
          </div>
        </div>

        {/* Mobile Executive Quick Essential Glance Pills */}
        <div className="admin-mobile-quick-bar">
          <div className="mobile-quick-card revenue" onClick={() => setActiveTab('analytics')}>
            <div className="mobile-quick-icon"><TrendingUp size={16} /></div>
            <div className="mobile-quick-info">
              <span className="mobile-quick-label">Total Revenue</span>
              <span className="mobile-quick-val">{orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0).toFixed(0)} DH</span>
            </div>
          </div>

          <div className="mobile-quick-card orders" onClick={() => setActiveTab('orders')}>
            <div className="mobile-quick-icon"><ShoppingBag size={16} /></div>
            <div className="mobile-quick-info">
              <span className="mobile-quick-label">Orders ({orders.length})</span>
              <span className="mobile-quick-val" style={{ color: orders.filter(o => o.status === 'Processing').length > 0 ? '#d97706' : '#059669' }}>
                {orders.filter(o => o.status === 'Processing').length} Pending
              </span>
            </div>
          </div>

          <div className="mobile-quick-card stock" onClick={() => setActiveTab('products')}>
            <div className="mobile-quick-icon"><Package size={16} /></div>
            <div className="mobile-quick-info">
              <span className="mobile-quick-label">Catalog ({products.length})</span>
              <span className="mobile-quick-val" style={{ color: products.filter(p => (p.stock !== null && p.stock <= 5)).length > 0 ? '#dc2626' : '#059669' }}>
                {products.filter(p => (p.stock !== null && p.stock <= 5)).length} Low Stock
              </span>
            </div>
          </div>

          <div className="mobile-quick-card reviews" onClick={() => { setActiveTab('reviews'); fetchAdminReviews(); }}>
            <div className="mobile-quick-icon"><MessageSquare size={16} /></div>
            <div className="mobile-quick-info">
              <span className="mobile-quick-label">Reviews ({adminReviewCounts.total})</span>
              <span className="mobile-quick-val" style={{ color: adminReviewCounts.pending > 0 ? '#d97706' : '#059669' }}>
                {adminReviewCounts.pending} To Moderate
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={18} /> Analytics & Media Buying
          <span className="badge" style={{ fontSize: '0.72rem', background: activeTab === 'analytics' ? 'rgba(255,255,255,0.2)' : '#ecfdf5', color: activeTab === 'analytics' ? '#fff' : '#059669' }}>
            ⚡ Pro Intel
          </span>
        </button>
        <button 
          className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <ShoppingBag size={18} /> Orders
          <span className="badge" style={{ fontSize: '0.72rem', background: activeTab === 'orders' ? 'rgba(255,255,255,0.2)' : '#f1f5f9', color: activeTab === 'orders' ? '#fff' : '#475569' }}>
            {orders.length}
          </span>
        </button>
        <button 
          className={`admin-tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <Package size={18} /> Products
          <span className="badge" style={{ fontSize: '0.72rem', background: activeTab === 'products' ? 'rgba(255,255,255,0.2)' : '#f1f5f9', color: activeTab === 'products' ? '#fff' : '#475569' }}>
            {products.length}
          </span>
        </button>
        <button 
          className={`admin-tab ${activeTab === 'ingredients' ? 'active' : ''}`}
          onClick={() => setActiveTab('ingredients')}
        >
          <FlaskConical size={18} /> Ingredients
          <span className="badge" style={{ fontSize: '0.72rem', background: activeTab === 'ingredients' ? 'rgba(255,255,255,0.2)' : '#f1f5f9', color: activeTab === 'ingredients' ? '#fff' : '#475569' }}>
            {ingredientsList.length}
          </span>
        </button>
        <button 
          className={`admin-tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('reviews');
            fetchAdminReviews();
          }}
        >
          <MessageSquare size={18} /> Reviews & Moderation
          {adminReviewCounts.pending > 0 ? (
            <span className="badge" style={{ fontSize: '0.72rem', background: activeTab === 'reviews' ? '#d97706' : '#f59e0b', color: '#fff', fontWeight: '700' }}>
              ⏳ {adminReviewCounts.pending} Pending
            </span>
          ) : (
            <span className="badge" style={{ fontSize: '0.72rem', background: activeTab === 'reviews' ? 'rgba(255,255,255,0.2)' : '#f1f5f9', color: activeTab === 'reviews' ? '#fff' : '#475569' }}>
              {adminReviewCounts.total}
            </span>
          )}
        </button>
        <button 
          className={`admin-tab ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('team');
            fetchAdminTeam();
          }}
        >
          <Users size={18} /> Team & Admins
          <span className="badge" style={{ fontSize: '0.72rem', background: activeTab === 'team' ? 'rgba(255,255,255,0.2)' : '#f1f5f9', color: activeTab === 'team' ? '#fff' : '#475569' }}>
            {adminTeam.length || 1}
          </span>
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'analytics' && (
          <div className="admin-panel animate-fade-in">
            {/* Header & Date Range Toolbar */}
            <div className="analytics-header-row">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h2 style={{ margin: 0 }}>Analytics & Media Buying Suite</h2>
                  <span className="badge" style={{ background: '#000', color: '#fff', fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                    <Sparkles size={12} style={{ display: 'inline', marginRight: '3px' }} /> Pro Intelligence
                  </span>
                </div>
                <div className="period-range-label" style={{ marginTop: '0.5rem' }}>
                  <Calendar size={14} color="#64748b" />
                  <span>{getDateRangeLabel()}</span>
                  {timeRange === 'custom' && (
                    <button 
                      onClick={() => setIsCalendarOpen(!isCalendarOpen)} 
                      style={{ border: 'none', background: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline', padding: '0 0.3rem' }}
                    >
                      {isCalendarOpen ? 'Hide Picker' : 'Edit Dates'}
                    </button>
                  )}
                </div>
              </div>

              {/* Time Period Selector & Calendar Trigger */}
              <div className="period-selector-wrapper" style={{ flexWrap: 'wrap', gap: '0.35rem' }}>
                <button 
                  className={`period-btn ${timeRange === 'today' ? 'active' : ''}`}
                  onClick={() => { setTimeRange('today'); setIsCalendarOpen(false); }}
                >
                  Today
                </button>
                <button 
                  className={`period-btn ${timeRange === 'yesterday' ? 'active' : ''}`}
                  onClick={() => { setTimeRange('yesterday'); setIsCalendarOpen(false); }}
                >
                  Yesterday
                </button>
                <button 
                  className={`period-btn ${timeRange === 'week' ? 'active' : ''}`}
                  onClick={() => { setTimeRange('week'); setIsCalendarOpen(false); }}
                >
                  7 Days
                </button>
                <button 
                  className={`period-btn ${timeRange === 'month' ? 'active' : ''}`}
                  onClick={() => { setTimeRange('month'); setIsCalendarOpen(false); }}
                >
                  30 Days
                </button>
                <button 
                  className={`period-btn ${timeRange === 'this_month' ? 'active' : ''}`}
                  onClick={() => { setTimeRange('this_month'); setIsCalendarOpen(false); }}
                >
                  This Month
                </button>
                <button 
                  className={`period-btn ${timeRange === 'last_month' ? 'active' : ''}`}
                  onClick={() => { setTimeRange('last_month'); setIsCalendarOpen(false); }}
                >
                  Last Month
                </button>
                <button 
                  className={`period-btn ${timeRange === 'year' ? 'active' : ''}`}
                  onClick={() => { setTimeRange('year'); setIsCalendarOpen(false); }}
                >
                  1 Year
                </button>
                <button 
                  className={`period-btn ${timeRange === 'all' ? 'active' : ''}`}
                  onClick={() => { setTimeRange('all'); setIsCalendarOpen(false); }}
                >
                  All Time
                </button>
                <button 
                  className={`period-btn ${timeRange === 'custom' ? 'active' : ''}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => { setTimeRange('custom'); setIsCalendarOpen(true); }}
                >
                  <CalendarDays size={13} /> Custom Days
                </button>
              </div>
            </div>

            {/* Custom Interactive Calendar Date Range Drawer */}
            {(isCalendarOpen || timeRange === 'custom') && (
              <div className="custom-calendar-box animate-fade-in" style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                margin: '1rem 0 1.5rem 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>From Date:</span>
                    <input 
                      type="date"
                      value={customStartDate}
                      onChange={(e) => {
                        setCustomStartDate(e.target.value);
                        setTimeRange('custom');
                      }}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#fff',
                        fontSize: '0.85rem',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>To Date:</span>
                    <input 
                      type="date"
                      value={customEndDate}
                      onChange={(e) => {
                        setCustomEndDate(e.target.value);
                        setTimeRange('custom');
                      }}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#fff',
                        fontSize: '0.85rem',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => {
                      const nowD = new Date();
                      const d14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
                      setCustomStartDate(d14.toISOString().split('T')[0]);
                      setCustomEndDate(nowD.toISOString().split('T')[0]);
                      setTimeRange('custom');
                    }}
                    className="btn-secondary btn-small"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
                  >
                    Last 14 Days
                  </button>
                  <button 
                    onClick={() => {
                      const nowD = new Date();
                      const d60 = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
                      setCustomStartDate(d60.toISOString().split('T')[0]);
                      setCustomEndDate(nowD.toISOString().split('T')[0]);
                      setTimeRange('custom');
                    }}
                    className="btn-secondary btn-small"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
                  >
                    Last 60 Days
                  </button>
                  <button 
                    onClick={() => {
                      const nowD = new Date();
                      const d90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
                      setCustomStartDate(d90.toISOString().split('T')[0]);
                      setCustomEndDate(nowD.toISOString().split('T')[0]);
                      setTimeRange('custom');
                    }}
                    className="btn-secondary btn-small"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
                  >
                    Last 90 Days
                  </button>
                </div>
              </div>
            )}

            {/* Executive Quick-Glance Ribbon */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '0.75rem',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.85rem 1.25rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>💰 Store Revenue</span>
                <strong style={{ fontSize: '1.15rem', color: '#0f172a' }}>{totalRevenue.toFixed(2)} DH</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>📦 Orders / Delivery</span>
                <strong style={{ fontSize: '1.15rem', color: '#0f172a' }}>{totalOrdersCount} ({deliveryRate}%)</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>🏷️ Baseline AOV</span>
                <strong style={{ fontSize: '1.15rem', color: '#0f172a' }}>{aov} DH</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>⚡ Blended ROAS</span>
                <strong style={{ fontSize: '1.15rem', color: blendedRoas ? '#059669' : '#64748b' }}>
                  {blendedRoas ? `${blendedRoas}x` : 'No spend logged'}
                </strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>💎 True Net Profit</span>
                <strong style={{ fontSize: '1.15rem', color: netProfit >= 0 ? '#059669' : '#dc2626' }}>
                  {netProfit.toFixed(2)} DH
                </strong>
              </div>
            </div>

            {/* Analytics Navigation Sub-Tabs & Quick Action */}
            <div className="analytics-sub-tabs" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '0.75rem',
              marginBottom: '1.5rem',
              overflowX: 'auto'
            }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'nowrap' }}>
                <button 
                  className={`analytics-sub-btn ${analyticsSubTab === 'all' ? 'active' : ''}`}
                  onClick={() => setAnalyticsSubTab('all')}
                >
                  <BarChart3 size={15} /> All Intelligence
                </button>
                <button 
                  className={`analytics-sub-btn ${analyticsSubTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setAnalyticsSubTab('overview')}
                >
                  <TrendingUp size={15} color={analyticsSubTab === 'overview' ? '#fff' : '#8b5cf6'} /> Sales & LTV Overview
                </button>
                <button 
                  className={`analytics-sub-btn ${analyticsSubTab === 'roas' ? 'active' : ''}`}
                  onClick={() => setAnalyticsSubTab('roas')}
                >
                  <DollarSign size={15} color={analyticsSubTab === 'roas' ? '#fff' : '#10b981'} /> Ad Spend & Blended ROAS
                </button>
                <button 
                  className={`analytics-sub-btn ${analyticsSubTab === 'dayparting' ? 'active' : ''}`}
                  onClick={() => setAnalyticsSubTab('dayparting')}
                >
                  <Clock size={15} /> Best Days & Hourly Timing
                </button>
                <button 
                  className={`analytics-sub-btn ${analyticsSubTab === 'seasons' ? 'active' : ''}`}
                  onClick={() => setAnalyticsSubTab('seasons')}
                >
                  <Flame size={15} color={analyticsSubTab === 'seasons' ? '#fff' : '#f97316'} /> Hot Seasons & Growth
                </button>
                <button 
                  className={`analytics-sub-btn ${analyticsSubTab === 'cities' ? 'active' : ''}`}
                  onClick={() => setAnalyticsSubTab('cities')}
                >
                  <MapPin size={15} color={analyticsSubTab === 'cities' ? '#fff' : '#06b6d4'} /> Top Cities & Geo-Intel
                </button>
                <button 
                  className={`analytics-sub-btn ${analyticsSubTab === 'bundles' ? 'active' : ''}`}
                  onClick={() => setAnalyticsSubTab('bundles')}
                >
                  <Layers size={15} color={analyticsSubTab === 'bundles' ? '#fff' : '#ec4899'} /> Bundle & Affinity Matrix
                </button>
                <button 
                  className={`analytics-sub-btn ${analyticsSubTab === 'mediabuyer' ? 'active' : ''}`}
                  onClick={() => setAnalyticsSubTab('mediabuyer')}
                >
                  <Target size={15} color={analyticsSubTab === 'mediabuyer' ? '#fff' : '#38bdf8'} /> Media Buyer Suite (CPA & ROAS)
                </button>
              </div>

              <button 
                onClick={() => setIsAdSpendModalOpen(true)}
                className="btn-primary btn-small"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#059669',
                  borderColor: '#059669',
                  fontSize: '0.8rem',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '20px',
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)'
                }}
              >
                <Plus size={14} /> Log Ad Spend
              </button>
            </div>
            
            {/* Top KPI Cards Grid */}
            <div className="analytics-grid">
              <div className="analytics-card">
                <div className="analytics-card-top">
                  <h3>Revenue</h3>
                  {revenueGrowth !== null && (
                    <span className={`trend-badge ${parseFloat(revenueGrowth) >= 0 ? 'positive' : 'negative'}`}>
                      {parseFloat(revenueGrowth) >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {parseFloat(revenueGrowth) >= 0 ? `+${revenueGrowth}%` : `${revenueGrowth}%`}
                    </span>
                  )}
                </div>
                <p className="analytics-value">{totalRevenue.toFixed(2)} DH</p>
                <span className="analytics-subtitle">From {nonCancelledOrders.length} valid orders</span>
              </div>

              <div className="analytics-card">
                <div className="analytics-card-top">
                  <h3>Orders Volume</h3>
                  {ordersGrowth !== null && (
                    <span className={`trend-badge ${parseFloat(ordersGrowth) >= 0 ? 'positive' : 'negative'}`}>
                      {parseFloat(ordersGrowth) >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {parseFloat(ordersGrowth) >= 0 ? `+${ordersGrowth}%` : `${ordersGrowth}%`}
                    </span>
                  )}
                </div>
                <p className="analytics-value">{totalOrdersCount}</p>
                <span className="analytics-subtitle">{deliveredOrdersCount} delivered ({deliveryRate}%)</span>
              </div>

              <div className="analytics-card">
                <div className="analytics-card-top">
                  <h3>Avg Order Value (AOV)</h3>
                  {aovGrowth !== null && (
                    <span className={`trend-badge ${parseFloat(aovGrowth) >= 0 ? 'positive' : 'negative'}`}>
                      {parseFloat(aovGrowth) >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {parseFloat(aovGrowth) >= 0 ? `+${aovGrowth}%` : `${aovGrowth}%`}
                    </span>
                  )}
                </div>
                <p className="analytics-value">{aov} DH</p>
                <span className="analytics-subtitle">Key baseline for Target CPA</span>
              </div>

              <div className="analytics-card">
                <div className="analytics-card-top">
                  <h3>Repeat Buyer Rate</h3>
                  <span className={`trend-badge ${repeatCustomerRate >= 20 ? 'positive' : 'neutral'}`}>
                    {repeatCustomerRate >= 20 ? 'Strong LTV' : 'Acquisition Phase'}
                  </span>
                </div>
                <p className="analytics-value">{repeatCustomerRate}%</p>
                <span className="analytics-subtitle">{returningCustomers.length} repeat / {uniqueCustomersCount} total buyers</span>
              </div>
            </div>

            {/* SECTION 0: AD SPEND, BLENDED ROAS, MER & TRUE NET PROFIT SUITE */}
            {(analyticsSubTab === 'all' || analyticsSubTab === 'roas') && (
              <div className="ad-spend-profit-container animate-fade-in" style={{
                background: 'linear-gradient(135deg, #064e3b 0%, #0f172a 100%)',
                color: '#fff',
                borderRadius: '16px',
                padding: '1.75rem',
                marginBottom: '2rem',
                boxShadow: '0 20px 40px rgba(6, 78, 59, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', paddingBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <DollarSign size={24} color="#34d399" />
                      <h3 style={{ margin: 0, color: '#fff', fontSize: '1.35rem', fontFamily: "'Playfair Display', serif" }}>
                        Blended ROAS, MER & Net Profit Command
                      </h3>
                    </div>
                    <p style={{ margin: '0.3rem 0 0 0', color: '#a7f3d0', fontSize: '0.85rem' }}>
                      Real marketing efficiency: Total Store Revenue ({totalRevenue.toFixed(2)} DH) vs Total Ad Spend ({totalAdSpend.toFixed(2)} DH).
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <button 
                      onClick={() => setIsAdSpendModalOpen(true)}
                      style={{
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        padding: '0.45rem 0.9rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Plus size={14} /> Log Spend for Date
                    </button>
                  </div>
                </div>

                {/* 4 Core ROAS & Profitability Hero Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  {/* 1. Total Ad Spend */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                      <span>Total Ad Spend</span>
                      <span style={{ color: '#6ee7b7', background: 'rgba(16, 185, 129, 0.15)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>
                        {periodAdSpends.length} logged
                      </span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff' }}>{totalAdSpend.toFixed(2)} DH</div>
                    <div style={{ fontSize: '0.75rem', color: '#a7f3d0', marginTop: '0.4rem', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {metaSpend > 0 && <span>Meta: {metaSpend.toFixed(0)} DH</span>}
                      {tiktokSpend > 0 && <span>TikTok: {tiktokSpend.toFixed(0)} DH</span>}
                      {googleSpend > 0 && <span>Google: {googleSpend.toFixed(0)} DH</span>}
                      {totalAdSpend === 0 && <span style={{ color: '#94a3b8' }}>No ad spend logged for period</span>}
                    </div>
                  </div>

                  {/* 2. Blended ROAS */}
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#a7f3d0', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                      <span>Blended ROAS</span>
                      {blendedRoas ? (
                        <span style={{
                          color: parseFloat(blendedRoas) >= 3.0 ? '#34d399' : parseFloat(blendedRoas) >= 2.0 ? '#facc15' : '#f87171',
                          background: 'rgba(0,0,0,0.3)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: '700'
                        }}>
                          {parseFloat(blendedRoas) >= 4.0 ? '🚀 High Scale' : parseFloat(blendedRoas) >= 2.8 ? '🟢 Profitable' : parseFloat(blendedRoas) >= 1.8 ? '🟡 Tight' : '🔴 Alert'}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Log spend to see</span>
                      )}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#34d399' }}>
                      {blendedRoas ? `${blendedRoas}x` : '—'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#d1fae5', marginTop: '0.4rem' }}>
                      MER: <strong>{merPercent ? `${merPercent}%` : '—'}</strong> of revenue spent on ads
                    </div>
                  </div>

                  {/* 3. POAS (Profit On Ad Spend) */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                      <span>POAS (Profit on Ad Spend)</span>
                      <span style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>Gross Margin</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#38bdf8' }}>
                      {poas ? `${poas}x` : '—'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                      Gross Profit: {grossProfit.toFixed(0)} DH (after {productCogsPercent}% COGS)
                    </div>
                  </div>

                  {/* 4. Estimated True Net Profit */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                      <span>True Net Take-Home</span>
                      <span style={{
                        color: netProfit >= 0 ? '#34d399' : '#f87171',
                        background: netProfit >= 0 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: '700'
                      }}>
                        {netMarginPercent}% Margin
                      </span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: netProfit >= 0 ? '#6ee7b7' : '#fca5a5' }}>
                      {netProfit.toFixed(2)} DH
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                      Blended CAC: <strong>{blendedCac ? `${blendedCac} DH` : '—'}</strong> / valid order
                    </div>
                  </div>
                </div>

                {/* Unit Economics P&L Waterfall Card & Simulation Controls */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  {/* P&L Waterfall Breakdown Table */}
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                      <strong style={{ color: '#fff', fontSize: '0.95rem' }}>📊 Period Financial Waterfall (P&L Breakdown)</strong>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ color: '#cbd5e1' }}>💰 Gross Store Revenue</span>
                        <strong style={{ color: '#fff' }}>+{totalRevenue.toFixed(2)} DH (100%)</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ color: '#f87171' }}>📦 Product Cost of Goods (COGS - {productCogsPercent}%)</span>
                        <span style={{ color: '#fca5a5' }}>-{cogsTotal.toFixed(2)} DH</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ color: '#38bdf8' }}>💵 Gross Profit</span>
                        <strong style={{ color: '#7dd3fc' }}>={grossProfit.toFixed(2)} DH ({(100 - productCogsPercent).toFixed(0)}%)</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ color: '#f87171' }}>📣 Marketing & Ad Spend ({merPercent || 0}% MER)</span>
                        <span style={{ color: '#fca5a5' }}>-{totalAdSpend.toFixed(2)} DH</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ color: '#f87171' }}>🚚 Est. Delivery & Fulfillment ({nonCancelledOrders.length} × {estShippingPerOrder} DH)</span>
                        <span style={{ color: '#fca5a5' }}>-{shippingTotal.toFixed(2)} DH</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.75rem', background: netProfit >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', borderRadius: '8px', marginTop: '0.3rem', fontWeight: '700' }}>
                        <span style={{ color: '#fff' }}>💎 ESTIMATED TRUE NET PROFIT</span>
                        <span style={{ color: netProfit >= 0 ? '#34d399' : '#f87171', fontSize: '1.05rem' }}>
                          {netProfit.toFixed(2)} DH ({netMarginPercent}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Unit Economics Simulator Controls */}
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.85rem' }}>
                      <Sliders size={16} color="#34d399" />
                      <strong style={{ color: '#fff', fontSize: '0.95rem' }}>Adjust Store Margin Assumptions</strong>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                          <span>Product COGS % (Manufacturing / Sourcing):</span>
                          <strong style={{ color: '#34d399' }}>{productCogsPercent}%</strong>
                        </div>
                        <input 
                          type="range"
                          min="10"
                          max="70"
                          step="1"
                          value={productCogsPercent}
                          onChange={(e) => setProductCogsPercent(parseInt(e.target.value))}
                          style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                          <span>Est. Shipping / Delivery Cost Per Order:</span>
                          <strong style={{ color: '#34d399' }}>{estShippingPerOrder} DH</strong>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="80"
                          step="5"
                          value={estShippingPerOrder}
                          onChange={(e) => setEstShippingPerOrder(parseInt(e.target.value))}
                          style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
                        />
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.78rem', color: '#94a3b8' }}>
                        💡 <strong>Media Buyer Scalability Rule:</strong> As long as POAS remains above <strong>2.0x</strong> and Blended MER stays below <strong>30%</strong>, you have room to aggressively raise daily ad budgets on Meta and TikTok.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ad Spend Log History Table */}
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <strong style={{ color: '#fff', fontSize: '0.95rem' }}>📋 Ad Spend History for Selected Period ({periodAdSpends.length} entries)</strong>
                    <button 
                      onClick={() => setIsAdSpendModalOpen(true)}
                      style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.3rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      + Add Ad Spend
                    </button>
                  </div>

                  {periodAdSpends.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                      No ad spend recorded in this date range. Click <strong>"Log Ad Spend"</strong> above to track your Meta, TikTok, or Google ad budgets.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="admin-table" style={{ fontSize: '0.82rem', color: '#e2e8f0' }}>
                        <thead>
                          <tr style={{ color: '#94a3b8' }}>
                            <th>Date</th>
                            <th>Platform</th>
                            <th>Spend (DH)</th>
                            <th>Impressions</th>
                            <th>Clicks / CTR</th>
                            <th>Notes</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {periodAdSpends.map(spend => {
                            const ctr = spend.impressions > 0 && spend.clicks > 0 
                              ? ((spend.clicks / spend.impressions) * 100).toFixed(2) + '%' 
                              : '-';
                            return (
                              <tr key={spend.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <td>{spend.date}</td>
                                <td>
                                  <span style={{
                                    background: spend.platform === 'Meta Ads' ? 'rgba(59, 130, 246, 0.2)' : spend.platform === 'TikTok Ads' ? 'rgba(255, 255, 255, 0.2)' : spend.platform === 'Google Ads' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                                    color: spend.platform === 'Meta Ads' ? '#60a5fa' : spend.platform === 'TikTok Ads' ? '#fff' : spend.platform === 'Google Ads' ? '#f87171' : '#fde047',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                  }}>
                                    {spend.platform}
                                  </span>
                                </td>
                                <td><strong style={{ color: '#fff' }}>{parseFloat(spend.amount).toFixed(2)} DH</strong></td>
                                <td>{spend.impressions ? spend.impressions.toLocaleString() : '-'}</td>
                                <td>{spend.clicks ? `${spend.clicks} (${ctr})` : '-'}</td>
                                <td style={{ color: '#94a3b8' }}>{spend.notes || '-'}</td>
                                <td>
                                  <button 
                                    onClick={() => handleDeleteAdSpend(spend.id)}
                                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px 6px' }}
                                    title="Delete record"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 1: MEDIA BUYER DECISION SUITE */}
            {(analyticsSubTab === 'all' || analyticsSubTab === 'mediabuyer') && (
              <div className="media-buyer-suite-container animate-fade-in" style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#fff',
                borderRadius: '16px',
                padding: '1.75rem',
                marginBottom: '2rem',
                boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', paddingBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Target size={22} color="#38bdf8" />
                      <h3 style={{ margin: 0, color: '#fff', fontSize: '1.35rem', fontFamily: "'Playfair Display', serif" }}>
                        Media Buyer Command Center & Unit Economics
                      </h3>
                    </div>
                    <p style={{ margin: '0.3rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                      Calculated from real store AOV ({aov} DH) to guide paid ad bids, cost caps, and budget allocation on Meta / TikTok / Google.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.07)', padding: '0.4rem 0.8rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Est. Margin / COGS:</span>
                    <input 
                      type="range"
                      min="20"
                      max="80"
                      step="5"
                      value={targetMargin}
                      onChange={(e) => setTargetMargin(parseInt(e.target.value))}
                      style={{ width: '80px', accentColor: '#38bdf8', cursor: 'pointer' }}
                    />
                    <strong style={{ color: '#38bdf8', fontSize: '0.85rem' }}>{targetMargin}%</strong>
                  </div>
                </div>

                {/* Target CPA Benchmark Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                      <span>Break-Even Max CAC</span>
                      <span style={{ color: '#fb7185', background: 'rgba(251, 113, 133, 0.15)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>Ceiling</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff' }}>{breakEvenCpa} DH</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>Max allowable cost per acquisition before loss</div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                      <span>2.0x Target ROAS CPA</span>
                      <span style={{ color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>Growth</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fef08a' }}>{targetCpa2x} DH</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>Aggressive customer acquisition cap</div>
                  </div>

                  <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#7dd3fc', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                      <span>3.0x Target ROAS CPA</span>
                      <span style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.25)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600' }}>👑 Sweet Spot</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#38bdf8' }}>{targetCpa3x} DH</div>
                    <div style={{ fontSize: '0.75rem', color: '#bae6fd', marginTop: '0.3rem' }}>Ideal healthy profit & scaling target</div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                      <span>4.0x Target ROAS CPA</span>
                      <span style={{ color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>High Profit</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#6ee7b7' }}>{targetCpa4x} DH</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>Conservative / Retargeting CPA target</div>
                  </div>
                </div>

                {/* Media Buyer Strategy Grid: Hero Creative & Action Roadmap */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                  {/* Hero Products for Ads */}
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.8rem' }}>
                      <Award size={16} color="#fbbf24" />
                      <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>Recommended Ad Creatives & Hero Products</strong>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {tofHeroProduct ? (
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: '600' }}>🎯 Cold Traffic Hero (TOF)</span>
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{tofHeroProduct.quantity} units sold</span>
                          </div>
                          <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.9rem' }}>{tofHeroProduct.name}</div>
                          <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                            Best for Top-of-Funnel prospecting ads with lowest cost per hook/click.
                          </div>
                        </div>
                      ) : null}

                      {valueHeroProduct ? (
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ color: '#34d399', fontSize: '0.75rem', fontWeight: '600' }}>💎 Highest Revenue Driver</span>
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{valueHeroProduct.revenue.toFixed(2)} DH generated</span>
                          </div>
                          <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.9rem' }}>{valueHeroProduct.name}</div>
                          <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                            Best for Purchase Value optimization (Advantage+ Shopping / High AOV scaling).
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Actionable Media Buying Playbook */}
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.8rem' }}>
                      <Sparkles size={16} color="#38bdf8" />
                      <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>Actionable Scaling Playbook</strong>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.82rem', color: '#cbd5e1' }}>
                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700', flexShrink: 0 }}>
                          DAYPARTING
                        </span>
                        <span>
                          {bestDay ? (
                            <>Scale ad spend by +20% on <strong>{bestDay.day}</strong> (generates {bestDay.revShare}% of revenue).</>
                          ) : (
                            <>Maintain steady weekday scaling.</>
                          )}
                        </span>
                      </li>

                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700', flexShrink: 0 }}>
                          TIMING
                        </span>
                        <span>
                          {bestTimeBlock ? (
                            <>Concentrate automated bid delivery during <strong>{bestTimeBlock.label}</strong> ({bestTimeBlock.orders} orders).</>
                          ) : (
                            <>Evening hours (18:00 - 23:00) generally see peak conversion spikes.</>
                          )}
                        </span>
                      </li>

                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700', flexShrink: 0 }}>
                          BUDGET SPLIT
                        </span>
                        <span>
                          {repeatCustomerRate < 20 ? (
                            <>Allocate <strong>80% Prospecting (TOF) / 20% Retargeting</strong> to expand new customer volume.</>
                          ) : (
                            <>Allocate <strong>70% TOF / 30% VIP Retargeting</strong> (strong {repeatCustomerRate}% repeat retention).</>
                          )}
                        </span>
                      </li>

                      <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ background: 'rgba(244, 114, 182, 0.2)', color: '#f472b6', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700', flexShrink: 0 }}>
                          AOV EXPANSION
                        </span>
                        <span>
                          Create a 2-item bundle or free gift tier at <strong>{(numericAov * 1.3).toFixed(0)} DH</strong> to increase allowable CAC ceiling.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: AD DAYPARTING & BEST PERFORMING DAYS / TIME OF DAY */}
            {(analyticsSubTab === 'all' || analyticsSubTab === 'dayparting') && (
              <div className="dayparting-section animate-fade-in" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                  <Clock size={20} color="var(--color-accent)" />
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: "'Playfair Display', serif" }}>
                    Dayparting: Best Performing Days of the Week & Hourly Windows
                  </h3>
                </div>

                <div className="analytics-charts-grid">
                  {/* Day of Week Chart */}
                  <div className="analytics-chart-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem' }}>Revenue & Volume by Day of Week</h4>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Identifies best days for weekly ad budget scaling</span>
                      </div>
                      {bestDay && (
                        <span className="badge" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                          👑 Top Day: {bestDay.day}
                        </span>
                      )}
                    </div>

                    <div style={{ width: '100%', height: 280 }}>
                      <ResponsiveContainer>
                        <BarChart data={dayOfWeekData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="shortDay" stroke="#64748b" fontSize={12} />
                          <YAxis stroke="#64748b" fontSize={12} />
                          <Tooltip 
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div style={{ background: '#0f172a', color: '#fff', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>📅 {data.day}</div>
                                    <div>💰 Revenue: <strong>{data.revenue.toFixed(2)} DH</strong> ({data.revShare}%)</div>
                                    <div>📦 Orders: <strong>{data.orders}</strong></div>
                                    <div>🏷️ AOV: <strong>{data.aov.toFixed(2)} DH</strong></div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="revenue" name="Revenue (DH)" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Day Performance Table */}
                    <div className="table-responsive" style={{ marginTop: '1rem' }}>
                      <table className="admin-table" style={{ fontSize: '0.85rem' }}>
                        <thead>
                          <tr>
                            <th>Day</th>
                            <th>Orders</th>
                            <th>Revenue</th>
                            <th>AOV</th>
                            <th>Share %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dayOfWeekData.map(d => (
                            <tr key={d.day} style={bestDay && d.day === bestDay.day ? { background: 'rgba(16, 185, 129, 0.05)', fontWeight: '600' } : {}}>
                              <td>
                                {bestDay && d.day === bestDay.day && '👑 '}
                                {d.day}
                              </td>
                              <td>{d.orders}</td>
                              <td>{d.revenue.toFixed(2)} DH</td>
                              <td>{d.aov.toFixed(2)} DH</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ width: '40px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${d.revShare}%`, height: '100%', background: 'var(--color-accent)' }} />
                                  </div>
                                  <span>{d.revShare}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Hourly Purchasing Window / Time Blocks */}
                  <div className="analytics-chart-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem' }}>Time-of-Day Conversion Blocks</h4>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>When your customers complete purchases</span>
                      </div>
                      {bestTimeBlock && (
                        <span className="badge" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                          ⚡ Peak: {bestTimeBlock.icon} {bestTimeBlock.label.split(' ')[0]}
                        </span>
                      )}
                    </div>

                    {/* 4 Time Blocks Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      {Object.entries(timeBlocks).map(([key, block]) => {
                        const share = totalRevenue > 0 ? ((block.revenue / totalRevenue) * 100).toFixed(1) : '0.0';
                        const isTop = bestTimeBlock && bestTimeBlock.label === block.label && block.orders > 0;
                        return (
                          <div 
                            key={key} 
                            style={{
                              background: isTop ? '#f0fdf4' : '#f8fafc',
                              border: isTop ? '1px solid #86efac' : '1px solid #e2e8f0',
                              padding: '0.75rem',
                              borderRadius: '8px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>
                              <span>{block.icon}</span>
                              <span>{block.label.split(' ')[0]}</span>
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: '0.2rem 0' }}>
                              {block.revenue.toFixed(2)} DH
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {block.orders} orders ({share}%)
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Hourly Distribution Line / Area Chart */}
                    <div style={{ width: '100%', height: 180 }}>
                      <ResponsiveContainer>
                        <AreaChart data={hourlyMap} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="hour" stroke="#64748b" fontSize={10} interval={3} />
                          <YAxis stroke="#64748b" fontSize={10} />
                          <Tooltip 
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                  <div style={{ background: '#0f172a', color: '#fff', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem' }}>
                                    <div>⏰ {d.hour}</div>
                                    <div>💰 {d.revenue.toFixed(2)} DH ({d.orders} orders)</div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#93c5fd" fillOpacity={0.4} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: SEASONALITY & "HOT SEASONS" TRENDS */}
            {(analyticsSubTab === 'all' || analyticsSubTab === 'seasons') && (
              <div className="seasonality-section animate-fade-in" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                  <Flame size={20} color="#f97316" />
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: "'Playfair Display', serif" }}>
                    Seasonality & Hot Seasons Tracker
                  </h3>
                </div>

                <div className="analytics-charts-grid">
                  {/* Monthly Seasonality Trend */}
                  <div className="analytics-chart-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem' }}>Monthly Performance & Momentum</h4>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Track high seasons, holiday surges, and MoM growth</span>
                      </div>
                      {peakMonth && (
                        <span className="badge" style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' }}>
                          🔥 Peak Month: {peakMonth.monthName} ({peakMonth.revenue.toFixed(0)} DH)
                        </span>
                      )}
                    </div>

                    <div style={{ width: '100%', height: 260 }}>
                      <ResponsiveContainer>
                        <BarChart data={monthlySeasonWithStatus} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="monthName" stroke="#64748b" fontSize={12} />
                          <YAxis stroke="#64748b" fontSize={12} />
                          <Tooltip 
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                  <div style={{ background: '#0f172a', color: '#fff', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                                    <div style={{ fontWeight: '600', marginBottom: '0.3rem' }}>📅 {d.monthName}</div>
                                    <div>💰 Revenue: <strong>{d.revenue.toFixed(2)} DH</strong></div>
                                    <div>📦 Orders: <strong>{d.orders}</strong></div>
                                    <div>🏷️ AOV: <strong>{d.aov.toFixed(2)} DH</strong></div>
                                    {d.momGrowth !== null && (
                                      <div style={{ color: d.momGrowth >= 0 ? '#4ade80' : '#f87171', marginTop: '0.2rem' }}>
                                        MoM Growth: {d.momGrowth >= 0 ? `+${d.momGrowth}%` : `${d.momGrowth}%`}
                                      </div>
                                    )}
                                    <div style={{ marginTop: '0.3rem', fontSize: '0.75rem', color: d.status === 'hot' ? '#fb923c' : '#94a3b8' }}>
                                      Status: {d.status === 'hot' ? '🔥 HOT SEASON' : d.status === 'cooldown' ? '❄️ Off-Peak' : '⚡ Steady'}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="revenue" name="Revenue (DH)" fill="#f97316" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Monthly Details Table with Hot Season Badges */}
                    <div className="table-responsive" style={{ marginTop: '1rem' }}>
                      <table className="admin-table" style={{ fontSize: '0.85rem' }}>
                        <thead>
                          <tr>
                            <th>Month</th>
                            <th>Revenue</th>
                            <th>Orders</th>
                            <th>MoM Growth</th>
                            <th>Season Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthlySeasonWithStatus.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-3">No recorded monthly orders yet.</td></tr>
                          ) : (
                            monthlySeasonWithStatus.map(m => (
                              <tr key={m.key}>
                                <td><strong>{m.monthName}</strong></td>
                                <td>{m.revenue.toFixed(2)} DH</td>
                                <td>{m.orders}</td>
                                <td>
                                  {m.momGrowth !== null ? (
                                    <span className={`trend-badge ${m.momGrowth >= 0 ? 'positive' : 'negative'}`}>
                                      {m.momGrowth >= 0 ? `+${m.momGrowth}%` : `${m.momGrowth}%`}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#94a3b8' }}>-</span>
                                  )}
                                </td>
                                <td>
                                  {m.status === 'hot' && (
                                    <span className="badge" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5' }}>
                                      🔥 Hot Peak
                                    </span>
                                  )}
                                  {m.status === 'active' && (
                                    <span className="badge" style={{ background: '#f8fafc', color: '#475569' }}>
                                      ⚡ Steady
                                    </span>
                                  )}
                                  {m.status === 'cooldown' && (
                                    <span className="badge" style={{ background: '#f1f5f9', color: '#64748b' }}>
                                      ❄️ Off-Peak
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Quarterly Seasonality Matrix */}
                  <div className="analytics-chart-container">
                    <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '1rem' }}>Quarterly E-Commerce Matrix</h4>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', color: '#64748b' }}>
                      Seasonal shopping cycles for jewelry, luxury gifting & perfume
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {quarterData.map(q => (
                        <div 
                          key={q.name}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '0.9rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{q.name}</strong>
                              <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#fff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                {q.theme}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                              {q.orders} recorded orders
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-accent)' }}>
                              {q.revenue.toFixed(2)} DH
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {q.revShare}% share
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '8px', padding: '0.85rem', marginTop: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#854d0e', fontWeight: '600', fontSize: '0.82rem' }}>
                        <Info size={14} /> Seasonality Tip for Media Buyers:
                      </div>
                      <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.78rem', color: '#713f12', lineHeight: 1.4 }}>
                        Launch ad creative testing 3 weeks ahead of peak quarters (e.g. late October for Q4 Black Friday & Gifting Season). This allows pixel learning and winning creative validation before CPMs peak.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4: TOP CITIES & REGIONAL GEO-TARGETING (DELIVERY RATES & EFFECTIVE CAC) */}
            {(analyticsSubTab === 'all' || analyticsSubTab === 'cities') && (
              <div className="cities-section animate-fade-in" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                  <MapPin size={22} color="#06b6d4" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: "'Playfair Display', serif" }}>
                      Geo-Targeting Intel & Delivery Success Rate by City
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Pinpoint high-converting cities, scale winning zones, and exclude high-cancellation postal regions.
                    </span>
                  </div>
                </div>

                {/* 4 City KPI summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="analytics-card" style={{ padding: '1rem' }}>
                    <div className="analytics-card-top">
                      <h3>Top Revenue City</h3>
                      <span className="badge" style={{ background: '#ecfeff', color: '#0891b2', border: '1px solid #a5f3fc' }}>
                        👑 #1 Market
                      </span>
                    </div>
                    <p className="analytics-value" style={{ fontSize: '1.4rem', margin: '0.2rem 0' }}>
                      {topCity ? topCity.city : '—'}
                    </p>
                    <span className="analytics-subtitle">
                      {topCity ? `${topCity.revenue.toFixed(2)} DH (${topCity.share}% share)` : 'No city data'}
                    </span>
                  </div>

                  <div className="analytics-card" style={{ padding: '1rem' }}>
                    <div className="analytics-card-top">
                      <h3>Best Delivery Rate</h3>
                      <span className="badge" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                        🛡️ Safe Scale
                      </span>
                    </div>
                    <p className="analytics-value" style={{ fontSize: '1.4rem', margin: '0.2rem 0' }}>
                      {bestDeliveryCity ? `${bestDeliveryCity.city}` : '—'}
                    </p>
                    <span className="analytics-subtitle">
                      {bestDeliveryCity ? `${bestDeliveryCity.deliveryRate}% Delivered (${bestDeliveryCity.delivered}/${bestDeliveryCity.totalOrders})` : 'Awaiting data'}
                    </span>
                  </div>

                  <div className="analytics-card" style={{ padding: '1rem' }}>
                    <div className="analytics-card-top">
                      <h3>Cities Tracked</h3>
                      <span className="badge" style={{ background: '#f8fafc', color: '#475569' }}>
                        🌍 Active Geo
                      </span>
                    </div>
                    <p className="analytics-value" style={{ fontSize: '1.4rem', margin: '0.2rem 0' }}>
                      {citiesCount} Cities
                    </p>
                    <span className="analytics-subtitle">
                      Across all recorded orders
                    </span>
                  </div>

                  <div className="analytics-card" style={{ padding: '1rem' }}>
                    <div className="analytics-card-top">
                      <h3>High-Return Alert</h3>
                      <span className="badge" style={{
                        background: highRiskCities.length > 0 ? '#fef2f2' : '#f0fdf4',
                        color: highRiskCities.length > 0 ? '#dc2626' : '#16a34a',
                        border: highRiskCities.length > 0 ? '1px solid #fecaca' : '1px solid #bbf7d0'
                      }}>
                        {highRiskCities.length > 0 ? `⚠️ ${highRiskCities.length} Flagged` : '🟢 Healthy'}
                      </span>
                    </div>
                    <p className="analytics-value" style={{ fontSize: '1.4rem', margin: '0.2rem 0' }}>
                      {highRiskCities.length > 0 ? `${highRiskCities[0].city}` : 'All Clean'}
                    </p>
                    <span className="analytics-subtitle">
                      {highRiskCities.length > 0 ? `>30% cancel rate (Verify on WhatsApp)` : 'No problematic postal zones'}
                    </span>
                  </div>
                </div>

                <div className="analytics-charts-grid">
                  {/* City Revenue Bar Chart */}
                  <div className="analytics-chart-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem' }}>Top Cities by Revenue (DH)</h4>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Revenue contribution by customer location</span>
                      </div>
                    </div>

                    <div style={{ width: '100%', height: 280 }}>
                      <ResponsiveContainer>
                        <BarChart data={cityPerformanceData.slice(0, 8)} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="city" stroke="#64748b" fontSize={11} angle={-25} textAnchor="end" />
                          <YAxis stroke="#64748b" fontSize={11} />
                          <Tooltip 
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                  <div style={{ background: '#0f172a', color: '#fff', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>📍 {d.city}</div>
                                    <div>💰 Revenue: <strong>{d.revenue.toFixed(2)} DH</strong> ({d.share}%)</div>
                                    <div>📦 Total Orders: <strong>{d.totalOrders}</strong></div>
                                    <div>🚚 Delivery Rate: <strong>{d.deliveryRate}%</strong></div>
                                    <div>🏷️ AOV: <strong>{d.aov.toFixed(2)} DH</strong></div>
                                    <div style={{ marginTop: '0.3rem', color: '#38bdf8' }}>Targeting: {d.actionTag}</div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="revenue" name="Revenue (DH)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Media Buyer Geo-Targeting Strategy Card */}
                  <div className="analytics-chart-container">
                    <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '1rem' }}>Media Buyer Location Targeting Playbook</h4>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', color: '#64748b' }}>
                      Optimize Meta / TikTok Campaign Locations
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {/* Green Scale List */}
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d', fontWeight: '700', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                          <ShieldCheck size={16} /> 🚀 High-Scale Winning Cities (Target Heavily)
                        </div>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#166534', lineHeight: 1.4 }}>
                          {cityPerformanceData.filter(c => c.deliveryRate >= 75 && c.totalOrders >= 1).map(c => c.city).slice(0, 5).join(', ') || 'Casablanca, Rabat, Marrakech, Tangier'}
                        </p>
                        <div style={{ fontSize: '0.72rem', color: '#15803d', marginTop: '0.3rem' }}>
                          High delivery confirmation ensures maximum ROI and lowest wasted CAC.
                        </div>
                      </div>

                      {/* Red Exclude List */}
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b91c1c', fontWeight: '700', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                          <ShieldAlert size={16} /> 🛑 High Return Zones (Negative Geo-Exclusion)
                        </div>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#991b1b', lineHeight: 1.4 }}>
                          {highRiskCities.length > 0 
                            ? highRiskCities.map(c => `${c.city} (${c.cancellationRate}% cancel)`).join(', ')
                            : 'No problematic cities detected yet in current date filter.'}
                        </p>
                        <div style={{ fontSize: '0.72rem', color: '#b91c1c', marginTop: '0.3rem' }}>
                          Exclude these in Meta Ads location settings or mandate advance payment/phone confirmation.
                        </div>
                      </div>

                      {/* Effective CAC Formula Note */}
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', fontSize: '0.78rem', color: '#475569', lineHeight: 1.4 }}>
                        💡 <strong>Real Effective CAC Rule:</strong> If your Ad CPA is <strong>100 DH</strong> and a city has an <strong>80%</strong> delivery rate, your Real Effective CPA is <code>100 ÷ 0.80 = 125 DH</code>. Always scale ads toward 90%+ delivery zones!
                      </div>
                    </div>
                  </div>
                </div>

                {/* Complete City Breakdown Table */}
                <div className="analytics-chart-container full-width" style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem' }}>Complete Regional Performance & Delivery Table</h4>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Sorted by total revenue</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        type="text"
                        placeholder="Search city (e.g. Casablanca)..."
                        value={citySearchQuery}
                        onChange={(e) => setCitySearchQuery(e.target.value)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.8rem',
                          width: '200px'
                        }}
                      />
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="admin-table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>City / Region</th>
                          <th>Total Orders</th>
                          <th>Delivered (Rate %)</th>
                          <th>Cancelled / Returned</th>
                          <th>Revenue (DH)</th>
                          <th>AOV</th>
                          <th>Share %</th>
                          <th>Media Buyer Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cityPerformanceData.filter(c => !citySearchQuery.trim() || c.city.toLowerCase().includes(citySearchQuery.toLowerCase().trim())).length === 0 ? (
                          <tr><td colSpan="8" className="text-center py-4">No city matching "{citySearchQuery}" found.</td></tr>
                        ) : (
                          cityPerformanceData.filter(c => !citySearchQuery.trim() || c.city.toLowerCase().includes(citySearchQuery.toLowerCase().trim())).map(c => (
                            <tr key={c.city}>
                              <td>
                                <strong>📍 {c.city}</strong>
                              </td>
                              <td>{c.totalOrders}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ width: '45px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${c.deliveryRate}%`, height: '100%', background: c.deliveryRate >= 80 ? '#10b981' : c.deliveryRate >= 60 ? '#f59e0b' : '#ef4444' }} />
                                  </div>
                                  <span style={{ fontWeight: '600', color: c.deliveryRate >= 80 ? '#059669' : c.deliveryRate >= 60 ? '#d97706' : '#dc2626' }}>
                                    {c.delivered} ({c.deliveryRate}%)
                                  </span>
                                </div>
                              </td>
                              <td>
                                <span style={{ color: c.cancelled > 0 ? '#dc2626' : '#64748b' }}>
                                  {c.cancelled} ({c.cancellationRate}%)
                                </span>
                              </td>
                              <td><strong>{c.revenue.toFixed(2)} DH</strong></td>
                              <td>{c.aov.toFixed(2)} DH</td>
                              <td>{c.share}%</td>
                              <td>
                                <span className="badge" style={{
                                  background: c.actionTag.includes('Scale') ? '#ecfdf5' : c.actionTag.includes('Exclude') ? '#fef2f2' : '#f8fafc',
                                  color: c.actionTag.includes('Scale') ? '#059669' : c.actionTag.includes('Exclude') ? '#dc2626' : '#475569',
                                  border: c.actionTag.includes('Scale') ? '1px solid #a7f3d0' : c.actionTag.includes('Exclude') ? '1px solid #fecaca' : '1px solid #e2e8f0'
                                }}>
                                  {c.actionTag}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4.5: BUNDLE & PRODUCT AFFINITY MATRIX ("FREQUENTLY BOUGHT TOGETHER") */}
            {(analyticsSubTab === 'all' || analyticsSubTab === 'bundles') && (
              <div className="bundle-affinity-section animate-fade-in" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                  <Layers size={22} color="#ec4899" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: "'Playfair Display', serif" }}>
                      Product Affinity Matrix & Winning Ad Bundles
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Discover which items are bought together most often to craft high-AOV bundle ads on Meta and TikTok.
                    </span>
                  </div>
                </div>

                {/* 4 Bundle Executive KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="analytics-card" style={{ padding: '1rem' }}>
                    <div className="analytics-card-top">
                      <h3>Multi-Item Order Rate</h3>
                      <span className="badge" style={{ background: '#fdf2f8', color: '#db2777', border: '1px solid #fbcfe8' }}>
                        🛍️ Basket Depth
                      </span>
                    </div>
                    <p className="analytics-value" style={{ fontSize: '1.4rem', margin: '0.2rem 0' }}>
                      {multiItemOrderRate}%
                    </p>
                    <span className="analytics-subtitle">
                      {multiItemOrdersCount} of {totalValidOrders} orders contain multiple products
                    </span>
                  </div>

                  <div className="analytics-card" style={{ padding: '1rem' }}>
                    <div className="analytics-card-top">
                      <h3>Multi-Item Bundle AOV</h3>
                      <span className="badge" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                        💰 High Ticket
                      </span>
                    </div>
                    <p className="analytics-value" style={{ fontSize: '1.4rem', margin: '0.2rem 0' }}>
                      {multiOrderAov} DH
                    </p>
                    <span className="analytics-subtitle">
                      vs {aov} DH storewide baseline AOV
                    </span>
                  </div>

                  <div className="analytics-card" style={{ padding: '1rem' }}>
                    <div className="analytics-card-top">
                      <h3>Top Co-Purchase Pair</h3>
                      <span className="badge" style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #ffedd5' }}>
                        🥇 #1 Bundle
                      </span>
                    </div>
                    <p className="analytics-value" style={{ fontSize: '1.1rem', margin: '0.2rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {topWinningBundle ? `${topWinningBundle.itemA} + ${topWinningBundle.itemB}` : 'Awaiting pairs'}
                    </p>
                    <span className="analytics-subtitle">
                      {topWinningBundle ? `${topWinningBundle.affinityPercent}% affinity (${topWinningBundle.pairCount} times)` : 'Single items in period'}
                    </span>
                  </div>

                  <div className="analytics-card" style={{ padding: '1rem' }}>
                    <div className="analytics-card-top">
                      <h3>Bundle Revenue Potential</h3>
                      <span className="badge" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                        🚀 AOV Boost
                      </span>
                    </div>
                    <p className="analytics-value" style={{ fontSize: '1.4rem', margin: '0.2rem 0' }}>
                      {topWinningBundle ? `${topWinningBundle.combinedBundlePrice} DH` : '—'}
                    </p>
                    <span className="analytics-subtitle">
                      {topWinningBundle ? `Offer for ${topWinningBundle.discountBundlePrice10} DH (-10%) in ads` : 'Create bundle offer'}
                    </span>
                  </div>
                </div>

                {/* Bundle Visual Strategy Grid */}
                <div className="analytics-charts-grid">
                  {/* Top Winning Ad Bundle Spotlight Card */}
                  <div className="analytics-chart-container" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)', color: '#fff', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={18} color="#f472b6" />
                        <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>Recommended Meta / TikTok Ad Bundle</h4>
                      </div>
                      <span style={{ background: 'rgba(236, 72, 153, 0.25)', color: '#f472b6', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '600' }}>
                        High Converting Set
                      </span>
                    </div>

                    {topWinningBundle ? (
                      <div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.07)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
                            <div>
                              <strong style={{ fontSize: '1rem', color: '#fff' }}>{topWinningBundle.itemA}</strong>
                              <span style={{ margin: '0 8px', color: '#f472b6', fontWeight: 'bold' }}>+</span>
                              <strong style={{ fontSize: '1rem', color: '#fff' }}>{topWinningBundle.itemB}</strong>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#fbcfe8' }}>
                              Co-purchased <strong>{topWinningBundle.pairCount} times</strong> ({topWinningBundle.affinityPercent}% affinity)
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                            <div>
                              <span style={{ color: '#94a3b8' }}>Regular Total: </span>
                              <span style={{ textDecoration: 'line-through', color: '#cbd5e1' }}>{topWinningBundle.combinedBundlePrice} DH</span>
                            </div>
                            <div>
                              <span style={{ color: '#94a3b8' }}>Bundle Price (10% Off): </span>
                              <strong style={{ color: '#34d399' }}>{topWinningBundle.discountBundlePrice10} DH</strong>
                            </div>
                            <div>
                              <span style={{ color: '#94a3b8' }}>Super Saver (15% Off): </span>
                              <strong style={{ color: '#38bdf8' }}>{topWinningBundle.discountBundlePrice15} DH</strong>
                            </div>
                          </div>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.85rem', borderRadius: '10px', fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                          📣 <strong>Media Buyer Ad Hook Idea:</strong> <em>"The Perfect Moroccan Duo: Pair the {topWinningBundle.itemA} with our handcrafted {topWinningBundle.itemB}. Save 15% today + Free Delivery across Morocco."</em>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                        No multi-product combinations recorded yet in this date range. As customers order multiple items, winning bundle ads will be generated automatically here.
                      </div>
                    )}
                  </div>

                  {/* Basket Size Breakdown Chart */}
                  <div className="analytics-chart-container">
                    <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '1rem' }}>Cart Basket Size Distribution</h4>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', color: '#64748b' }}>
                      Breakdown of single-item vs multi-item checkout orders
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {basketSizeData.map(b => (
                        <div key={b.name}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                            <span style={{ fontWeight: '600', color: '#334155' }}>{b.name}</span>
                            <span style={{ color: '#64748b' }}>{b.count} orders ({b.percentage}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${b.percentage}%`, height: '100%', background: b.fill }} />
                          </div>
                        </div>
                      ))}

                      <div style={{ background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: '8px', padding: '0.75rem', fontSize: '0.78rem', color: '#9d174d', marginTop: '0.5rem', lineHeight: 1.4 }}>
                        💡 <strong>Media Buyer AOV Maximizer:</strong> Raising your 2+ item order rate by just <strong>15%</strong> with post-purchase upsells or "Buy Together" discounts will increase your store AOV by <strong>~30-50 DH</strong> per order, directly funding higher Meta ad bids.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Frequently Bought Together Co-Purchase Affinity Table */}
                <div className="analytics-chart-container full-width" style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>Frequently Bought Together Leaderboard & Cross-Sell Matrix</h4>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Ranked by co-purchase frequency & affinity rate</span>
                  </div>

                  <div className="table-responsive">
                    <table className="admin-table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Primary Product (When buying...)</th>
                          <th>Frequently Paired With</th>
                          <th>Co-Purchased</th>
                          <th>Affinity Rate %</th>
                          <th>Combined Value</th>
                          <th>Suggested Bundle Price</th>
                          <th>Ad & Upsell Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bundleAffinityList.length === 0 ? (
                          <tr><td colSpan="7" className="text-center py-4">No product bundle combinations recorded yet in this date range.</td></tr>
                        ) : (
                          bundleAffinityList.slice(0, 10).map((pair, idx) => (
                            <tr key={`${pair.itemA}-${pair.itemB}-${idx}`}>
                              <td><strong>{pair.itemA}</strong></td>
                              <td><strong style={{ color: '#db2777' }}>+ {pair.itemB}</strong></td>
                              <td>{pair.pairCount} orders</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ width: '45px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${pair.affinityPercent}%`, height: '100%', background: pair.affinityPercent >= 50 ? '#ec4899' : '#3b82f6' }} />
                                  </div>
                                  <span style={{ fontWeight: '600', color: pair.affinityPercent >= 50 ? '#db2777' : '#2563eb' }}>
                                    {pair.affinityPercent}%
                                  </span>
                                </div>
                              </td>
                              <td>{pair.combinedBundlePrice} DH</td>
                              <td><strong style={{ color: '#059669' }}>{pair.discountBundlePrice10} DH</strong> (-10%)</td>
                              <td>
                                <span className="badge" style={{
                                  background: pair.recommendation.includes('Winning') ? '#fdf2f8' : pair.recommendation.includes('Cross-Sell') ? '#eff6ff' : '#f8fafc',
                                  color: pair.recommendation.includes('Winning') ? '#db2777' : pair.recommendation.includes('Cross-Sell') ? '#2563eb' : '#475569',
                                  border: pair.recommendation.includes('Winning') ? '1px solid #fbcfe8' : pair.recommendation.includes('Cross-Sell') ? '1px solid #bfdbfe' : '1px solid #e2e8f0'
                                }}>
                                  {pair.recommendation}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 5: STORE SALES OVERVIEW & LTV TIMELINE */}
            {(analyticsSubTab === 'all' || analyticsSubTab === 'overview') && (
              <div className="overview-section animate-fade-in" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                  <TrendingUp size={22} color="#8b5cf6" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: "'Playfair Display', serif" }}>
                      Store Sales Overview & Customer LTV
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Order fulfillment pipeline, daily sales timeline, top spending customers, and repurchase rate.
                    </span>
                  </div>
                </div>

                <div className="analytics-charts-grid">
                  <div className="analytics-chart-container">
                    <h3>Order Status Breakdown</h3>
                    <div style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry) => (
                              <Cell 
                                key={`cell-${entry.name}`} 
                                fill={STATUS_COLORS[entry.name] || '#94a3b8'} 
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="analytics-chart-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h3 style={{ margin: 0 }}>Revenue & Orders Timeline</h3>
                      <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
                        <button 
                          onClick={() => setChartViewMode('both')}
                          style={{
                            border: 'none',
                            background: chartViewMode === 'both' ? '#000' : 'transparent',
                            color: chartViewMode === 'both' ? '#fff' : '#64748b',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Combined
                        </button>
                        <button 
                          onClick={() => setChartViewMode('revenue')}
                          style={{
                            border: 'none',
                            background: chartViewMode === 'revenue' ? '#000' : 'transparent',
                            color: chartViewMode === 'revenue' ? '#fff' : '#64748b',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Revenue
                        </button>
                        <button 
                          onClick={() => setChartViewMode('orders')}
                          style={{
                            border: 'none',
                            background: chartViewMode === 'orders' ? '#000' : 'transparent',
                            color: chartViewMode === 'orders' ? '#fff' : '#64748b',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Orders
                        </button>
                      </div>
                    </div>

                    <div style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer>
                        <BarChart data={revenueChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <XAxis dataKey="date" />
                          <YAxis yAxisId="left" orientation="left" stroke="#64748b" />
                          {chartViewMode === 'both' && (
                            <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" allowDecimals={false} />
                          )}
                          <Tooltip 
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                const rev = data.revenue || 0;
                                const ords = data.orders || 0;
                                const avgVal = ords > 0 ? (rev / ords).toFixed(2) : '0.00';
                                return (
                                  <div style={{
                                    background: '#0f172a',
                                    color: '#fff',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
                                    fontSize: '0.85rem',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                  }}>
                                    <div style={{ fontWeight: '600', marginBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '0.3rem' }}>
                                      📅 {label}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.2rem', color: '#93c5fd', marginBottom: '0.25rem' }}>
                                      <span>📦 Orders Count:</span>
                                      <strong style={{ color: '#fff' }}>{ords} {ords === 1 ? 'order' : 'orders'}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.2rem', color: '#fb923c', marginBottom: '0.25rem' }}>
                                      <span>💰 Total Revenue:</span>
                                      <strong style={{ color: '#fff' }}>{rev.toFixed(2)} DH</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.2rem', color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.3rem', paddingTop: '0.3rem', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                                      <span>Average Order (AOV):</span>
                                      <strong style={{ color: '#e2e8f0' }}>{avgVal} DH</strong>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend />
                          {(chartViewMode === 'both' || chartViewMode === 'revenue') && (
                            <Bar yAxisId="left" name="Revenue (DH)" dataKey="revenue" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                          )}
                          {(chartViewMode === 'both' || chartViewMode === 'orders') && (
                            <Bar yAxisId={chartViewMode === 'both' ? 'right' : 'left'} name="Orders Volume" dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="analytics-charts-grid" style={{ marginTop: '1.5rem' }}>
                  <div className="analytics-chart-container">
                    <h3>Top Spenders (LTV Champions)</h3>
                    <div className="table-responsive">
                      <table className="admin-table">
                        <thead><tr><th>Customer</th><th>Orders</th><th>Spent</th></tr></thead>
                        <tbody>
                          {topBuyers.length === 0 ? (
                            <tr><td colSpan="3" className="text-center py-3">No customer orders recorded yet.</td></tr>
                          ) : (
                            topBuyers.map(b => (
                              <tr key={b.email}>
                                <td><div><strong>{b.name}</strong></div><div style={{fontSize: '0.8rem', color: '#666'}}>{b.email}</div></td>
                                <td>{b.orders}</td>
                                <td>{b.spend.toFixed(2)} DH</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="analytics-chart-container">
                    <h3>Top Selling Products</h3>
                    <div className="table-responsive">
                      <table className="admin-table">
                        <thead><tr><th>Product</th><th>Sold</th><th>Revenue</th></tr></thead>
                        <tbody>
                          {topSellers.length === 0 ? (
                            <tr><td colSpan="3" className="text-center py-3">No product sales yet.</td></tr>
                          ) : (
                            topSellers.map(p => (
                              <tr key={p.name}>
                                <td>{p.name}</td>
                                <td>{p.quantity}</td>
                                <td>{p.revenue.toFixed(2)} DH</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="analytics-chart-container full-width">
                    <h3>Customer Repurchase Velocity & Loyalty</h3>
                    {repurchaseData.length > 0 ? (
                      <div className="table-responsive">
                        <table className="admin-table">
                          <thead><tr><th>Customer</th><th>Total Orders</th><th>Avg Days Between</th></tr></thead>
                          <tbody>
                            {repurchaseData.map(c => (
                              <tr key={c.email}>
                                <td><div><strong>{c.name}</strong></div><div style={{fontSize: '0.8rem', color: '#666'}}>{c.email}</div></td>
                                <td>{c.totalOrders}</td>
                                <td>{c.avgDays} days</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p style={{color: '#666', padding: '1rem 0'}}>Not enough data from repeat customers yet in this date range.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="admin-panel animate-fade-in">
            <div className="panel-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2>Recent Orders</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                  Manage customer orders, track live status, and print fulfillment receipts
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input 
                  type="text"
                  placeholder="Search order #, customer, phone..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    minWidth: '220px'
                  }}
                />

                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ width: 'auto', padding: '0.45rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.85rem' }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <button 
                  onClick={handleManualRefresh} 
                  className="btn-secondary btn-small"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.8rem' }}
                  title="Refresh Orders"
                >
                  <RotateCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                  Refresh
                </button>

                <span className="badge" style={{ background: '#f1f5f9', color: '#334155', fontWeight: '600' }}>
                  {orders.filter(o => {
                    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
                    const query = orderSearchQuery.toLowerCase().trim();
                    if (!query) return matchesStatus;
                    const nameMatch = (o.user_name || '').toLowerCase().includes(query);
                    const emailMatch = (o.user_email || '').toLowerCase().includes(query);
                    const phoneMatch = (o.customer_phone || '').toLowerCase().includes(query);
                    const idMatch = String(o.id).includes(query);
                    return matchesStatus && (nameMatch || emailMatch || phoneMatch || idMatch);
                  }).length} shown
                </span>
              </div>
            </div>
            
            {/* Desktop Table View */}
            <div className="table-responsive desktop-orders-table">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.filter(o => {
                    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
                    const query = orderSearchQuery.toLowerCase().trim();
                    if (!query) return matchesStatus;
                    const nameMatch = (o.user_name || '').toLowerCase().includes(query);
                    const emailMatch = (o.user_email || '').toLowerCase().includes(query);
                    const phoneMatch = (o.customer_phone || '').toLowerCase().includes(query);
                    const idMatch = String(o.id).includes(query);
                    return matchesStatus && (nameMatch || emailMatch || phoneMatch || idMatch);
                  }).length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-4">No orders found matching your search.</td></tr>
                  ) : (
                    orders.filter(o => {
                      const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
                      const query = orderSearchQuery.toLowerCase().trim();
                      if (!query) return matchesStatus;
                      const nameMatch = (o.user_name || '').toLowerCase().includes(query);
                      const emailMatch = (o.user_email || '').toLowerCase().includes(query);
                      const phoneMatch = (o.customer_phone || '').toLowerCase().includes(query);
                      const idMatch = String(o.id).includes(query);
                      return matchesStatus && (nameMatch || emailMatch || phoneMatch || idMatch);
                    }).map(order => (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td>
                          <div style={{ fontWeight: '600' }}>{order.user_name || 'Guest Customer'}</div>
                          <div className="text-small text-light">{order.user_email || order.customer_phone || 'No email provided'}</div>
                        </td>
                        <td>
                          <div>{parseOrderDate(order.created_at).toLocaleDateString()}</div>
                          <div className="text-small text-light">{parseOrderDate(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                        </td>
                        <td className="font-bold">{order.total.toFixed(2)} DH</td>
                        <td>
                          <span className={`status-badge ${order.status.toLowerCase()}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="btn-secondary btn-small" 
                              onClick={() => setSelectedOrder(order)}
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                            >
                              View Details
                            </button>
                            <select 
                              className="status-select"
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              style={{ fontSize: '0.82rem' }}
                            >
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch-Friendly Order Cards */}
            <div className="mobile-orders-cards">
              {orders.filter(o => {
                const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
                const query = orderSearchQuery.toLowerCase().trim();
                if (!query) return matchesStatus;
                const nameMatch = (o.user_name || '').toLowerCase().includes(query);
                const emailMatch = (o.user_email || '').toLowerCase().includes(query);
                const phoneMatch = (o.customer_phone || '').toLowerCase().includes(query);
                const idMatch = String(o.id).includes(query);
                return matchesStatus && (nameMatch || emailMatch || phoneMatch || idMatch);
              }).length === 0 ? (
                <div className="no-mobile-orders">No orders found matching your search.</div>
              ) : (
                orders.filter(o => {
                  const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
                  const query = orderSearchQuery.toLowerCase().trim();
                  if (!query) return matchesStatus;
                  const nameMatch = (o.user_name || '').toLowerCase().includes(query);
                  const emailMatch = (o.user_email || '').toLowerCase().includes(query);
                  const phoneMatch = (o.customer_phone || '').toLowerCase().includes(query);
                  const idMatch = String(o.id).includes(query);
                  return matchesStatus && (nameMatch || emailMatch || phoneMatch || idMatch);
                }).map(order => (
                  <div key={order.id} className="mobile-order-card">
                    <div className="mobile-order-card-header">
                      <div className="mobile-order-id-date">
                        <span className="order-id">#{order.id}</span>
                        <span className="order-date">{parseOrderDate(order.created_at).toLocaleDateString()} • {parseOrderDate(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <span className={`status-badge ${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="mobile-order-card-body">
                      <div className="mobile-order-customer">
                        <div className="customer-name">{order.user_name || 'Guest Customer'}</div>
                        {order.customer_phone ? (
                          <a href={`tel:${order.customer_phone}`} className="customer-phone-link">
                            <Phone size={13} /> {order.customer_phone}
                          </a>
                        ) : (
                          <div className="customer-sub">{order.user_email || 'No contact provided'}</div>
                        )}
                      </div>

                      <div className="mobile-order-total-box">
                        <span className="total-label">Total</span>
                        <span className="total-amount">{Number(order.total).toFixed(2)} DH</span>
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="mobile-order-items-preview">
                        <span className="items-count-tag">{order.items.length} item{order.items.length > 1 ? 's' : ''}:</span>
                        <div className="items-thumbnails">
                          {order.items.slice(0, 4).map((it, idx) => (
                            <img key={idx} src={it.image} alt={it.name} title={`${it.name} (x${it.quantity})`} />
                          ))}
                          {order.items.length > 4 && <span className="more-items">+{order.items.length - 4}</span>}
                        </div>
                      </div>
                    )}

                    <div className="mobile-order-card-actions">
                      <button 
                        className="btn-secondary mobile-details-btn" 
                        onClick={() => setSelectedOrder(order)}
                      >
                        View Details
                      </button>
                      <select 
                        className="status-select mobile-status-select"
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                      >
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="admin-panel">
            <div className="panel-header">
              <h2>Real-World Inventory & Fulfillment</h2>
              <span className="badge">{products.length} products</span>
            </div>

            {/* Real-World Inventory Overview Stat Cards */}
            <div className="inventory-stats-grid">
              <div className="inventory-stat-card">
                <div className="inventory-icon-box" style={{ background: '#ecfdf5', color: '#059669' }}>
                  <Boxes size={22} />
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>Available On-Hand Stock</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: '700', color: '#0f172a' }}>
                    {products.reduce((acc, p) => acc + (p.stock !== undefined && p.stock !== null ? p.stock : 50), 0)} units
                  </div>
                </div>
              </div>

              <div className="inventory-stat-card">
                <div className="inventory-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <Truck size={22} />
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>Shipped & Delivered (Sold)</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: '700', color: '#2563eb' }}>
                    {products.reduce((acc, p) => acc + (p.units_sold || 0), 0)} units
                  </div>
                </div>
              </div>

              <div className="inventory-stat-card">
                <div className="inventory-icon-box" style={{ background: '#fef3c7', color: '#d97706' }}>
                  <Clock size={22} />
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>Reserved in Processing</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: '700', color: '#d97706' }}>
                    {products.reduce((acc, p) => acc + (p.units_reserved || 0), 0)} units
                  </div>
                </div>
              </div>

              <div className="inventory-stat-card">
                <div className="inventory-icon-box" style={{ background: '#fef2f2', color: '#dc2626' }}>
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>Low / Out of Stock</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: '700', color: '#dc2626' }}>
                    {products.filter(p => (p.stock !== undefined ? p.stock : 50) <= 10).length} SKUs
                  </div>
                </div>
              </div>
            </div>

            {/* Sub Filter and Search Controls */}
            <div className="table-controls" style={{ marginTop: '1.5rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button 
                  className={`btn-small ${productStockFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setProductStockFilter('all')}
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                >
                  All ({products.length})
                </button>
                <button 
                  className={`btn-small ${productStockFilter === 'in_stock' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setProductStockFilter('in_stock')}
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                >
                  In Stock ({products.filter(p => (p.stock !== undefined ? p.stock : 50) > 10).length})
                </button>
                <button 
                  className={`btn-small ${productStockFilter === 'low_stock' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setProductStockFilter('low_stock')}
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                >
                  ⚠️ Low Stock ({products.filter(p => (p.stock !== undefined ? p.stock : 50) > 0 && (p.stock !== undefined ? p.stock : 50) <= 10).length})
                </button>
                <button 
                  className={`btn-small ${productStockFilter === 'out_of_stock' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setProductStockFilter('out_of_stock')}
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                >
                  🚫 Out of Stock ({products.filter(p => (p.stock !== undefined ? p.stock : 50) <= 0).length})
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.85rem',
                    minWidth: '220px'
                  }}
                />

                <button 
                  className="btn-primary btn-small"
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm(defaultFormState);
                    setIsProductModalOpen(true);
                    setSelectedFile(null);
                    setGalleryFiles([]);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.5rem 1rem' }}
                >
                  <Plus size={16} /> Add Product
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Fulfillment / Sales</th>
                    <th>Available Stock (On-Hand)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.filter(p => {
                    const q = productSearchQuery.toLowerCase().trim();
                    const matchesSearch = !q || (p.name || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q) || (p.notes || '').toLowerCase().includes(q);
                    
                    const currentStock = p.stock !== undefined && p.stock !== null ? p.stock : 50;
                    let matchesStock = true;
                    if (productStockFilter === 'in_stock') matchesStock = currentStock > 10;
                    else if (productStockFilter === 'low_stock') matchesStock = currentStock > 0 && currentStock <= 10;
                    else if (productStockFilter === 'out_of_stock') matchesStock = currentStock <= 0;

                    return matchesSearch && matchesStock;
                  }).length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-4">No products found matching filters.</td></tr>
                  ) : (
                    products.filter(p => {
                      const q = productSearchQuery.toLowerCase().trim();
                      const matchesSearch = !q || (p.name || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q) || (p.notes || '').toLowerCase().includes(q);
                      
                      const currentStock = p.stock !== undefined && p.stock !== null ? p.stock : 50;
                      let matchesStock = true;
                      if (productStockFilter === 'in_stock') matchesStock = currentStock > 10;
                      else if (productStockFilter === 'low_stock') matchesStock = currentStock > 0 && currentStock <= 10;
                      else if (productStockFilter === 'out_of_stock') matchesStock = currentStock <= 0;

                      return matchesSearch && matchesStock;
                    }).map(prod => {
                      const stockVal = prod.stock !== undefined && prod.stock !== null ? prod.stock : 50;
                      const soldVal = prod.units_sold || 0;
                      const reservedVal = prod.units_reserved || 0;

                      return (
                        <tr key={prod.id}>
                          <td>
                            <img src={prod.image} alt={prod.name} className="admin-prod-img" />
                          </td>
                          <td>
                            <div className="font-bold">{prod.name}</div>
                            <div className="text-small text-light">{prod.notes}</div>
                          </td>
                          <td style={{ textTransform: 'capitalize' }}>{prod.category || 'Jewelry'}</td>
                          <td>{(parseFloat((prod.price || '0').toString().replace(/[^0-9.]/g, '')) || 0).toFixed(2)} DH</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ fontSize: '0.78rem', color: '#166534', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                                🚚 {soldVal} units sold
                              </span>
                              {reservedVal > 0 && (
                                <span style={{ fontSize: '0.75rem', color: '#92400e', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                                  ⏳ {reservedVal} in processing
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className="stock-stepper">
                                <button 
                                  className="stock-stepper-btn"
                                  onClick={() => handleQuickStockUpdate(prod.id, Math.max(0, stockVal - 1))}
                                  title="Decrease available stock by 1"
                                >
                                  -
                                </button>
                                <span className="stock-stepper-value">{stockVal}</span>
                                <button 
                                  className="stock-stepper-btn"
                                  onClick={() => handleQuickStockUpdate(prod.id, stockVal + 1)}
                                  title="Increase available stock by 1"
                                >
                                  +
                                </button>
                              </div>

                              <span className={`stock-pill ${stockVal <= 0 ? 'out-of-stock' : stockVal <= 10 ? 'low-stock' : 'in-stock'}`}>
                                {stockVal <= 0 ? 'Out of Stock' : stockVal <= 10 ? 'Low Stock' : 'In Stock'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button className="icon-btn edit-btn" onClick={() => openEditProduct(prod)} title="Edit product">
                                <Edit size={16} />
                              </button>
                              <button className="icon-btn delete-btn" onClick={() => setProductToDelete(prod)} title="Delete product">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ingredients' && (
          <div className="admin-panel">
            <div className="panel-header">
              <h2>Ingredient Library</h2>
              <span className="badge">{ingredientsList.length} total</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginTop: '1rem' }}>
              
              {/* Add Ingredient Form */}
              <div style={{ backgroundColor: 'var(--color-bg-alt)', padding: '1.5rem', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Add New Ingredient</h3>
                <form onSubmit={handleIngredientSubmit}>
                  <div className="form-group">
                    <label>Ingredient Name</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Coconut" 
                      value={ingredientForm.name} 
                      onChange={e => setIngredientForm({...ingredientForm, name: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Icon / Logo (Image)</label>
                    <input 
                      id="ingredient-file-input"
                      required 
                      type="file" 
                      accept="image/*"
                      onChange={e => setIngredientFile(e.target.files[0])}
                    />
                  </div>
                  <button type="submit" className="btn-primary w-100"><Plus size={16} /> Add to Library</button>
                </form>
              </div>

              {/* Ingredients List Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem', alignContent: 'start' }}>
                {ingredientsList.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--color-text-light)' }}>
                    Library is empty. Add your first ingredient!
                  </div>
                ) : ingredientsList.map(ing => (
                  <div key={ing.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', backgroundColor: 'white', borderRadius: '12px', border: '1px solid var(--color-border)', position: 'relative' }}>
                    <button 
                      onClick={() => handleDeleteIngredient(ing.id)}
                      style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.2rem' }}
                    >
                      <X size={14} />
                    </button>
                    <div style={{ width: '50px', height: '50px', backgroundColor: 'var(--color-bg-alt)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem', overflow: 'hidden' }}>
                      <img src={ing.icon} alt={ing.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '500', textAlign: 'center' }}>{ing.name}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="admin-panel animate-fade-in">
            {/* Header & Overview Stats */}
            <div className="admin-panel-header" style={{ marginBottom: '1.5rem' }}>
              <div>
                <h2>Customer Reviews & Moderation</h2>
                <p>Review, approve, or reject customer ratings before they appear on product pages.</p>
              </div>
              <button 
                className="btn-secondary" 
                onClick={() => fetchAdminReviews()}
                disabled={isReviewsLoading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <RotateCw size={16} className={isReviewsLoading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {/* Moderation Stat Cards */}
            <div className="review-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div 
                className={`review-stat-card ${reviewFilterStatus === 'pending' ? 'active' : ''}`}
                onClick={() => { setReviewFilterStatus('pending'); fetchAdminReviews('pending'); }}
                style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '1.2rem', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#b45309' }}>⏳ Pending Moderation</span>
                  <span style={{ background: '#fef3c7', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', color: '#b45309' }}>Action Req.</span>
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#92400e', marginTop: '0.4rem' }}>{adminReviewCounts.pending}</div>
                <div style={{ fontSize: '0.78rem', color: '#b45309' }}>Reviews awaiting your approval</div>
              </div>

              <div 
                className={`review-stat-card ${reviewFilterStatus === 'approved' ? 'active' : ''}`}
                onClick={() => { setReviewFilterStatus('approved'); fetchAdminReviews('approved'); }}
                style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '1.2rem', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#047857' }}>✓ Approved & Live</span>
                  <CheckCircle size={16} color="#059669" />
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#065f46', marginTop: '0.4rem' }}>{adminReviewCounts.approved}</div>
                <div style={{ fontSize: '0.78rem', color: '#047857' }}>Visible to store shoppers</div>
              </div>

              <div 
                className={`review-stat-card ${reviewFilterStatus === 'rejected' ? 'active' : ''}`}
                onClick={() => { setReviewFilterStatus('rejected'); fetchAdminReviews('rejected'); }}
                style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '1.2rem', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#b91c1c' }}>✕ Rejected</span>
                  <XCircle size={16} color="#dc2626" />
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#991b1b', marginTop: '0.4rem' }}>{adminReviewCounts.rejected}</div>
                <div style={{ fontSize: '0.78rem', color: '#b91c1c' }}>Hidden from store</div>
              </div>

              <div 
                className={`review-stat-card ${reviewFilterStatus === 'all' ? 'active' : ''}`}
                onClick={() => { setReviewFilterStatus('all'); fetchAdminReviews('all'); }}
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.2rem', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Total Submitted</span>
                  <MessageSquare size={16} color="#64748b" />
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#1e293b', marginTop: '0.4rem' }}>{adminReviewCounts.total}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>All time customer reviews</div>
              </div>
            </div>

            {/* Filter Pills and Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button 
                  className={`admin-filter-pill ${reviewFilterStatus === 'all' ? 'active' : ''}`}
                  onClick={() => { setReviewFilterStatus('all'); fetchAdminReviews('all'); }}
                  style={{ padding: '0.45rem 0.9rem', borderRadius: '20px', border: '1px solid #cbd5e1', background: reviewFilterStatus === 'all' ? '#0f172a' : '#fff', color: reviewFilterStatus === 'all' ? '#fff' : '#334155', fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  All ({adminReviewCounts.total})
                </button>
                <button 
                  className={`admin-filter-pill ${reviewFilterStatus === 'pending' ? 'active' : ''}`}
                  onClick={() => { setReviewFilterStatus('pending'); fetchAdminReviews('pending'); }}
                  style={{ padding: '0.45rem 0.9rem', borderRadius: '20px', border: '1px solid #f59e0b', background: reviewFilterStatus === 'pending' ? '#d97706' : '#fffbeb', color: reviewFilterStatus === 'pending' ? '#fff' : '#b45309', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  ⏳ Pending ({adminReviewCounts.pending})
                </button>
                <button 
                  className={`admin-filter-pill ${reviewFilterStatus === 'approved' ? 'active' : ''}`}
                  onClick={() => { setReviewFilterStatus('approved'); fetchAdminReviews('approved'); }}
                  style={{ padding: '0.45rem 0.9rem', borderRadius: '20px', border: '1px solid #10b981', background: reviewFilterStatus === 'approved' ? '#059669' : '#ecfdf5', color: reviewFilterStatus === 'approved' ? '#fff' : '#047857', fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  ✓ Approved ({adminReviewCounts.approved})
                </button>
                <button 
                  className={`admin-filter-pill ${reviewFilterStatus === 'rejected' ? 'active' : ''}`}
                  onClick={() => { setReviewFilterStatus('rejected'); fetchAdminReviews('rejected'); }}
                  style={{ padding: '0.45rem 0.9rem', borderRadius: '20px', border: '1px solid #ef4444', background: reviewFilterStatus === 'rejected' ? '#dc2626' : '#fef2f2', color: reviewFilterStatus === 'rejected' ? '#fff' : '#b91c1c', fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  ✕ Rejected ({adminReviewCounts.rejected})
                </button>
              </div>

              <div style={{ minWidth: '260px', flex: '0 1 320px' }}>
                <input 
                  type="text"
                  placeholder="Search reviews, reviewer, product..."
                  value={reviewSearchQuery}
                  onChange={(e) => {
                    setReviewSearchQuery(e.target.value);
                    fetchAdminReviews(undefined, e.target.value);
                  }}
                  style={{ width: '100%', padding: '0.55rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Reviews List */}
            {isReviewsLoading ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Loading reviews...</div>
            ) : adminReviews.length === 0 ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                <MessageSquare size={40} color="#94a3b8" style={{ marginBottom: '1rem' }} />
                <h3 style={{ color: '#334155' }}>No reviews found</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  {reviewFilterStatus === 'pending' ? 'Great job! No pending reviews awaiting moderation.' : 'No reviews match your current filter.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {adminReviews.map((rev) => (
                  <div 
                    key={rev.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '14px',
                      border: rev.status === 'pending' ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                      boxShadow: rev.status === 'pending' ? '0 4px 15px rgba(245, 158, 11, 0.08)' : '0 2px 6px rgba(0,0,0,0.02)',
                      padding: '1.4rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                      {/* Product details */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                        {rev.product_image && (
                          <img 
                            src={rev.product_image} 
                            alt={rev.product_name || 'Product'} 
                            style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eee' }} 
                          />
                        )}
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '700', color: '#1e293b' }}>
                            {rev.product_name || `Product #${rev.product_id}`}
                          </h4>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                            By <strong style={{ color: '#334155' }}>{rev.author_name}</strong> 
                            {rev.author_email ? ` (${rev.author_email})` : ''} 
                            {!!rev.verified_purchase && (
                              <span style={{ marginLeft: '6px', background: '#ecfdf5', color: '#059669', fontSize: '0.7rem', fontWeight: '700', padding: '0.15rem 0.45rem', borderRadius: '10px' }}>
                                ✓ Verified Buyer
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Badge & Date */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          {parseOrderDate(rev.created_at).toLocaleString()}
                        </span>
                        {rev.status === 'pending' && (
                          <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ⏳ Pending Moderation
                          </span>
                        )}
                        {rev.status === 'approved' && (
                          <span style={{ background: '#ecfdf5', color: '#047857', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ✓ Live & Approved
                          </span>
                        )}
                        {rev.status === 'rejected' && (
                          <span style={{ background: '#fef2f2', color: '#b91c1c', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ✕ Rejected
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Star Rating & Comment Body */}
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', marginBottom: '1.2rem', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.5rem' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            size={16} 
                            fill={s <= rev.rating ? '#F6D365' : 'transparent'} 
                            stroke={s <= rev.rating ? '#D4AF37' : '#cbd5e1'} 
                          />
                        ))}
                        <span style={{ marginLeft: '6px', fontWeight: '700', fontSize: '0.88rem', color: '#1e293b' }}>
                          {rev.rating} / 5
                        </span>
                      </div>
                      {rev.title && (
                        <div style={{ fontWeight: '700', fontSize: '0.92rem', color: '#0f172a', marginBottom: '0.3rem' }}>
                          {rev.title}
                        </div>
                      )}
                      <p style={{ margin: 0, fontSize: '0.88rem', color: '#334155', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                        {rev.comment}
                      </p>

                      {/* Customer Photo Attachments */}
                      {(() => {
                        let photoList = [];
                        try {
                          photoList = typeof rev.images === 'string' ? JSON.parse(rev.images) : (rev.images || []);
                        } catch(e) {}

                        if (Array.isArray(photoList) && photoList.length > 0) {
                          return (
                            <div style={{ marginTop: '0.9rem', paddingTop: '0.8rem', borderTop: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Camera size={14} /> Customer Photos ({photoList.length}):
                              </span>
                              {photoList.map((imgUrl, imgIdx) => (
                                <a key={imgIdx} href={imgUrl} target="_blank" rel="noopener noreferrer" title="Click to view full image in new tab">
                                  <img 
                                    src={imgUrl} 
                                    alt={`Review attachment ${imgIdx + 1}`} 
                                    style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'zoom-in', transition: 'transform 0.15s' }} 
                                  />
                                </a>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {/* Action Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        👍 {rev.helpful_count || 0} helpful votes
                      </div>

                      <div style={{ display: 'flex', gap: '0.6rem' }}>
                        {rev.status !== 'approved' && (
                          <button 
                            className="btn-primary"
                            onClick={() => handleUpdateReviewStatus(rev.id, 'approved')}
                            style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', background: '#059669', borderColor: '#059669', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Check size={14} /> Approve & Publish
                          </button>
                        )}
                        {rev.status !== 'rejected' && (
                          <button 
                            className="btn-secondary"
                            onClick={() => handleUpdateReviewStatus(rev.id, 'rejected')}
                            style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', borderColor: '#f87171', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteReview(rev.id)}
                          style={{ padding: '0.45rem 0.8rem', fontSize: '0.82rem', background: 'none', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Delete review permanently"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TEAM & ADMINS MANAGEMENT PANEL --- */}
        {activeTab === 'team' && (
          <div className="admin-panel animate-fade-in">
            <div className="admin-panel-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2>Store Administrators & Staff</h2>
                <p>Create, manage, and grant admin permissions to your team.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button 
                  className="btn-secondary" 
                  onClick={() => fetchAdminTeam()}
                  disabled={isAdminTeamLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <RotateCw size={16} className={isAdminTeamLoading ? 'animate-spin' : ''} /> Refresh
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => setIsCreateAdminModalOpen(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#0f172a' }}
                >
                  <UserPlus size={16} /> Add New Admin
                </button>
              </div>
            </div>

            {/* Admin Overview Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Total Administrators</span>
                  <Shield size={18} color="#0f172a" />
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#0f172a', marginTop: '0.4rem' }}>
                  {adminTeam.length || 1}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Active accounts with store management access</div>
              </div>

              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#047857' }}>Super Admin Role</span>
                  <UserCheck size={18} color="#059669" />
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#065f46', marginTop: '0.6rem' }}>
                  Full Access & Creator Privileges
                </div>
                <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '0.2rem' }}>Manage products, orders, analytics, and team members</div>
              </div>
            </div>

            {/* Admin Team Table */}
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Administrator</th>
                    <th>Email Address</th>
                    <th>Role & Status</th>
                    <th>Date Added</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminTeam.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                        Loading admin team members...
                      </td>
                    </tr>
                  ) : (
                    adminTeam.map((admin) => {
                      const isCurrentSession = currentLoggedInAdminId === admin.id || currentUser?.id === admin.id || currentUser?.email === admin.email;
                      return (
                        <tr key={admin.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem' }}>
                                {(admin.name || 'A')[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {admin.name}
                                  {isCurrentSession && (
                                    <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '0.7rem', fontWeight: '700', padding: '0.1rem 0.45rem', borderRadius: '10px' }}>
                                      You
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID #{admin.id}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontWeight: '500', color: '#334155' }}>
                            {admin.email}
                          </td>
                          <td>
                            <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <ShieldCheck size={12} /> Store Admin
                            </span>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                            {parseOrderDate(admin.created_at || Date.now()).toLocaleDateString()}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {isCurrentSession ? (
                              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                Active Session
                              </span>
                            ) : (
                              <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                                <button
                                  className="btn-secondary"
                                  onClick={() => handleRevokeAdmin(admin.id, admin.name)}
                                  style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', borderColor: '#fde68a', color: '#b45309', background: '#fffbeb' }}
                                  title="Revoke admin permissions (keep account)"
                                >
                                  Revoke Admin
                                </button>
                                <button
                                  onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', background: 'none', border: '1px solid #fee2e2', color: '#dc2626', borderRadius: '6px', cursor: 'pointer' }}
                                  title="Delete account permanently"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* --- CREATE ADMIN MODAL --- */}
      {isCreateAdminModalOpen && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setIsCreateAdminModalOpen(false)}>
          <div className="modal-content admin-modal animate-fade-up" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsCreateAdminModalOpen(false)}>
              <X size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserPlus size={18} />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Add New Administrator</h2>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Create an admin account for a team member to grant access to the store dashboard.
            </p>

            <form onSubmit={handleCreateAdmin}>
              <div className="admin-form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  Full Name *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Sarah Mansouri"
                  value={newAdminForm.name}
                  onChange={(e) => setNewAdminForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div className="admin-form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  Email Address *
                </label>
                <input 
                  type="email"
                  required
                  placeholder="e.g. sarah@aura.com"
                  value={newAdminForm.email}
                  onChange={(e) => setNewAdminForm(prev => ({ ...prev, email: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div className="admin-form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  Password * (Min 6 characters)
                </label>
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newAdminForm.password}
                  onChange={(e) => setNewAdminForm(prev => ({ ...prev, password: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div className="admin-form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  Confirm Password *
                </label>
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newAdminForm.confirmPassword}
                  onChange={(e) => setNewAdminForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsCreateAdminModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmittingAdmin} style={{ background: '#0f172a' }}>
                  {isSubmittingAdmin ? 'Creating...' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {selectedOrder && createPortal(
        <div className="modal-overlay">
          <div className="modal-content admin-modal">
            <button className="modal-close" onClick={() => setSelectedOrder(null)}>
              <X size={24} />
            </button>
            <h2>Order Details #{selectedOrder.id}</h2>
            
            <div className="order-details-info" style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
              <p><strong>Customer Account:</strong> {selectedOrder.user_name} ({selectedOrder.user_email})</p>
              <p><strong>Date:</strong> {parseOrderDate(selectedOrder.created_at).toLocaleString()}</p>
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f8f9fa', borderRadius: '4px' }}>
                <p><strong>Subtotal:</strong> {(selectedOrder.subtotal?.toFixed(2) || selectedOrder.total.toFixed(2))} DH</p>
                {selectedOrder.discount_amount > 0 && (
                  <p style={{ color: 'var(--color-accent)' }}><strong>Discount ({selectedOrder.discount_percent}%):</strong> -{selectedOrder.discount_amount.toFixed(2)} DH</p>
                )}
                {selectedOrder.shipping_cost !== undefined && (
                  <p><strong>Shipping Cost:</strong> {selectedOrder.shipping_cost > 0 ? `${selectedOrder.shipping_cost.toFixed(2)} DH` : 'Free'}</p>
                )}
                <p style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}><strong>Final Total:</strong> {selectedOrder.total.toFixed(2)} DH</p>
              </div>

              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0f4f8', borderRadius: '8px', border: '1px solid #d9e2ec' }}>
                <h4 style={{ marginBottom: '0.5rem', color: '#102a43', fontSize: '1rem' }}>Shipping Details</h4>
                {selectedOrder.shipping_details ? (() => {
                  try {
                    const ship = JSON.parse(selectedOrder.shipping_details);
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <div><strong>Name:</strong> {ship.firstName} {ship.lastName}</div>
                        <div><strong>Phone:</strong> {ship.phone}</div>
                        <div><strong>Email:</strong> {ship.email}</div>
                        <div style={{ gridColumn: '1 / -1' }}><strong>Address:</strong> {ship.address}, {ship.city}, {ship.zipCode}</div>
                      </div>
                    );
                  } catch(e) { 
                    return <div style={{ fontSize: '0.9rem', color: '#666' }}>Error loading shipping details.</div>; 
                  }
                })() : (
                  <div style={{ fontSize: '0.9rem', color: '#829ab1', fontStyle: 'italic' }}>
                    Shipping details not captured (Old Order). New orders will display full address and phone number here.
                  </div>
                )}
              </div>
              
              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <strong>Status:</strong>
                <select 
                  className="status-select"
                  value={selectedOrder.status}
                  onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                >
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <h3>Ordered Items</h3>
            <div className="table-responsive" style={{ marginTop: '1rem' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <img src={item.product_image} alt={item.product_name} className="admin-prod-img" style={{ width: '30px', height: '30px' }} />
                          <span>{item.product_name}</span>
                        </div>
                      </td>
                      <td>{item.price.toFixed(2)} DH</td>
                      <td>{item.quantity}</td>
                      <td>{(item.price * item.quantity).toFixed(2)} DH</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Order Calculation Breakdown */}
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#555' }}>
                <span>Subtotal</span>
                <span>{(selectedOrder.subtotal || selectedOrder.total).toFixed(2)} DH</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: selectedOrder.discount_amount > 0 ? '#e64a19' : '#555', fontWeight: '500' }}>
                <span>Bundle Discount ({selectedOrder.discount_percent || 0}%)</span>
                <span>-{(selectedOrder.discount_amount || 0).toFixed(2)} DH</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #ccc', fontWeight: 'bold' }}>
                <span>Final Total</span>
                <span>{selectedOrder.total.toFixed(2)} DH</span>
              </div>
            </div>
            
            <button className="btn-secondary w-100" style={{ marginTop: '2rem' }} onClick={() => setSelectedOrder(null)}>
              Close Details
            </button>
          </div>
        </div>,
        document.body
      )}

      {isProductModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content admin-modal">
            <button className="modal-close" onClick={() => setIsProductModalOpen(false)}>
              <X size={24} />
            </button>
            <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            
            <form onSubmit={handleProductSubmit} className="admin-form" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '1rem' }}>
              
              <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '0.5rem' }}>1. Basic Info</h3>
              
              <div className="form-group">
                <label>Product Name</label>
                <input required type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Category (System)</label>
                  <select required value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}>
                    <option value="Rings">Rings</option>
                    <option value="Necklaces">Necklaces</option>
                    <option value="Earrings">Earrings</option>
                    <option value="Bracelets">Bracelets</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Price (DH) *</label>
                  <input required type="number" step="0.01" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} placeholder="e.g. 290" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Stock / Inventory Units *</label>
                  <input 
                    required 
                    type="number" 
                    min="0" 
                    value={productForm.stock !== undefined ? productForm.stock : 50} 
                    onChange={e => setProductForm({...productForm, stock: parseInt(e.target.value) || 0})} 
                    placeholder="e.g. 50" 
                  />
                </div>
                <div className="form-group">
                  <label>Gender Audience</label>
                  <select value={productForm.gender} onChange={e => setProductForm({...productForm, gender: e.target.value})}>
                    <option value="Unisex">Unisex</option>
                    <option value="Women">Women</option>
                    <option value="Men">Men</option>
                  </select>
                </div>
              </div>

              <div className="form-group checkbox" style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={productForm.isNew} onChange={e => setProductForm({...productForm, isNew: e.target.checked})} style={{ width: 'auto', marginBottom: 0 }} />
                  Mark as "New Arrival"
                </label>
              </div>

              <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', margin: '1.5rem 0 1rem 0' }}>2. Media</h3>

              <div className="form-group">
                <label>Product Image</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => setSelectedFile(e.target.files[0])}
                    style={{ padding: '0.5rem', fontSize: '0.9rem' }}
                  />
                  <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-light)' }}>OR provide an external URL</div>
                  <input 
                    type="text" 
                    value={productForm.image} 
                    onChange={e => { setProductForm({...productForm, image: e.target.value}); setSelectedFile(null); }} 
                    placeholder="https://..." 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Gallery Images (Optional Additional Pictures)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {productForm.images && productForm.images.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                      {productForm.images.map((imgUrl, i) => (
                        <div key={i} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '4px', border: '1px solid #ccc', overflow: 'hidden' }}>
                          <img src={imgUrl} alt={`Gallery ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button 
                            type="button" 
                            onClick={() => setProductForm({...productForm, images: productForm.images.filter((_, idx) => idx !== i)})}
                            style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '10px', padding: '2px 4px' }}
                          >X</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    multiple
                    onChange={e => setGalleryFiles(Array.from(e.target.files))}
                    style={{ padding: '0.5rem', fontSize: '0.9rem' }}
                  />
                  {galleryFiles.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      {galleryFiles.map((file, i) => (
                        <div key={`new-${i}`} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '4px', border: '2px dashed #2e7d32', overflow: 'hidden' }}>
                          <img src={URL.createObjectURL(file)} alt={`New Gallery ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button 
                            type="button" 
                            onClick={() => setGalleryFiles(galleryFiles.filter((_, idx) => idx !== i))}
                            style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '10px', padding: '2px 4px' }}
                          >X</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {galleryFiles.length > 0 && <div style={{ fontSize: '0.85rem', color: '#2e7d32', marginTop: '0.2rem' }}>{galleryFiles.length} new files ready to upload.</div>}
                </div>
              </div>

              <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', margin: '1.5rem 0 1rem 0' }}>3. Jewelry Details</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Style Family (Badge)</label>
                  <input type="text" value={productForm.scentFamily} onChange={e => setProductForm({...productForm, scentFamily: e.target.value})} placeholder="e.g. Geometric, Minimalist, Classic" />
                </div>
                <div className="form-group">
                  <label>Estimated Retail Value (DH)</label>
                  <input type="number" value={productForm.luxuryPrice} onChange={e => setProductForm({...productForm, luxuryPrice: e.target.value})} placeholder="e.g. 750" />
                </div>
              </div>

              <div className="form-group">
                <label>Product Description (Subtitle)</label>
                <input type="text" value={productForm.scentDescription} onChange={e => setProductForm({...productForm, scentDescription: e.target.value})} placeholder="e.g. Handcrafted Stainless Steel ring with Zirconia" />
              </div>

              <div className="form-group">
                <label>Key Materials (Select from Library)</label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
                  gap: '0.8rem', 
                  padding: '1rem', 
                  border: '1px solid var(--color-border)', 
                  borderRadius: '8px',
                  backgroundColor: '#fcfcfc',
                  maxHeight: '250px',
                  overflowY: 'auto'
                }}>
                  {ingredientsList.length === 0 ? <p style={{margin:0, fontSize:'0.85rem'}}>No ingredients found in library.</p> : ingredientsList.map(ing => (
                    <label key={ing.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.6rem', 
                      cursor: 'pointer', 
                      padding: '0.5rem 0.8rem', 
                      backgroundColor: productForm.mainNotesIds.includes(ing.id) ? '#f0f7f4' : 'var(--color-bg-alt)', 
                      border: productForm.mainNotesIds.includes(ing.id) ? '1px solid #2e7d32' : '1px solid transparent',
                      borderRadius: '8px', 
                      fontSize: '0.85rem',
                      transition: 'all 0.2s',
                      boxShadow: productForm.mainNotesIds.includes(ing.id) ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                    }}>
                      <input 
                        type="checkbox" 
                        style={{ display: 'none' }}
                        checked={productForm.mainNotesIds.includes(ing.id)}
                        onChange={(e) => {
                          const newIds = e.target.checked 
                            ? [...productForm.mainNotesIds, ing.id] 
                            : productForm.mainNotesIds.filter(id => id !== ing.id);
                          setProductForm({...productForm, mainNotesIds: newIds});
                        }}
                      />
                      <img src={ing.icon} alt={ing.name} style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                      <span style={{ fontWeight: productForm.mainNotesIds.includes(ing.id) ? '600' : '500' }}>{ing.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Primary Material</label>
                <input type="text" value={productForm.topNotes} onChange={e => setProductForm({...productForm, topNotes: e.target.value})} placeholder="e.g. Stainless Steel 316L" />
              </div>

              <div className="form-group">
                <label>Secondary Material</label>
                <input type="text" value={productForm.middleNotes} onChange={e => setProductForm({...productForm, middleNotes: e.target.value})} placeholder="e.g. XP Plating / Cubic Zirconia" />
              </div>

              <div className="form-group">
                <label>Accents / Plating</label>
                <input type="text" value={productForm.baseNotes} onChange={e => setProductForm({...productForm, baseNotes: e.target.value})} placeholder="e.g. Lapis Lazuli, Rhodium Plating" />
              </div>

              <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', margin: '1.5rem 0 1rem 0' }}>4. Technical Details</h3>

              <div className="form-group">
                <label>Full Materials List</label>
                <textarea 
                  rows="4" 
                  value={productForm.ingredients} 
                  onChange={e => setProductForm({...productForm, ingredients: e.target.value})} 
                  placeholder="e.g. Pink Pepper Ess, Benzoin Res, Bergamot Ess..."
                  style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                />
              </div>

              <div className="form-group" style={{ display: 'none' }}>
                <label>Inspired By (Legacy)</label>
                <input type="text" value={productForm.inspiredBy} onChange={e => setProductForm({...productForm, inspiredBy: e.target.value})} />
              </div>

              <button type="submit" className="btn-primary w-100" style={{ marginTop: '1.5rem', padding: '1rem' }}>
                <Save size={18} /> {editingProduct ? 'Update Product' : 'Save Product'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
      {productToDelete && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
            <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Trash2 size={30} />
            </div>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Delete Product?</h2>
            <p style={{ color: 'var(--color-text-light)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Are you sure you want to delete <strong>{productToDelete.name}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                className="btn-secondary" 
                onClick={() => setProductToDelete(null)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={() => handleDeleteProduct(productToDelete.id)}
                style={{ flex: 1, backgroundColor: '#dc2626', borderColor: '#dc2626' }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Log Ad Spend Modal */}
      {isAdSpendModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px', padding: '2rem', borderRadius: '16px', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: '#ecfdf5', color: '#059669', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>Log Paid Ad Spend</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Calculate real Blended ROAS, MER & Net Profit</span>
                </div>
              </div>
              <button 
                onClick={() => setIsAdSpendModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAdSpend}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', fontSize: '0.85rem' }}>
                  Date of Spend *
                </label>
                <input 
                  type="date"
                  required
                  value={adSpendForm.date}
                  onChange={(e) => setAdSpendForm({ ...adSpendForm, date: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', fontSize: '0.85rem' }}>
                  Ad Platform / Channel *
                </label>
                <select
                  value={adSpendForm.platform}
                  onChange={(e) => setAdSpendForm({ ...adSpendForm, platform: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                >
                  <option value="Meta Ads">Meta Ads (Facebook & Instagram)</option>
                  <option value="TikTok Ads">TikTok Ads</option>
                  <option value="Google Ads">Google Ads</option>
                  <option value="Snapchat Ads">Snapchat Ads</option>
                  <option value="Influencer">Influencer / Creator Collab</option>
                  <option value="Other">Other Paid Marketing</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', fontSize: '0.85rem' }}>
                  Total Spend Amount (DH) *
                </label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="e.g. 850.00"
                  value={adSpendForm.amount}
                  onChange={(e) => setAdSpendForm({ ...adSpendForm, amount: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: '600' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: '#64748b' }}>
                    Impressions (Optional)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    placeholder="e.g. 24000"
                    value={adSpendForm.impressions}
                    onChange={(e) => setAdSpendForm({ ...adSpendForm, impressions: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: '#64748b' }}>
                    Link Clicks (Optional)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    placeholder="e.g. 420"
                    value={adSpendForm.clicks}
                    onChange={(e) => setAdSpendForm({ ...adSpendForm, clicks: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: '#64748b' }}>
                  Campaign Notes / Angles (Optional)
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Scaling Broad Advantage+ Video #4"
                  value={adSpendForm.notes}
                  onChange={(e) => setAdSpendForm({ ...adSpendForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsAdSpendModalOpen(false)}
                  style={{ padding: '0.6rem 1rem' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '0.6rem 1.25rem', background: '#059669', borderColor: '#059669' }}
                >
                  <Save size={16} /> Save Ad Spend
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {toastMessage && (
        <div className={`admin-toast admin-toast-${toastType}`}>
          {toastMessage}
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
