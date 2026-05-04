---
tags:
- sentence-transformers
- sentence-similarity
- feature-extraction
- generated_from_trainer
- dataset_size:20000
- loss:TripletLoss
- dataset_size:82727
- loss:CosineSimilarityLoss
- dataset_size:14907
- loss:MultipleNegativesRankingLoss
- dataset_size:3000
base_model: sentence-transformers/all-mpnet-base-v2
widget:
- source_sentence: A woman is holding some food outside and smiling.
  sentences:
  - The people are outside.
  - A woman is outside with food.
  - A woman is sitting at a table with some food and frowning.
- source_sentence: Smiling boy in white shirt and blue jeans in front of rock wall
    with man in overalls behind him.
  sentences:
  - Glowing lanterns decorated the graveyards in Nagasaki.
  - The rock wall does not seem interesting to the people.
  - The boy and man smile for a picture in front of a rock wall.
- source_sentence: Ideally, divide your stay ' sightseeing in the capital at the beginning,
    spending a leisurely time at a seaside resort or in a sunny village in the hills,
    then shopping in Paris at the end.
  sentences:
  - A man wearing sunglasses and a blue jacket with a patch of the Korean flag on
    the left side of the jacket is sitting in a car, asleep.
  - In a perfect world you'd stay exclusively at a seaside resort and never bother
    with shopping in Paris.
  - Your visit should be split up between different activities.
- source_sentence: For concerts, the Auditorium on Palma's waterfront has a regular
    schedule of events from opera to heavy metal.
  sentences:
  - A woman moves through an urban area.
  - The auditorium has a lot of concerts.
  - The auditorium only featers people speaking.
- source_sentence: Newsweek excerpts the forthcoming memoir of former Air Force bomber
    pilot Kelly Flinn, who was discharged for adultery.
  sentences:
  - A group riding bikes.
  - Newsweek makes no mention of Kelly Flinn.
  - Newsweek includes a small sample from the memoir of Kelly Flinn.
pipeline_tag: sentence-similarity
library_name: sentence-transformers
---

# SentenceTransformer based on sentence-transformers/all-mpnet-base-v2

