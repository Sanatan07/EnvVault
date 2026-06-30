import click
from rich.console import Console
from envvault_cli import __version__
from envvault_cli.commands.login import login
from envvault_cli.commands.pull import pull
from envvault_cli.commands.push import push

console = Console()


@click.group()
@click.version_option(version=__version__, prog_name="envvault")
def cli():
    """EnvVault CLI — manage secrets and environment variables."""
    pass


cli.add_command(login)
cli.add_command(pull)
cli.add_command(push)


@cli.command()
def whoami():
    """Show the currently authenticated user."""
    from envvault_cli.config import load_config
    config = load_config()
    email = config.get("email")
    api_url = config.get("api_url", "https://app.envvault.io/api/v1")
    if email:
        console.print(f"Logged in as [bold]{email}[/bold] @ {api_url}")
    else:
        console.print("[yellow]Not logged in.[/yellow] Run [bold]envvault login[/bold].")


@cli.command()
def logout():
    """Clear saved credentials."""
    from envvault_cli.config import CONFIG_FILE
    if CONFIG_FILE.exists():
        CONFIG_FILE.unlink()
        console.print("[green]✓[/green] Logged out.")
    else:
        console.print("Not logged in.")


if __name__ == "__main__":
    cli()
