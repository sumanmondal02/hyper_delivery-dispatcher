// ─── HYPER LOCAL DISPATCHER — Design System ──────────────────────────────────
// Dark-first UI inspired by Zepto / Blinkit / Swiggy
// Vite + React + TailwindCSS v4
// Import: import { btn, card, ... } from '../styles/common.js'

// ─── COLOR TOKENS ─────────────────────────────────────────────────────────────
export const colors = {
  bg:           '#0f0f0f',
  surface:      '#1a1a1a',
  surfaceHover: '#222222',
  surfaceLight: '#2a2a2a',
  border:       '#2e2e2e',
  borderHover:  '#444444',
  accent:       '#ff6b00',
  accentHover:  '#e05e00',
  accentLight:  '#ff6b0015',
  green:        '#00c853',
  greenBg:      '#00c85315',
  red:          '#ff3b30',
  redBg:        '#ff3b3015',
  amber:        '#ffb300',
  amberBg:      '#ffb30015',
  blue:         '#2979ff',
  blueBg:       '#2979ff15',
  text:         '#f0f0f0',
  textMuted:    '#888888',
  textHint:     '#555555',
  white:        '#ffffff',
  black:        '#000000',
};

// ─── PAGE SHELL ───────────────────────────────────────────────────────────────
export const pageRoot        = 'min-h-screen bg-[#0f0f0f] text-[#f0f0f0] font-sans antialiased';
export const pageWrapper     = 'max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8';
export const pageCentered    = 'min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4';

// ─── LAYOUT ───────────────────────────────────────────────────────────────────
export const appLayout       = 'flex min-h-screen bg-[#0f0f0f]';
export const sidebarLayout   = 'flex min-h-screen bg-[#0f0f0f]';
export const mainContent     = 'flex-1 min-w-0 overflow-x-hidden';

// Grids
export const grid2           = 'grid grid-cols-1 sm:grid-cols-2 gap-4';
export const grid3           = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';
export const grid4           = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4';
export const statGrid        = 'grid grid-cols-2 lg:grid-cols-4 gap-4';

// Flex utils
export const flexCenter      = 'flex items-center justify-center';
export const flexBetween     = 'flex items-center justify-between';
export const flexStart       = 'flex items-center gap-2';

// ─── TOP BAR / NAVBAR ─────────────────────────────────────────────────────────
export const topBar          = 'sticky top-0 z-40 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-[#2e2e2e] h-[60px] flex items-center px-4 md:px-6 gap-4';
export const topBarLogo      = 'text-[#ff6b00] font-extrabold text-[22px] tracking-tight flex items-center gap-2 cursor-pointer flex-shrink-0 select-none';
export const topBarLogoSub   = 'text-[#888888] font-medium text-[11px] tracking-widest uppercase';
export const topBarTitle     = 'font-bold text-[18px] text-[#f0f0f0] flex-1 truncate';
export const topBarActions   = 'flex items-center gap-2 ml-auto';
export const topBarIconBtn   = 'w-10 h-10 flex items-center justify-center rounded-full text-[#888888] hover:text-[#f0f0f0] hover:bg-[#2a2a2a] transition-colors cursor-pointer text-[20px] relative';
export const navBadge        = 'absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-[#ff6b00] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none';
export const backBtn         = 'w-9 h-9 rounded-full flex items-center justify-center text-[#f0f0f0] hover:bg-[#2a2a2a] transition-colors cursor-pointer text-[20px] flex-shrink-0';

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
export const sidebar         = 'w-[240px] flex-shrink-0 bg-[#1a1a1a] border-r border-[#2e2e2e] flex flex-col h-screen sticky top-0 hidden md:flex';
export const sidebarInner    = 'flex flex-col flex-1 overflow-y-auto p-3';
export const sidebarLogo     = 'flex items-center gap-2 px-2 py-5 mb-2';
export const sidebarLogoText = 'font-extrabold text-[20px] text-[#ff6b00] tracking-tight';
export const navSection      = 'text-[11px] font-semibold text-[#555555] uppercase tracking-widest px-3 mt-4 mb-1';
export const navItem         = 'flex items-center gap-3 px-3 h-[46px] rounded-xl text-[#888888] hover:text-[#f0f0f0] hover:bg-[#222222] transition-all cursor-pointer text-[15px] font-medium';
export const navItemActive   = 'flex items-center gap-3 px-3 h-[46px] rounded-xl text-[#ff6b00] bg-[#ff6b0015] font-semibold text-[15px] cursor-pointer';
export const navIcon         = 'text-[20px] flex-shrink-0';
export const navBadgeInline  = 'ml-auto min-w-[20px] h-[20px] bg-[#ff6b00] text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1';
export const sidebarDivider  = 'mx-2 my-3 border-t border-[#2e2e2e]';
export const sidebarUser     = 'flex items-center gap-3 p-3 mx-1 mb-2 rounded-xl hover:bg-[#222222] cursor-pointer transition-colors mt-auto';
export const sidebarUserName = 'font-semibold text-[14px] text-[#f0f0f0] leading-tight truncate';
export const sidebarUserRole = 'text-[12px] text-[#888888] capitalize leading-tight';

