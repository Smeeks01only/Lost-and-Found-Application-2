---
tags:
- sentence-transformers
- sentence-similarity
- feature-extraction
- generated_from_trainer
- dataset_size:80
- loss:CosineSimilarityLoss
base_model: sentence-transformers/all-MiniLM-L6-v2
widget:
- source_sentence: 'item: silver nike backpack description: silver nike backpack front
    zip pocket, side bottle holder. category: backpack color: silver brand: nike location:
    student center'
  sentences:
  - 'item: found backpack description: picked up a silver nike backpack around student
    center. item appears intact and may belong to a student. category: backpack color:
    silver brand: nike location: student center'
  - 'item: found book description: picked up a red notebook book around main library.
    item appears intact and may belong to a student. category: book color: red brand:
    notebook location: main library'
  - 'item: found book description: found a blue book near sports ground, likely textbook,
    matches description and appears recently misplaced. category: book color: blue
    brand: textbook location: sports ground'
- source_sentence: 'item: brown xiaomi power bank description: brown xiaomi power
    bank led indicator working, 10,000mah. category: power bank color: brown brand:
    xiaomi location: cafeteria'
  sentences:
  - 'item: found keys description: picked up a brown office keys around admin block.
    item appears intact and may belong to a student. category: keys color: brown brand:
    office location: admin block'
  - 'item: found laptop description: picked up a black asus laptop around hostel block
    b. item appears intact and may belong to a student. category: laptop color: black
    brand: asus location: hostel block b'
  - 'item: found power bank description: picked up a brown xiaomi power bank around
    cafeteria. item appears intact and may belong to a student. category: power bank
    color: brown brand: xiaomi location: cafeteria'
- source_sentence: 'item: brown xiaomi power bank description: brown xiaomi power
    bank led indicator working, 10,000mah. category: power bank color: brown brand:
    xiaomi location: cafeteria'
  sentences:
  - 'item: found white id card description: recovered white uz id card with student
    id with lanyard and inside transparent holder. category: id card color: white
    brand: uz location: admin block'
  - 'item: found power bank description: picked up a gray itel power bank around lecture
    room a1. item appears intact and may belong to a student. category: power bank
    color: gray brand: itel location: lecture room a1'
  - 'item: found backpack description: samsonite backpack recovered at student center
    gray in color and seems to match a recent report. category: backpack color: gray
    brand: samsonite location: student center'
- source_sentence: 'item: white puma jacket description: white puma jacket medium
    size, left pocket slightly torn. category: jacket color: white brand: puma location:
    parking lot'
  sentences:
  - 'item: found jacket description: picked up a white puma jacket around parking
    lot. item appears intact and may belong to a student. category: jacket color:
    white brand: puma location: parking lot'
  - 'item: found green keys description: recovered green honda keys with small metal
    tag and attached to blue keyholder. category: keys color: green brand: honda location:
    cafeteria'
  - 'item: found wallet description: levi s wallet recovered at computer lab green
    in color and seems to match a recent report. category: wallet color: green brand:
    levi s location: computer lab'
- source_sentence: 'item: black nike jacket description: black nike jacket hood attached,
    lightweight material. category: jacket color: black brand: nike location: hostel
    block b'
  sentences:
  - 'item: found jacket description: picked up a white puma jacket around parking
    lot. item appears intact and may belong to a student. category: jacket color:
    white brand: puma location: parking lot'
  - 'item: found blue backpack description: recovered blue hp backpack with front
    zip pocket and padded straps. category: backpack color: blue brand: hp location:
    parking lot'
  - 'item: found backpack description: samsonite backpack recovered at student center
    gray in color and seems to match a recent report. category: backpack color: gray
    brand: samsonite location: student center'
pipeline_tag: sentence-similarity
library_name: sentence-transformers
---

# SentenceTransformer based on sentence-transformers/all-MiniLM-L6-v2

