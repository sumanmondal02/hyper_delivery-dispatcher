import { useNavigate } from 'react-router-dom';
import { RiMotorbikeLine, RiStoreLine, RiMapPinLine, RiArrowRightLine, RiTimeLine, RiShieldLine } from 'react-icons/ri';
import useAuthStore from '../store/useAuthStore';
import * as S from '../styles/common';

const features = [
  { icon: <RiTimeLine />, title: '10-min delivery', sub: 'Hyper-local partners always nearby' },
  { icon: <RiMapPinLine />, title: 'Live tracking', sub: 'Watch your order move in real-time' },
  { icon: <RiShieldLine />, title: 'Cash on delivery', sub: 'Pay when it arrives, no hassle' },
];

const roles = [
  { key: 'customer', icon: <RiMapPinLine />, label: 'Order food & essentials', cta: 'Start ordering' },
  { key: 'vendor',   icon: <RiStoreLine />,  label: 'Sell on our platform',    cta: 'List your store' },
  { key: 'partner',  icon: <RiMotorbikeLine />, label: 'Deliver & earn money', cta: 'Start delivering' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user }  = useAuthStore();

  const handleCta = (role) => {
    if (user) {
      const map = { customer: '/home', vendor: '/vendor/orders', partner: '/partner/available', admin: '/admin/dashboard' };
      navigate(map[user.role] || '/home');
    } else {
      navigate(`/register?role=${role}`);
    }
  };

  return (
    <div className={S.landingPage}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[#2e2e2e]">
        <span className={S.topBarLogo}>
          <img src="/favicon.png" alt="Hyper" className="w-15 h-15 mr-1.5" />
          Hyper - Dispatch. Track. Deliver.
        </span>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')}    className={S.btnSecondary}>Log in</button>
          <button onClick={() => navigate('/register')} className={S.btnPrimary}>Get started</button>
        </div>
      </nav>

      {/* Hero */}
      <section className={S.landingHero}>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ff6b00]/15 border border-[#ff6b00]/30 text-[#ff6b00] text-[13px] font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-[#ff6b00] animate-pulse" />
          Live deliveries in your area
        </div>
        <h1 className={S.landingTitle}>
          Delivered in<br />
          <span className={S.landingAccent}>minutes,</span> not hours
        </h1>
        <p className={S.landingSubtitle}>
          Hyper-local delivery connecting you to nearby restaurants, grocery stores, and pharmacies — with real-time tracking every step of the way.
        </p>
        <div className={S.landingBtns}>
          <button onClick={() => handleCta('customer')} className={S.btnPrimaryLg} style={{ width: 'auto', padding: '14px 32px' }}>
            Order now <RiArrowRightLine />
          </button>
          <button onClick={() => handleCta('partner')} className={S.btnSecondaryLg} style={{ width: 'auto', padding: '14px 32px' }}>
            Deliver & earn
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-12 max-w-[900px] mx-auto w-full">
        <div className={S.grid3}>
          {features.map((f) => (
            <div key={f.title} className={`${S.landingCard} flex items-start gap-4`}>
              <div className="w-10 h-10 rounded-xl bg-[#ff6b00]/15 flex items-center justify-center text-[#ff6b00] text-[20px] flex-shrink-0">
                {f.icon}
              </div>
              <div>
                <div className="font-bold text-[15px] text-[#f0f0f0]">{f.title}</div>
                <div className="text-[13px] text-[#888888] mt-0.5">{f.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Role cards */}
      <section className="px-6 pb-20 max-w-[900px] mx-auto w-full">
        <h2 className={`${S.h2} text-center mb-8`}>Who are you?</h2>
        <div className={S.grid3}>
          {roles.map((r) => (
            <div key={r.key}
              className={`${S.landingCard} flex flex-col items-center text-center gap-3 p-6 hover:border-[#ff6b00]/40 transition-all cursor-pointer`}
              onClick={() => handleCta(r.key)}>
              <div className="w-12 h-12 rounded-2xl bg-[#ff6b00]/15 flex items-center justify-center text-[#ff6b00] text-[24px]">
                {r.icon}
              </div>
              <div className="text-[14px] text-[#888888]">{r.label}</div>
              <button className={S.btnOutline} style={{ fontSize: '13px', padding: '8px 20px' }}>{r.cta}</button>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#2e2e2e] px-6 py-6 text-center text-[#555555] text-[13px]">
        © {new Date().getFullYear()} Hyper · Built for speed
      </footer>
    </div>
  );
}