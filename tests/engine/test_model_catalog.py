"""Project-owned capability/privacy contracts; no real account or network."""
import asyncio
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import AsyncMock, patch
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'python'))
from model_catalog import model_descriptor, discover_models, restore_config_aliases
from src import auth, trae_client


class ModelCatalogTests(unittest.TestCase):
    def test_confirmed_exact_names_are_restored_after_restart(self):
        with tempfile.TemporaryDirectory() as directory, patch.dict(trae_client._ALIAS_LOOKUP, {'gpt-4o':'legacy-other-model'}):
            path=Path(directory)/'config.json'
            path.write_text(json.dumps({'models':[{'id':'gpt-4o','configName':'GPT-4o'}]}),encoding='utf-8')
            restore_config_aliases(path)
            self.assertEqual(trae_client.convert_model_name('gpt-4o'),'GPT-4o')
    def test_projection_has_capabilities_but_no_provider_credentials(self):
        raw={'name':'Example-Reasoner','display_name':'Example', 'ak':'fixture-private-ak',
             'sk':'fixture-private-sk','token':'fixture-private-token',
             'context_window_tokens':{'dev':128000,'max':1000000},
             'reasoning_effort_config':{'support_thinking':True,'options':['light','high'],'default_level':'high'}}
        model=model_descriptor(raw)
        self.assertEqual(model['id'],'example-reasoner')
        self.assertEqual(model['contextWindow'],128000)
        self.assertEqual(model['reasoningLevels'],['light','high'])
        self.assertEqual(model['defaultReasoning'],'high')
        self.assertNotIn('fixture-private',json.dumps(model))

    def test_filters_routing_profiles_disabled_and_non_chat_models(self):
        for raw in ({'name':'auto'}, {'name':'work'}, {'name':'x','disabled':True},
                    {'name':'x','enabled':False}, {'name':'x','custom_models':[{}]},
                    {'name':'x','usage':'embedding'}, {'name':'x','is_expired':True}):
            self.assertIsNone(model_descriptor(raw))

    def test_unknown_thinking_does_not_invent_levels_and_explicit_false_is_kept(self):
        unknown=model_descriptor({'name':'x'})
        self.assertEqual(unknown['reasoningLevels'],[])
        self.assertIsNone(unknown['reasoningSupport'])
        plain=model_descriptor({'name':'x','reasoning_effort_config':{'support_thinking':False,'options':['high']}})
        self.assertEqual(plain['reasoningLevels'],[])
        self.assertFalse(plain['reasoningSupport'])

    def test_discovery_merges_live_configs_with_remote_precedence_and_no_aliases(self):
        remote={'Example':{'name':'Example','display_name':'Remote','reasoning_effort_config':{'support_thinking':True,'options':['high']}}}
        solo={'Example':{'name':'Example','display_name':'Solo'},'Plain':{'name':'Plain'}}
        with patch.object(auth,'get_active_account_snapshot',return_value=('fixture',{'token':'synthetic-only'})), \
             patch.object(trae_client,'_fetch_web_model_configs',new=AsyncMock(return_value=remote)), \
             patch.object(trae_client,'_fetch_solo_model_configs',new=AsyncMock(return_value=solo)):
            models=asyncio.run(discover_models())
        self.assertEqual({m['id'] for m in models},{'example','plain'})
        self.assertEqual(next(m for m in models if m['id']=='example')['name'],'Remote')

    def test_no_account_or_empty_upstream_is_an_error_not_a_fake_available_catalog(self):
        with patch.object(auth,'get_active_account_snapshot',return_value=('',{})),patch.object(auth,'get_token',return_value=''):
            with self.assertRaises(ValueError): asyncio.run(discover_models())
        with patch.object(auth,'get_active_account_snapshot',return_value=('fixture',{'token':'synthetic-only'})), \
             patch.object(trae_client,'_fetch_web_model_configs',new=AsyncMock(return_value={})), \
             patch.object(trae_client,'_fetch_solo_model_configs',new=AsyncMock(side_effect=RuntimeError('offline'))):
            with self.assertRaises(ValueError): asyncio.run(discover_models())


if __name__=='__main__': unittest.main()
