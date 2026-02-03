"""
FAISS Vector Store

This module provides vector storage and similarity search using FAISS
for efficient semantic matching of lost and found items.
"""

import os
import pickle
import logging
from typing import Dict, List, Optional, Tuple
import numpy as np

logger = logging.getLogger(__name__)

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    logger.warning("FAISS not available. Vector search will be disabled.")


class VectorStore:
    """
    FAISS-based vector store for semantic search.
    
    Supports:
    - Adding vectors with associated item IDs
    - Similarity search with top-k results
    - Persistence (save/load from disk)
    - Separate indexes for lost and found items
    """
    
    def __init__(self, dimension: int = 384, index_type: str = 'flat'):
        """
        Initialize the vector store.
        
        Args:
            dimension: Embedding dimension (384 for all-MiniLM-L6-v2)
            index_type: Type of FAISS index ('flat' for exact search)
        """
        self.dimension = dimension
        self.index_type = index_type
        self.index = None
        self.id_to_item: Dict[int, str] = {}  # FAISS index -> item UUID
        self.item_to_id: Dict[str, int] = {}  # item UUID -> FAISS index
        
        if FAISS_AVAILABLE:
            self._create_index()
    
    def _create_index(self):
        """Create a new FAISS index."""
        if self.index_type == 'flat':
            # Exact L2 search (accurate but slower for large datasets)
            self.index = faiss.IndexFlatL2(self.dimension)
        elif self.index_type == 'ivf':
            # Approximate search using IVF (faster for large datasets)
            quantizer = faiss.IndexFlatL2(self.dimension)
            self.index = faiss.IndexIVFFlat(quantizer, self.dimension, 100)
        else:
            self.index = faiss.IndexFlatL2(self.dimension)
    
    @property
    def is_empty(self) -> bool:
        """Check if the index is empty."""
        if self.index is None:
            return True
        return self.index.ntotal == 0
    
    @property
    def total_vectors(self) -> int:
        """Get total number of vectors in the index."""
        if self.index is None:
            return 0
        return self.index.ntotal
    
    def add_vector(self, item_id: str, vector: np.ndarray) -> int:
        """
        Add a vector to the FAISS index.
        
        Args:
            item_id: UUID of the item (as string)
            vector: Embedding vector
            
        Returns:
            The FAISS index ID assigned to this vector
        """
        if not FAISS_AVAILABLE or self.index is None:
            logger.warning("FAISS not available, cannot add vector")
            return -1
        
        # Remove existing entry if updating
        if item_id in self.item_to_id:
            self.remove_vector(item_id)
        
        # Ensure vector is the right shape and type
        vector = np.array([vector]).astype('float32')
        
        # Get the next FAISS ID
        faiss_id = self.index.ntotal
        
        # Add to index
        self.index.add(vector)
        
        # Update mappings
        self.id_to_item[faiss_id] = item_id
        self.item_to_id[item_id] = faiss_id
        
        logger.debug(f"Added vector for item {item_id} at index {faiss_id}")
        return faiss_id
    
    def remove_vector(self, item_id: str) -> bool:
        """
        Remove a vector from the index (mark as deleted).
        
        Note: FAISS IndexFlatL2 doesn't support true deletion.
        We just remove from our mappings.
        
        Args:
            item_id: UUID of the item to remove
            
        Returns:
            True if removed, False if not found
        """
        if item_id not in self.item_to_id:
            return False
        
        faiss_id = self.item_to_id[item_id]
        del self.id_to_item[faiss_id]
        del self.item_to_id[item_id]
        
        return True
    
    def search(
        self,
        query_vector: np.ndarray,
        top_k: int = 10,
        exclude_ids: Optional[List[str]] = None
    ) -> List[Dict]:
        """
        Search for similar vectors.
        
        Args:
            query_vector: The query embedding
            top_k: Number of results to return
            exclude_ids: Item IDs to exclude from results
            
        Returns:
            List of dicts with 'item_id', 'distance', and 'similarity' keys
        """
        if not FAISS_AVAILABLE or self.index is None or self.is_empty:
            logger.warning("Cannot search: FAISS not available or index is empty")
            return []
        
        exclude_ids = set(exclude_ids or [])
        
        # Ensure vector is the right shape
        query_vector = np.array([query_vector]).astype('float32')
        
        # Search for more than top_k to account for exclusions
        search_k = min(top_k + len(exclude_ids) + 10, self.total_vectors)
        
        distances, indices = self.index.search(query_vector, search_k)
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx == -1:  # FAISS returns -1 for empty slots
                continue
            
            if idx not in self.id_to_item:
                continue
            
            item_id = self.id_to_item[idx]
            
            if item_id in exclude_ids:
                continue
            
            # Convert L2 distance to similarity score
            # Using inverse: similarity = 1 / (1 + distance)
            similarity = 1.0 / (1.0 + float(dist))
            
            results.append({
                'item_id': item_id,
                'distance': float(dist),
                'similarity': similarity
            })
            
            if len(results) >= top_k:
                break
        
        return results
    
    def save(self, filepath: str):
        """
        Save the index and mappings to disk.
        
        Args:
            filepath: Base path for saving (without extension)
        """
        if not FAISS_AVAILABLE or self.index is None:
            logger.warning("Cannot save: FAISS not available")
            return
        
        # Create directory if needed
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # Save FAISS index
        faiss.write_index(self.index, f"{filepath}.faiss")
        
        # Save mappings
        with open(f"{filepath}.mappings.pkl", 'wb') as f:
            pickle.dump({
                'id_to_item': self.id_to_item,
                'item_to_id': self.item_to_id
            }, f)
        
        logger.info(f"Saved vector store to {filepath}")
    
    def load(self, filepath: str) -> bool:
        """
        Load the index and mappings from disk.
        
        Args:
            filepath: Base path for loading (without extension)
            
        Returns:
            True if loaded successfully, False otherwise
        """
        if not FAISS_AVAILABLE:
            logger.warning("Cannot load: FAISS not available")
            return False
        
        faiss_path = f"{filepath}.faiss"
        mappings_path = f"{filepath}.mappings.pkl"
        
        if not os.path.exists(faiss_path) or not os.path.exists(mappings_path):
            logger.warning(f"Vector store files not found at {filepath}")
            return False
        
        try:
            # Load FAISS index
            self.index = faiss.read_index(faiss_path)
            
            # Load mappings
            with open(mappings_path, 'rb') as f:
                mappings = pickle.load(f)
                self.id_to_item = mappings['id_to_item']
                self.item_to_id = mappings['item_to_id']
            
            logger.info(f"Loaded vector store from {filepath} ({self.total_vectors} vectors)")
            return True
            
        except Exception as e:
            logger.error(f"Error loading vector store: {e}")
            self._create_index()
            self.id_to_item = {}
            self.item_to_id = {}
            return False


# Global instances for lost and found items
_found_items_store: Optional[VectorStore] = None


def get_found_items_store() -> VectorStore:
    """Get or create the found items vector store."""
    global _found_items_store
    
    if _found_items_store is None:
        from django.conf import settings
        
        dimension = getattr(settings, 'NLP_EMBEDDING_DIMENSION', 384)
        _found_items_store = VectorStore(dimension=dimension)
        
        # Try to load existing store
        store_path = getattr(settings, 'VECTOR_STORE_PATH', 'vector_stores')
        store_file = os.path.join(str(store_path), 'found_items')
        _found_items_store.load(store_file)
    
    return _found_items_store


def save_found_items_store():
    """Save the found items vector store to disk."""
    global _found_items_store
    
    if _found_items_store is not None:
        from django.conf import settings
        
        store_path = getattr(settings, 'VECTOR_STORE_PATH', 'vector_stores')
        store_file = os.path.join(str(store_path), 'found_items')
        _found_items_store.save(store_file)
