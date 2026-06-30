import os
import click
import httpx
from pathlib import Path
from rich.console import Console
from envvault_cli.config import load_config, get_api_url, get_token

console = Console()


def get_auth_headers(config: dict) -> dict:
    token = get_token(config)
    if token:
        return {"Authorization": f"Token {token}"}
    access = config.get("access_token")
    if access:
        return {"Authorization": f"Bearer {access}"}
    console.print("[red]✗[/red] Not authenticated. Run [bold]envvault login[/bold] first.")
    raise SystemExit(1)


@click.command()
@click.option("--project", required=True, help="Project ID or slug")
@click.option("--env", required=True, help="Environment name (e.g. production)")
@click.option("--output", "-o", default=".env", help="Output file path (default: .env)")
@click.option("--export", "export_format", is_flag=True, default=False, help="Export as .env file content")
@click.option("--inject", is_flag=True, default=False, help="Inject secrets into the current shell process environment")
def pull(project: str, env: str, output: str, export_format: bool, inject: bool):
    """Pull secrets from EnvVault and write to a .env file."""
    config = load_config()
    base_url = get_api_url(config)
    headers = get_auth_headers(config)

    with console.status(f"Fetching secrets for [bold]{project}[/bold] / [bold]{env}[/bold]…"):
        try:
            resp = httpx.get(
                f"{base_url}/secrets/{project}/{env}/export/",
                headers=headers,
                timeout=30,
            )
            resp.raise_for_status()
            content = resp.text
        except httpx.HTTPStatusError as e:
            console.print(f"[red]✗[/red] API error {e.response.status_code}: {e.response.text}")
            raise SystemExit(1)
        except httpx.RequestError as e:
            console.print(f"[red]✗[/red] Connection error: {e}")
            raise SystemExit(1)

    if inject:
        # Print export statements for shell eval: eval $(envvault pull --inject ...)
        for line in content.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                console.print(f"export {line}")
        return

    if export_format:
        console.print(content)
        return

    out_path = Path(output)
    out_path.write_text(content)
    lines = [l for l in content.splitlines() if l and not l.startswith("#") and "=" in l]
    console.print(f"[green]✓[/green] Wrote [bold]{len(lines)}[/bold] secrets to [bold]{out_path}[/bold]")
