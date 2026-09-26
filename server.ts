import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Readable} from 'node:stream';
import {handleApi} from './backend/api';
import type {Environment} from './backend/contracts';

const root=path.dirname(fileURLToPath(import.meta.url));
const app=express();app.disable('x-powered-by');
app.use('/api',async(req,res)=>{
 try{
  const origin=process.env.PUBLIC_SITE_URL||`http://127.0.0.1:${process.env.PORT||3000}`;
  const headers=new Headers();for(const [name,value] of Object.entries(req.headers))if(value)headers.set(name,Array.isArray(value)?value.join(','):value);
  // Only trust Cloudflare's header on Cloudflare. Local Express derives it from the socket.
  headers.set('cf-connecting-ip',req.socket.remoteAddress||'local');
  const init:RequestInit&{duplex?:string}={method:req.method,headers};
  if(req.method!=='GET'&&req.method!=='HEAD'){init.body=Readable.toWeb(req) as ReadableStream;init.duplex='half'}
  const response=await handleApi(new Request(new URL(req.originalUrl,origin),init),process.env as Environment);
  res.status(response.status);response.headers.forEach((value,key)=>res.setHeader(key,value));res.send(Buffer.from(await response.arrayBuffer()));
 }catch{res.status(500).json({error:'SERVER_ERROR'})}
});
if(process.argv.includes('--production')){
 app.use(express.static(path.join(root,'dist')));app.get('*',(_req,res)=>res.sendFile(path.join(root,'dist/index.html')));
}else{
 const {createServer}=await import('vite');const vite=await createServer({root,configLoader:'runner',server:{middlewareMode:true},appType:'spa'});app.use(vite.middlewares);
}
const port=Number(process.env.PORT||3000);
app.listen(port,'127.0.0.1',()=>console.log(`Local site: http://127.0.0.1:${port}`));
