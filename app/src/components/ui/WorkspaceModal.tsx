import {useEffect,useRef,type ReactNode} from 'react';
import {X} from 'lucide-react';
import './workspace-modal.css';

export function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{ref.current?.showModal();},[]);
 return <dialog ref={ref} className="rf-modal" aria-label={title} onCancel={event=>{event.preventDefault();onClose();}}><header><div><small>CREATOR WORKSPACE</small><h2>{title}</h2></div><button onClick={onClose} aria-label="关闭"><X size={20}/></button></header>{children}</dialog>;
}
