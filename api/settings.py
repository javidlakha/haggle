import pathlib
from starlette.config import Config

BASE_PATH = pathlib.Path(__file__).parent.parent.resolve()

# Configuration from environment variables or '.env' file.
config = Config(BASE_PATH / ".env")
# OpenAI API key.
OPENAI_API_KEY = config("OPENAI_API_KEY", default="")
