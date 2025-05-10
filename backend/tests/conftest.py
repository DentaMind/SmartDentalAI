import pytest
import os
import sys
from pathlib import Path

# Add the parent directory to the path so we can import the app
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

# Configure pytest for asyncio
@pytest.fixture
def event_loop():
    """
    Create an instance of the default event loop for each test case.
    """
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close() 