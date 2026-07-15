import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import InputField from '../components/UI/InputField';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const result = await login(data.email, data.password, data.rememberMe);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Welcome back, Admin!', {
        icon: '💼',
        style: { borderRadius: '12px', background: '#0f172a', color: '#fff' }
      });
      window.location.href = '/';
    } else {
      toast.error(result.message || 'Authentication Failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl transition-all duration-300">
        
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl mb-4 border border-indigo-500/30">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Electronics ERP</h1>
          <p className="text-sm text-slate-400 mt-1">Sign in to control business management operations</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          <div className="text-slate-200">
            <InputField
              label="Admin Identity (Email)"
              type="email"
              placeholder="admin@shop.com"
              icon={Mail}
              error={errors.email?.message}
              {...register('email', { 
                required: 'Email mapping profile is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid format patterns' }
              })}
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            />
          </div>

          <div className="text-slate-200">
            <InputField
              label="Secure Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              error={errors.password?.message}
              {...register('password', { 
                required: 'Security key entry is missing',
                minLength: { value: 6, message: 'Password must be at least 6 characters' }
              })}
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500/30 accent-indigo-500"
                {...register('rememberMe')}
              />
              <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">Remember device session</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Secure Node...</span>
              </>
            ) : (
              <span>Access Control Room</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}