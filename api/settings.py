import pathlib
from starlette.config import Config

# Configuration from environment variables or '.env' file.
config = Config(pathlib.Path.cwd() / ".env")

# OpenAI API key.
OPENAI_API_KEY = config("OPENAI_API_KEY", default="")
