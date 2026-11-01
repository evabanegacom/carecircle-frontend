import { FormEvent, useEffect, useState } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'

type Condition = { id:string; name:string; active:boolean }
type Community = { id:string; name:string; slug:string; description:string; guidelines:string; status:'active'|'inactive'; conditionId:string|null; condition?:string|null; memberCount:number }
type Draft = Pick<Community,'name'|'slug'|'description'|'guidelines'|'status'|'conditionId'>

async function adminApi<T=any>(path:string, options:RequestInit={}) {
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
}

const blank:Draft={name:'',slug:'',description:'',guidelines:'Share personal experiences with care. Do not ask members to diagnose or prescribe. Avoid identifying details, medication doses, and urgent-care requests. Talk with a qualified health professional about personal medical decisions.',status:'active',conditionId:null}
const slugify=(value:string)=>value.toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'')

export default function CommunityManager({toast}:{toast:(message:string)=>void}){
 const [items,setItems]=useState<Community[]>([]),[conditions,setConditions]=useState<Condition[]>([]),[draft,setDraft]=useState<Draft>(blank),[busy,setBusy]=useState(true),[saving,setSaving]=useState(false)
 async function reload(){setBusy(true);try{const [communities,topics]=await Promise.all([adminApi<Community[]>('/admin/communities'),adminApi<Condition[]>('/admin/conditions')]);setItems(communities);setConditions(topics)}catch(e){toast(e instanceof Error?e.message:'Could not load communities.')}finally{setBusy(false)}}
 useEffect(()=>{void reload()},[])
 function update(id:string,patch:Partial<Draft>){setItems(rows=>rows.map(row=>row.id===id?{...row,...patch}:row))}
 async function add(e:FormEvent){e.preventDefault();setSaving(true);try{await adminApi('/admin/communities',{method:'POST',body:JSON.stringify(draft)});setDraft(blank);await reload();toast('Community added.')}catch(e){toast(e instanceof Error?e.message:'Could not add the community.')}finally{setSaving(false)}}
 async function save(item:Community){setSaving(true);try{await adminApi(`/admin/communities/${item.id}`,{method:'PUT',body:JSON.stringify({name:item.name,slug:item.slug,description:item.description,guidelines:item.guidelines,status:item.status,conditionId:item.conditionId||null})});await reload();toast('Community updated.')}catch(e){toast(e instanceof Error?e.message:'Could not update the community.')}finally{setSaving(false)}}
 async function deactivate(item:Community){if(!confirm(`Remove “${item.name}” from the public communities list? Existing memberships will be kept.`))return;setSaving(true);try{await adminApi(`/admin/communities/${item.id}`,{method:'DELETE'});await reload();toast('Community removed from the public list.')}catch(e){toast(e instanceof Error?e.message:'Could not remove the community.')}finally{setSaving(false)}}
 return <section className="account-card">
  <div className="section-heading"><div><span className="section-kicker">ADMIN SETTINGS</span><h3>Manage communities</h3><p>Create and edit community pages. Removing a community makes it inactive while preserving member records; you can reactivate it later.</p></div><button className="button button-outline" onClick={()=>void reload()}>Refresh</button></div>
  <form className="settings-form" onSubmit={add}>
   <label>Community name<input value={draft.name} onChange={e=>setDraft(current=>({...current,name:e.target.value,slug:current.slug||slugify(e.target.value)}))} minLength={2} maxLength={120} required placeholder="e.g. New parents"/></label>
   <label>URL slug<input value={draft.slug} onChange={e=>setDraft(current=>({...current,slug:slugify(e.target.value)}))} minLength={2} maxLength={120} required placeholder="new-parents"/></label>
   <label>Related topic<select value={draft.conditionId||''} onChange={e=>setDraft(current=>({...current,conditionId:e.target.value||null}))}><option value="">No linked topic</option>{conditions.map(c=><option key={c.id} value={c.id}>{c.name}{c.active?'':' (inactive)'}</option>)}</select></label>
   <label>Description<textarea value={draft.description} onChange={e=>setDraft(current=>({...current,description:e.target.value}))} maxLength={1000} rows={2}/></label>
   <label>Guidelines<textarea value={draft.guidelines} onChange={e=>setDraft(current=>({...current,guidelines:e.target.value}))} maxLength={3000} rows={3}/></label>
   <button className="button button-teal" disabled={saving}><Plus size={15}/> Add community</button>
  </form>
  {busy?<p className="loading-card">Loading communities…</p>:<div className="admin-list">{items.map(item=><article className="admin-item" key={item.id}>
   <div className="settings-form">
    <label>Community name<input value={item.name} onChange={e=>update(item.id,{name:e.target.value})} maxLength={120}/></label>
    <label>URL slug<input value={item.slug} onChange={e=>update(item.id,{slug:slugify(e.target.value)})} maxLength={120}/></label>
    <label>Related topic<select value={item.conditionId||''} onChange={e=>update(item.id,{conditionId:e.target.value||null})}><option value="">No linked topic</option>{conditions.map(c=><option key={c.id} value={c.id}>{c.name}{c.active?'':' (inactive)'}</option>)}</select></label>
    <label>Description<textarea value={item.description} onChange={e=>update(item.id,{description:e.target.value})} maxLength={1000} rows={2}/></label>
    <label>Guidelines<textarea value={item.guidelines} onChange={e=>update(item.id,{guidelines:e.target.value})} maxLength={3000} rows={3}/></label>
    <label>Status<select value={item.status} onChange={e=>update(item.id,{status:e.target.value as Community['status']})}><option value="active">Public</option><option value="inactive">Inactive</option></select></label>
    <small>{item.memberCount} joined · /communities/{item.slug}</small>
   </div>
   <div className="admin-actions"><button disabled={saving} onClick={()=>void save(item)}><Check size={14}/> Save</button>{item.status==='active'&&<button disabled={saving} onClick={()=>void deactivate(item)}><Trash2 size={14}/> Remove</button>}</div>
  </article>)}{!items.length&&<p className="quiet-empty">No communities yet. Create one above.</p>}</div>}
 </section>
}
