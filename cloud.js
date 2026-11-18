(function(){
 'use strict';
 const cfg=window.SK_ELIT_CLOUD||{},base=String(cfg.url||'').replace(/\/$/,''),publishableKey=cfg.publishableKey||'',slot='sk-elit-personal:'+base;
 const fail=(message,code)=>Object.assign(new Error(message),{code}),validKey=value=>/^[a-f0-9]{64}$/i.test(value||'');
 let accessKey='';try{accessKey=localStorage.getItem(slot)||''}catch{}
 const hash=new URLSearchParams(location.hash.slice(1)),incoming=hash.get('key');
 if(incoming){history.replaceState(null,'',location.pathname+location.search);if(validKey(incoming)){accessKey=incoming.toLowerCase();try{localStorage.setItem(slot,accessKey)}catch{}}}
 function checkConfig(){if(!base||!publishableKey)throw fail('База ещё не подключена.','CONFIG');if(!base.startsWith('https://')||publishableKey.startsWith('sb_secret_'))throw fail('Неверные параметры подключения базы.','CONFIG');try{if(publishableKey.split('.').length===3&&JSON.parse(atob(publishableKey.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role==='service_role')throw fail('Закрытый ключ нельзя использовать в приложении.','CONFIG')}catch(e){if(e.code)throw e}}
 async function ready(){checkConfig();if(!validKey(accessKey))throw fail('Откройте свою личную ссылку.','ACCESS')}
 async function request(path,method='GET',body){
  await ready();const [kind,id]=path.split('/');if(!['projects','workers','tasks','shifts'].includes(kind))throw fail('Неизвестный раздел.','INPUT');
  const action=method==='GET'?'read':method==='POST'?'create':method==='PUT'?'update':method==='DELETE'?'delete':null;if(!action)throw fail('Неизвестное действие.','INPUT');
  const headers={apikey:publishableKey,'Content-Type':'application/json'};
  let response;try{response=await fetch(base+'/rest/v1/rpc/sk_elit_sync',{method:'POST',headers,body:JSON.stringify({p_access_key:accessKey,p_action:action,p_kind:kind,p_id:id||null,p_data:body||null})})}catch{throw fail('Нет соединения с базой. Проверьте интернет.','NETWORK')}
  if(!response.ok){let error;try{error=await response.json()}catch{}if(error?.code==='42501')throw fail('Личная ссылка недействительна. Откройте сохранённую ссылку ещё раз.','ACCESS');throw fail(response.status===404?'Таблица ещё не настроена. Нужно выполнить новый SQL в Supabase.':'Не удалось сохранить или загрузить данные. Попробуйте ещё раз.','REQUEST')}
  const result=await response.json();if(action==='read')return result.map(row=>({...row.data,id:row.id}));if(action==='delete')return {ok:true};return {...result.data,id:result.id};
 }
 async function connectLink(value){checkConfig();let link;try{link=new URL(String(value).trim())}catch{throw fail('Вставьте сохранённую личную ссылку.','ACCESS')}if(link.origin!==location.origin||link.pathname.replace(/index\.html$/,'')!==location.pathname.replace(/index\.html$/,''))throw fail('Это ссылка на другое приложение.','ACCESS');const key=new URLSearchParams(link.hash.slice(1)).get('key');if(!validKey(key))throw fail('В ссылке нет личного ключа.','ACCESS');const previous=accessKey;accessKey=key.toLowerCase();try{await request('projects');localStorage.setItem(slot,accessKey)}catch(e){accessKey=previous;throw e}}
 function personalLink(){checkConfig();if(!validKey(accessKey))throw fail('Сначала подключите личную ссылку.','ACCESS');return location.origin+location.pathname+'#key='+accessKey}
 window.SKCloud={ready,request,connectLink,personalLink};
})();