// ─── MOBILE BOTTOM NAV ────────────────────────────────────────────────────────
export const bottomNav       = 'fixed bottom-0 left-0 right-0 bg-[#0f0f0f] border-t border-[#2e2e2e] flex z-40 md:hidden';
export const bottomNavItem   = 'flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-[#555555] cursor-pointer transition-colors relative';
export const bottomNavActive = 'flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-[#ff6b00] cursor-pointer relative';
export const bottomNavLabel  = 'text-[10px] font-medium';

// ─── CARDS ────────────────────────────────────────────────────────────────────
export const card            = 'bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e]';
export const cardPadded      = 'bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e] p-4';
export const cardPaddedLg    = 'bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e] p-6';
export const cardHover       = 'bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e] hover:border-[#444444] hover:bg-[#1e1e1e] transition-all cursor-pointer';
export const cardHeader      = 'flex items-center justify-between mb-4';
export const cardTitle       = 'font-bold text-[16px] text-[#f0f0f0]';
export const cardSubtitle    = 'text-[13px] text-[#888888] mt-0.5';
export const cardSection     = 'border-t border-[#2e2e2e] px-4 py-3';

// ─── VENDOR CARD ──────────────────────────────────────────────────────────────
export const vendorCard      = 'bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e] hover:border-[#ff6b00]/40 hover:shadow-[0_0_0_1px_#ff6b0030] transition-all cursor-pointer overflow-hidden group';
export const vendorCardImg   = 'w-full h-[160px] object-cover bg-[#2a2a2a] group-hover:scale-[1.02] transition-transform duration-300';
export const vendorCardBody  = 'p-4';
export const vendorCardName  = 'font-bold text-[16px] text-[#f0f0f0] leading-snug';
export const vendorCardMeta  = 'flex items-center gap-3 mt-1.5 text-[13px] text-[#888888]';
export const vendorCardOpen  = 'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#00c853]/15 text-[#00c853]';
export const vendorCardClosed= 'text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#ff3b30]/15 text-[#ff3b30]';
export const vendorCardEta   = 'flex items-center gap-1 text-[12px] text-[#888888]';

// ─── PRODUCT CARD (menu) ──────────────────────────────────────────────────────
export const productCard     = 'flex items-center justify-between py-4 border-b border-[#2e2e2e] last:border-0 gap-4';
export const productInfo     = 'flex-1 min-w-0';
export const productName     = 'font-semibold text-[15px] text-[#f0f0f0] leading-snug';
export const productDesc     = 'text-[13px] text-[#888888] mt-0.5 line-clamp-2';
export const productPrice    = 'font-bold text-[15px] text-[#f0f0f0] mt-1.5';
export const productImg      = 'w-[100px] h-[100px] rounded-xl object-cover bg-[#2a2a2a] flex-shrink-0';
export const productImgEmpty = 'w-[100px] h-[100px] rounded-xl bg-[#2a2a2a] flex-shrink-0 flex items-center justify-center text-[#555555] text-[28px]';
export const vegDot          = 'inline-block w-4 h-4 border-2 border-[#00c853] rounded-sm flex items-center justify-center mr-1 flex-shrink-0';

// ─── ORDER CARD ───────────────────────────────────────────────────────────────
export const orderCard       = 'bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e] p-4 hover:border-[#444444] transition-all cursor-pointer';
export const orderCardHeader = 'flex items-center justify-between mb-3';
export const orderCardId     = 'font-mono text-[13px] font-bold text-[#ff6b00]';
export const orderCardDate   = 'text-[12px] text-[#888888]';
export const orderCardItems  = 'text-[14px] text-[#888888] mb-3 truncate';
export const orderCardFooter = 'flex items-center justify-between';
export const orderCardTotal  = 'font-bold text-[16px] text-[#f0f0f0]';

