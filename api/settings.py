import pathlib
from starlette.config import Config

# Configuration from environment variables or '.env' file.
config = Config(pathlib.Path(__file__).parent.resolve() / ".env")

# GCP API key.
GCP_API_KEY = config("GCP_API_KEY", default="")

# OpenAI API key.
OPENAI_API_KEY = config("OPENAI_API_KEY", default="")
