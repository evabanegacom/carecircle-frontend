import { FormEvent, useEffect, useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { trackApiRequest } from './apiActivity'

type ManagedCondition = { id:string; name:string; slug:string; category:string; active:boolean }

function adminApi<T=any>(path:string, options:RequestInit={}) {
 return trackApiRequest(async()=>{
 const method=(options.method||'GET').toUpperCase(),headers=new Headers(options.headers)
 if(options.body)headers.set('Content-Type','application/json')
 if(!['GET','HEAD','OPTIONS'].includes(method)){
  const csrf=await fetch('/api/auth/csrf',{credentials:'include',cache:'no-store'})
  if(!csrf.ok)throw new Error('Could not prepare a secure request. Refresh the page and try again.')
  headers.set('X-XSRF-TOKEN',(await csrf.json()).token)
 }
 const response=await fetch(`/api${path}`,{...options,headers,credentials:'include'})
 const data=await response.json().catch(()=>null)
 if(!response.ok)throw new Error(data?.message||data?.title||`Request failed (${response.status})`)
 return data as T
 })
}

export default function LookupManager({toast,changed}:{toast:(message:string)=>void;changed:()=>void}){
 const [items,setItems]=useState<ManagedCondition[]>([]),[busy,setBusy]=useState(true)
 const [name,setName]=useState(''),[category,setCategory]=useState('child-health')
 const [saving,setSaving]=useState(false)
 async function reload(){setBusy(true);try{setItems(await adminApi<ManagedCondition[]>('/admin/conditions'))}catch(e){toast(e instanceof Error?e.message:'Could not load topics.')}finally{setBusy(false)}}
 useEffect(()=>{void reload()},[])
 async function add(e:FormEvent){e.preventDefault();setSaving(true);try{await adminApi('/admin/conditions',{method:'POST',body:JSON.stringify({name,category,active:true})});setName('');await reload();changed();toast('Topic added. Its community is ready too.')}catch(e){toast(e instanceof Error?e.message:'Could not add the topic.')}finally{setSaving(false)}}
 async function save(item:ManagedCondition){setSaving(true);try{await adminApi(`/admin/conditions/${item.id}`,{method:'PUT',body:JSON.stringify({name:item.name,category:item.category,active:item.active})});await reload();changed();toast('Topic updated.')}catch(e){toast(e instanceof Error?e.message:'Could not update the topic.')}finally{setSaving(false)}}
 return <section className="account-card">
  <div className="section-heading"><div><span className="section-kicker">ADMIN SETTINGS</span><h3>Manage topics</h3><p>Topics appear in story and question forms. New topics also get a matching community. Deactivating a topic keeps it on existing stories.</p></div><button className="button button-outline" onClick={()=>void reload()}>Refresh</button></div>
  <form className="settings-form" onSubmit={add}><label>Topic name<input value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={120} required placeholder="e.g. Maternal health"/></label><label>Category<input value={category} onChange={e=>setCategory(e.target.value)} minLength={2} maxLength={80} required/></label><button className="button button-teal" disabled={saving}><Plus size={15}/> Add topic</button></form>
  {busy?<p className="loading-card">Loading topics…</p>:<div className="admin-list">{items.map(item=><article className="admin-item" key={item.id}><div className="settings-form"><label>Topic<input value={item.name} onChange={e=>setItems(all=>all.map(row=>row.id===item.id?{...row,name:e.target.value}:row))}/></label><label>Category<input value={item.category} onChange={e=>setItems(all=>all.map(row=>row.id===item.id?{...row,category:e.target.value}:row))}/></label><label className="check-label"><input type="checkbox" checked={item.active} onChange={e=>setItems(all=>all.map(row=>row.id===item.id?{...row,active:e.target.checked}:row))}/> Available to members</label><small>/{item.slug}</small></div><div className="admin-actions"><button disabled={saving} onClick={()=>void save(item)}><Check size={14}/> Save</button></div></article>)}{!items.length&&<p className="quiet-empty">No topics yet. Add one above to make it available in the experience form.</p>}</div>}
 </section>
}