// ─── ORDER STATUS BADGES ──────────────────────────────────────────────────────
export const statusBadge = {
  placed:     'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#888888]/15 text-[#888888]',
  accepted:   'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#2979ff]/15 text-[#2979ff]',
  preparing:  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#ffb300]/15 text-[#ffb300]',
  ready:      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#ff6b00]/15 text-[#ff6b00]',
  picked_up:  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#ff6b00]/15 text-[#ff6b00]',
  in_transit: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#2979ff]/15 text-[#2979ff]',
  delivered:  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#00c853]/15 text-[#00c853]',
  cancelled:  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#ff3b30]/15 text-[#ff3b30]',
};
export const getStatusStyle  = (status) => statusBadge[status] || statusBadge.placed;

// ─── STAT CARDS ───────────────────────────────────────────────────────────────
export const statCard        = 'bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e] p-5';
export const statNum         = 'font-extrabold text-[32px] text-[#f0f0f0] leading-none';
export const statLabel       = 'text-[13px] text-[#888888] mt-2';
export const statIcon        = 'w-10 h-10 rounded-xl flex items-center justify-center text-[20px] mb-3';
export const statTrendUp     = 'text-[13px] font-medium text-[#00c853] mt-2';
export const statTrendDown   = 'text-[13px] font-medium text-[#ff3b30] mt-2';

// ─── ADMIN TABLE ──────────────────────────────────────────────────────────────
export const tableWrap       = 'overflow-x-auto rounded-2xl border border-[#2e2e2e]';
export const table           = 'w-full text-[14px]';
export const th              = 'text-left py-3.5 px-4 text-[#888888] text-[12px] font-semibold uppercase tracking-wide border-b border-[#2e2e2e] bg-[#1a1a1a]';
export const td              = 'py-3.5 px-4 border-b border-[#2e2e2e] text-[#f0f0f0]';
export const tr              = 'hover:bg-[#1e1e1e] transition-colors';

// ─── BUTTONS ──────────────────────────────────────────────────────────────────
export const btn             = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';
export const btnPrimary      = `${btn} bg-[#ff6b00] hover:bg-[#e05e00] text-white px-5 py-2.5 text-[15px]`;
export const btnPrimaryLg    = `${btn} bg-[#ff6b00] hover:bg-[#e05e00] text-white px-6 py-3.5 text-[16px] rounded-2xl w-full`;
export const btnSecondary    = `${btn} bg-[#2a2a2a] hover:bg-[#333333] text-[#f0f0f0] border border-[#2e2e2e] hover:border-[#444444] px-5 py-2.5 text-[15px]`;
export const btnSecondaryLg  = `${btn} bg-[#2a2a2a] hover:bg-[#333333] text-[#f0f0f0] border border-[#2e2e2e] hover:border-[#444444] px-6 py-3.5 text-[16px] rounded-2xl w-full`;
export const btnDanger       = `${btn} bg-[#ff3b30] hover:bg-[#e02d22] text-white px-5 py-2.5 text-[15px]`;
export const btnDangerOutline= `${btn} border border-[#ff3b30] text-[#ff3b30] hover:bg-[#ff3b3015] px-5 py-2.5 text-[15px]`;
export const btnOutline      = `${btn} border border-[#ff6b00] text-[#ff6b00] hover:bg-[#ff6b0015] px-5 py-2.5 text-[15px]`;
export const btnGhost        = `${btn} text-[#ff6b00] hover:bg-[#ff6b0015] px-4 py-2 text-[14px]`;
export const btnGreen        = `${btn} bg-[#00c853] hover:bg-[#00a844] text-white px-5 py-2.5 text-[15px]`;
export const btnSm           = `${btn} px-3 py-1.5 text-[13px] rounded-lg`;
export const btnIcon         = 'w-10 h-10 flex items-center justify-center rounded-xl text-[#888888] hover:text-[#f0f0f0] hover:bg-[#2a2a2a] transition-all cursor-pointer text-[20px]';
export const btnIconSm       = 'w-8 h-8 flex items-center justify-center rounded-lg text-[#888888] hover:text-[#f0f0f0] hover:bg-[#2a2a2a] transition-all cursor-pointer text-[18px]';

