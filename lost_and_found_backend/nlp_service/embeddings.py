"""
SBERT Embedding Generator

This module provides embedding generation using Sentence-BERT (SBERT)
for semantic similarity matching between lost and found items.
"""

import os
import logging
from typing import List, Union
import numpy as np

logger = logging.getLogger(__name__)

# Lazy loading of the model to avoid importing torch on every Django request
_model = None


def get_model():
    """Get or initialize the SBERT model."""
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        from django.conf import settings
        
        model_name = getattr(settings, 'NLP_MODEL_NAME', 'all-MiniLM-L6-v2')
        logger.info(f"Loading SBERT model: {model_name}")
        _model = SentenceTransformer(model_name)
        logger.info("SBERT model loaded successfully")
    return _model


class EmbeddingGenerator:
    """
    Generates semantic embeddings for text using SBERT.
    
    The embeddings can be used with FAISS for fast similarity search.
    """
    
    def __init__(self):
        self._model = None
    
    @property
    def model(self):
        """Lazy load the model."""
        if self._model is None:
            self._model = get_model()
        return self._model
    
    @property
    def dimension(self):
        """Get the embedding dimension."""
        get_dim = getattr(self.model, 'get_embedding_dimension', None)
        if callable(get_dim):
            return get_dim()
        return self.model.get_sentence_embedding_dimension()
    
    def generate_embedding(self, text: str) -> np.ndarray:
        """
        Generate embedding for a single text.
        
        Args:
            text: Input text to embed
            
        Returns:
            numpy array of shape (dimension,) containing the embedding
        """
        if not text or not text.strip():
            logger.warning("Empty text provided for embedding")
            return np.zeros(self.dimension, dtype=np.float32)
        
        embedding = self.model.encode(
            text,
            convert_to_tensor=False,
            normalize_embeddings=True
        )
        return embedding.astype(np.float32)
    
    def generate_batch_embeddings(self, texts: List[str]) -> np.ndarray:
        """
        Generate embeddings for multiple texts.
        
        Args:
            texts: List of input texts
            
        Returns:
            numpy array of shape (n_texts, dimension)
        """
        if not texts:
            return np.array([])
        
        # Filter empty texts
        valid_texts = [t if t and t.strip() else " " for t in texts]
        
        embeddings = self.model.encode(
            valid_texts,
            convert_to_tensor=False,
            normalize_embeddings=True,
            show_progress_bar=len(texts) > 10
        )
        return embeddings.astype(np.float32)
    
    def compute_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Compute cosine similarity between two embeddings.
        
        Args:
            embedding1: First embedding
            embedding2: Second embedding
            
        Returns:
            Cosine similarity score between -1 and 1
        """
        # Embeddings are already normalized, so dot product equals cosine similarity
        similarity = np.dot(embedding1, embedding2)
        return float(similarity)


# Singleton instance for use across the application
embedding_generator = EmbeddingGenerator()
