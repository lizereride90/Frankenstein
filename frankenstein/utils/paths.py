from __future__ import annotations

import pathlib
from typing import Optional


ROOT = pathlib.Path(__file__).resolve().parent.parent


def project_root() -> pathlib.Path:
    return ROOT


def resolve_data_dir(path: Optional[str]) -> pathlib.Path:
    base = project_root()
    if path:
        return (base / path).resolve()
    return (base / "data").resolve()


def resolve_extensions_dir(path: str) -> pathlib.Path:
    return (project_root() / path).resolve()
