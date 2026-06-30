from setuptools import setup, find_packages

setup(
    name="envvault-cli",
    version="1.0.0",
    description="EnvVault CLI — pull, push, and manage secrets from the command line",
    packages=find_packages(),
    python_requires=">=3.9",
    install_requires=[
        "click>=8.1",
        "httpx>=0.27",
        "tomli>=2.0; python_version < '3.11'",
        "tomli-w>=1.0",
        "rich>=13.0",
        "python-dotenv>=1.0",
    ],
    entry_points={
        "console_scripts": [
            "envvault=envvault_cli.main:cli",
        ],
    },
)
