Building a Hybrid Semantic Matching Algorithm for a Lost and Found Platform
Introduction

Traditional lost and found systems often depend on users searching with exact keywords or manually browsing through lists of reported items. This approach can fail when two people describe the same item differently.

For example, one person may report losing a "black leather backpack with a laptop compartment", while another person may report finding a "dark backpack containing a computer sleeve". Although the descriptions refer to potentially similar items, a simple keyword-based search may not recognise the relationship between them.

To address this problem, I developed a hybrid semantic matching algorithm for my Lost and Found Recovery Platform. The algorithm combines Natural Language Processing (NLP) with contextual metadata to identify potential matches between lost and found items.

The main idea behind the approach is that a good match should not depend only on how similar two descriptions are. Information such as the item's category, location, colour, and the time between when it was lost and found can also provide important evidence.

The resulting system uses semantic similarity to understand the meaning of descriptions and metadata scoring to provide additional real-world context.

The Problem with Exact Keyword Matching

Keyword-based matching works well when users use the same words to describe an item. However, people naturally describe the same object in different ways.

Consider the following descriptions:

Lost: "Blue Samsung phone with a cracked screen"

Found: "Damaged Galaxy smartphone in a blue case"

The descriptions do not contain exactly the same words, but they may still refer to the same item.

A system based purely on keyword matching could miss this potential match because words such as phone and smartphone, or cracked and damaged, are not identical.

This is where semantic similarity becomes useful.

Semantic similarity focuses on the meaning and context of text rather than only checking whether the same keywords appear in both descriptions.

Using Sentence Embeddings for Semantic Similarity

The semantic component of the system uses SBERT (Sentence-BERT) embeddings.

An embedding is a numerical representation of text. Instead of treating a description as a collection of individual words, a sentence embedding represents the overall meaning of that description as a vector.

For example, these descriptions:

"Black backpack containing a laptop"
"Dark computer bag with a notebook sleeve"

may have similar embeddings because they express related meanings, even though the wording is different.

The system can then compare the embeddings of lost and found item descriptions to calculate a semantic similarity score.

A higher score indicates that the descriptions are more semantically related.

However, semantic similarity alone is not always enough. Two items can have similar descriptions while being completely unrelated in terms of where or when they were reported.

For this reason, I combined semantic similarity with metadata-based scoring.

Efficient Candidate Retrieval with FAISS

Comparing a newly reported item against every item in the database would become inefficient as the number of reports grows.

To improve this process, the system uses FAISS for similarity search.

FAISS stores vector representations and allows the system to efficiently retrieve the most semantically similar candidate items.

The matching process can therefore be divided into two stages:

Convert the item's description into an embedding.
Use FAISS to retrieve the most semantically similar candidate items.

Instead of performing detailed calculations on every record, the system first narrows the search to the most relevant candidates.

The candidates can then be evaluated further using metadata such as category, location, time, and colour.

This approach combines efficient vector retrieval with more detailed contextual scoring.

The Hybrid Scoring Approach

The final matching algorithm combines two major components:

Semantic similarity
Metadata similarity

The final score is calculated using a configurable parameter called alpha.

Conceptually, the formula is:

Final Score =
(alpha × Semantic Score) +
((1 - alpha) × Metadata Score)

The default value of alpha is 0.6.

This means:

60% of the final score comes from semantic similarity.
40% of the final score comes from metadata similarity.

The value is constrained between 0.3 and 0.9, allowing the balance between semantic and metadata information to be adjusted.

I chose this approach because neither source of information is sufficient on its own.

Semantic similarity helps the system understand that different descriptions may refer to similar items, while metadata helps determine whether the potential match makes sense in the real world.

For example, two descriptions may be highly similar, but if one item was lost in Harare and the other was found in a completely unrelated location at a very different time, the metadata should reduce confidence in that match.

Metadata Scoring

The metadata score is itself made up of several components.

The algorithm assigns the following weights:

Metadata Component	Weight
Category	0.4
Location	0.3
Time	0.2
Colour	0.1

These weights add up to 1.0.

Category receives the highest weight because identifying whether two reports refer to the same type of item is important. Location receives the second-highest weight because items are more likely to be related when they were lost and found in nearby or similar places.

Time also contributes to the score, while colour provides additional supporting information.

The weighting system makes the algorithm configurable and easier to improve as more data becomes available.

Category Matching

Category matching is the simplest metadata component.

If the lost and found items belong to the same category, the algorithm returns a score of 1.0. If they do not match, the score is 0.0.

When category information is missing, the algorithm uses a neutral score rather than immediately rejecting the candidate.

This is important because users may not always provide complete information when reporting an item.

For example:

Lost item category: Electronics
Found item category: Electronics