// ─── FORM ELEMENTS ────────────────────────────────────────────────────────────
export const formGroup       = 'flex flex-col gap-1.5 mb-4';
export const label           = 'text-[13px] font-semibold text-[#888888] uppercase tracking-wide';
export const input           = 'w-full bg-[#2a2a2a] border border-[#2e2e2e] rounded-xl px-4 py-3 text-[#f0f0f0] text-[15px] placeholder:text-[#555555] outline-none focus:border-[#ff6b00] focus:ring-1 focus:ring-[#ff6b00]/30 transition-all';
export const inputError      = 'w-full bg-[#2a2a2a] border border-[#ff3b30] rounded-xl px-4 py-3 text-[#f0f0f0] text-[15px] placeholder:text-[#555555] outline-none focus:border-[#ff3b30] transition-all';
export const inputWrap       = 'relative';
export const inputIcon       = 'absolute left-4 top-1/2 -translate-y-1/2 text-[#555555] text-[18px] pointer-events-none';
export const inputWithIcon   = 'w-full bg-[#2a2a2a] border border-[#2e2e2e] rounded-xl pl-11 pr-4 py-3 text-[#f0f0f0] text-[15px] placeholder:text-[#555555] outline-none focus:border-[#ff6b00] focus:ring-1 focus:ring-[#ff6b00]/30 transition-all';
export const select          = 'w-full bg-[#2a2a2a] border border-[#2e2e2e] rounded-xl px-4 py-3 text-[#f0f0f0] text-[15px] outline-none focus:border-[#ff6b00] transition-all cursor-pointer appearance-none';
export const textarea        = 'w-full bg-[#2a2a2a] border border-[#2e2e2e] rounded-xl px-4 py-3 text-[#f0f0f0] text-[15px] placeholder:text-[#555555] outline-none focus:border-[#ff6b00] focus:ring-1 focus:ring-[#ff6b00]/30 transition-all resize-none';
export const fieldError      = 'text-[12px] text-[#ff3b30] mt-1';
export const fieldHint       = 'text-[12px] text-[#555555] mt-1';

// ─── SEARCH BAR ───────────────────────────────────────────────────────────────
export const searchBar       = 'relative w-full';
export const searchInput     = 'w-full bg-[#2a2a2a] border border-[#2e2e2e] rounded-2xl pl-11 pr-4 py-3 text-[#f0f0f0] text-[15px] placeholder:text-[#555555] outline-none focus:border-[#ff6b00]/50 transition-all';
export const searchIcon      = 'absolute left-4 top-1/2 -translate-y-1/2 text-[#555555] text-[18px] pointer-events-none';
export const searchClear     = 'absolute right-4 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#f0f0f0] cursor-pointer text-[18px]';

// ─── TABS ─────────────────────────────────────────────────────────────────────
export const tabBar          = 'flex border-b border-[#2e2e2e] overflow-x-auto [&::-webkit-scrollbar]:hidden';
export const tab             = 'px-5 py-3.5 text-[#888888] text-[14px] font-medium whitespace-nowrap cursor-pointer hover:text-[#f0f0f0] transition-colors relative flex-shrink-0';
export const tabActive       = 'px-5 py-3.5 text-[#ff6b00] text-[14px] font-semibold whitespace-nowrap cursor-pointer relative flex-shrink-0';
export const tabIndicator    = 'absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff6b00] rounded-full';

// Category chips / filter pills
export const chipRow         = 'flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden';
export const chip            = 'flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-[#2a2a2a] border border-[#2e2e2e] text-[14px] text-[#888888] hover:border-[#ff6b00]/50 hover:text-[#f0f0f0] cursor-pointer transition-all whitespace-nowrap';
export const chipActive      = 'flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff6b00]/15 border border-[#ff6b00]/40 text-[14px] text-[#ff6b00] font-semibold cursor-pointer whitespace-nowrap';

// ─── MODALS ───────────────────────────────────────────────────────────────────
export const modalOverlay    = 'fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4';
export const modalBox        = 'bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto';
export const modalHeader     = 'flex items-center gap-3 px-5 py-4 border-b border-[#2e2e2e] sticky top-0 bg-[#1a1a1a] z-10';
export const modalTitle      = 'font-bold text-[18px] text-[#f0f0f0] flex-1';
export const modalClose      = 'w-9 h-9 flex items-center justify-center rounded-xl text-[#888888] hover:text-[#f0f0f0] hover:bg-[#2a2a2a] transition-all cursor-pointer text-[20px]';
export const modalBody       = 'px-5 py-5';
export const modalFooter     = 'flex items-center gap-3 justify-end px-5 py-4 border-t border-[#2e2e2e]';

