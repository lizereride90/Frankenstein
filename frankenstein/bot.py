from __future__ import annotations

import asyncio
import importlib
import logging
import pkgutil
from pathlib import Path
from typing import Iterable, List

import discord
from discord.ext import commands

from .config import BotConfig
from .logger import get_logger
from .utils.paths import resolve_data_dir, resolve_extensions_dir


class FrankensteinBot(commands.Bot):
    """Discord bot with auto extension discovery and JSON-driven config."""

    def __init__(self, config: BotConfig) -> None:
        intents = discord.Intents.default()
        intents.message_content = True
        intents.members = True
        intents.presences = True

        super().__init__(
            command_prefix=self._prefix_resolver,
            intents=intents,
            case_insensitive=True,
            owner_ids=set(config.owner_ids),
        )

        self.config = config
        self.log: logging.Logger = get_logger("frankenstein.bot")
        self.extensions_path = resolve_extensions_dir(config.extensions_path)
        self.data_dir = resolve_data_dir(config.data_dir)

        self.data_dir.mkdir(parents=True, exist_ok=True)

    async def setup_hook(self) -> None:
        await self._load_extensions()
        await self._sync_commands()
        await self._set_presence()

    async def _load_extensions(self) -> None:
        if not self.extensions_path.exists():
            self.log.warning("Extensions path missing: %s", self.extensions_path)
            return

        discovered: List[str] = []
        for module in self._iter_command_modules(self.extensions_path):
            module_path = f"{self.config.extensions_path}.{module}"
            try:
                await self.load_extension(module_path)
                discovered.append(module_path)
            except commands.errors.ExtensionNotFound:
                self.log.warning("Extension not found: %s", module_path)
            except Exception:
                self.log.exception("Failed to load extension %s", module_path)

        if discovered:
            self.log.info("Loaded %d extensions", len(discovered))
        else:
            self.log.info("No extensions found. Add cogs under %s", self.extensions_path)

    def _iter_command_modules(self, base_path: Path) -> Iterable[str]:
        for module in pkgutil.iter_modules([str(base_path)]):
            if module.name.startswith("__"):
                continue
            # support nested packages later; for now flat modules
            yield module.name

    async def _sync_commands(self) -> None:
        if not self.config.command_sync.sync_on_start:
            self.log.info("Skipping command sync (disabled in config)")
            return

        try:
            if self.config.command_sync.prefer_guild and self.config.dev_guild_id:
                guild = discord.Object(id=self.config.dev_guild_id)
                self.tree.copy_global_to(guild=guild)
                synced = await self.tree.sync(guild=guild)
                self.log.info(
                    "Synced %d app commands to guild %s", len(synced), self.config.dev_guild_id
                )
            else:
                synced = await self.tree.sync()
                self.log.info("Synced %d global app commands", len(synced))
        except Exception:
            self.log.exception("Failed to sync application commands")

    async def _set_presence(self) -> None:
        presence = self.config.presence
        activity_type = presence.activity_type.lower()
        activity = discord.ActivityType.playing
        match activity_type:
            case "watching":
                activity = discord.ActivityType.watching
            case "listening":
                activity = discord.ActivityType.listening
            case "competing":
                activity = discord.ActivityType.competing
            case "streaming":
                activity = discord.ActivityType.streaming
            case _:
                activity = discord.ActivityType.playing
        await self.change_presence(
            status=getattr(discord.Status, presence.status, discord.Status.online),
            activity=discord.Activity(type=activity, name=presence.activity_text),
        )

    async def on_ready(self) -> None:
        self.log.info("Connected as %s (ID: %s)", self.user, self.user and self.user.id)
        self.log.info("Guilds: %s", ", ".join(g.name for g in self.guilds) or "none")

    async def on_command_error(self, ctx: commands.Context, error: commands.CommandError):
        if isinstance(error, commands.CommandNotFound):
            return
        self.log.exception("Command error: %s", error)
        await ctx.reply("Something went wrong executing that command.")

    async def on_app_command_error(
        self, interaction: discord.Interaction, error: discord.app_commands.AppCommandError
    ) -> None:
        self.log.exception("App command error: %s", error)
        if interaction.response.is_done():
            await interaction.followup.send("Something went wrong.", ephemeral=True)
        else:
            await interaction.response.send_message("Something went wrong.", ephemeral=True)

    async def _prefix_resolver(self, bot: commands.Bot, message: discord.Message):
        return self.config.prefix

    def run_with_token(self, token: str) -> None:
        self.log.info("Starting bot %s v%s", self.config.name, self.config.version)
        super().run(token, log_handler=None)
