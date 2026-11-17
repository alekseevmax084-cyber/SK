import fs from 'node:fs';
fs.mkdirSync('dist/server',{recursive:true});fs.mkdirSync('dist/.openai',{recursive:true});
const html=fs.readFileSync('index.html','utf8'), api=fs.readFileSync('worker/api.js','utf8').replace('export async function api','async function api');
fs.writeFileSync('dist/server/index.js',api+'\nconst html='+JSON.stringify(html)+';\nexport default {async fetch(request,env){try{if(new URL(request.url).pathname.startsWith("/api/"))return await api(request,env);return new Response(html,{headers:{"Content-Type":"text/html; charset=utf-8"}})}catch(e){console.error(e);return Response.json({error:"Не удалось обработать запрос. Попробуйте ещё раз."},{status:500})}}};');
fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');fs.cpSync('migrations','dist/migrations',{recursive:true});

fs.cpSync('drizzle','dist/drizzle',{recursive:true});
