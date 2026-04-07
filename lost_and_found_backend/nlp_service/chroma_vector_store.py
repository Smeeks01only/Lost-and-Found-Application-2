"""ChromaDB Vector Store

This module provides a small wrapper around ChromaDB for storing and querying
embeddings, alongside metadata and documents.

It is intentionally kept independent of Django models so it can be used by
management commands and background jobs.
"""

from __future__ import annotations

import os
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import numpy as np

logger = logging.getLogger(__name__)


class ChromaNotAvailable(RuntimeError):
    pass


def _import_chromadb():
    try:
        # Best-effort: disable anonymized telemetry to avoid noisy warnings in some environments.
        # Chroma reads this at import time.
        os.environ.setdefault("ANONYMIZED_TELEMETRY", "False")
        os.environ.setdefault("CHROMA_TELEMETRY", "False")

        import chromadb  # type: ignore

        return chromadb
    except Exception as exc:  # pragma: no cover
        raise ChromaNotAvailable(
            "ChromaDB is not installed. Add 'chromadb' to requirements and reinstall."
        ) from exc


@dataclass(frozen=True)
class ChromaQueryResult:
    ids: List[str]
    distances: List[float]

    def similarities(self) -> List[float]:
        # For cosine space Chroma returns distance = 1 - cosine_similarity.
        sims: List[float] = []
        for d in self.distances:
            sim = 1.0 - float(d)
            if sim < -1.0:
                sim = -1.0
            if sim > 1.0:
                sim = 1.0
            sims.append(sim)
        return sims


class ChromaVectorStore:
    """Persistent ChromaDB store for embeddings."""

    def __init__(self, persist_path: str | Path, collection_name: str):
        chromadb = _import_chromadb()

        # Avoid noisy telemetry issues in some environments.
        chroma_settings = None
        try:  # pragma: no cover
            from chromadb.config import Settings as ChromaSettings  # type: ignore

            chroma_settings = ChromaSettings(anonymized_telemetry=False)
        except Exception:
            chroma_settings = None

        self.persist_path = Path(persist_path)
        self.persist_path.mkdir(parents=True, exist_ok=True)

        if chroma_settings is not None:
            self.client = chromadb.PersistentClient(path=str(self.persist_path), settings=chroma_settings)
        else:
            self.client = chromadb.PersistentClient(path=str(self.persist_path))
        # Use cosine distance because our SBERT embeddings are normalized.
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
        )

    def reset_collection(self):
        """Delete and recreate the collection."""
        name = self.collection.name
        self.client.delete_collection(name)
        self.collection = self.client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": "cosine"},
        )

    def upsert(
        self,
        *,
        ids: Sequence[str],
        embeddings: np.ndarray,
        documents: Optional[Sequence[str]] = None,
        metadatas: Optional[Sequence[Dict[str, Any]]] = None,
    ):
        if len(ids) == 0:
            return

        if embeddings.ndim != 2:
            raise ValueError("Embeddings must be a 2D numpy array")

        if len(ids) != embeddings.shape[0]:
            raise ValueError("ids length must match embeddings rows")

        # Chroma expects list[float] per embedding.
        emb_list: List[List[float]] = embeddings.astype(np.float32).tolist()

        kwargs: Dict[str, Any] = {
            "ids": list(ids),
            "embeddings": emb_list,
        }
        if documents is not None:
            if len(documents) != len(ids):
                raise ValueError("documents length must match ids")
            kwargs["documents"] = list(documents)

        if metadatas is not None:
            if len(metadatas) != len(ids):
                raise ValueError("metadatas length must match ids")
            kwargs["metadatas"] = list(metadatas)

        self.collection.upsert(**kwargs)

    def query(self, query_embedding: np.ndarray, top_k: int = 10) -> ChromaQueryResult:
        if query_embedding.ndim != 1:
            raise ValueError("query_embedding must be a 1D vector")

        res = self.collection.query(
            query_embeddings=[query_embedding.astype(np.float32).tolist()],
            n_results=top_k,
            include=["distances"],
        )

        ids = (res.get("ids") or [[]])[0]
        distances = (res.get("distances") or [[]])[0]
        return ChromaQueryResult(ids=list(ids), distances=[float(d) for d in distances])