Category Score: 1.0

Matching categories increase confidence that the two reports could refer to the same item.

Location Matching

Location information can be entered differently by different users.

For example:

"University of Zimbabwe Library"
"UZ Library"
"Library, University of Zimbabwe"

A strict exact-text comparison would be too limited.

The algorithm therefore supports several levels of location matching.

An exact location match receives the highest score. Partial matches are also recognised when one location contains the other.

The algorithm also checks for common words between locations and calculates a score based on the amount of overlap.

This makes the matching process more flexible than requiring users to enter locations in exactly the same format.

When location information is missing, a neutral score is used instead of assuming that the candidate is unrelated.

Time-Based Scoring

Time is another important part of determining whether two reports are likely to be connected.

An item found shortly after it was reported lost may be more likely to be the same item than one found several months later.

The algorithm uses exponential decay to reduce the time score as the difference between the lost and found dates increases.

The calculation is based on:

Time Score = e^(-days_difference / 7)

The result is a score between 0 and 1.

As the number of days between the two reports increases, the score decreases.

This approach provides a gradual reduction in confidence instead of using a hard rule such as "reject every match older than seven days."

A gradual decay is more flexible because genuine matches can still occur after longer periods.

Colour Matching

Colour is treated as additional supporting information.

The algorithm checks whether the colours match exactly and also supports partial matching.

For example:

"Dark blue"
"Blue"

These descriptions may still provide useful evidence of a possible match.

Colour has a lower weight than category, location, and time because it can be less reliable. Users may describe the same colour differently, and some items may have multiple colours.

For this reason, colour contributes to the final decision without having too much influence over it.

Ranking and Filtering Potential Matches

After semantic and metadata scores have been combined, the candidate matches are ranked according to their final scores.

The highest-scoring candidates are considered the strongest potential matches.

The system also uses a similarity threshold to filter out weak matches.

This is important because a semantic search system will usually return some results even when there is no genuinely strong match.

By applying a threshold, the system can avoid presenting every vaguely similar item as a potential recovery candidate.

The final process is therefore:

Item Report
    ↓
Generate Semantic Embedding
    ↓
FAISS Similarity Search
    ↓
Retrieve Candidate Items
    ↓
Calculate Semantic Score
    ↓
Calculate Metadata Score
    ↓
Combine Scores Using Hybrid Formula
    ↓
Apply Threshold
    ↓
Rank Strongest Matches
    ↓
Return Potential Matches
Why I Chose a Hybrid Approach

The most important design decision in this algorithm was combining semantic similarity with contextual metadata.

A purely keyword-based approach would struggle when users describe the same item differently.

A purely semantic approach could also produce false positives because descriptions may be similar even when the items are unrelated.

For example, two reports about black backpacks may have high semantic similarity. However, if they were reported in different locations and on very different dates, metadata provides evidence that they may not represent the same physical item.

The hybrid approach allows the system to benefit from both methods.

Semantic similarity answers a question similar to:

"Do these descriptions appear to mean similar things?"

Metadata answers additional questions such as:

"Are these the same type of item?"

"Were they reported in related locations?"

"Are the dates reasonably close?"

"Does the colour provide supporting evidence?"

Combining these signals produces a more contextual and practical matching system.

Integration with the Application

The matching algorithm is designed to work as part of the backend of the Lost and Found Recovery Platform.

When a user submits an item report, the system can generate a semantic representation of the description and search for relevant candidate items.

The candidates are then evaluated using the hybrid scoring process.

Potential matches can be ranked according to their confidence scores and stored or returned to the application for further processing.

This architecture separates efficient candidate retrieval from detailed match evaluation.

It also makes the algorithm easier to extend in the future.

For example, future improvements could include:

Fuzzy matching for brand names.
More advanced colour normalisation.
Geographic distance calculations using coordinates.
Image similarity for photos of items.
Learning optimal metadata weights from historical match data.
User feedback to improve future ranking decisions.
Conclusion

Building this algorithm taught me that solving a real-world matching problem requires more than choosing a single similarity technique.

Semantic embeddings make it possible to recognise relationships between differently worded descriptions. FAISS makes it possible to retrieve similar candidates efficiently. Metadata provides additional context that helps distinguish genuinely useful matches from false positives.

The hybrid approach combines these strengths into a single scoring system.

The algorithm is also configurable, allowing the relative importance of semantic and metadata similarity to be adjusted as the system evolves.

Although there is still room for improvement, this project gave me practical experience in applying NLP, vector similarity search, scoring algorithms, and backend integration to solve a real-world problem.

For me, the most valuable part of building the system was moving beyond a simple "does this text contain the same keywords?" approach and designing a solution that considers both what users mean and the context in which an item was lost or found.