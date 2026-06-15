import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  RiMotorbikeLine, RiEyeLine, RiEyeOffLine, RiMailLine,
  RiLockLine, RiUserLine, RiPhoneLine, RiStoreLine, RiMapPinLine,
} from 'react-icons/ri';
import favicon from '../../public/favicon.png';
import useAuthStore from '../store/useAuthStore';
import * as S from '../styles/common';

const ROLES = [
  { key: 'customer', label: 'Customer',         icon: <RiMapPinLine />,    sub: 'Order food & essentials' },
  { key: 'vendor',   label: 'Vendor',           icon: <RiStoreLine />,     sub: 'Sell on the platform' },
  { key: 'partner',  label: 'Delivery Partner', icon: <RiMotorbikeLine />, sub: 'Deliver & earn' },
];

const VEHICLE_TYPES = ['bike', 'scooter', 'truck'];

export default function Register() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { register: registerUser, loading } = useAuthStore();
  const [role, setRole] = useState(params.get('role') || 'customer');
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    const payload = { ...data, role };
    const res = await registerUser(payload);
    if (res.success) {
      toast.success('Account created!');
      const map = { customer: '/home', vendor: '/vendor/orders', partner: '/partner/available' };
      navigate(map[role] || '/home');
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className={S.authPage}>
      <div className={`${S.authBox} max-w-[520px]`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src={favicon} alt="Hyper" className="w-11 h-11 mr-0.5" />
          <span className={S.authLogo} style={{ marginBottom: 0 }}>Hyper</span>
        </div>
        <p className={S.authTagline}>Join the fastest delivery network</p>
        <h2 className={S.authTitle}>Create account</h2>

        {/* Role selector */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {ROLES.map((r) => (
            <button key={r.key} type="button" onClick={() => setRole(r.key)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                role === r.key
                  ? 'border-[#ff6b00] bg-[#ff6b00]/10 text-[#ff6b00]'
                  : 'border-[#2e2e2e] bg-[#2a2a2a] text-[#888888] hover:border-[#444444]'
              }`}>
              <span className="text-[20px]">{r.icon}</span>
              <span className="text-[12px] font-semibold leading-tight">{r.label}</span>
              <span className="text-[10px] opacity-70 leading-tight">{r.sub}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Name */}
          <div className={S.formGroup}>
            <label className={S.label}>Full Name</label>
            <div className={S.inputWrap}>
              <RiUserLine className={S.inputIcon} />
              <input {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })}
                type="text" placeholder="Full Name"
                className={errors.name ? S.inputError : S.inputWithIcon} />
            </div>
            {errors.name && <p className={S.fieldError}>{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className={S.formGroup}>
            <label className={S.label}>Email</label>
            <div className={S.inputWrap}>
              <RiMailLine className={S.inputIcon} />
              <input {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
                type="email" placeholder="you@example.com"
                className={errors.email ? S.inputError : S.inputWithIcon} />
            </div>
            {errors.email && <p className={S.fieldError}>{errors.email.message}</p>}
          </div>

          {/* Phone */}
          <div className={S.formGroup}>
            <label className={S.label}>Phone</label>
            <div className={S.inputWrap}>
              <RiPhoneLine className={S.inputIcon} />
              <input {...register('phone', { required: 'Phone is required', pattern: { value: /^[6-9]\d{9}$/, message: 'Enter valid 10-digit number' } })}
                type="tel" placeholder="9999999999"
                className={errors.phone ? S.inputError : S.inputWithIcon} />
            </div>
            {errors.phone && <p className={S.fieldError}>{errors.phone.message}</p>}
          </div>

          {/* Password */}
          <div className={S.formGroup}>
            <label className={S.label}>Password</label>
            <div className={S.inputWrap}>
              <RiLockLine className={S.inputIcon} />
              <input {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                type={showPw ? 'text' : 'password'} placeholder="••••••••"
                className={`${errors.password ? S.inputError : S.inputWithIcon} pr-11`} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#f0f0f0] text-[18px] cursor-pointer">
                {showPw ? <RiEyeOffLine /> : <RiEyeLine />}
              </button>
            </div>
            {errors.password && <p className={S.fieldError}>{errors.password.message}</p>}
          </div>

          {/* Partner-only fields */}
          {role === 'partner' && (
            <div className="border border-[#2e2e2e] rounded-xl p-4 mb-4 bg-[#2a2a2a]/50">
              <p className="text-[12px] font-semibold text-[#888888] uppercase tracking-wide mb-3">Vehicle Details</p>

              <div className={S.formGroup}>
                <label className={S.label}>Vehicle Type</label>
                <select {...register('vehicleType', { required: role === 'partner' ? 'Select vehicle type' : false })}
                  className={errors.vehicleType ? S.inputError : S.select}>
                  <option value="">Select type</option>
                  {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
                </select>
                {errors.vehicleType && <p className={S.fieldError}>{errors.vehicleType.message}</p>}
              </div>

              <div className={S.formGroup} style={{ marginBottom: 0 }}>
                <label className={S.label}>Vehicle Number</label>
                <input {...register('vehicleNumber', { required: role === 'partner' ? 'Vehicle number required' : false })}
                  type="text" placeholder="TN01AB1234"
                  className={errors.vehicleNumber ? S.inputError : S.input} />
                {errors.vehicleNumber && <p className={S.fieldError}>{errors.vehicleNumber.message}</p>}
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className={`${S.btnPrimaryLg} mt-2`}>
            {loading ? <span className={S.spinner} /> : 'Create account'}
          </button>
        </form>

        <p className={S.authFooter}>
          Already have an account? <Link to="/login" className={S.authLink}>Log in</Link>
        </p>
      </div>
    </div>
  );
}