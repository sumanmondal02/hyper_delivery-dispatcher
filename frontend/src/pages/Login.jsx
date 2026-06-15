import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { RiMotorbikeLine, RiEyeLine, RiEyeOffLine, RiMailLine, RiLockLine } from 'react-icons/ri';
import useAuthStore from '../store/useAuthStore';
import * as S from '../styles/common';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    const res = await login(data);
    if (res.success) {
      toast.success('Welcome back!');
      const map = { customer: '/home', vendor: '/vendor/orders', partner: '/partner/available', admin: '/admin/dashboard' };
      navigate(map[res.role] || '/home');
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className={S.authPage}>
      <div className={S.authBox}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="/favicon.png" alt="Hyper" className="w-11 h-11 mr-0.5" />
          <span className={S.authLogo} style={{ marginBottom: 0 }}>Hyper</span>
        </div>
        <p className={S.authTagline}>Your city, delivered fast</p>
        <h2 className={S.authTitle}>Welcome back</h2>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={S.formGroup}>
            <label className={S.label}>Email</label>
            <div className={S.inputWrap}>
              <RiMailLine className={S.inputIcon} />
              <input
                {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
                type="email" placeholder="you@example.com"
                className={errors.email ? S.inputError : S.inputWithIcon}
              />
            </div>
            {errors.email && <p className={S.fieldError}>{errors.email.message}</p>}
          </div>

          <div className={S.formGroup}>
            <label className={S.label}>Password</label>
            <div className={S.inputWrap}>
              <RiLockLine className={S.inputIcon} />
              <input
                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                type={showPw ? 'text' : 'password'} placeholder="••••••••"
                className={`${errors.password ? S.inputError : S.inputWithIcon} pr-11`}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#f0f0f0] text-[18px] cursor-pointer">
                {showPw ? <RiEyeOffLine /> : <RiEyeLine />}
              </button>
            </div>
            {errors.password && <p className={S.fieldError}>{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={loading} className={`${S.btnPrimaryLg} mt-2`}>
            {loading ? <span className={S.spinner} /> : 'Log in'}
          </button>
        </form>

        <p className={S.authFooter}>
          No account? <Link to="/register" className={S.authLink}>Create one</Link>
        </p>
      </div>
    </div>
  );
}