// Bottom sheet (mobile)
export const sheetOverlay    = 'fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end';
export const sheetBox        = 'bg-[#1a1a1a] border-t border-[#2e2e2e] rounded-t-3xl w-full max-h-[90vh] overflow-y-auto';
export const sheetHandle     = 'w-10 h-1 rounded-full bg-[#2e2e2e] mx-auto mt-3 mb-4';

// Confirm dialog
export const confirmModal    = 'bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl w-full max-w-[360px] p-7 text-center';
export const confirmTitle    = 'font-bold text-[20px] text-[#f0f0f0] mb-2';
export const confirmBody     = 'text-[#888888] text-[14px] mb-6 leading-relaxed';

// ─── DROPDOWN ─────────────────────────────────────────────────────────────────
export const dropdown        = 'absolute right-0 top-12 bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl shadow-2xl z-20 min-w-[200px] py-1.5 overflow-hidden';
export const dropdownItem    = 'flex items-center gap-3 px-4 py-3 hover:bg-[#222222] cursor-pointer text-[14px] text-[#f0f0f0] transition-colors w-full text-left';
export const dropdownDanger  = 'flex items-center gap-3 px-4 py-3 hover:bg-[#ff3b3015] cursor-pointer text-[14px] text-[#ff3b30] font-semibold transition-colors w-full text-left';
export const dropdownDivider = 'my-1 border-t border-[#2e2e2e]';

// ─── AUTH PAGES ───────────────────────────────────────────────────────────────
export const authPage        = 'min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4';
export const authBox         = 'bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl w-full max-w-[440px] p-8';
export const authLogo        = 'text-[#ff6b00] font-extrabold text-[28px] text-center mb-1';
export const authTagline     = 'text-[#888888] text-[14px] text-center mb-8';
export const authTitle       = 'font-bold text-[22px] text-[#f0f0f0] mb-6';
export const authDivider     = 'flex items-center gap-3 text-[#555555] text-[13px] my-5';
export const authDividerLine = 'flex-1 border-t border-[#2e2e2e]';
export const authLink        = 'text-[#ff6b00] hover:underline cursor-pointer font-medium';
export const authFooter      = 'text-[#888888] text-[14px] text-center mt-6';

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
export const landingPage     = 'min-h-screen bg-[#0f0f0f] flex flex-col';
export const landingHero     = 'flex-1 flex flex-col items-center justify-center text-center px-6 py-20';
export const landingTitle    = 'font-extrabold text-[clamp(36px,6vw,72px)] text-[#f0f0f0] leading-tight mb-4';
export const landingAccent   = 'text-[#ff6b00]';
export const landingSubtitle = 'text-[clamp(16px,2vw,20px)] text-[#888888] max-w-[560px] leading-relaxed mb-10';
export const landingBtns     = 'flex flex-col sm:flex-row gap-3 items-center';
export const landingCard     = 'bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-5 text-left';

// ─── CART ─────────────────────────────────────────────────────────────────────
export const cartItem        = 'flex items-center gap-3 py-3 border-b border-[#2e2e2e] last:border-0';
export const cartItemName    = 'flex-1 font-medium text-[14px] text-[#f0f0f0]';
export const cartItemPrice   = 'text-[14px] font-semibold text-[#f0f0f0] min-w-[60px] text-right';
export const qtyControl      = 'flex items-center gap-0 border border-[#2e2e2e] rounded-xl overflow-hidden';
export const qtyBtn          = 'w-8 h-8 flex items-center justify-center text-[#ff6b00] hover:bg-[#ff6b0015] transition-colors cursor-pointer font-bold text-[16px]';
export const qtyValue        = 'w-8 text-center font-bold text-[14px] text-[#f0f0f0]';
export const addToCartBtn    = 'border border-[#ff6b00] text-[#ff6b00] font-bold text-[13px] px-3 py-1.5 rounded-xl hover:bg-[#ff6b0015] transition-colors cursor-pointer';

// Cart summary panel
export const cartSummary     = 'bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e] p-5 sticky top-[76px]';
export const cartSummaryRow  = 'flex justify-between text-[14px] text-[#888888] mb-2';
export const cartSummaryDiv  = 'border-t border-[#2e2e2e] my-3';
export const cartSummaryTotal= 'flex justify-between font-bold text-[16px] text-[#f0f0f0]';

// ─── CHECKOUT / PRICING ───────────────────────────────────────────────────────
export const priceRow        = 'flex justify-between items-center py-2 text-[14px]';
export const priceRowLabel   = 'text-[#888888]';
export const priceRowValue   = 'text-[#f0f0f0] font-medium';
export const priceTotalRow   = 'flex justify-between items-center py-3 border-t border-[#2e2e2e] mt-1';
export const priceTotalLabel = 'font-bold text-[16px] text-[#f0f0f0]';
export const priceTotalValue = 'font-extrabold text-[18px] text-[#ff6b00]';

