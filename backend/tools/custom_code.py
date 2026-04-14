import json
import sys
import io
import traceback
from tools.base import BaseTool
from utils.logger import get_logger

logger = get_logger(__name__)

# Allowed built-ins for sandboxed execution
SAFE_BUILTINS = {
    "print": print,
    "len": len,
    "range": range,
    "enumerate": enumerate,
    "zip": zip,
    "map": map,
    "filter": filter,
    "sorted": sorted,
    "sum": sum,
    "min": min,
    "max": max,
    "abs": abs,
    "round": round,
    "int": int,
    "float": float,
    "str": str,
    "bool": bool,
    "list": list,
    "dict": dict,
    "set": set,
    "tuple": tuple,
    "type": type,
    "isinstance": isinstance,
    "hasattr": hasattr,
    "getattr": getattr,
    "json": json,
}


class CustomCodeTool(BaseTool):
    name = "custom_code"
    description = (
        "Execute a user-supplied Python code snippet in a sandboxed environment. "
        "Use for custom data transformations, calculations, or logic not covered by other tools. "
        "The code runs in a restricted environment — no file system, network, or OS access. "
        "The code should define a 'result' variable with the output."
    )
    input_schema = {
        "type": "object",
        "properties": {
            "code": {"type": "string", "description": "Python code to execute"},
            "context": {"type": "object", "description": "Variables to inject into the execution context"},
        },
        "required": ["code"],
    }

    def __init__(self, allowed_code: str = ""):
        self.allowed_code = allowed_code

    def run(self, input: str) -> str:
        try:
            try:
                data = json.loads(input)
                code = data.get("code", "")
                context = data.get("context", {})
            except Exception:
                code = input
                context = {}

            if not code:
                return "No code provided."

            # Capture stdout
            old_stdout = sys.stdout
            sys.stdout = io.StringIO()

            try:
                safe_globals = {"__builtins__": SAFE_BUILTINS, **context}
                local_vars = {}
                exec(code, safe_globals, local_vars)

                stdout_output = sys.stdout.getvalue()
                result = local_vars.get("result", stdout_output or "Code executed successfully (no result variable set).")

                return str(result)

            except Exception as e:
                return f"Code execution error: {traceback.format_exc(limit=3)}"
            finally:
                sys.stdout = old_stdout

        except Exception as e:
            logger.error("custom_code_error", error=str(e))
            return f"Custom code tool failed: {str(e)}"
