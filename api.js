export async function api(request, env) {
 const u=new URL(request.url), parts=u.pathname.split('/').filter(Boolean), type=parts[1], id=parts[2];
 const json=(x,s=200)=>Response.json(x,{status:s,headers:{'Cache-Control':'no-store'}});
 if(request.method!=='GET' && request.headers.get('Origin') && request.headers.get('Origin')!==u.origin) return json({error:'Недопустимый источник'},403);
 if(type==='files' && id && request.method==='GET') {const f=await env.BUCKET.get(id);return f?new Response(f.body,{headers:{'Content-Type':f.httpMetadata?.contentType||'application/octet-stream','Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(f.customMetadata?.name||'file'),'X-Content-Type-Options':'nosniff'}}):json({error:'Файл не найден'},404);}
 if(type==='files' && request.method==='POST') {const f=(await request.formData()).get('file');if(!f||typeof f==='string'||f.size>15*1024*1024)return json({error:'Выберите файл до 15 МБ'},400);const key=crypto.randomUUID();await env.BUCKET.put(key,f.stream(),{httpMetadata:{contentType:f.type||'application/octet-stream'},customMetadata:{name:f.name}});return json({id:key,name:f.name,size:f.size});}
 if(!['tasks','workers','shifts','projects','documents'].includes(type))return json({error:'Не найдено'},404);
 if(request.method==='GET'){const r=await env.DB.prepare('SELECT data FROM records WHERE kind=?').bind(type).all();return json(r.results.map(x=>JSON.parse(x.data)));}
 if(request.method==='POST'||request.method==='PUT'){const data=await request.json();data.id=id||crypto.randomUUID();if(JSON.stringify(data).length>100000)return json({error:'Слишком много данных'},400);
 if(type==='shifts'){if(!data.worker||!/^\d{4}-\d{2}-\d{2}$/.test(data.date)||!/^\d{2}:\d{2}$/.test(data.start)||!/^\d{2}:\d{2}$/.test(data.end)||Number(data.break)<0||Number(data.break)>1440)return json({error:'Проверьте данные смены'},400);}
 await env.DB.prepare('INSERT INTO records(id,kind,data) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data WHERE kind=excluded.kind').bind(data.id,type,JSON.stringify(data)).run();return json(data);}
 if(request.method==='DELETE'&&id){await env.DB.prepare('DELETE FROM records WHERE id=? AND kind=?').bind(id,type).run();return json({ok:true});}
 return json({error:'Метод не поддерживается'},405);
}
