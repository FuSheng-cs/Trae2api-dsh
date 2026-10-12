"""DSH-specific access controls and explicit, read-only desktop import."""
import hmac
import json
import os
from pathlib import Path
import secrets
import sys
import time

ENGINE = Path(os.environ['DSH_RELAY_ENGINE']).resolve()
sys.path.insert(0, str(ENGINE))
os.chdir(ENGINE)
from fastapi import Request, Query
from fastapi.responses import HTMLResponse, JSONResponse, Response
from src import auth, trae_decrypt
from src.main import app, PUBLIC_PATHS
from model_catalog import discover_models, restore_config_aliases

restore_config_aliases(ENGINE.parent / 'config.json')

PUBLIC_PATHS.update(('/dsh/console', '/dsh/session'))

API_KEY = os.environ['RELAY_API_KEYS']
COOKIE_NAME = 'dsh_trae_session_' + os.environ['PORT']
tickets = {}
sessions = {}
login_tickets = {}


def authorized(request):
    value = request.headers.get('authorization', '')
    return hmac.compare_digest(value, 'Bearer ' + API_KEY)


def same_origin(request):
    origin = request.headers.get('origin')
    return origin is None or origin == str(request.base_url).rstrip('/')


@app.middleware('http')
async def private_console(request: Request, call_next):
    expected = '127.0.0.1:' + os.environ['PORT']
    if request.headers.get('host') != expected:
        return JSONResponse({'error': 'Invalid host'}, status_code=403)
    if request.url.path == '/healthz':
        return await call_next(request)
    if request.method not in ('GET', 'HEAD') and not same_origin(request):
        return JSONResponse({'error': 'Cross-origin request refused'}, status_code=403)
    if request.url.path in ('/dsh/console', '/dsh/session'):
        return await call_next(request)
    if request.url.path == '/api/web-auth':
        grant = request.headers.get('x-dsh-login-ticket', '')
        if grant and login_tickets.pop(grant, 0) > time.monotonic():
            return await call_next(request)
    bearer = authorized(request)
    session = sessions.get(request.cookies.get(COOKIE_NAME, ''), 0) > time.monotonic()
    # Model requests, imports and ticket minting always require the API key.
    model_path = request.url.path.startswith('/v1/') or request.url.path == '/v1'
    privileged = model_path or request.url.path in ('/dsh/import', '/dsh/ticket', '/dsh/models')
    if not bearer and (privileged or not session):
        return JSONResponse({'error': 'Open the console from DSH'}, status_code=401)
    return await call_next(request)


@app.post('/dsh/ticket')
async def ticket():
    now = time.monotonic()
    for key, deadline in list(tickets.items()):
        if deadline <= now:
            tickets.pop(key, None)
    value = secrets.token_urlsafe(32)
    tickets[value] = now + 30
    return JSONResponse({'ticket': value}, headers={'Cache-Control': 'no-store'})


@app.get('/dsh/models')
async def account_models():
    try:
        return JSONResponse({'models': await discover_models()}, headers={'Cache-Control': 'no-store'})
    except ValueError as error:
        return JSONResponse({'error': str(error)}, status_code=400)


@app.get('/dsh/console')
async def console():
    return HTMLResponse('''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>TRAE 控制台</title>
<body><p id="status">正在打开控制台…</p><script>
const ticket=location.hash.slice(1);history.replaceState(null,'','/dsh/console');
fetch('/dsh/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ticket})})
.then(r=>{if(!r.ok)throw Error();location.replace('/web/login')})
.catch(()=>document.getElementById('status').textContent='入口已过期，请在 DSH 中重新打开控制台。');
</script></body></html>''', headers={'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer'})


@app.post('/dsh/session')
async def session(request: Request):
    try:
        value = str((await request.json()).get('ticket') or '')
    except Exception:
        return JSONResponse({'error': 'Invalid request'}, status_code=400)
    expiry = tickets.pop(value, 0)
    if expiry <= time.monotonic():
        return JSONResponse({'error': 'Expired entry'}, status_code=401)
    now = time.monotonic()
    for key, deadline in list(sessions.items()):
        if deadline <= now:
            sessions.pop(key, None)
    cookie = secrets.token_urlsafe(32)
    sessions[cookie] = now + 8 * 3600
    response = JSONResponse({'success': True}, headers={'Cache-Control': 'no-store'})
    response.set_cookie(COOKIE_NAME, cookie, httponly=True, samesite='strict', max_age=8 * 3600, path='/')
    return response