This is a [sentence-transformers](https://www.SBERT.net) model finetuned from [sentence-transformers/all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2). It maps sentences & paragraphs to a 384-dimensional dense vector space and can be used for retrieval.

## Model Details

### Model Description
- **Model Type:** Sentence Transformer
- **Base model:** [sentence-transformers/all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) <!-- at revision c9745ed1d9f207416be6d2e6f8de32d1f16199bf -->
- **Maximum Sequence Length:** 256 tokens
- **Output Dimensionality:** 384 dimensions
- **Similarity Function:** Cosine Similarity
- **Supported Modality:** Text
<!-- - **Training Dataset:** Unknown -->
<!-- - **Language:** Unknown -->
<!-- - **License:** Unknown -->

### Model Sources

- **Documentation:** [Sentence Transformers Documentation](https://sbert.net)
- **Repository:** [Sentence Transformers on GitHub](https://github.com/huggingface/sentence-transformers)
- **Hugging Face:** [Sentence Transformers on Hugging Face](https://huggingface.co/models?library=sentence-transformers)

### Full Model Architecture

```
SentenceTransformer(
  (0): Transformer({'transformer_task': 'feature-extraction', 'modality_config': {'text': {'method': 'forward', 'method_output_name': 'last_hidden_state'}}, 'module_output_name': 'token_embeddings', 'architecture': 'BertModel'})
  (1): Pooling({'embedding_dimension': 384, 'pooling_mode': 'mean', 'include_prompt': True})
  (2): Normalize({})
)
```

## Usage

### Direct Usage (Sentence Transformers)

First install the Sentence Transformers library:

```bash
pip install -U sentence-transformers
```
Then you can load this model and run inference.
```python
from sentence_transformers import SentenceTransformer

# Download from the 🤗 Hub
model = SentenceTransformer("sentence_transformers_model_id")
# Run inference
sentences = [
    'item: black nike jacket description: black nike jacket hood attached, lightweight material. category: jacket color: black brand: nike location: hostel block b',
    'item: found backpack description: samsonite backpack recovered at student center gray in color and seems to match a recent report. category: backpack color: gray brand: samsonite location: student center',
    'item: found blue backpack description: recovered blue hp backpack with front zip pocket and padded straps. category: backpack color: blue brand: hp location: parking lot',
]
embeddings = model.encode(sentences)
print(embeddings.shape)
# [3, 384]

# Get the similarity scores for the embeddings
similarities = model.similarity(embeddings, embeddings)
print(similarities)
# tensor([[1.0000, 0.1126, 0.0710],
#         [0.1126, 1.0000, 0.2251],
#         [0.0710, 0.2251, 1.0000]])
```
<!--
### Direct Usage (Transformers)

<details><summary>Click to see the direct usage in Transformers</summary>

</details>
-->

<!--
### Downstream Usage (Sentence Transformers)

You can finetune this model on your own dataset.

<details><summary>Click to expand</summary>

</details>
-->

<!--
### Out-of-Scope Use

*List how the model may foreseeably be misused and address what users ought not to do with the model.*
-->

<!--
## Bias, Risks and Limitations

*What are the known or foreseeable issues stemming from this model? You could also flag here known failure cases or weaknesses of the model.*
-->

<!--
### Recommendations

*What are recommendations with respect to the foreseeable issues? For example, filtering explicit content.*
-->

## Training Details

### Training Dataset

#### Unnamed Dataset

* Size: 80 training samples
* Columns: <code>sentence_0</code>, <code>sentence_1</code>, and <code>label</code>
* Approximate statistics based on the first 80 samples:
  |         | sentence_0                                                                         | sentence_1                                                                         | label                                                         |
  |:--------|:-----------------------------------------------------------------------------------|:-----------------------------------------------------------------------------------|:--------------------------------------------------------------|
  | type    | string                                                                             | string                                                                             | float                                                         |
  | details | <ul><li>min: 31 tokens</li><li>mean: 37.17 tokens</li><li>max: 44 tokens</li></ul> | <ul><li>min: 34 tokens</li><li>mean: 42.17 tokens</li><li>max: 48 tokens</li></ul> | <ul><li>min: 0.0</li><li>mean: 0.5</li><li>max: 1.0</li></ul> |
* Samples:
  | sentence_0                                                                                                                                                                                          | sentence_1                                                                                                                                                                                                                     | label            |
  |:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:-----------------|
  | <code>item: green generic wallet description: green generic wallet contains student id, has ecocash card. category: wallet color: green brand: generic location: computer lab</code>                | <code>item: found jacket description: picked up a white puma jacket around parking lot. item appears intact and may belong to a student. category: jacket color: white brand: puma location: parking lot</code>                | <code>0.0</code> |
  | <code>item: black dell backpack description: black dell backpack padded straps, side bottle holder. category: backpack color: black brand: dell location: sports ground</code>                      | <code>item: found jacket description: found a black jacket near hostel block b, likely adidas, matches description and appears recently misplaced. category: jacket color: black brand: adidas location: hostel block b</code> | <code>0.0</code> |
  | <code>item: silver textbook book description: silver textbook book handwritten notes inside, name written on first page. category: book color: silver brand: textbook location: main library</code> | <code>item: found gray id card description: recovered gray hit id card with student id with lanyard and inside transparent holder. category: id card color: gray brand: hit location: lecture room a1</code>                   | <code>0.0</code> |
* Loss: [<code>CosineSimilarityLoss</code>](https://sbert.net/docs/package_reference/sentence_transformer/losses.html#cosinesimilarityloss) with these parameters:
  ```json
  {
      "loss_fct": "torch.nn.modules.loss.MSELoss",
      "cos_score_transformation": "torch.nn.modules.linear.Identity"
  }
  ```

### Training Hyperparameters
#### Non-Default Hyperparameters

- `multi_dataset_batch_sampler`: round_robin

#### All Hyperparameters
<details><summary>Click to expand</summary>

- `do_predict`: False
- `eval_strategy`: no
- `prediction_loss_only`: True
- `per_device_train_batch_size`: 8
- `per_device_eval_batch_size`: 8
- `gradient_accumulation_steps`: 1
- `eval_accumulation_steps`: None
- `torch_empty_cache_steps`: None
- `learning_rate`: 5e-05
- `weight_decay`: 0.0
- `adam_beta1`: 0.9
- `adam_beta2`: 0.999
- `adam_epsilon`: 1e-08
- `max_grad_norm`: 1
- `num_train_epochs`: 3
- `max_steps`: -1
- `lr_scheduler_type`: linear
- `lr_scheduler_kwargs`: None
- `warmup_ratio`: None
- `warmup_steps`: 0
- `log_level`: passive
- `log_level_replica`: warning
- `log_on_each_node`: True
- `logging_nan_inf_filter`: True
- `enable_jit_checkpoint`: False
- `save_on_each_node`: False
- `save_only_model`: False
- `restore_callback_states_from_checkpoint`: False
- `use_cpu`: False
- `seed`: 42
- `data_seed`: None
- `bf16`: False
- `fp16`: False
- `bf16_full_eval`: False
- `fp16_full_eval`: False
- `tf32`: None
- `local_rank`: -1
- `ddp_backend`: None
- `debug`: []
- `dataloader_drop_last`: False
- `dataloader_num_workers`: 0
- `dataloader_prefetch_factor`: None
- `disable_tqdm`: False
- `remove_unused_columns`: True
- `label_names`: None
- `load_best_model_at_end`: False
- `ignore_data_skip`: False
- `fsdp`: []
- `fsdp_config`: {'min_num_params': 0, 'xla': False, 'xla_fsdp_v2': False, 'xla_fsdp_grad_ckpt': False}
- `accelerator_config`: {'split_batches': False, 'dispatch_batches': None, 'even_batches': True, 'use_seedable_sampler': True, 'non_blocking': False, 'gradient_accumulation_kwargs': None}
- `parallelism_config`: None
- `deepspeed`: None
- `label_smoothing_factor`: 0.0
- `optim`: adamw_torch_fused
- `optim_args`: None
- `group_by_length`: False
- `length_column_name`: length
- `project`: huggingface
- `trackio_space_id`: trackio
- `ddp_find_unused_parameters`: None
- `ddp_bucket_cap_mb`: None
- `ddp_broadcast_buffers`: False
- `dataloader_pin_memory`: True
- `dataloader_persistent_workers`: False
- `skip_memory_metrics`: True
- `push_to_hub`: False
- `resume_from_checkpoint`: None
- `hub_model_id`: None
- `hub_strategy`: every_save
- `hub_private_repo`: None
- `hub_always_push`: False
- `hub_revision`: None
- `gradient_checkpointing`: False
- `gradient_checkpointing_kwargs`: None
- `include_for_metrics`: []
- `eval_do_concat_batches`: True
- `auto_find_batch_size`: False
- `full_determinism`: False
- `ddp_timeout`: 1800
- `torch_compile`: False
- `torch_compile_backend`: None
- `torch_compile_mode`: None
- `include_num_input_tokens_seen`: no
- `neftune_noise_alpha`: None
- `optim_target_modules`: None
- `batch_eval_metrics`: False
- `eval_on_start`: False
- `use_liger_kernel`: False
- `liger_kernel_config`: None
- `eval_use_gather_object`: False
- `average_tokens_across_devices`: True
- `use_cache`: False
- `prompts`: None
- `batch_sampler`: batch_sampler
- `multi_dataset_batch_sampler`: round_robin
- `router_mapping`: {}
- `learning_rate_mapping`: {}

</details>

### Training Time
- **Training**: 1.8 minutes

### Framework Versions
- Python: 3.12.13
- Sentence Transformers: 5.4.0
- Transformers: 5.0.0
- PyTorch: 2.10.0+cpu
- Accelerate: 1.13.0
- Datasets: 4.0.0
- Tokenizers: 0.22.2

## Citation

### BibTeX

#### Sentence Transformers
```bibtex
@inproceedings{reimers-2019-sentence-bert,
    title = "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks",
    author = "Reimers, Nils and Gurevych, Iryna",
    booktitle = "Proceedings of the 2019 Conference on Empirical Methods in Natural Language Processing",
    month = "11",
    year = "2019",
    publisher = "Association for Computational Linguistics",
    url = "https://arxiv.org/abs/1908.10084",
}
```

<!--
## Glossary

*Clearly define terms in order to be accessible across audiences.*
-->

<!--
## Model Card Authors

*Lists the people who create the model card, providing recognition and accountability for the detailed work that goes into its construction.*
-->

<!--
## Model Card Contact

*Provides a way for people who have updates to the Model Card, suggestions, or questions, to contact the Model Card authors.*
-->