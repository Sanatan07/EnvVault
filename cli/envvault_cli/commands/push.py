import click
import httpx
from pathlib import Path
from rich.console import Console
from rich.table import Table
from envvault_cli.config import load_config, get_api_url, get_token
from envvault_cli.commands.pull import get_auth_headers

console = Console()


def parse_env_file(content: str) -> dict[str, str]:
    result = {}
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        idx = line.find("=")
        if idx < 0:
            continue
        key = line[:idx].strip()
        value = line[idx + 1:].strip()
        if (value.startswith('"') and value.endswith('"')) or \
           (value.startswith("'") and value.endswith("'")):
            value = value[1:-1]
        if key:
            result[key] = value
    return result


@click.command()
@click.option("--project", required=True, help="Project ID or slug")
@click.option("--env", required=True, help="Environment name (e.g. production)")
@click.option("--file", "-f", "file_path", default=".env", help="Path to .env file (default: .env)")
@click.option("--dry-run", is_flag=True, default=False, help="Show what would be pushed without pushing")
def push(project: str, env: str, file_path: str, dry_run: bool):
    """Push secrets from a .env file to EnvVault."""
    path = Path(file_path)
    if not path.exists():
        console.print(f"[red]✗[/red] File not found: {path}")
        raise SystemExit(1)

    secrets = parse_env_file(path.read_text())
    if not secrets:
        console.print("[yellow]⚠[/yellow] No secrets found in file.")
        return

    table = Table(title=f"Secrets to push → {project}/{env}")
    table.add_column("Key", style="cyan")
    table.add_column("Value", style="dim")
    for key, value in secrets.items():
        table.add_row(key, "••••" + value[-4:] if len(value) > 4 else "••••")
    console.print(table)

    if dry_run:
        console.print(f"[yellow]Dry run:[/yellow] {len(secrets)} secrets would be pushed.")
        return

    config = load_config()
    base_url = get_api_url(config)
    headers = get_auth_headers(config)
    headers["Content-Type"] = "application/json"

    with console.status(f"Pushing {len(secrets)} secrets…"):
        try:
            resp = httpx.post(
                f"{base_url}/secrets/{project}/{env}/import/",
                json={"content": path.read_text()},
                headers=headers,
                timeout=30,
            )
            resp.raise_for_status()
            result = resp.json()
            console.print(f"[green]✓[/green] Pushed [bold]{result.get('imported', len(secrets))}[/bold] secrets.")
        except httpx.HTTPStatusError as e:
            console.print(f"[red]✗[/red] Push failed {e.response.status_code}: {e.response.text}")
            raise SystemExit(1)
        except httpx.RequestError as e:
            console.print(f"[red]✗[/red] Connection error: {e}")
            raise SystemExit(1)