// ─── ADDRESS CARD ─────────────────────────────────────────────────────────────
export const addressCard     = 'bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-4 hover:border-[#ff6b00]/40 transition-all cursor-pointer relative';
export const addressCardSel  = 'bg-[#1a1a1a] border border-[#ff6b00] rounded-2xl p-4 relative ring-1 ring-[#ff6b00]/30';
export const addressLabel    = 'inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#ff6b00]/15 text-[#ff6b00] mb-2';
export const addressText     = 'text-[14px] text-[#f0f0f0] leading-relaxed';
export const addressMeta     = 'text-[12px] text-[#888888] mt-1';

// ─── ORDER TRACKING ───────────────────────────────────────────────────────────
export const trackingMap     = 'w-full h-[55vh] max-h-[420px]';
export const trackingCard    = 'bg-[#1a1a1a] rounded-t-3xl border-t border-[#2e2e2e] -mt-4 relative z-10 px-4 pt-5 pb-6';
export const trackingStatus  = 'font-bold text-[20px] text-[#f0f0f0]';
export const trackingEta     = 'text-[#888888] text-[14px] mt-0.5';
export const trackingPartner = 'flex items-center gap-3 mt-4 p-3 bg-[#2a2a2a] rounded-xl';
export const trackingPName   = 'font-semibold text-[15px] text-[#f0f0f0]';
export const trackingPSub    = 'text-[#888888] text-[13px]';

// Order progress stepper
export const stepperWrap     = 'flex flex-col gap-0 my-4';
export const stepRow         = 'flex items-start gap-3 relative';
export const stepDot         = 'w-3 h-3 rounded-full border-2 flex-shrink-0 mt-1';
export const stepDotDone     = 'bg-[#00c853] border-[#00c853]';
export const stepDotActive   = 'bg-[#ff6b00] border-[#ff6b00]';
export const stepDotPending  = 'bg-transparent border-[#2e2e2e]';
export const stepLine        = 'absolute left-[5px] top-4 bottom-0 w-[2px] bg-[#2e2e2e]';
export const stepLineDone    = 'absolute left-[5px] top-4 bottom-0 w-[2px] bg-[#00c853]';
export const stepLabel       = 'text-[14px] pb-5 text-[#555555]';
export const stepLabelDone   = 'text-[14px] pb-5 text-[#00c853] font-medium';
export const stepLabelActive = 'text-[14px] pb-5 text-[#ff6b00] font-semibold';

// ─── PARTNER DASHBOARD ────────────────────────────────────────────────────────
export const toggleWrap      = 'flex items-center gap-3 p-4 bg-[#1a1a1a] rounded-2xl border border-[#2e2e2e]';
export const toggleLabel     = 'flex-1 font-semibold text-[15px] text-[#f0f0f0]';
export const toggleSub       = 'text-[13px] text-[#888888]';
export const toggleTrack     = 'relative w-12 h-6 rounded-full transition-colors cursor-pointer';
export const toggleTrackOn   = 'bg-[#00c853]';
export const toggleTrackOff  = 'bg-[#2a2a2a] border border-[#2e2e2e]';
export const toggleThumb     = 'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform';

export const earningCard     = 'bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-3 text-center';
export const earningNum      = 'font-extrabold text-[22px] text-[#f0f0f0]';
export const earningLabel    = 'text-[11px] text-[#888888] mt-0.5 uppercase tracking-wide';

// Delivery request modal
export const deliveryModal   = 'fixed inset-0 z-50 flex items-end sm:items-center justify-center';
export const deliveryModalBg = 'absolute inset-0 bg-black/75 backdrop-blur-sm';
export const deliveryModalBox= 'relative bg-[#1a1a1a] border border-[#2e2e2e] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-[420px] p-6 z-10';
export const deliveryDetail  = 'flex items-start gap-3 py-3 border-b border-[#2e2e2e] last:border-0';
export const deliveryDetIcon = 'w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[#888888] text-[16px] flex-shrink-0 mt-0.5';
export const deliveryDetLabel= 'text-[13px] text-[#888888]';
export const deliveryDetVal  = 'text-[15px] font-semibold text-[#f0f0f0]';
export const earningsBadge   = 'bg-[#00c853]/15 text-[#00c853] border border-[#00c853]/30 font-bold text-[24px] px-4 py-3 rounded-xl text-center mt-4 mb-2';

