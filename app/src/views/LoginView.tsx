import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Lock, Mail } from 'lucide-react';

import { getAuthMode } from '../services/accessControl';
import { login, register } from '../services/authService';

type Mode = 'login' | 'register';

export default function LoginView() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/';
  const authMode = getAuthMode();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (authMode !== 'real') return;

    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }

      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || '操作失败，请重试。');
    } finally {
      setLoading(false);
    }
  };

  if (authMode !== 'real') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-4">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-white shadow-2xl backdrop-blur-xl">
          <button
            onClick={() => navigate('/')}
            className="mb-6 flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white/80"
          >
            <ArrowLeft className="h-4 w-4" />
            返回排版工具
          </button>

          <h1 className="text-2xl font-bold">当前模式不启用真实登录</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">
            你现在运行的是 OSS 调试身份模式。登录入口已由首页的“调试身份”切换器接管，回到首页即可切换
            `未登录 / 免费 / VIP / 管理员`。
          </p>

          <button
            onClick={() => navigate('/')}
            className="mt-8 w-full rounded-xl bg-emerald-500 py-3 font-semibold text-white transition-colors hover:bg-emerald-400"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white/80"
        >
          <ArrowLeft className="h-4 w-4" />
          返回排版工具
        </button>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 text-center">
            <span className="mb-3 block text-4xl">✦</span>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {mode === 'login' ? '欢迎回来' : '创建账号'}
            </h1>
            <p className="mt-2 text-sm text-white/40">
              {mode === 'login'
                ? '登录后即可使用在线版 AI 排版与云端预设。'
                : '注册后即可拥有自己的账号与角色权限。'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-white/50">邮箱地址</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-white/20 transition-all focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-white/50">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === 'register' ? '至少 6 位字符' : '请输入密码'}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-white/20 transition-all focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/30 disabled:bg-emerald-500/50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  处理中...
                </>
              ) : mode === 'login' ? (
                '登录'
              ) : (
                '创建账号'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-white/40">
            {mode === 'login' ? (
              <>
                还没有账号？
                <button
                  onClick={() => {
                    setMode('register');
                    setError('');
                  }}
                  className="ml-1 font-medium text-emerald-400 transition-colors hover:text-emerald-300"
                >
                  免费注册
                </button>
              </>
            ) : (
              <>
                已有账号？
                <button
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="ml-1 font-medium text-emerald-400 transition-colors hover:text-emerald-300"
                >
                  立即登录
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
