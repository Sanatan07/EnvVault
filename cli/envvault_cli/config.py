import sys
from pathlib import Path

if sys.version_info >= (3, 11):
    import tomllib
else:
    import tomli as tomllib  # type: ignore

import tomli_w

CONFIG_DIR = Path.home() / ".envvault"
CONFIG_FILE = CONFIG_DIR / "config.toml"


def load_config() -> dict:
    if not CONFIG_FILE.exists():
        return {}
    with open(CONFIG_FILE, "rb") as f:
        return tomllib.load(f)


def save_config(data: dict) -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_FILE, "wb") as f:
        tomli_w.dump(data, f)
    CONFIG_FILE.chmod(0o600)


def get_api_url(config: dict) -> str:
    return config.get("api_url", "https://app.envvault.io/api/v1")


def get_token(config: dict) -> str | None:
    return config.get("token")
