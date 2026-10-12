"""The original full console is preserved; model controls are additive."""
from pathlib import Path
import sys
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'python'))
from console_models import extend_console, NAV, PAGE, STYLE, SCRIPT
from src import main


class ConsoleModelsTests(unittest.TestCase):
    def test_original_console_survives_extension_byte_for_byte(self):
        original=main._web_login_html()
        updated=extend_console(original)
        for label in ('概览','账号与签到','消费记录','轮询与设置','模型测试'):
            self.assertIn(label,updated)
        self.assertIn('DSH 模型管理',updated)
        restored=updated.replace(NAV+'\n','',1).replace(PAGE+'\n','',1).replace(STYLE,'',1).replace(SCRIPT,'',1)
        self.assertEqual(restored,original)
        self.assertNotIn('DSH_RELAY_CONTROL_KEY',updated)

    def test_unexpected_upstream_structure_fails_loudly(self):
        with self.assertRaises(RuntimeError):extend_console('<html><body></body></html>')


if __name__=='__main__':unittest.main()
