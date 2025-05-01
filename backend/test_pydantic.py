from pydantic import BaseModel
from typing import Optional

class TestModel(BaseModel):
    name: str
    value: int
    is_active: bool = True
    optional_value: Optional[str] = None

# Test creating a model instance
test = TestModel(name="Test", value=42)
print("Pydantic test successful!")
print(test.dict())
