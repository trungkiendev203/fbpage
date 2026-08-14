'use client';

import React, { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Facebook, LockKeyhole, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@fbpage.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError(res.status === 401 ? 'Email hoặc mật khẩu không đúng.' : 'Không thể kết nối máy chủ.');
        return;
      }

      router.replace('/');
      router.refresh();
    } catch {
      setError('Không thể kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white grid lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden lg:flex relative overflow-hidden border-r border-white/10 p-14 flex-col justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.32),transparent_34%),radial-gradient(circle_at_80%_75%,rgba(14,165,233,0.18),transparent_30%)]" />
        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Facebook className="w-6 h-6 fill-current" />
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight">Tools FB</p>
            <p className="text-xs font-mono text-slate-400">EDITORIAL OPERATIONS</p>
          </div>
        </div>
        <div className="relative max-w-xl">
          <p className="text-xs font-mono tracking-[0.3em] text-blue-400 mb-5">CONTROL ROOM / SECURE ACCESS</p>
          <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight">
            Điều phối nội dung.<br />Kiểm soát từng lần xuất bản.
          </h1>
          <p className="mt-6 text-sm leading-7 text-slate-400 max-w-md">
            Không gian vận hành tập trung cho quy trình thu thập, biên tập và phát hành nội dung Facebook Page.
          </p>
        </div>
        <p className="relative text-[11px] font-mono text-slate-600">AUTHORIZED PERSONNEL ONLY</p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Facebook className="w-5 h-5 fill-current" />
            </div>
            <span className="font-extrabold">Tools FB</span>
          </div>
          <p className="text-xs font-mono text-blue-400 tracking-widest">XÁC THỰC VẬN HÀNH</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight">Đăng nhập hệ thống</h2>
          <p className="mt-2 text-sm text-slate-400">Sử dụng tài khoản quản trị đã được cấp quyền.</p>

          <form onSubmit={handleSubmit} className="mt-9 space-y-5">
            <label className="block">
              <span className="text-xs font-semibold text-slate-300">Email</span>
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-900 px-3 focus-within:border-blue-500">
                <Mail className="w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="username"
                  className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-600"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-300">Mật khẩu</span>
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-900 px-3 focus-within:border-blue-500">
                <LockKeyhole className="w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoFocus
                  autoComplete="current-password"
                  className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-600"
                  placeholder="Nhập mật khẩu"
                />
              </div>
            </label>

            {error && <p className="rounded-md border border-red-900 bg-red-950/60 px-3 py-2.5 text-xs text-red-300">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-3 text-sm font-bold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 transition"
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
