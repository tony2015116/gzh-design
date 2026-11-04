/**
 * FeishuCallbackView — 飞书 OAuth 回调页。
 * 飞书授权后跳回 /feishu/callback?code=...&state=...，用 code 换绑定。
 */

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

import { asFeishuError, exchangeCode } from '../services/feishuService';

type CallbackState = 'loading' | 'success' | 'error';

export default function FeishuCallbackView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code');
  const [state, setState] = useState<CallbackState>(code ? 'loading' : 'error');
  const [message, setMessage] = useState(code ? '' : '非法回调：缺少授权 code 参数。');
  const [feishuUserName, setFeishuUserName] = useState('');
  const startedRef = useRef(false);

  useEffect(() => {
    if (!code || startedRef.current) return;
    startedRef.current = true;

    const oauthState = searchParams.get('state') || '';

    exchangeCode(code, oauthState, `${window.location.origin}/feishu/callback`)
      .then((result) => {
        setState('success');
        setFeishuUserName(result.feishuUserName || '');
        window.setTimeout(() => navigate('/'), 1500);
      })
      .catch((err: unknown) => {
        setState('error');
        setMessage(asFeishuError(err).message || '绑定失败，请重试。');
      });
  }, [code, searchParams, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg">
        {state === 'loading' && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-600" />
            <h1 className="mt-4 text-lg font-semibold text-gray-800">正在绑定飞书账号…</h1>
            <p className="mt-2 text-sm text-gray-500">请稍候，正在完成授权。</p>
          </>
        )}

        {state === 'success' && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <h1 className="mt-4 text-lg font-semibold text-gray-800">绑定成功</h1>
            <p className="mt-2 text-sm text-gray-500">
              已绑定飞书账号{feishuUserName ? `「${feishuUserName}」` : ''}，正在返回首页…
            </p>
          </>
        )}

        {state === 'error' && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-red-500" />
            <h1 className="mt-4 text-lg font-semibold text-gray-800">绑定失败</h1>
            <p className="mt-2 text-sm text-red-500">{message}</p>
            <Link
              to="/"
              className="mt-6 inline-block rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              返回首页
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
