import json
import os
import logging
from django.core.management.base import BaseCommand
from django.conf import settings
from items.models import LostItem, FoundItem
from nlp_service.matching import SemanticMatcher, find_matches_for_lost_item
from nlp_service.embeddings import embedding_generator
from nlp_service.chroma_vector_store import ChromaVectorStore

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Evaluates the matching algorithm on the synthetic dataset.'

    def handle(self, *args, **options):
        self.stdout.write("Starting Evaluation Pipeline from CSV...")
        
        dataset_path = os.path.join(settings.BASE_DIR, 'synthetic_data', 'lost_found_ground_truth_matches.csv')
        
        import csv
        ground_truth = []
        with open(dataset_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row['is_true_match'] == '1':
                    ground_truth.append(row)

        if not ground_truth:
            self.stdout.write(self.style.ERROR("No ground truth pairs found in dataset."))
            return

        # We will test using ChromaDB and the full matching strategy
        collection_name = getattr(settings, 'CHROMA_COLLECTION_FOUND', 'synthetic_found_items')
        persist_path = getattr(settings, 'CHROMA_PERSIST_PATH', os.path.join(settings.BASE_DIR, 'synthetic_data', 'chroma'))
        chroma_store = ChromaVectorStore(persist_path=persist_path, collection_name=collection_name)
        
        # Load synthetic items from DB and index by title
        lost_items_query = LostItem.objects.filter(title__startswith='[SYNTHETIC]')
        found_items_query = FoundItem.objects.filter(title__startswith='[SYNTHETIC]')
        
        # The titles are like "[SYNTHETIC] [L001] Green Levi's Wallet"
        def extract_id(title):
            import re
            match = re.search(r'\[([LF]\d+)\]', title)
            return match.group(1) if match else None

        lost_items_map = {extract_id(item.title): item for item in lost_items_query if extract_id(item.title)}
        found_items_map = {extract_id(item.title): item for item in found_items_query if extract_id(item.title)}
        
        top_1_correct = 0
        top_3_correct = 0
        total_precision = 0.0
        total_recall = 0.0
        
        total_pairs = len(ground_truth)
        
        self.stdout.write(f"Evaluating {total_pairs} ground truth pairs...")
        
        matcher = SemanticMatcher(
            w_semantic=getattr(settings, 'MATCHING_SEMANTIC_WEIGHT', 0.6),
            w_time=getattr(settings, 'MATCHING_TIME_WEIGHT', 0.2),
            w_location=getattr(settings, 'MATCHING_LOCATION_WEIGHT', 0.2)
        )
        
        for pair in ground_truth:
            lost_id = pair['lost_item_id']
            found_id = pair['found_item_id']
            
            lost_item = lost_items_map.get(lost_id)
            target_found_item = found_items_map.get(found_id)
            
            if not lost_item or not target_found_item:
                self.stdout.write(self.style.WARNING(f"Item not found in DB for pair {lost_id}-{found_id}"))
                continue
            
            # Use ChromaDB to get candidates (Top 10)
            lost_text = lost_item.get_combined_text()
            lost_embedding = embedding_generator.generate_embedding(lost_text)
            query_res = chroma_store.query(lost_embedding, top_k=10)
            
            # Map ChromaDB results to actual FoundItems and calculate full score
            candidates_with_scores = []
            for i, found_item_id_str in enumerate(query_res.ids):
                # We need the actual FoundItem object from DB
                try:
                    candidate_item = FoundItem.objects.get(id=found_item_id_str)
                    semantic_sim = query_res.similarities()[i]
                    candidates_with_scores.append((candidate_item, semantic_sim))
                except FoundItem.DoesNotExist:
                    continue
                    
            ranked_matches = matcher.rank_matches(lost_item, candidates_with_scores)
            
            # Check Top-1 and Top-3
            ranked_ids = [str(rm['found_item'].id) for rm in ranked_matches]
            target_id_str = str(target_found_item.id)
            
            if len(ranked_ids) > 0 and ranked_ids[0] == target_id_str:
                top_1_correct += 1
                
            if target_id_str in ranked_ids[:3]:
                top_3_correct += 1
                
            # Precision@3 and Recall@3 metrics
            # In our setup, there's only 1 true match per lost item
            retrieved_top_3 = ranked_ids[:3]
            if target_id_str in retrieved_top_3:
                total_precision += 1 / len(retrieved_top_3)  # Only 1 correct out of retrieved
                total_recall += 1.0  # Found the 1 true match
            else:
                total_precision += 0.0
                total_recall += 0.0

        top_1_acc = (top_1_correct / total_pairs) * 100
        top_3_acc = (top_3_correct / total_pairs) * 100
        avg_precision = (total_precision / total_pairs) * 100
        avg_recall = (total_recall / total_pairs) * 100
        
        self.stdout.write("\n=== EVALUATION RESULTS ===")
        self.stdout.write(f"Total Evaluated Pairs: {total_pairs}")
        self.stdout.write(f"Top-1 Accuracy: {top_1_acc:.2f}%")
        self.stdout.write(f"Top-3 Accuracy: {top_3_acc:.2f}%")
        self.stdout.write(f"Average Precision@3: {avg_precision:.2f}%")
        self.stdout.write(f"Average Recall@3: {avg_recall:.2f}%")
        self.stdout.write("==========================\n")
        
        results = {
            "total_pairs": total_pairs,
            "top_1_accuracy_percent": top_1_acc,
            "top_3_accuracy_percent": top_3_acc,
            "average_precision_at_3_percent": avg_precision,
            "average_recall_at_3_percent": avg_recall
        }
        
        results_path = os.path.join(settings.BASE_DIR, 'synthetic_data', 'evaluation_results.json')
        with open(results_path, 'w') as f:
            json.dump(results, f, indent=2)
            
        self.stdout.write(self.style.SUCCESS(f"Saved evaluation results to {results_path}"))
