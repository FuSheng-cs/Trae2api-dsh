"""Add DSH model visibility inside the original console without replacing it."""
import os
import httpx

ALLOWED = {'models', 'status', 'refreshModels', 'modelVisibility', 'connect', 'disconnect'}


async def control(action, payload):
    if action not in ALLOWED:
        return {'ok': False, 'error': 'Unknown control action'}
    url = os.environ.get('DSH_RELAY_CONTROL_URL', '')
    key = os.environ.get('DSH_RELAY_CONTROL_KEY', '')
    if not url.startswith('http://127.0.0.1:') or not key:
        return {'ok': False, 'error': '请在 DSH 中启用插件后使用模型管理。'}
    try:
        async with httpx.AsyncClient(trust_env=False, timeout=60) as client:
            response = await client.post(url + '/' + action, json=payload,
                                         headers={'Authorization': 'Bearer ' + key})
        return response.json()
    except Exception:
        return {'ok': False, 'error': 'DSH 控制连接已断开，请重新启用插件后重试。'}


NAV = '''<button class="nav-item" role="tab" data-tab="dsh-models" data-title="DSH 模型管理" onclick="switchTab('dsh-models')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 7h18M3 12h18M3 17h18"/><circle cx="8" cy="7" r="2"/><circle cx="16" cy="17" r="2"/></svg><span>DSH 模型管理</span></button>'''
PAGE = '''<div class="tab-page" data-page="dsh-models">
<section class="panel-card" aria-label="DSH 模型管理">
<div class="section-head"><div class="section-title">DSH 模型管理</div><span id="dsh-model-count" class="section-meta"></span></div>
<p class="dsh-model-hint">所有显示的模型出现在对话输入框的模型菜单；思考档位按上游能力提供。这里的开关只管理本插件接入的模型。</p>
<div class="btn-group">
<button class="btn btn-primary" id="dsh-model-refresh">发现 / 刷新可用模型</button>
<button class="btn btn-secondary" id="dsh-model-show-all">显示全部</button>
<button class="btn btn-secondary" id="dsh-model-hide-all">隐藏全部</button>
<button class="btn btn-secondary" id="dsh-model-connect">接入 dsh 模型菜单</button>
<button class="btn btn-secondary" id="dsh-model-disconnect">断开模型接入</button>
</div>
<label class="dsh-model-search">搜索模型 <input id="dsh-model-search" placeholder="模型名称或 ID" autocomplete="off"></label>
<div id="dsh-model-status" class="dsh-model-hint" role="status" aria-live="polite"></div>
<div class="dsh-model-table-wrap"><table class="dsh-model-table"><thead><tr><th scope="col">模型</th><th scope="col">思考档位</th><th scope="col">上下文 / 输出</th><th scope="col">显示到 dsh</th></tr></thead><tbody id="dsh-model-rows"></tbody></table></div>
<p class="dsh-model-hint">隐藏会从 dsh 的模型目录中移除该模型；正在使用它的会话需先切换模型。重新显示可恢复接入。概览、账号与签到、消费记录、轮询与设置及模型测试均保持原有功能。</p>
</section></div>'''
STYLE = '''<style>
.dsh-model-hint{font-size:13px;line-height:1.7;color:var(--muted)}
.dsh-model-search{display:flex;flex-direction:column;gap:8px;margin:18px 0 10px;font-size:13px}
.dsh-model-search input{width:100%;box-sizing:border-box;padding:9px 12px;background:var(--surface-2);color:var(--text);border:1px solid var(--line);border-radius:7px}
.dsh-model-table-wrap{overflow-x:auto}.dsh-model-table{width:100%;border-collapse:collapse;font-size:13px}
.dsh-model-table th,.dsh-model-table td{padding:12px 8px;text-align:left;border-bottom:1px solid var(--line);vertical-align:middle}
.dsh-model-table th{font-weight:500;color:var(--muted)}.dsh-model-table code{display:block;margin-top:3px;font-size:11px;overflow-wrap:anywhere}
.dsh-model-table input{accent-color:var(--accent,#22c55e)}.dsh-model-table input:focus-visible,.dsh-model-search input:focus-visible{outline:2px solid var(--accent,#22c55e);outline-offset:3px}
</style>'''
SCRIPT = '''<script>
(function(){
let catalog={models:[]},state={},busy=false,sequence=0;
const byId=id=>document.getElementById(id),levels={light:'Low',high:'High',extra_high:'Xhigh'};
async function call(action,payload={}){
 const response=await fetch('/dsh/controls/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
 const result=await response.json();if(!response.ok||!result.ok)throw Error(typeof result.error==='string'?result.error:'操作失败');return result.value;
}
function render(){
 const query=byId('dsh-model-search').value.toLowerCase(),tbody=byId('dsh-model-rows');tbody.replaceChildren();
 byId('dsh-model-count').textContent=catalog.models.length+' 个模型 · '+catalog.models.filter(m=>m.visible).length+' 个显示';
 for(const model of catalog.models.filter(m=>(m.name+' '+m.id).toLowerCase().includes(query))){
  const row=document.createElement('tr'),name=row.insertCell();name.textContent=model.name;
  const id=document.createElement('code');id.textContent=model.id;name.appendChild(id);
  row.insertCell().textContent=model.reasoningLevels.length?model.reasoningLevels.map(v=>levels[v]).join(' / '):model.reasoningSupport===false?'无思考档位':'由上游控制';
  row.insertCell().textContent=model.contextWindow.toLocaleString()+' / '+model.maxTokens.toLocaleString();
  const cell=row.insertCell(),label=document.createElement('label'),input=document.createElement('input');
  input.type='checkbox';input.checked=model.visible;input.disabled=busy;input.setAttribute('aria-label','在 dsh 显示 '+model.name);
  input.addEventListener('change',()=>act('modelVisibility',{changes:[{id:model.id,visible:input.checked}]}));
  label.append(input,document.createTextNode(model.visible?' 显示':' 隐藏'));cell.append(label);tbody.append(row);
 }
 for(const id of ['refresh','show-all','hide-all','connect','disconnect'])byId('dsh-model-'+id).disabled=busy;
 byId('dsh-model-connect').disabled=busy||state.connected;byId('dsh-model-disconnect').disabled=busy||!state.connected;
}
async function refresh(){
 const seq=++sequence;const [models,status]=await Promise.all([call('models'),call('status')]);
 if(seq!==sequence)return;catalog=models;state=status;render();
 if(state.catalogError)byId('dsh-model-status').textContent=state.catalogError;
}
async function act(action,payload){
 if(busy)return;busy=true;render();byId('dsh-model-status').textContent='正在处理…';
 try{await call(action,payload);await refresh();byId('dsh-model-status').textContent=state.connected?'已保存，dsh 模型菜单已同步。':'已保存。点击接入后可在 dsh 模型菜单选择。'}
 catch(error){byId('dsh-model-status').textContent=error.message;}
 finally{busy=false;render();}
}
byId('dsh-model-search').addEventListener('input',render);
byId('dsh-model-refresh').addEventListener('click',()=>act('refreshModels'));
byId('dsh-model-show-all').addEventListener('click',()=>act('modelVisibility',{changes:catalog.models.map(m=>({id:m.id,visible:true}))}));
byId('dsh-model-hide-all').addEventListener('click',()=>act('modelVisibility',{changes:catalog.models.map(m=>({id:m.id,visible:false}))}));
byId('dsh-model-connect').addEventListener('click',()=>act('connect'));
byId('dsh-model-disconnect').addEventListener('click',()=>act('disconnect'));
document.querySelector('[data-tab="dsh-models"]').addEventListener('click',()=>refresh().catch(e=>{byId('dsh-model-status').textContent=e.message}));
refresh().catch(e=>{byId('dsh-model-status').textContent=e.message});
setInterval(()=>{if(!busy&&document.querySelector('[data-page="dsh-models"].active'))refresh().catch(()=>{})},5000);
})();</script>'''


def extend_console(html):
    nav_marker = '<button class="nav-item" role="tab" data-tab="models"'
    page_marker = '<div class="tab-page" data-page="models">'
    if nav_marker not in html or page_marker not in html:
        raise RuntimeError('Pinned upstream console structure changed; review the additive extension')
    return html.replace(nav_marker, NAV + '\n' + nav_marker, 1).replace(page_marker, PAGE + '\n' + page_marker, 1).replace('</head>', STYLE + '</head>', 1).replace('</body>', SCRIPT + '</body>', 1)
