from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

import orjson
from dotenv import load_dotenv

from .utils.paths import project_root


@dataclass
class PresenceConfig:
    status: str
    activity_type: str
    activity_text: str


@dataclass
class CommandSyncConfig:
    sync_on_start: bool = True
    prefer_guild: bool = True


@dataclass
class BotConfig:
    name: str
    version: str
    prefix: str
    owner_ids: List[int] = field(default_factory=list)
    presence: PresenceConfig = field(
        default_factory=lambda: PresenceConfig("online", "watching", "the lab")
    )
    command_sync: CommandSyncConfig = field(
        default_factory=lambda: CommandSyncConfig(True, True)
    )
    guild_allowlist: List[int] = field(default_factory=list)
    extensions_path: str = "commands"
    data_dir: str = "data"
    log_level: str = "INFO"
    dev_guild_id: Optional[int] = None


class ConfigLoader:
    """Loads JSON config files and applies environment overrides."""

    def __init__(self, base_path: Optional[Path] = None) -> None:
        self.base_path = base_path or project_root()
        self.defaults_file = self.base_path / "config" / "defaults.json"
        self.local_file = self.base_path / "config" / "local.json"

    def _load_json(self, file_path: Path) -> Dict[str, Any]:
        if not file_path.exists():
            return {}
        # Use orjson for speed and strictness.
        return orjson.loads(file_path.read_bytes())

    def load(self) -> BotConfig:
        load_dotenv(self.base_path / ".env")

        data: Dict[str, Any] = {}
        data.update(self._load_json(self.defaults_file))
        data.update(self._load_json(self.local_file))

        # Environment overrides
        prefix = os.getenv("COMMAND_PREFIX") or data.get("prefix", "!")
        log_level = os.getenv("LOG_LEVEL") or data.get("log_level", "INFO")
        status_message = os.getenv("STATUS_MESSAGE") or data.get(
            "presence", {}
        ).get("activity_text")
        dev_guild_id = os.getenv("DISCORD_GUILD_ID")
        if dev_guild_id:
            try:
                data["dev_guild_id"] = int(dev_guild_id)
            except ValueError:
                pass

        if prefix:
            data["prefix"] = prefix
        if log_level:
            data["log_level"] = log_level
        if status_message:
            presence = data.get("presence", {})
            presence["activity_text"] = status_message
            data["presence"] = presence

        return self._to_dataclass(data)

    def _to_dataclass(self, raw: Dict[str, Any]) -> BotConfig:
        presence = raw.get("presence", {})
        presence_cfg = PresenceConfig(
            status=presence.get("status", "online"),
            activity_type=presence.get("activity_type", "watching"),
            activity_text=presence.get("activity_text", "the lab"),
        )

        cmd_sync = raw.get("command_sync", {})
        sync_cfg = CommandSyncConfig(
            sync_on_start=cmd_sync.get("sync_on_start", True),
            prefer_guild=cmd_sync.get("prefer_guild", True),
        )

        guild_allowlist = [int(x) for x in raw.get("guild_allowlist", []) if str(x).isdigit()]
        owner_ids = [int(x) for x in raw.get("owner_ids", []) if str(x).isdigit()]

        return BotConfig(
            name=raw.get("name", "Frankenstein"),
            version=raw.get("version", "0.1.0"),
            prefix=raw.get("prefix", "!"),
            owner_ids=owner_ids,
            presence=presence_cfg,
            command_sync=sync_cfg,
            guild_allowlist=guild_allowlist,
            extensions_path=raw.get("extensions_path", "commands"),
            data_dir=raw.get("data_dir", "data"),
            log_level=raw.get("log_level", "INFO"),
            dev_guild_id=raw.get("dev_guild_id"),
        )


def load_config() -> BotConfig:
    return ConfigLoader().load()
