"""Project an account's real model configs into credential-free capabilities."""
import asyncio
import json
from collections.abc import Mapping
from src import auth, trae_client
from src.reasoning_effort import supported_levels, normalize_level


def positive(value):
    if isinstance(value, bool):
        return None
    try:
        number = int(value)
        return number if 0 < number <= 10000000 else None
    except (ValueError, TypeError):
        return None


def model_descriptor(raw):
    if not isinstance(raw, Mapping) or raw.get('custom_models'):
        return None
    if raw.get('disabled') is True or raw.get('enabled') is False or raw.get('is_expired') is True:
        return None
    if str(raw.get('usage') or '').lower() not in ('', 'chat_completion'):
        return None
    exact = str(raw.get('config_name') or raw.get('name') or '').strip()
    if not exact or exact.lower() in ('auto', 'work'):
        return None
    display = raw.get('display_config') or {}
    display = display if isinstance(display, Mapping) else {}
    name = raw.get('display_name') or raw.get('display_model_name') or display.get('display_name') or exact
    tokens = raw.get('context_window_tokens') or {}
    tokens = tokens if isinstance(tokens, Mapping) else {}
    context = raw.get('context_window_size') or {}
    base_context = context.get('default') if isinstance(context, Mapping) else context
    window = positive(tokens.get('dev')) or positive(base_context) or positive(raw.get('context_window')) or 200000
    maximum = positive(raw.get('max_output_tokens')) or positive(raw.get('max_completion_tokens')) or 8192
    config = raw.get('reasoning_effort_config')
    levels = supported_levels(raw)
    default = normalize_level(config.get('default_level')) if isinstance(config, Mapping) else ''
    support = bool(config.get('support_thinking')) if isinstance(config, Mapping) and 'support_thinking' in config else None
    return {'id': exact.lower(), 'configName': exact, 'name': str(name), 'contextWindow': window,
            'maxTokens': min(maximum, window, 32768),
            'input': ['text', 'image'] if raw.get('multimodal') else ['text'],
            'reasoningLevels': levels, 'defaultReasoning': default if default in levels else None,
            'reasoningSupport': support}


async def discover_models():
    account_id, record = auth.get_active_account_snapshot()
    token = str((record or {}).get('token') or auth.get_token() or '')
    if not token:
        raise ValueError('请先导入或登录 TRAE 账号。')
    kwargs = {'token_override': token}
    provider = (record or {}).get('provider_specific') or {}
    if isinstance(provider, Mapping):
        kwargs['provider_specific'] = dict(provider)
    results = await asyncio.gather(trae_client._fetch_web_model_configs(**kwargs),
                                   trae_client._fetch_solo_model_configs(**kwargs), return_exceptions=True)
    if auth.get_active_account_snapshot()[0] != account_id:
        raise ValueError('读取模型时账号已切换，请重新刷新模型目录。')
    configs = {}
    for result in results:
        if isinstance(result, Mapping):
            for key, value in result.items():
                configs.setdefault(key, value)
    models = {}
    for raw in configs.values():
        model = model_descriptor(raw)
        if model:
            models.setdefault(model['id'], model)
            exact = str(raw.get('config_name') or raw.get('name')).strip()
            # A confirmed config wins over historical compatibility aliases.
            trae_client._UPSTREAM_MODEL_CASE[model['id']] = exact
            trae_client._ALIAS_LOOKUP[model['id']] = exact
    if not models:
        raise ValueError('上游没有返回可用模型，原有列表和显示设置已保留，请检查账号或网络后重试。')
    return list(models.values())


def restore_config_aliases(path):
    """Confirmed cached model IDs still win over legacy aliases after restart."""
    try:
        config = json.loads(path.read_text('utf-8'))
    except (OSError, ValueError):
        return
    models = config.get('models') or []
    if not isinstance(models, list):
        return
    for model in models[:500]:
        if not isinstance(model, Mapping):
            continue
        model_id = model.get('id')
        exact = model.get('configName') or model_id
        if not isinstance(model_id, str) or not isinstance(exact, str) or exact.lower() != model_id:
            continue
        trae_client._UPSTREAM_MODEL_CASE[model_id] = exact
        trae_client._ALIAS_LOOKUP[model_id] = exact