// Vendor order queue
export const orderQueueItem  = 'bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-3 mb-2 hover:border-[#ff6b00]/40 transition-colors cursor-pointer';
export const orderQueueHdr   = 'flex items-center justify-between mb-2';
export const orderQueueId    = 'font-mono text-[12px] font-bold text-[#ff6b00]';
export const orderQueueItems = 'text-[13px] text-[#888888]';
export const orderQueueAmt   = 'font-bold text-[15px] text-[#f0f0f0]';

// ─── GOOGLE MAP WRAPPERS ──────────────────────────────────────────────────────
export const mapContainer    = 'rounded-2xl overflow-hidden border border-[#2e2e2e] w-full';
export const mapFull         = 'w-full h-[400px]';
export const mapSmall        = 'w-full h-[220px]';
export const mapLarge        = 'w-full h-[550px]';
export const mapTrack        = 'w-full h-[55vh] max-h-[420px]';

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const notifItem       = 'flex gap-4 px-4 py-4 border-b border-[#2e2e2e] hover:bg-[#1e1e1e] transition-colors cursor-pointer';
export const notifItemUnread = 'flex gap-4 px-4 py-4 border-b border-[#2e2e2e] hover:bg-[#1e1e1e] transition-colors cursor-pointer bg-[#ff6b00]/5';
export const notifIcon       = 'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[18px]';
export const notifIconOrder  = 'bg-[#ff6b00]/15 text-[#ff6b00]';
export const notifIconDel    = 'bg-[#2979ff]/15 text-[#2979ff]';
export const notifIconPay    = 'bg-[#00c853]/15 text-[#00c853]';
export const notifIconSys    = 'bg-[#888888]/15 text-[#888888]';
export const notifContent    = 'flex-1 min-w-0';
export const notifTitle      = 'font-semibold text-[14px] text-[#f0f0f0] leading-snug';
export const notifMsg        = 'text-[13px] text-[#888888] mt-0.5 leading-snug';
export const notifTime       = 'text-[12px] text-[#555555] mt-1';
export const notifUnreadDot  = 'w-2 h-2 rounded-full bg-[#ff6b00] flex-shrink-0 mt-2';

// ─── BADGES ───────────────────────────────────────────────────────────────────
export const badge           = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-semibold';
export const badgeOrange     = `${badge} bg-[#ff6b00]/15 text-[#ff6b00]`;
export const badgeGreen      = `${badge} bg-[#00c853]/15 text-[#00c853]`;
export const badgeRed        = `${badge} bg-[#ff3b30]/15 text-[#ff3b30]`;
export const badgeAmber      = `${badge} bg-[#ffb300]/15 text-[#ffb300]`;
export const badgeBlue       = `${badge} bg-[#2979ff]/15 text-[#2979ff]`;
export const badgeGray       = `${badge} bg-[#888888]/15 text-[#888888]`;

// ─── FEEDBACK / ALERTS ────────────────────────────────────────────────────────
export const errorAlert      = 'bg-[#ff3b30]/10 border border-[#ff3b30]/30 text-[#ff3b30] rounded-xl px-4 py-3 text-[14px]';
export const successAlert    = 'bg-[#00c853]/10 border border-[#00c853]/30 text-[#00c853] rounded-xl px-4 py-3 text-[14px]';
export const warningAlert    = 'bg-[#ffb300]/10 border border-[#ffb300]/30 text-[#ffb300] rounded-xl px-4 py-3 text-[14px]';
export const infoAlert       = 'bg-[#2979ff]/10 border border-[#2979ff]/30 text-[#2979ff] rounded-xl px-4 py-3 text-[14px]';

// ─── LOADING / SKELETON ───────────────────────────────────────────────────────
export const spinner         = 'w-5 h-5 border-2 border-[#2e2e2e] border-t-[#ff6b00] rounded-full animate-spin';
export const spinnerLg       = 'w-9 h-9 border-[3px] border-[#2e2e2e] border-t-[#ff6b00] rounded-full animate-spin';
export const loadingCenter   = 'flex justify-center items-center py-12';
export const loadingOverlay  = 'absolute inset-0 bg-[#0f0f0f]/70 flex items-center justify-center z-10 rounded-2xl backdrop-blur-sm';
export const skeleton        = 'animate-pulse bg-[#2a2a2a] rounded-xl';
export const skeletonText    = 'animate-pulse bg-[#2a2a2a] rounded-full h-3';
export const skeletonCircle  = (size = 'w-10 h-10') => `animate-pulse bg-[#2a2a2a] rounded-full ${size}`;

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export const emptyState      = 'flex flex-col items-center justify-center py-16 px-6 text-center';
export const emptyIcon       = 'text-[48px] text-[#2a2a2a] mb-4';
export const emptyTitle      = 'font-bold text-[18px] text-[#f0f0f0] mb-2';
export const emptySubtitle   = 'text-[14px] text-[#888888] max-w-[280px] leading-relaxed';