This is a [sentence-transformers](https://www.SBERT.net) model finetuned from [sentence-transformers/all-mpnet-base-v2](https://huggingface.co/sentence-transformers/all-mpnet-base-v2). It maps sentences & paragraphs to a 768-dimensional dense vector space and can be used for retrieval.

## Model Details

### Model Description
- **Model Type:** Sentence Transformer
- **Base model:** [sentence-transformers/all-mpnet-base-v2](https://huggingface.co/sentence-transformers/all-mpnet-base-v2) <!-- at revision e8c3b32edf5434bc2275fc9bab85f82640a19130 -->
- **Maximum Sequence Length:** 384 tokens
- **Output Dimensionality:** 768 dimensions
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
  (0): Transformer({'transformer_task': 'feature-extraction', 'modality_config': {'text': {'method': 'forward', 'method_output_name': 'last_hidden_state'}}, 'module_output_name': 'token_embeddings', 'architecture': 'MPNetModel'})
  (1): Pooling({'embedding_dimension': 768, 'pooling_mode': 'mean', 'include_prompt': True})
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
    'Newsweek excerpts the forthcoming memoir of former Air Force bomber pilot Kelly Flinn, who was discharged for adultery.',
    'Newsweek includes a small sample from the memoir of Kelly Flinn.',
    'Newsweek makes no mention of Kelly Flinn.',
]
embeddings = model.encode(sentences)
print(embeddings.shape)
# [3, 768]

# Get the similarity scores for the embeddings
similarities = model.similarity(embeddings, embeddings)
print(similarities)
# tensor([[ 1.0000,  0.7990, -0.1465],
#         [ 0.7990,  1.0000, -0.3729],
#         [-0.1465, -0.3729,  1.0000]])
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

* Size: 3,000 training samples
* Columns: <code>sentence_0</code> and <code>sentence_1</code>
* Approximate statistics based on the first 1000 samples:
  |         | sentence_0                                                                          | sentence_1                                                                          |
  |:--------|:------------------------------------------------------------------------------------|:------------------------------------------------------------------------------------|
  | type    | string                                                                              | string                                                                              |
  | details | <ul><li>min: 11 tokens</li><li>mean: 75.91 tokens</li><li>max: 384 tokens</li></ul> | <ul><li>min: 12 tokens</li><li>mean: 73.68 tokens</li><li>max: 187 tokens</li></ul> |
* Samples:
  | sentence_0                                                                                                                                                                                                                                                                                                                                                                                                                                     | sentence_1                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
  |:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
  | <code>item: nike benassi solarsoft 2 slide sandals midnight/lyon blue en sandals en brand: lacrosse monkey en description: the nike benassi solarsoft 2 men s slide improves upon its predecessor with more padding on the strap and a textured footbed for added comfort and support. a soft, pliable foam midsole offers plush cushioning, and flex grooves allow your foot to mover more naturally. benefits one piece synthetic lea</code> | <code>item: nike benassi solarsoft 2 slide sandals midnight/lyon blue en slides and sandals en brand: baseball monkey en description: the nike benassi solarsoft 2 men s slide improves upon its predecessor with more padding on the strap and a textured footbed for added comfort and support. a soft, pliable foam midsole offers plush cushioning, and flex grooves allow your foot to mover more naturally. benefits one piece synthetic lea</code>   |
  | <code>item: t l commande manfrotto follow focus lectronique avec poign e mvr911ejcn description: int gr e protocole canon mise au point manuel rayon image famille accessoires apn et cam ra sous famille t l commandes pour cam scopes collection t l commandes marque site poids net 0,500 kg page du catalogue 950</code>                                                                                                                   | <code>item: manfrotto hdslr deluxe remote control for canon mvr911ejcn manfrotto mvr911ejcn wts broadcast brand: manfrotto description: one of the world rsquo s first true electronic hdslr remote controls, the deluxe electronic remote control for canon hdslrs lets you react quickly to changing contexts and creative inspiration. br / br / it promises real innovation in the field of hdslr filming by circumventing the need for any phys</code> |
  | <code>item: hp 11,6 chroma hoes nl accessoires hp store netherlands nl brand: null nl</code>                                                                                                                                                                                                                                                                                                                                                   | <code>item: hp 11,6 chroma hoes nl 11 6 hoes hp store netherlands nl description: p bewaar je laptop in de goed passende, kleurrijke hoes die hij verdient. het stevige neopreenmateriaal beschermt de laptop tegen stoten en krassen en met keus uit vier maten en vier tweezijdig draagbare kleuren vind je er altijd een die bij jouw smaak past. /p voor laptops tot 11,6 inch 29,46 cm 1 </code>                                                       |
* Loss: [<code>MultipleNegativesRankingLoss</code>](https://sbert.net/docs/package_reference/sentence_transformer/losses.html#multiplenegativesrankingloss) with these parameters:
  ```json
  {
      "scale": 20.0,
      "similarity_fct": "cos_sim",
      "gather_across_devices": false,
      "directions": [
          "query_to_doc"
      ],
      "partition_mode": "joint",
      "hardness_mode": null,
      "hardness_strength": 0.0
  }
  ```

### Training Hyperparameters
#### Non-Default Hyperparameters

- `per_device_train_batch_size`: 16
- `per_device_eval_batch_size`: 16
- `fp16`: True
- `multi_dataset_batch_sampler`: round_robin

#### All Hyperparameters
<details><summary>Click to expand</summary>

- `do_predict`: False
- `prediction_loss_only`: True
- `per_device_train_batch_size`: 16
- `per_device_eval_batch_size`: 16
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
- `fp16`: True
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

### Training Logs
| Epoch  | Step  | Training Loss |
|:------:|:-----:|:-------------:|
| 0.8    | 500   | 0.1659        |
| 0.1934 | 1000  | 0.0751        |
| 0.2901 | 1500  | 0.0617        |
| 0.3868 | 2000  | 0.0582        |
| 0.4835 | 2500  | 0.0581        |
| 0.5802 | 3000  | 0.0550        |
| 0.6769 | 3500  | 0.0531        |
| 0.7735 | 4000  | 0.0497        |
| 0.8702 | 4500  | 0.0467        |
| 0.9669 | 5000  | 0.0461        |
| 1.0636 | 5500  | 0.0383        |
| 1.1603 | 6000  | 0.0358        |
| 1.2570 | 6500  | 0.0353        |
| 1.3537 | 7000  | 0.0357        |
| 1.4504 | 7500  | 0.0339        |
| 1.5471 | 8000  | 0.0331        |
| 1.6438 | 8500  | 0.0354        |
| 1.7405 | 9000  | 0.0327        |
| 1.8372 | 9500  | 0.0321        |
| 1.9339 | 10000 | 0.0322        |
| 2.6596 | 500   | 0.0235        |


### Training Time
- **Training**: 1.1 hours

### Framework Versions
- Python: 3.12.13
- Sentence Transformers: 5.4.1
- Transformers: 5.0.0
- PyTorch: 2.10.0+cu128
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

#### MultipleNegativesRankingLoss
```bibtex
@misc{oord2019representationlearningcontrastivepredictive,
      title={Representation Learning with Contrastive Predictive Coding},
      author={Aaron van den Oord and Yazhe Li and Oriol Vinyals},
      year={2019},
      eprint={1807.03748},
      archivePrefix={arXiv},
      primaryClass={cs.LG},
      url={https://arxiv.org/abs/1807.03748},
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