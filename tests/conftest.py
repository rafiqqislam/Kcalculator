"""
Mock the supabase package before any backend module imports it.
This prevents a cryptography/PyJWT system package conflict from
breaking the test suite. In production, always use a virtualenv.
"""
import sys
from unittest.mock import MagicMock

for _mod in [
    "supabase",
    "gotrue",
    "gotrue._async",
    "gotrue._async.gotrue_client",
    "postgrest",
    "realtime",
    "storage3",
]:
    sys.modules.setdefault(_mod, MagicMock())
