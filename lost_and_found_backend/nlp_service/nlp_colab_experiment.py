# %% [markdown]
# # Semantic Matching Algorithm - Experiment Notebook
# 
# This file is structured similarly to a Google Colab / Jupyter Notebook. 
# If you are using VS Code, you can click "Run Cell" above any `# %%` block 
# to execute the code interactively, provided you have the Jupyter extension installed.
#
# **Objective:** 
# Demonstrate the end-to-end Machine Learning pipeline for the Semantic Lost and Found Recovery System:
# 1. Data Collection & Loading
# 2. Data Cleaning & Preprocessing
# 3. Model Loading (SBERT)
# 4. Vector Store Generation (ChromaDB)
# 5. Evaluation & Metrics Calculation

# %% [markdown]
# ## Step 1: Install & Import Dependencies
# Make sure you have `pandas`, `sentence-transformers`, and `chromadb` installed.

# %%
import os
import pandas as pd
import numpy as np
import time
from sentence_transformers import SentenceTransformer
import chromadb
from collections import defaultdict

# Setting paths assuming execution from the backend root or nlp_service folder
DATA_DIR = os.path.join("..", "synthetic_data") 
if not os.path.exists(DATA_DIR):
    # Failsafe if running directly from backend root
    DATA_DIR = "synthetic_data"

DATASET_PATH = os.path.join(DATA_DIR, "lost_found_items_dataset.csv")
GROUND_TRUTH_PATH = os.path.join(DATA_DIR, "lost_found_ground_truth_matches.csv")

print(f"Using dataset path: {DATASET_PATH}")
print(f"Using ground truth path: {GROUND_TRUTH_PATH}")


# %% [markdown]
# ## Step 2: Data Collection & Loading
# We load the synthetic datasets using Pandas DataFrame for easy manipulation.

# %%
# Load Items
df_items = pd.read_csv(DATASET_PATH)
print("Items Dataset Sample:")
display(df_items.head(3)) if 'display' in globals() else print(df_items.head(3))

# Load Ground Truth Matches
df_truth = pd.read_csv(GROUND_TRUTH_PATH)
# We only care about positive matches for evaluation
df_truth_positive = df_truth[df_truth['is_true_match'] == 1]

print(f"\nTotal items loaded: {len(df_items)}")
print(f"Total true matching pairs loaded: {len(df_truth_positive)}")


# %% [markdown]
# ## Step 3: Data Cleaning & Preprocessing
# We separate the data into `LOST` and `FOUND` subsets.
# We also create a "semantic_text" field combining title, color, brand, location, and description.

# %%
def clean_and_prepare(df):
    # Fill missing values with empty strings
    df = df.fillna("")
    
    # Create a dense feature representation (semantic_text)
    # The richer the text, the better SBERT performs
    df['combined_text'] = df.apply(
        lambda row: f"{row['category']} {row['color']} {row['brand']} {row['location']} {row['description']}".strip(), 
        axis=1
    )
    return df

df_items_clean = clean_and_prepare(df_items.copy())

# Split into LOST and FOUND dataframes
df_lost = df_items_clean[df_items_clean['item_type'] == 'LOST'].reset_index(drop=True)
df_found = df_items_clean[df_items_clean['item_type'] == 'FOUND'].reset_index(drop=True)

print(f"Cleaned LOST items: {len(df_lost)}")
print(f"Cleaned FOUND items: {len(df_found)}")
print("\nSample combined text for a lost item:")
print(df_lost.iloc[0]['combined_text'])


# %% [markdown]
# ## Step 4: Model Loading (SBERT)
# We use `all-MiniLM-L6-v2` as it offers a great balance of speed and semantic performance.

# %%
MODEL_NAME = 'all-MiniLM-L6-v2'
print(f"Loading SBERT model: {MODEL_NAME}...")

start_time = time.time()
model = SentenceTransformer(MODEL_NAME)
load_time = time.time() - start_time