# Serve a helper authorized only for one credential submission, not a copy of
# the model API key. Download is protected by the console session above.
app.router.routes[:] = [route for route in app.router.routes if getattr(route, 'path', None) != '/web/login/download']


@app.get('/web/login/download')
async def login_helper(as_param: str = Query('', alias='as')):
    relay = 'http://127.0.0.1:' + os.environ['PORT']
    if as_param == 'bat':
        source = (ENGINE / 'start_auth.bat').read_text('utf-8').replace('http://192.168.5.246:8000', relay)
        return Response(source, media_type='application/octet-stream', headers={'Content-Disposition': 'attachment; filename="start_auth.bat"', 'Cache-Control': 'no-store'})
    now = time.monotonic()
    for key, deadline in list(login_tickets.items()):
        if deadline <= now:
            login_tickets.pop(key, None)
    grant = secrets.token_urlsafe(32)
    login_tickets[grant] = now + 900
    source = (ENGINE / 'web_login.py').read_text('utf-8').replace('http://192.168.5.246:8000', relay)
    marker = '\n    req.add_header("Content-Type", "application/json")'
    if source.count(marker) != 1:
        raise RuntimeError('Pinned login helper changed; update its reviewed adapter')
    source = source.replace(marker, marker + '\n    req.add_header("X-DSH-Login-Ticket", ' + json.dumps(grant) + ')')
    return Response(source, media_type='application/octet-stream', headers={'Content-Disposition': 'attachment; filename="web_login.py"', 'Cache-Control': 'no-store'})


def desktop_directory(edition, explicit=''):
    if explicit:
        return Path(explicit).expanduser().resolve()
    name = {'cn': 'Trae CN', 'solo': 'TRAE SOLO CN'}[edition]
    if sys.platform == 'win32':
        base = Path(os.environ.get('APPDATA') or Path.home() / 'AppData' / 'Roaming')
    elif sys.platform == 'darwin':
        base = Path.home() / 'Library' / 'Application Support'
    else:
        base = Path(os.environ.get('XDG_CONFIG_HOME') or Path.home() / '.config')
    return base / name / 'User'


@app.post('/dsh/import')
async def import_desktop(request: Request):
    body = await request.json()
    edition = body.get('edition', 'solo')
    if edition not in ('cn', 'solo'):
        return JSONResponse({'error': 'Only TRAE CN / SOLO CN are supported'}, status_code=400)
    directory = desktop_directory(edition, str(body.get('directory') or ''))
    try:
        data = trae_decrypt.decrypt_auth_data(directory)
        state = auth.AuthState(source='web-login', edition=edition)
        state.token = data.get('token') or ''
        state.refresh_token = data.get('refreshToken') or ''
        state.user_id = data.get('userId') or data.get('UserID') or ''
        state.expired_at = data.get('expiredAt') or data.get('TokenExpireAt') or ''
        state.refresh_expired_at = data.get('refreshExpiredAt') or data.get('RefreshExpireAt') or ''
        state.host = 'https://api.trae.cn'
        state.client_id = data.get('clientID') or data.get('ClientID') or data.get('clientId') or ''
        auth._extract_provider_specific_from_auth(state, data)
        if not state.token:
            raise ValueError('Desktop account is not signed in')
        aid = auth.add_account(auth._state_to_record(state), label=str(body.get('label') or edition))
        return {'success': True, 'account': aid}
    except Exception:
        # Do not put decrypted values or underlying exception strings on the wire.
        return JSONResponse({'error': '无法导入：请确认所选 TRAE CN 版本已登录，或填写 User 数据目录。'}, status_code=400)


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=int(os.environ['PORT']), access_log=False, log_level='warning')
