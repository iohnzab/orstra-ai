from abc import ABC, abstractmethod
from typing import Any


class BaseTool(ABC):
    name: str = ""
    description: str = ""
    input_schema: dict = {
        "type": "object",
        "properties": {
            "input": {"type": "string", "description": "The input to the tool"}
        },
        "required": ["input"],
    }

    @abstractmethod
    def run(self, input: str) -> str:
        raise NotImplementedError

    def get_definition(self) -> dict:
        """Returns OpenAI function-calling format definition."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.input_schema,
            },
        }

    def __repr__(self) -> str:
        return f"<Tool: {self.name}>"