// ─── SECTION HEADERS ──────────────────────────────────────────────────────────
export const sectionHead     = 'flex items-center justify-between mb-4';
export const sectionTitle    = 'font-bold text-[18px] text-[#f0f0f0]';
export const sectionSub      = 'text-[#888888] text-[13px] mt-0.5';
export const sectionLink     = 'text-[13px] font-semibold text-[#ff6b00] hover:underline cursor-pointer';

// ─── TYPOGRAPHY ───────────────────────────────────────────────────────────────
export const h1              = 'font-extrabold text-[28px] text-[#f0f0f0] leading-tight';
export const h2              = 'font-bold text-[22px] text-[#f0f0f0] leading-snug';
export const h3              = 'font-bold text-[18px] text-[#f0f0f0] leading-snug';
export const h4              = 'font-semibold text-[16px] text-[#f0f0f0]';
export const bodyText        = 'text-[15px] text-[#f0f0f0] leading-relaxed';
export const mutedText       = 'text-[14px] text-[#888888] leading-relaxed';
export const hintText        = 'text-[12px] text-[#555555]';
export const linkText        = 'text-[#ff6b00] hover:underline cursor-pointer font-medium';
export const rupee           = '₹';

// ─── DIVIDERS ─────────────────────────────────────────────────────────────────
export const divider         = 'border-t border-[#2e2e2e]';
export const dividerThick    = 'border-t-4 border-[#1a1a1a]';
export const dot             = 'w-1 h-1 rounded-full bg-[#555555] inline-block mx-1.5 align-middle';

// ─── MISC UTILS ───────────────────────────────────────────────────────────────
export const scrollHide      = '[&::-webkit-scrollbar]:hidden overflow-auto';
export const truncate2       = 'line-clamp-2';
export const truncate3       = 'line-clamp-3';
export const avatarFallback  = (size = 'w-10 h-10') => `${size} rounded-full bg-[#ff6b00]/15 flex items-center justify-center text-[#ff6b00] font-bold flex-shrink-0`;
export const srOnly          = 'sr-only';

// ─── REACT-ICONS REFERENCE (react-icons/ri) ───────────────────────────────────
// RiMapPinLine / RiMapPin2Fill       → location
// RiTimeLine                         → ETA / clock
// RiMotorbikeLine                    → delivery partner / bike
// RiStoreLine / RiStore2Line         → vendor / shop
// RiShoppingCartLine / RiCartFill    → cart
// RiOrderPlayLine / RiFileListLine   → orders
// RiBellLine / RiBellFill            → notifications
// RiUserLine / RiUserFill            → profile
// RiHome5Line / RiHome5Fill          → home
// RiSearchLine                       → search
// RiArrowLeftLine                    → back button
// RiCloseLine                        → close / X modal
// RiCheckLine / RiCheckDoubleLine    → success / delivered
// RiStarFill                         → rating (future)
// RiPhoneLine                        → call partner
// RiWalletLine / RiMoneyDollarLine   → earnings / wallet
// RiDashboardLine                    → admin dashboard
// RiGroupLine / RiTeamLine           → users list
// RiBarChartLine / RiLineChartLine   → analytics
// RiSettings4Line                    → settings
// RiAddLine / RiSubtractLine         → qty +/- in cart
// RiImageAddLine                     → image upload
// RiLogoutBoxLine                    → logout
// RiVerifiedBadgeFill                → verified vendor
// RiTruckLine                        → delivery truck (admin map)
// RiShieldLine                       → admin / security
// RiToggleLine / RiFill              → online/offline toggle
// RiEyeLine / RiEyeOffLine           → password show/hide
// RiEditLine                         → edit product/profile
// RiDeleteBinLine                    → delete
// RiRefreshLine                      → refresh orders
// RiNavigationLine                   → route / navigate
// RiMoneyRupeeCircleLine             → rupee earnings
// RiHistoryLine                      → delivery history