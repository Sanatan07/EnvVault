import click
import httpx
from rich.console import Console
from rich.prompt import Prompt
from envvault_cli.config import load_config, save_config, get_api_url

console = Console()


@click.command()
@click.option("--api-url", default=None, help="Override the API base URL")
@click.option("--token", default=None, help="Provide API token directly")
def login(api_url: str | None, token: str | None):
    """Authenticate with EnvVault and save credentials."""
    config = load_config()
    if api_url:
        config["api_url"] = api_url
    base_url = get_api_url(config)

    if token:
        config["token"] = token
        save_config(config)
        console.print("[green]✓[/green] API token saved.")
        return

    email = Prompt.ask("Email")
    password = Prompt.ask("Password", password=True)

    try:
        resp = httpx.post(
            f"{base_url}/auth/login",
            json={"email": email, "password": password},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        config["access_token"] = data["access"]
        config["refresh_token"] = data["refresh"]
        config["email"] = email
        save_config(config)
        console.print("[green]✓[/green] Logged in successfully.")
    except httpx.HTTPStatusError as e:
        console.print(f"[red]✗[/red] Login failed: {e.response.status_code}")
        raise SystemExit(1)
    except httpx.RequestError as e:
        console.print(f"[red]✗[/red] Connection error: {e}")
        raise SystemExit(1)
