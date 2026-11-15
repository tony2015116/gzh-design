import {useSyncExternalStore} from 'react';
import {DRAFT_OWNER_EVENT,getDraftOwner} from './draftScope.ts';
function subscribe(listener:()=>void){
 const changed=(event:StorageEvent)=>{if(event.key===null||event.key==='auth_token'||event.key==='auth_user')listener();};
 window.addEventListener('storage',changed);window.addEventListener(DRAFT_OWNER_EVENT,listener);
 return()=>{window.removeEventListener('storage',changed);window.removeEventListener(DRAFT_OWNER_EVENT,listener);};
}
export function useDraftOwner(){return useSyncExternalStore(subscribe,getDraftOwner,()=> 'guest');}