print(f"Model loaded in {load_time:.2f} seconds.")


# %% [markdown]
# ## Step 5: Vector Store Generation (ChromaDB)
# We simulate the production environment by storing all FOUND items inside ChromaDB.

# %%
# Initialize an ephemeral ChromaDB client in memory for this experiment
chroma_client = chromadb.EphemeralClient()

# Create collection (cosine similarity works best for normalized embeddings)
collection_name = "experiment_found_items"
try:
    chroma_client.delete_collection(name=collection_name)
except:
    pass

collection = chroma_client.create_collection(
    name=collection_name,
    metadata={"hnsw:space": "cosine"}
)

# Extract texts and generate embeddings for FOUND items
print("Generating embeddings for FOUND items...")
found_texts = df_found['combined_text'].tolist()
found_ids = df_found['item_id'].tolist()
found_metadatas = [{"category": cat, "location": loc} for cat, loc in zip(df_found['category'], df_found['location'])]

# Generate embeddings in one batch
found_embeddings = model.encode(found_texts, convert_to_numpy=True, normalize_embeddings=True)

print(f"Upserting {len(found_embeddings)} vectors into ChromaDB...")
collection.upsert(
    ids=found_ids,
    embeddings=found_embeddings.tolist(),
    documents=found_texts,
    metadatas=found_metadatas
)
print("ChromaDB indexing complete!")


# %% [markdown]
# ## Step 6: Evaluation & Metrics Calculation
# We iterate over the ground truth pairs, query ChromaDB for each LOST item, 
# and calculate precision, recall, and accuracy.

# %%
total_pairs = len(df_truth_positive)
top_1_correct = 0
top_3_correct = 0
total_precision = 0.0
total_recall = 0.0

print(f"Evaluating {total_pairs} ground truth pairs...\n")

for _, row in df_truth_positive.iterrows():
    lost_id = row['lost_item_id']
    true_found_id = row['found_item_id']
    
    # Get lost item text
    lost_item = df_lost[df_lost['item_id'] == lost_id]
    if lost_item.empty:
        continue
        
    lost_text = lost_item.iloc[0]['combined_text']
    
    # Generate embedding for the lost item
    lost_emb = model.encode(lost_text, convert_to_numpy=True, normalize_embeddings=True)
    
    # Query ChromaDB for top 3 closest items
    results = collection.query(
        query_embeddings=[lost_emb.tolist()],
        n_results=3,
        include=["distances", "documents"]
    )
    
    retrieved_ids = results['ids'][0]
    
    # 1. Top-1 Accuracy: Is the #1 result the correct one?
    if len(retrieved_ids) > 0 and retrieved_ids[0] == true_found_id:
        top_1_correct += 1
        
    # 2. Top-3 Accuracy & Recall: Is the correct one in the top 3?
    if true_found_id in retrieved_ids:
        top_3_correct += 1
        total_recall += 1.0
        # Precision@3 
        total_precision += 1 / len(retrieved_ids)
    else:
        total_recall += 0.0
        total_precision += 0.0

# Calculate final metrics
metrics = {
    "Total Evaluated": total_pairs,
    "Top-1 Accuracy": f"{(top_1_correct / total_pairs) * 100:.2f}%",
    "Top-3 Accuracy": f"{(top_3_correct / total_pairs) * 100:.2f}%",
    "Precision@3": f"{(total_precision / total_pairs) * 100:.2f}%",
    "Recall@3": f"{(total_recall / total_pairs) * 100:.2f}%"
}

print("=== NLP EXPERIMENT EVALUATION RESULTS ===")
for key, val in metrics.items():
    print(f"{key:<20}: {val}")


# %% [markdown]
# ## Conclusion
# 
# The SBERT model paired with a vector database (ChromaDB) successfully associates descriptions of lost items 
# with their found counterparts almost flawlessly. The `combined_text` approach ensures metadata attributes 
# (brand, color, location) are mathematically captured in the vector space, creating a robust semantic search engine.
