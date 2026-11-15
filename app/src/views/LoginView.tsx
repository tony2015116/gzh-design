import {useState,type FormEvent} from 'react';
import {Link,useLocation,useNavigate} from 'react-router-dom';
import {ArrowLeft,ArrowRight,Bookmark,Eye,EyeOff,Loader2,PenTool,ShieldCheck} from 'lucide-react';
import {login,register} from '../services/authService';
import './login.css';

export default function LoginView(){
 const navigate=useNavigate(),location=useLocation();
 const requested=(location.state as {from?:unknown}|null)?.from;
 let from='/';
 if(typeof requested==='string'){try{const target=new URL(requested,window.location.origin);if(target.origin===window.location.origin&&target.pathname!=='/login')from=target.pathname+target.search+target.hash;}catch{/* Return to the editor for invalid paths. */}}
 const [mode,setMode]=useState<'login'|'register'>('login'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
 const [visible,setVisible]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const submit=async(event:FormEvent)=>{
  event.preventDefault();if(busy)return;setError('');
  if(mode==='register'){
   if(password.length<8||!/[A-Za-z]/.test(password)||!/[0-9]/.test(password)){setError('密码至少8位，需同时包含字母和数字');return;}
   if(password!==confirm){setError('两次输入的密码不一致');return;}
  }
  setBusy(true);
  try{if(mode==='register')await register(email.trim(),password);else await login(email.trim(),password);navigate(from,{replace:true});}
  catch(e){setError(e instanceof Error?e.message:'暂时无法登录，请稍后再试');}finally{setBusy(false);}
 };
 return <main className="login-page"><header className="login-header"><Link to="/" className="login-brand"><span><PenTool size={23}/></span><strong>公众号工作台<small>CREATOR WORKSPACE</small></strong></Link><Link to="/" className="login-back"><ArrowLeft size={15}/>返回排版</Link></header>
  <div className="login-layout"><section className="login-intro"><span className="login-eyebrow">YOUR CREATIVE SPACE</span><h1>把灵感留下，<br/>把文章写好。</h1><p>从写好正文，到调整文章的样式，<br/>让每一次创作都有一个安放的地方。</p><div className="login-paper"><div className="login-paper-top"><PenTool size={17}/><span>下一篇，从这里开始</span></div><div className="login-paper-rule"/><h2>把内容写好，<br/>把样子交给这里。</h2><div className="login-paper-lines"><i/><i/><i/></div><footer><Bookmark size={14}/>文章与预设，保存在你的账号中</footer></div><p className="login-local-note">草稿按账号保存在当前浏览器，访客草稿可手动带入。</p></section>
  <section className="login-card" aria-label="账号登录"><div className="login-card-heading"><span className="login-eyebrow">WELCOME TO YOUR WORKSPACE</span><h2>{mode==='login'?'登录你的工作台':'创建你的账号'}</h2><p>{mode==='login'?'继续编辑文章，保存自己的排版作品。':'使用邮箱和密码，保存自己的文章与预设。'}</p></div>
   <div className="login-switch" role="group" aria-label="账号操作">{(['login','register'] as const).map(value=><button key={value} type="button" aria-pressed={mode===value} disabled={busy} onClick={()=>{setMode(value);setError('');setConfirm('');}}>{value==='login'?'登录':'注册'}</button>)}</div>
   <form onSubmit={submit} className="login-form"><label htmlFor="login-email">邮箱地址</label><input id="login-email" type="email" autoComplete="username" required value={email} disabled={busy} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
    <label htmlFor="login-password">密码</label><div className="login-password"><input id="login-password" type={visible?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} minLength={mode==='register'?8:1} required value={password} disabled={busy} onChange={e=>setPassword(e.target.value)} placeholder={mode==='register'?'至少8位，包含字母和数字':'请输入密码'}/><button type="button" aria-label={visible?'隐藏密码':'显示密码'} aria-pressed={visible} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={17}/>:<Eye size={17}/>}</button></div>
    {mode==='register'&&<><label htmlFor="login-confirm">确认密码</label><input id="login-confirm" type={visible?'text':'password'} autoComplete="new-password" required value={confirm} disabled={busy} onChange={e=>setConfirm(e.target.value)} placeholder="再次输入密码"/></>}
    {error&&<p className="login-error" role="alert">{error}</p>}<button className="login-submit" type="submit" disabled={busy}>{busy?<><Loader2 size={17} className="login-spinner"/>正在处理…</>:<>{mode==='login'?'登录':'注册并登录'}<ArrowRight size={16}/></>}</button>
   </form><p className="login-account-note"><ShieldCheck size={15}/>每个账号拥有独立的文章与个人预设。</p>
  </section></div><footer className="login-footer">写作 · 排版 · 导出</footer>
 </main>;
}
