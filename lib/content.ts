export type Concept = {
  key: string;
  title: string;
  answer: string;
  why: string;
  keywords: string[][];
};

export type Topic = {
  id: string;
  title: string;
  short: string;
  color: string;
  icon: string;
  outcome: string;
  concepts: Concept[];
};

export type ArenaQuestion = {
  id: string;
  source: "Core" | "Mock Client" | "Gladiator";
  number: number;
  topicId: string;
  conceptKey: string;
  prompt: string;
  difficulty: "Foundation" | "Applied" | "Challenge";
};

const c = (key: string, title: string, answer: string, why: string, keywords: string[][]): Concept => ({ key, title, answer, why, keywords });

export const TOPICS: Topic[] = [
  {
    id: "ml-foundations", title: "ML Foundations & Trees", short: "Models, CART and supervised vs unsupervised learning", color: "#65d8b3", icon: "TreePine", outcome: "Explain tree models, their splitting logic and where unsupervised learning fits.",
    concepts: [
      c("decision-tree", "Decision Tree", "A decision tree is a supervised model that repeatedly splits data using feature-based questions. Internal nodes contain questions, branches contain answers, and leaves contain a class, probability or numeric prediction.", "This definition names the learning type, structure and output, so it answers both what the model is and how it predicts.", [["supervised"], ["split", "question"], ["leaf", "leaves"], ["class", "prediction"]]),
      c("regression-tree", "Regression Tree", "A regression tree predicts a continuous number. Each split reduces the variation of target values, commonly by minimizing squared error; a leaf usually returns the mean target of its training rows.", "It distinguishes regression from classification and states the training objective and leaf output.", [["continuous", "numeric"], ["squared error", "variance"], ["mean", "average"], ["leaf"]]),
      c("cart", "CART", "CART means Classification and Regression Trees. It builds a binary tree by greedily selecting splits that reduce impurity for classification or prediction error for regression, and it may be pruned to control overfitting.", "The answer expands the acronym and covers both supported tasks, split selection and complexity control.", [["classification"], ["regression"], ["binary"], ["impurity", "error"], ["prun", "overfit"]]),
      c("cart-binary", "Why CART uses binary splits", "Binary splits keep each optimization step simple, let the tree represent multi-way decisions through repeated splits and make pruning and interpretation consistent. A chosen feature threshold naturally divides rows into two exhaustive groups.", "It explains the practical and mathematical reasons without claiming binary trees are always shallower.", [["simple", "optimization"], ["repeated", "multi-way"], ["prun", "interpret"], ["two", "threshold"]]),
      c("unsupervised", "Unsupervised learning", "Unsupervised models learn structure from data without target labels. Examples include K-means and hierarchical clustering, PCA for dimensionality reduction, anomaly detection and association rules.", "A complete interview answer gives the defining absence of labels, the goal and representative model families.", [["without", "no label", "unlabeled"], ["cluster", "k-means"], ["pca", "dimensional"], ["anomaly"]]),
    ],
  },
  {
    id: "data-python", title: "Data, EDA & Python", short: "Imputation, distributions, Pandas, NumPy and modular code", color: "#71a7ff", icon: "Database", outcome: "Defend preprocessing choices and explain the Python tools behind them.",
    concepts: [
      c("ml-lifecycle", "ML lifecycle", "The ML lifecycle moves from business problem and success metric to data collection, validation, EDA, preprocessing, feature engineering, training, evaluation, deployment, monitoring and retraining. Every stage should be reproducible and traceable.", "It starts with the business goal and continues beyond deployment, avoiding the common mistake of describing only model training.", [["business", "problem"], ["data"], ["train", "model"], ["deploy"], ["monitor", "retrain"]]),
      c("imputation", "Imputation", "Imputation replaces missing values using a justified estimate. Simple choices include mean or median for numeric data, mode or a new category for categorical data, and time-aware forward or backward filling for ordered series; fit the imputer on training data only.", "It provides multiple techniques and prevents data leakage by fitting only on training data.", [["missing"], ["mean", "median", "mode"], ["categorical", "category"], ["training", "leak"]]),
      c("advanced-imputation", "Advanced imputation", "Advanced approaches include KNN imputation, iterative or MICE imputation, regression models, matrix factorization and domain-specific time-series interpolation. Compare methods through validation and preserve a missingness indicator when absence itself may be informative.", "It lists genuinely advanced techniques and explains how to choose rather than presenting one method as universally best.", [["knn", "mice", "iterative"], ["regression", "model"], ["validation"], ["missingness indicator", "indicator"]]),
      c("eda", "Exploratory Data Analysis", "EDA is the structured investigation of a dataset before modeling: inspect schema and quality, summarize distributions, find missing values and outliers, study relationships, check target balance and form hypotheses using statistics and visualizations.", "It frames EDA as decision-making, not merely drawing charts.", [["distribution"], ["missing", "outlier"], ["relationship", "correlation"], ["target", "balance"], ["visual"]]),
      c("data-distribution", "Data distribution analysis", "Study shape, center, spread, skewness, tails, outliers, class balance and changes across subgroups or time. Use histograms, density or box plots plus summary statistics, then decide whether transformations, robust methods or stratification are needed.", "It connects observations to modeling actions, which is what an interviewer wants from distribution analysis.", [["shape", "skew"], ["spread", "variance"], ["outlier"], ["class balance"], ["transform", "stratif"]]),
      c("numpy-broadcast", "NumPy broadcasting", "Broadcasting lets NumPy apply vectorized operations to arrays with compatible shapes by conceptually expanding dimensions of size one without physically copying the data. Shapes are compared from the right; dimensions must match or one must equal one.", "It gives both the rule and the efficiency benefit.", [["compatible shape"], ["right"], ["one", "1"], ["without copy", "vector"]]),
      c("loc-iloc", "loc vs iloc", "`loc` selects Pandas rows and columns by label and includes both ends of a label slice. `iloc` selects by zero-based integer position and follows Python's end-exclusive slicing.", "The key distinction is label versus position, plus the frequently tested slicing behavior.", [["label"], ["position", "integer"], ["inclusive"], ["exclusive"]]),
      c("stratify", "Stratification", "Stratification preserves the target-class proportions in train and test subsets. Use `stratify=y` for one split, `StratifiedKFold` or `StratifiedShuffleSplit` for repeated evaluation, and group-aware or iterative stratification when groups or multilabel targets matter.", "It explains the purpose and gives valid alternatives for different data structures.", [["class proportion", "distribution"], ["StratifiedKFold"], ["shuffle"], ["group", "multilabel"]]),
      c("plot-libs", "Plotting and reporting libraries", "Use Matplotlib for core plotting, Seaborn for statistical graphics, Plotly or Altair for interactive charts, and Pandas plotting for quick EDA. Reports can be produced with Jupyter, Quarto, ReportLab, WeasyPrint or dashboard frameworks such as Streamlit.", "It separates visualization libraries from report-generation tools and shows appropriate use cases.", [["matplotlib"], ["seaborn"], ["plotly", "altair"], ["reportlab", "quarto", "jupyter", "streamlit"]]),
      c("preprocess-libs", "Preprocessing libraries", "Pandas and NumPy handle cleaning and transformation; scikit-learn provides imputers, encoders, scalers, column transformers and pipelines; imbalanced-learn supports resampling. Specialized work may use category_encoders, feature-engine or domain libraries.", "It names the major libraries and the exact preprocessing responsibilities they cover.", [["pandas"], ["numpy"], ["scikit", "sklearn"], ["imputer", "encoder", "scaler", "pipeline"], ["imbalanced"]]),
      c("feature-engineering", "Feature engineering with Pandas", "Create meaningful variables with arithmetic, bins, dates, string extraction, group aggregates, rolling windows and joins. Build transformations from training data, avoid leakage, document assumptions and place repeatable steps in a pipeline.", "It gives concrete Pandas operations while emphasizing leakage and reproducibility.", [["date", "string", "bin"], ["group", "rolling"], ["join"], ["leak"], ["pipeline"]]),
      c("refactoring", "Refactoring", "Refactoring changes internal code structure without changing external behavior. Typical goals are removing duplication, improving names, extracting functions, simplifying control flow and making code easier to test and maintain.", "It clearly separates code-quality improvement from feature changes.", [["without changing behavior"], ["duplicate"], ["function"], ["test", "maintain"]]),
      c("modular-code", "Modular code", "Modular code separates responsibilities into focused, reusable components with clear interfaces—for example data loading, preprocessing, training and evaluation modules. This improves testing, replacement, collaboration and reuse.", "It defines modularity through separation and interfaces, then states its engineering benefits.", [["separate", "responsibility"], ["interface"], ["reusable"], ["test", "replace"]]),
    ],
  },
  {
    id: "evaluation", title: "Metrics & Model Evaluation", short: "Accuracy, precision, recall, F1 and ROC", color: "#f5c15d", icon: "Gauge", outcome: "Select metrics from business costs rather than quoting accuracy alone.",
    concepts: [
      c("precision-recall", "Precision and recall", "Precision = TP/(TP+FP): of predicted positives, how many were correct. Recall = TP/(TP+FN): of actual positives, how many were found. Raising a decision threshold often improves precision but lowers recall, so choose based on false-positive and false-negative costs.", "It gives formulas, plain-English meaning and the threshold trade-off.", [["tp", "true positive"], ["precision"], ["recall"], ["false positive"], ["false negative"], ["threshold", "trade-off"]]),
      c("f1", "F1-score", "F1 is the harmonic mean of precision and recall: 2PR/(P+R). It is useful when classes are imbalanced and both false positives and false negatives matter, because a high score requires both precision and recall to be reasonably high.", "It gives the formula and explains why F1 is safer than accuracy for imbalanced classification.", [["harmonic"], ["precision"], ["recall"], ["imbalanc"], ["false positive", "false negative"]]),
      c("roc", "ROC curve", "The ROC curve plots true-positive rate against false-positive rate across classification thresholds. AUC summarizes ranking ability: 0.5 is random and 1.0 is perfect, but precision-recall curves are often more informative when positives are rare.", "It defines both axes, threshold behavior and an important limitation of ROC-AUC.", [["true positive rate", "tpr"], ["false positive rate", "fpr"], ["threshold"], ["auc"], ["precision-recall", "rare"]]),
      c("accuracy-fit", "Is an accuracy good enough?", "There is no universal good accuracy. Compare against a simple baseline and current process, evaluate confidence intervals and subgroup performance, and translate each error type into business, safety or user cost. Choose a threshold that meets those requirements on unseen data.", "It replaces arbitrary targets such as 80% or 90% with evidence tied to the actual use case.", [["baseline"], ["business", "cost"], ["error"], ["unseen", "validation", "test"], ["subgroup", "confidence"]]),
      c("ml-llm-metrics", "ML and LLM evaluation metrics", "For ML, choose task metrics such as precision, recall, F1, ROC-AUC, MAE or RMSE and calibration. For LLMs, combine task success, groundedness, factuality, relevance, safety, latency and cost, using automated checks plus human or judge-model review on a representative golden set.", "It avoids applying one metric to every system and covers quality plus operational measures.", [["f1", "mae", "rmse", "auc"], ["ground", "factual"], ["relevance"], ["safety"], ["latency", "cost"], ["human", "golden"]]),
    ],
  },
  {
    id: "mlops", title: "ML Projects & MLOps", short: "Pipelines, deployment, monitoring and retraining", color: "#ef7f7f", icon: "Workflow", outcome: "Describe an end-to-end production ML system and defend its operations.",
    concepts: [
      c("mlops-lifecycle", "ML lifecycle vs MLOps lifecycle", "The ML lifecycle focuses on creating a useful model from problem framing through evaluation. The MLOps lifecycle operationalizes that work with versioning, automated tests, CI/CD/CT, deployment, monitoring, governance, rollback and scheduled or triggered retraining.", "It shows that MLOps contains software and operational controls around the modeling lifecycle.", [["model", "ml lifecycle"], ["version"], ["ci", "cd", "ct"], ["monitor"], ["rollback", "retrain"]]),
      c("mlops-benefits", "Benefits of MLOps", "MLOps makes experiments reproducible, deployments repeatable, releases safer and model behavior observable. It shortens delivery time while improving lineage, collaboration, governance, rollback and response to drift.", "It connects technical practices to reliability, speed and governance outcomes.", [["reproduc"], ["repeat", "automate"], ["monitor", "observable"], ["lineage", "govern"], ["drift", "rollback"]]),
      c("post-deploy", "Post-deployment activities", "After deployment, monitor service health, latency, cost, input quality, drift, prediction distributions, calibration and delayed ground-truth performance. Log versions, investigate incidents, collect feedback, run shadow or A/B tests and retrain or roll back under controlled criteria.", "It covers both software operations and model-specific degradation.", [["latency", "health"], ["drift"], ["performance", "ground truth"], ["ab", "shadow"], ["retrain", "rollback"]]),
      c("monitoring", "Ways to monitor ML models", "Use infrastructure metrics and traces, schema and data-quality checks, statistical drift tests, prediction and confidence distributions, performance on delayed labels, subgroup/fairness metrics and business KPIs. Set actionable alerts and compare against training baselines.", "It gives multiple monitoring layers rather than reducing monitoring to accuracy.", [["infrastructure", "latency"], ["data quality", "schema"], ["drift"], ["prediction"], ["fairness", "subgroup"], ["business"]]),
      c("project-pipeline", "ML project pipeline", "A robust pipeline defines the problem and metric, versions data, validates and explores it, preprocesses and engineers features, trains baselines and candidates, evaluates on held-out data, packages the chosen model, deploys it, monitors it and triggers governed improvement.", "It is end-to-end, ordered and includes baselines, versioning and production feedback.", [["problem", "metric"], ["data", "eda"], ["feature", "preprocess"], ["baseline", "train"], ["evaluate"], ["deploy", "monitor"]]),
      c("sentiment-project", "Sentiment analysis project", "Define labels and success criteria, collect representative text, clean and split it, explore imbalance, create a TF-IDF baseline, train and tune classifiers, evaluate per class, inspect errors, expose inference, monitor drift and retrain with reviewed labels.", "It gives a realistic project flow with a baseline and text-specific error analysis.", [["label", "criteria"], ["clean", "split"], ["tf-idf", "baseline"], ["evaluate", "per class"], ["error"], ["deploy", "drift"]]),
      c("college-project", "College ML project example", "Example: predict student support needs. Define an ethical support goal, obtain consented attendance and assessment features, clean and split by time or cohort, build an interpretable baseline, evaluate recall and subgroup fairness, show explanations to staff and monitor whether interventions help.", "The example is end-to-end, feasible and treats the output as support rather than punishment.", [["student"], ["attendance", "assessment"], ["baseline"], ["recall", "fairness"], ["support", "intervention"]]),
      c("churn-project", "Banking churn project", "Define churn and intervention timing; join customer, product and activity data; prevent future-data leakage; analyze imbalance; encode and scale through a pipeline; compare interpretable and boosted models; optimize recall/precision to campaign cost; explain, deploy, monitor drift and measure retention uplift.", "It ties model choices to the bank's intervention economics and includes leakage prevention.", [["churn", "timing"], ["leak"], ["imbalance"], ["pipeline"], ["precision", "recall", "cost"], ["drift", "uplift"]]),
    ],
  },
  {
    id: "llm", title: "LLMs & Prompt Engineering", short: "Generation, sampling, structured outputs and prompts", color: "#c593ff", icon: "Sparkles", outcome: "Explain how LLMs generate, control and structure responses.",
    concepts: [
      c("generative-ai", "Generative AI", "Generative AI learns patterns in data and creates new content such as text, images, audio, code or video. Unlike a discriminative model that only assigns labels or predicts values, a generative model estimates how data is formed and samples a new output conditioned on instructions or context.", "It defines the capability, gives modalities and contrasts it with predictive classification.", [["create", "generate"], ["text", "image", "code"], ["pattern", "distribution"], ["condition", "prompt"]]),
      c("ml-vs-llm", "ML models vs LLMs", "Traditional ML models are usually trained for a narrow task on structured or task-specific data and often have smaller compute and clearer metrics. LLMs are large pretrained sequence models that handle broad language tasks through prompting or adaptation, but cost more and need factuality, safety and prompt-sensitive evaluation.", "It compares scope, data, training, interface, cost and evaluation rather than only model size.", [["narrow", "specific"], ["pretrain", "language"], ["prompt"], ["compute", "cost"], ["factual", "safety"]]),
      c("choose-ml-llm", "When to use ML vs LLM", "Use conventional ML when inputs and targets are structured, the task is stable, labeled data exists and low latency, cost or explainability matters. Use an LLM for unstructured language, generation, summarization, extraction or flexible interaction; combine them when an LLM handles language and ML handles scoring or forecasting.", "It makes the choice from task, data and constraints and includes a hybrid option.", [["structured"], ["latency", "cost", "explain"], ["language", "unstructured"], ["generate", "summar"], ["hybrid", "combine"]]),
      c("sampling", "Top-K and Top-P", "Top-K samples only from the K highest-probability next tokens. Top-P (nucleus sampling) uses the smallest token set whose cumulative probability reaches P, so the set adapts to uncertainty. Lower values are more focused; higher values are more diverse.", "It accurately distinguishes a fixed-size candidate set from an adaptive probability-mass set.", [["k highest"], ["cumulative", "nucleus"], ["adaptive"], ["diverse", "focused"]]),
      c("llm-parameters", "Key LLM parameters", "Key generation controls include temperature, top-p, top-k where supported, maximum tokens, stop sequences, repetition or frequency penalties and random seed. Model choice and context-window size are configuration decisions; tune controls together and evaluate on representative prompts.", "It lists practical parameters and warns against treating them independently of evaluation.", [["temperature"], ["top-p", "top p"], ["max", "token"], ["stop"], ["penalty", "seed"], ["context"]]),
      c("structured-output", "Structured output and Pydantic", "Structured output constrains an LLM response to a schema such as JSON. An output parser converts and validates the response; a Pydantic model declares field names, types, constraints and nested structure, producing reliable application data or a clear validation error.", "It explains both the goal and distinct roles of schema, parser and Pydantic validation.", [["schema", "json"], ["parser"], ["pydantic"], ["type", "constraint"], ["validation", "error"]]),
      c("prompt-engineering", "Prompt engineering", "Prompt engineering designs instructions and context so a model reliably performs a task. A strong prompt states role and objective, supplies necessary context, defines constraints and output format, gives examples when useful and specifies how to handle missing information; it is then tested systematically.", "It presents prompt design as an evaluated engineering process, not clever wording.", [["instruction", "objective"], ["context"], ["constraint"], ["format"], ["example"], ["test", "evaluate"]]),
      c("cot", "Chain of Thought", "Chain of Thought prompting asks a model to perform intermediate reasoning before an answer. It can help complex tasks, but hidden reasoning should not be treated as guaranteed truth; production systems often request concise justifications, verifiable calculations or tool traces instead of exposing private internal reasoning.", "It states the benefit while correctly emphasizing verification and safer evidence forms.", [["intermediate", "reason"], ["complex"], ["verify"], ["justification", "tool trace"]]),
    ],
  },
  {
    id: "rag", title: "RAG, Retrieval & Vector Stores", short: "Embeddings, chunking, search and grounded generation", color: "#4fd1d9", icon: "Boxes", outcome: "Trace a RAG request end to end and measure retrieval and generation separately.",
    concepts: [
      c("rag", "RAG workflow", "Retrieval-Augmented Generation first ingests documents, extracts and cleans text, chunks it, creates embeddings and indexes chunks with metadata. At query time it embeds or rewrites the question, retrieves and optionally reranks relevant chunks, builds a grounded prompt, generates an answer with citations and logs the result for evaluation.", "It cleanly separates offline ingestion from online retrieval and generation.", [["extract", "clean"], ["chunk"], ["embedding", "index"], ["retrieve", "rerank"], ["prompt"], ["citation", "evaluate"]]),
      c("vector-vs-sql", "Vector database vs SQL database", "SQL databases excel at exact structured queries, transactions, joins and constraints. Vector databases index high-dimensional embeddings for approximate semantic similarity; many also store metadata and support filters. Hybrid systems commonly keep business records in SQL and searchable embeddings in a vector index.", "It compares strengths and gives the practical hybrid architecture instead of claiming one replaces the other.", [["sql", "structured"], ["transaction", "join"], ["embedding", "vector"], ["semantic", "similar"], ["hybrid", "metadata"]]),
      c("vector-index", "Vector indexing", "Vector databases use indexes such as HNSW, IVF, product quantization or flat exact search. Approximate nearest-neighbor indexes trade a small amount of recall for much lower latency and memory; parameters such as efSearch or probes are tuned using recall-versus-latency tests.", "It answers yes, names real index families and explains the central performance trade-off.", [["hnsw", "ivf"], ["approximate", "ann"], ["recall"], ["latency", "memory"], ["tune"]]),
      c("retrieval-eval", "Retrieval evaluation", "Build a golden set of queries with relevant chunk or document labels. Measure Recall@K, Precision@K, MRR, nDCG, hit rate and latency, then perform error analysis by query type. Evaluate retriever settings independently before judging the generated answer.", "It states the required ground truth, suitable metrics and separation of retrieval from generation.", [["golden", "ground truth"], ["recall@", "precision@"], ["mrr", "ndcg"], ["latency"], ["independent", "separate"]]),
      c("precision-recall-k", "Precision@K and Recall@K", "Precision@K is relevant items among the top K divided by K. Recall@K is relevant items found in the top K divided by all relevant items. Precision rewards a clean context; recall rewards not missing evidence, and increasing K often raises recall while lowering precision.", "It gives correct denominators and interprets the K trade-off for RAG.", [["relevant", "top k"], ["divide", "k"], ["all relevant"], ["trade-off"]]),
      c("mrr", "Mean Reciprocal Rank", "For each query, reciprocal rank is 1 divided by the position of the first relevant result; MRR is the mean across queries. It is ideal when finding one correct item early matters, but it ignores later relevant items.", "It gives the calculation, correct use case and limitation.", [["first relevant"], ["1", "rank"], ["mean", "average"], ["ignore", "later"]]),
      c("response-eval", "RAG response evaluation", "Evaluate answer correctness against a reference, faithfulness or groundedness against retrieved context, relevance to the question, citation accuracy and completeness, safety, readability, latency and cost. Use deterministic checks where possible plus calibrated human or LLM-as-judge rubrics.", "It separates answer correctness from grounding and includes citations and operations.", [["correct"], ["faithful", "ground"], ["relevant"], ["citation"], ["human", "judge"], ["latency", "cost"]]),
      c("hallucination", "Hallucination rate and reduction", "Hallucination rate is the proportion of evaluated claims or responses that are unsupported or factually wrong under a defined rubric. Reduce it with better retrieval and reranking, high-quality chunks, grounded prompts, citations, abstention when evidence is absent, structured outputs, tool validation and continuous evaluation.", "It defines a measurable denominator and gives controls across retrieval, prompting and validation.", [["unsupported", "wrong"], ["proportion", "rate"], ["retriev", "rerank"], ["citation", "ground"], ["abstain", "evidence"], ["validate"]]),
      c("chunking", "Chunking", "Chunking divides documents into retrieval units. Fixed-size chunks are simple; recursive separators respect paragraphs and headings; semantic or structure-aware approaches preserve meaning; sliding overlap retains boundary context. Choose size from document structure, embedding limits and retrieval evaluation.", "It describes major techniques and makes chunk size an evaluated design choice.", [["fixed"], ["recursive"], ["semantic", "structure"], ["overlap"], ["evaluate", "size"]]),
      c("recursive-chunking", "Recursive chunking", "Recursive chunking tries separators in order—such as sections, paragraphs, sentences and words—until every chunk fits the limit. It preserves natural boundaries better than blindly cutting every N characters while still guaranteeing a maximum size.", "It explains the recursive mechanism and why it improves context coherence.", [["separator"], ["section", "paragraph", "sentence"], ["limit", "size"], ["boundary", "coher"]]),
      c("chunk-size", "Choosing chunk size", "Start from the unit needed to answer a question, stay within embedding and generation limits, add measured overlap and test several sizes on a golden query set. Compare Recall@K, answer groundedness, latency and token cost; different document types may need different strategies.", "It avoids a magic number and gives an evidence-based experiment.", [["answer", "unit"], ["token", "limit"], ["overlap"], ["golden", "test"], ["recall", "ground", "latency", "cost"]]),
      c("embedding", "Embeddings and vectorization", "An embedding model converts text or another item into a fixed-length numeric vector whose geometry captures learned similarity. Vectorization is the broader conversion of data into numeric features; embeddings are dense learned vectors used for semantic search, clustering and model input.", "It defines both terms and their relationship without treating every vector as an embedding.", [["numeric", "vector"], ["fixed", "dimension"], ["similar", "semantic"], ["vectorization"], ["dense", "learned"]]),
      c("embedding-choice", "Embedding model and vector size", "State the exact model used, its dimension from the model documentation, language/domain coverage, maximum input length, license, latency and cost. The vector size is fixed by that model—for example 384, 768 or 1536—not chosen independently after embeddings are created.", "It gives the defensible project answer and prevents inventing a dimension.", [["model", "exact"], ["dimension", "size"], ["documentation"], ["language", "domain"], ["latency", "cost"]]),
      c("faiss", "FAISS", "FAISS is an optimized library for dense-vector similarity search. It is fast because it uses efficient C++ and SIMD/GPU implementations plus index structures such as flat, IVF, HNSW and product quantization; it is primarily an index library, so metadata and persistence need application design.", "It explains speed and accurately distinguishes a search library from a full database.", [["vector", "similarity"], ["c++", "simd", "gpu"], ["ivf", "hnsw", "pq"], ["metadata", "database"]]),
      c("chroma-faiss", "ChromaDB vs FAISS", "FAISS is a high-performance vector indexing library with fine index control. Chroma is a developer-friendly vector database layer that adds collections, document and metadata storage, filtering and persistence. Chroma may add overhead, while FAISS needs more surrounding application code.", "It compares abstraction and features rather than simply saying one is faster.", [["library", "index"], ["database", "collection"], ["metadata", "filter"], ["overhead"], ["application code"]]),
      c("mmr", "Maximal Marginal Relevance", "MMR selects results by balancing relevance to the query with novelty relative to already selected results. A lambda parameter controls the balance, helping RAG avoid returning many near-duplicate chunks while retaining useful evidence.", "It names both optimization goals and the duplication problem it solves.", [["relevance"], ["divers", "novel"], ["duplicate"], ["lambda", "balance"]]),
      c("citations", "Citations in RAG", "Store source IDs, page numbers and offsets with every chunk, carry metadata through retrieval and attach citations to claims generated from those chunks. Validate that each citation exists and actually supports its claim; a source link alone is not evidence of faithfulness.", "It gives the implementation chain and the required support check.", [["metadata"], ["page", "source"], ["chunk", "retrieval"], ["claim"], ["support", "validate"]]),
      c("vector-stores", "Popular vector databases", "Common choices include Pinecone, Weaviate, Milvus, Qdrant, Chroma, pgvector, Elasticsearch/OpenSearch vector search and managed cloud vector services. Choose by scale, filtering, hybrid search, operations, security, latency, cost and ecosystem—not popularity alone.", "It names market options and gives defensible selection criteria.", [["pinecone", "weaviate", "milvus", "qdrant"], ["chroma", "pgvector"], ["elastic", "opensearch"], ["filter", "hybrid"], ["cost", "scale"]]),
      c("compare-docs", "Comparing documents", "Represent documents or chunks with embeddings and compare cosine similarity for semantic closeness; combine this with lexical or metadata comparison when exact terms matter. For full-document comparison, aggregate chunk-level matches and inspect aligned evidence rather than averaging everything blindly.", "It supports both semantic and exact comparison and preserves explainable evidence.", [["embedding"], ["cosine"], ["lexical", "metadata"], ["chunk"], ["evidence"]]),
    ],
  },
  {
    id: "agents", title: "Agents, Guardrails & Evaluation", short: "ReAct, LangGraph, autonomy, safety and testing", color: "#ff8faf", icon: "Bot", outcome: "Design, constrain and evaluate tool-using AI agents.",
    concepts: [
      c("ai-agent", "AI agents", "An AI agent observes a state, decides the next action, uses tools or APIs, reads the result and repeats until it reaches a goal or stopping condition. A production agent also needs bounded permissions, memory design, error handling, observability and human escalation.", "It goes beyond an LLM response and includes the action-feedback loop and operational controls.", [["observe", "state"], ["decide", "plan"], ["tool", "action"], ["repeat", "loop"], ["permission", "human"]]),
      c("react", "ReAct agent", "ReAct interleaves reasoning with actions: assess the task, choose a tool, observe its output and update the plan. The pattern grounds decisions in external evidence and supports multi-step work, but must include tool validation, iteration limits and safe failure handling.", "It states the core reason-action-observation loop and its production safeguards.", [["reason"], ["action", "tool"], ["observation"], ["loop", "update"], ["limit", "validate"]]),
      c("rag-agent", "RAG agent", "A RAG agent decides when and how to retrieve, may rewrite the query, select sources, rerank evidence, request clarification and iterate before answering. Unlike a fixed RAG chain, its next retrieval action can depend on previous observations.", "It correctly distinguishes agentic retrieval from a predetermined pipeline.", [["decide"], ["retrieve"], ["rewrite", "rerank"], ["clarif"], ["previous", "observation"]]),
      c("guardrails", "LLM guardrails", "Guardrails are layered controls around inputs, tools, retrieval and outputs: authentication and authorization, prompt-injection filtering, allowlisted tools, schema validation, grounding checks, safety policies, PII redaction, rate limits, monitoring and human approval for high-impact actions.", "It treats guardrails as defense in depth rather than one prompt instruction.", [["input", "output"], ["authoriz", "permission"], ["injection"], ["schema", "validate"], ["pii", "safety"], ["human"]]),
      c("malicious-response", "Avoiding wrong or malicious responses", "Use trusted context and citations, refuse or clarify when evidence is insufficient, validate structured outputs, isolate and allowlist tools, treat retrieved text as untrusted, filter unsafe content, red-team adversarial prompts and monitor real failures. High-risk actions require human confirmation.", "It combines factuality and security controls across the full system.", [["trusted", "citation"], ["insufficient", "abstain", "clarif"], ["validate"], ["allowlist", "isolate"], ["red team", "monitor"], ["human"]]),
      c("langgraph", "LangGraph agent", "LangGraph models an agent as a stateful graph: nodes perform work, edges route based on state, checkpoints persist progress and cycles support iterative behavior. It is useful for explicit orchestration, recovery, human-in-the-loop steps and observable multi-agent or tool workflows.", "It explains the graph abstraction and the concrete engineering benefits.", [["state", "graph"], ["node", "edge"], ["checkpoint"], ["cycle", "iteration"], ["human", "recovery"]]),
      c("determinism", "Is LangGraph deterministic?", "The graph routing can be deterministic when conditions and tools are deterministic, but an LLM node is generally stochastic unless tightly constrained. LangGraph provides deterministic orchestration around potentially nondeterministic components; reproducibility still requires fixed inputs, versions, seeds where supported and mocked tools.", "It avoids the false yes/no answer by separating orchestration from model behavior.", [["routing", "graph"], ["deterministic"], ["llm", "stochastic", "nondeterministic"], ["seed", "version", "mock"]]),
      c("autonomous-agent", "Autonomous agent", "An autonomous agent can plan and execute multiple steps toward a goal with limited human intervention, adapting to observations. Autonomy should be bounded by scope, budgets, permissions, stopping conditions, audit logs and escalation because more freedom also increases failure impact.", "It defines autonomy and immediately qualifies it with necessary controls.", [["plan"], ["multiple step"], ["adapt", "observation"], ["limited human"], ["budget", "permission", "stop", "audit"]]),
      c("agent-eval", "Agent testing and evaluation", "Create task suites and golden traces covering normal, edge, adversarial and tool-failure cases. Measure task success, step efficiency, tool selection and arguments, groundedness, safety, recovery, latency and cost; run deterministic unit tests plus simulation, judge and human review.", "It evaluates the trajectory and tools, not only the final sentence.", [["golden", "test"], ["edge", "adversarial"], ["task success"], ["tool", "argument"], ["safety", "recovery"], ["latency", "cost"]]),
      c("golden-dataset", "Golden datasets and ground truth", "A golden dataset is a reviewed set of representative inputs with expected outputs, evidence, tool actions or scoring labels. It makes regressions measurable, supports repeatable comparison across versions and exposes gaps through edge and failure cases; it must be versioned and refreshed as reality changes.", "It defines the artifact, its evaluation role and the need for maintenance.", [["reviewed", "representative"], ["expected", "ground truth"], ["regression", "repeat"], ["version"], ["edge", "failure"]]),
    ],
  },
  {
    id: "api-security", title: "APIs, Security & Project Structure", short: "Validation, formatting, identity, secrets and failures", color: "#fb9f5a", icon: "ShieldCheck", outcome: "Explain a production API and show where it can fail safely.",
    concepts: [
      c("libraries", "Project libraries", "Answer from the actual dependency file, grouping libraries by responsibility: data (Pandas/NumPy), ML (scikit-learn), API (FastAPI/Pydantic), RAG (embedding/vector/LLM clients), testing and observability. For each major library, state the exact class or function used and why.", "It is specific and verifiable, avoiding an unconvincing list of names.", [["actual", "requirement", "dependency"], ["responsibility"], ["exact", "class", "function"], ["why"]]),
      c("sklearn", "Scikit-learn usage", "Scikit-learn provides preprocessing, train/test splitting, pipelines, classical estimators, model selection and metrics. Name actual imports—for example `ColumnTransformer`, `Pipeline`, `SimpleImputer`, `OneHotEncoder`, `train_test_split`, the chosen estimator and evaluation metrics—rather than saying only `import sklearn`.", "It answers both what the library does and what a credible project imports.", [["preprocess"], ["pipeline"], ["split"], ["estimator", "model"], ["metric"], ["exact import"]]),
      c("numpy-use", "Why NumPy", "NumPy supplies compact n-dimensional arrays, vectorized numerical operations, broadcasting, linear algebra and interoperability with Pandas and ML libraries. It replaces slow Python loops for numerical work and makes shapes and dtypes explicit.", "It gives project-relevant benefits rather than the vague statement that NumPy is fast.", [["array"], ["vector"], ["broadcast"], ["linear algebra"], ["loop", "performance"], ["dtype", "shape"]]),
      c("request-response", "Request validation vs response formatting", "Request validation checks incoming data before business logic—types, required fields, ranges and allowed values—and rejects invalid requests clearly. Response formatting serializes successful or error results into a stable documented schema, status code and content type without exposing internal objects or secrets.", "It separates inbound correctness from outbound contract and includes errors and security.", [["incoming", "request"], ["type", "required", "range"], ["response", "serialize"], ["schema", "status code"], ["secret", "internal"]]),
      c("auth-authz", "Authentication vs authorization", "Authentication proves who the caller is; authorization decides what that identity may do. Passwordless links, OAuth/OIDC, sessions, API keys or JWT-based tokens can establish identity, while roles, scopes, claims, ownership checks and policy engines enforce permissions server-side.", "It gives the identity-versus-permission distinction and maps technologies to their roles.", [["who", "identity"], ["what", "permission"], ["oauth", "oidc", "session", "jwt"], ["role", "scope", "ownership"], ["server"]]),
      c("jwt", "JWT", "A JWT is a signed token containing claims in header.payload.signature form. The server verifies signature, issuer, audience and expiry before trusting claims; JWTs are not encrypted by default, should be short-lived and need a refresh or revocation strategy.", "It covers structure, verification and the most important security misconceptions.", [["signed"], ["claim"], ["header", "payload", "signature"], ["issuer", "audience", "expiry"], ["not encrypted"], ["refresh", "revoke"]]),
      c("oauth", "OAuth", "OAuth 2.0 is an authorization framework that lets an application obtain scoped access to a resource on a user's behalf without receiving the user's password. OpenID Connect adds authentication. Use Authorization Code with PKCE for user-facing apps and validate state, issuer, audience and redirect URIs.", "It correctly distinguishes OAuth authorization from OIDC authentication and names the modern secure flow.", [["authorization"], ["scope"], ["without password"], ["openid", "oidc"], ["code", "pkce"], ["state", "redirect"]]),
      c("project-structure", "Project folder structure", "Use folders with single responsibilities, for example `app/api` or routes, `services`, `models`, `schemas`, `repositories`, `core/config`, `tests`, `scripts` and migrations. Keep configuration at the boundary and dependency direction clear so domain logic is testable without the web server.", "It provides a concrete structure and explains the architectural reason behind it.", [["route", "api"], ["service"], ["model", "schema"], ["test"], ["config"], ["depend", "domain"]]),
      c("secrets", "Configs and secrets", "Use typed configuration loaded from environment variables or a managed secret store, with separate values per environment. Commit only safe defaults and an `.env.example`; never commit API keys, log them or ship them to the browser. Rotate, scope and audit secrets.", "It covers storage, environment separation, leakage prevention and lifecycle management.", [["environment"], ["secret store"], ["env.example"], ["never commit", "browser"], ["rotate", "scope", "audit"]]),
      c("rag-failures", "RAG failure points", "Failures can occur in ingestion and OCR, parsing, chunking, metadata, embedding versions, index updates, query understanding, retrieval, filtering, reranking, context assembly, prompt injection, generation, citations, permissions and dependencies. Add validation, observability, retries only for transient idempotent work, fallbacks and test cases at each boundary.", "It traces failure across the whole pipeline and pairs risks with controls.", [["ingest", "ocr", "parse"], ["chunk", "metadata"], ["embedding", "index"], ["retriev", "rerank"], ["prompt", "generation"], ["citation", "permission"], ["observ", "fallback"]]),
    ],
  },
  {
    id: "client-defense", title: "Mock Client Defense", short: "Assumptions, limitations, edge cases and project decisions", color: "#e58fca", icon: "Presentation", outcome: "Defend a solution honestly with evidence, boundaries and improvement plans.",
    concepts: [
      c("assumptions", "Assumptions and limitations", "State assumptions explicitly—for example representative data, stable definitions, available inputs and acceptable latency—then separate limitations in data, model, product, infrastructure, security and evaluation. Quantify impact where possible and give a mitigation or next experiment for each major limitation.", "A client trusts a bounded, evidence-based answer more than a claim that the solution has no limitations.", [["assumption"], ["data"], ["model", "product", "infrastructure"], ["impact"], ["mitigation", "experiment"]]),
      c("non-data-limit", "Limitations beyond data", "Beyond data, examine model capacity and explainability, latency and cost, dependency reliability, security and privacy, UX, integration, scalability, monitoring, operational ownership and regulatory constraints. Prioritize them by likelihood and impact.", "It broadens risk analysis beyond the common 'we need more data' answer.", [["model"], ["latency", "cost"], ["security", "privacy"], ["ux", "integration"], ["scale", "monitor"], ["likelihood", "impact"]]),
      c("edge-cases", "Edge-case testing", "Test missing, empty, malformed, duplicate and extreme inputs; rare classes; unsupported language or domain; ambiguous queries; long documents; service timeouts; authorization failures; prompt injection and concurrent requests. Report expected behavior and evidence, not only the list.", "It covers data, product, infrastructure and AI-specific failure modes.", [["missing", "malformed"], ["extreme", "rare"], ["ambiguous", "unsupported"], ["timeout", "failure"], ["authorization", "injection"], ["expected", "evidence"]]),
    ],
  },
  {
    id: "conversation", title: "Conversational Product Design", short: "Slots, clarification, intent, budgets and graceful fallbacks", color: "#7ad66d", icon: "MessagesSquare", outcome: "Design a robust multi-turn travel assistant instead of brittle keyword rules.",
    concepts: [
      c("travel-clarify", "Clarifying an underspecified request", "If a user asks for a place recommendation without enough detail, acknowledge the request and ask one low-effort clarifying question about trip type, origin or constraints. Offer quick choices such as beach, nature, heritage or nightlife so the conversation progresses without guessing.", "It avoids fabricated recommendations while minimizing user effort.", [["clarif"], ["trip type", "preference"], ["origin", "constraint"], ["choice", "option"], ["not guess"]]),
      c("travel-slots", "Collecting travel slots", "Maintain structured conversation state for destination, origin, dates or days, traveler count, budget, interests and constraints. Ask only for missing fields, group closely related low-effort fields when natural, confirm interpreted values and allow corrections.", "Slot filling is more reliable than keyword order and supports multi-turn correction.", [["state", "slot"], ["destination"], ["days", "traveler", "budget"], ["missing"], ["confirm", "correct"]]),
      c("sequential-questions", "Together or sequential?", "Ask together only when the values are easy and naturally related, such as 'How many travelers and days?'. Ask sequentially when cognitive load is high, a previous answer changes the next question or validation is needed. Adaptive dialogue is better than one fixed rule.", "It gives a conditional product decision rather than an absolute answer.", [["together"], ["related", "easy"], ["sequential"], ["cognitive", "previous"], ["adaptive"]]),
      c("city-recognition", "City recognition", "Use entity extraction plus normalization, aliases and fuzzy matching, then validate against supported destinations. If confidence is low, present likely matches and ask the user to confirm; keep the confirmed city in conversation state instead of repeatedly matching keywords.", "It combines robust recognition with a safe clarification path.", [["entity"], ["normal", "alias", "fuzzy"], ["confidence"], ["confirm"], ["state"]]),
      c("out-of-scope", "Non-travel questions", "Briefly state the assistant's travel scope, answer only safe general questions if the product allows it, and guide the user back with an example travel request. Do not invent a travel intent or become an unrestricted assistant accidentally.", "It preserves product boundaries while keeping the interaction helpful.", [["scope"], ["safe"], ["redirect", "guide"], ["not invent"]]),
      c("budget", "Budget estimation", "Calculate a transparent range from destination-specific accommodation, food, local transport, activities, season, days and traveler count. If budget is missing, ask for a band or show labeled economy/standard/comfort scenarios rather than silently inventing one default.", "It accounts for city differences and avoids presenting a fabricated precise cost.", [["destination", "city"], ["accommodation", "food", "transport"], ["season", "days", "traveler"], ["range"], ["ask", "scenario"]]),
      c("unavailable-city", "Unavailable destinations", "Say the city is not currently covered, keep the user's request, offer nearby or similar supported options and ask permission before substituting. Log the unsupported city for product coverage analysis.", "It is honest, recoverable and creates useful product feedback without silently changing intent.", [["not available", "unsupported"], ["similar", "nearby"], ["permission", "confirm"], ["log", "coverage"]]),
      c("live-api", "Using live APIs", "Live maps, weather, transport, hotel and event APIs make availability and cost estimates current. Add provider adapters, authentication, quotas, caching, normalization, timeouts, retries with backoff, circuit breakers, fallbacks, monitoring and clear freshness timestamps.", "It includes both the user benefit and the engineering changes required for reliable integration.", [["weather", "hotel", "map", "transport"], ["current", "live"], ["adapter", "normalize"], ["quota", "cache"], ["timeout", "retry", "fallback"], ["freshness"]]),
    ],
  },
  {
    id: "cloud", title: "Cloud, Containers & AI Engineering", short: "Docker, Kubernetes, infrastructure and team roles", color: "#72c7ff", icon: "CloudCog", outcome: "Explain deployment consistency, orchestration and practical AI engineer responsibilities.",
    concepts: [
      c("docker", "Docker and containerization", "Docker packages application code, runtime, system libraries and configuration expectations into a versioned image. It improves consistency and isolation across laptops, CI and servers, but deployment does not always require Docker—choose it when portability, reproducibility and orchestration benefits justify the overhead.", "It explains both value and the important 'not mandatory' qualification.", [["code", "runtime", "library"], ["image"], ["consistent", "reproduc"], ["isolation", "portable"], ["not required", "not mandatory"]]),
      c("kubernetes", "Kubernetes", "Kubernetes orchestrates containers across a cluster. Desired-state controllers schedule and restart workloads, Services distribute traffic, autoscalers change capacity, rolling updates reduce downtime and health probes replace failed instances; the trade-off is operational complexity.", "It directly covers scaling, load balancing, recovery and deployment.", [["orchestrat", "cluster"], ["schedule", "restart"], ["service", "load balanc"], ["autoscal"], ["rolling", "health"]]),
      c("specialization", "Choosing a specialization", "Choose from project demand and interest, then build T-shaped depth: strong Python, SQL, APIs, testing, Git, cloud and ML fundamentals plus one deeper area such as RAG, data platforms or a cloud stack. Prove it with an end-to-end project and remain able to collaborate across boundaries.", "It replaces trend chasing with a durable selection framework and demonstrable depth.", [["project", "demand"], ["interest"], ["python", "sql", "api", "git"], ["depth", "special"], ["end-to-end"]]),
      c("ai-skills", "AI project skills", "Core skills include Python, SQL, data handling, ML evaluation, APIs, Git, testing, Linux, Docker, cloud IAM/storage/compute, observability and secure secret handling. GenAI work adds prompts, embeddings, vector retrieval, evaluation, guardrails and cost/latency optimization.", "It balances modeling with software, cloud and responsible-operation skills.", [["python", "sql"], ["ml", "evaluation"], ["api", "git", "test"], ["docker", "cloud"], ["embedding", "rag", "prompt"], ["guardrail", "cost"]]),
      c("junior-role", "Junior AI engineer responsibilities", "A junior engineer typically prepares and validates data, implements modules, writes tests, runs experiments, integrates APIs, documents decisions, monitors jobs and fixes scoped issues under review. They should escalate uncertainty, protect secrets and communicate progress instead of making unsupported production changes.", "It gives realistic contribution boundaries and professional behaviors.", [["data"], ["implement", "module"], ["test", "experiment"], ["api", "document"], ["monitor", "issue"], ["review", "escalate"]]),
    ],
  },
  {
    id: "documents", title: "Documents, OCR & Embeddings", short: "Mixed PDFs, image text and document comparison", color: "#ffd166", icon: "ScanText", outcome: "Build a document ingestion pipeline that handles both digital text and images.",
    concepts: [
      c("ocr", "Extracting text from images", "Preprocess the image for orientation, contrast and noise, run OCR such as Tesseract or a managed vision service, retain bounding boxes and confidence, then post-process language and validate low-confidence text. For handwriting or complex layouts, use a document-understanding model and human review.", "It describes a quality-controlled OCR pipeline rather than naming one library.", [["preprocess", "contrast", "rotate"], ["ocr", "tesseract"], ["bounding", "confidence"], ["post-process"], ["human", "review"]]),
      c("mixed-pdf", "PDF pages with image and text", "Use a hybrid parser: extract the digital text layer and layout first, detect embedded images or sparse-text pages, run OCR on those regions, then merge results by page coordinates while removing duplicates. Preserve page and bounding-box metadata for citations and visually validate samples.", "It avoids OCRing clean text unnecessarily and prevents duplicate content.", [["text layer", "digital"], ["image", "sparse"], ["ocr"], ["merge", "coordinate"], ["duplicate"], ["page", "citation", "visual"]]),
      c("vector-storage", "Where vectors are stored", "Store embeddings in a vector index or vector-capable database such as FAISS, pgvector, Qdrant, Pinecone, Weaviate or Chroma. Store each vector with a stable chunk ID and metadata pointing to the authoritative document; do not treat the vector as the original content.", "It names valid storage choices and explains the link between vector, chunk and source.", [["vector", "index", "database"], ["faiss", "pgvector", "qdrant", "pinecone", "chroma"], ["chunk id"], ["metadata"], ["source", "document"]]),
    ],
  },
];

const q = (id: string, source: ArenaQuestion["source"], number: number, topicId: string, conceptKey: string, prompt: string, difficulty: ArenaQuestion["difficulty"] = "Foundation"): ArenaQuestion => ({ id, source, number, topicId, conceptKey, prompt, difficulty });

export const QUESTIONS: ArenaQuestion[] = [
  q("M1","Core",1,"ml-foundations","decision-tree","What is a Decision Tree?"),
  q("M2","Core",2,"ml-foundations","regression-tree","What is a Regression Tree?"),
  q("M3","Core",3,"ml-foundations","cart-binary","Why does CART use binary splits (2 branches)?","Applied"),
  q("M4","Core",4,"ml-foundations","cart","What is CART?"),
  q("M5","Core",5,"ml-foundations","unsupervised","What are Unsupervised ML models?"),
  q("M6","Core",6,"rag","vector-vs-sql","Vector Database vs SQL Database.","Applied"),
  q("M7","Core",7,"rag","vector-index","Does a Vector Database have indexing?"),
  q("M8","Core",8,"rag","retrieval-eval","How is retrieval evaluated in RAG?","Applied"),
  q("M9","Core",9,"rag","precision-recall-k","Explain Recall@K and Precision@K.","Applied"),
  q("M10","Core",10,"data-python","ml-lifecycle","ML lifecycle and imputation techniques.","Applied"),
  q("M11","Core",11,"data-python","advanced-imputation","Advanced imputation techniques."),
  q("M12","Core",12,"data-python","plot-libs","Python libraries for plotting and report generation."),
  q("M13","Core",13,"llm","sampling","Top-K vs Top-P.","Applied"),
  q("M14","Core",14,"data-python","eda","What is EDA?"),
  q("M15","Core",15,"data-python","numpy-broadcast","What is NumPy Broadcasting?","Applied"),
  q("M16","Core",16,"mlops","ml-lifecycle","ML SDLC."),
  q("M17","Core",17,"data-python","loc-iloc","Difference between iloc and loc."),
  q("M18","Core",18,"mlops","mlops-lifecycle","Difference between ML Lifecycle and MLOps Lifecycle.","Applied"),
  q("M19","Core",19,"mlops","mlops-benefits","Benefits of MLOps."),
  q("M20","Core",20,"mlops","post-deploy","Post-deployment activities in ML.","Applied"),
  q("M21","Core",21,"mlops","monitoring","Different ways to monitor ML models.","Applied"),
  q("M22","Core",22,"llm","ml-vs-llm","Difference between ML models and LLMs.","Applied"),
  q("M23","Core",23,"evaluation","ml-llm-metrics","Evaluation metrics for ML and LLMs.","Challenge"),
  q("M24","Core",24,"rag","retrieval-eval","Evaluation of retrieval in RAG.","Applied"),
  q("M25","Core",25,"rag","retrieval-eval","How to evaluate retrieval quality in RAG?","Applied"),
  q("M26","Core",26,"rag","response-eval","Response quality evaluation in RAG.","Applied"),
  q("M27","Core",27,"llm","prompt-engineering","What is Prompt Engineering?"),
  q("M28","Core",28,"agents","react","What is a ReAct Agent?","Applied"),
  q("M29","Core",29,"agents","guardrails","What are Guardrails in LLMs?","Applied"),
  q("M30","Core",30,"agents","malicious-response","How to avoid wrong or malicious responses in LLMs?","Challenge"),
  q("M31","Core",31,"rag","rag","Standard prompt template for RAG.","Applied"),
  q("M32","Core",32,"mlops","project-pipeline","ML project pipeline."),
  q("M33","Core",33,"mlops","project-pipeline","What is done in each stage of an ML project?","Applied"),
  q("M34","Core",34,"data-python","stratify","Alternatives to stratify=y.","Applied"),
  q("M35","Core",35,"evaluation","f1","What is the F1-score?"),
  q("M36","Core",36,"evaluation","f1","Why use F1-score instead of Accuracy?","Applied"),
  q("M37","Core",37,"evaluation","roc","What is the ROC Curve?","Applied"),
  q("M38","Core",38,"evaluation","precision-recall","Explain Precision and Recall.","Applied"),
  q("M39","Core",39,"llm","generative-ai","What is Generative AI?"),
  q("M40","Core",40,"rag","rag","Explain the RAG workflow.","Applied"),
  q("M41","Core",41,"rag","chunking","Chunking techniques.","Applied"),
  q("M42","Core",42,"rag","faiss","Why is FAISS faster?","Applied"),
  q("M43","Core",43,"rag","retrieval-eval","Evaluation in RAG.","Challenge"),
  q("M44","Core",44,"rag","retrieval-eval","How are RAG evaluation metrics calculated?","Challenge"),
  q("M45","Core",45,"mlops","ml-lifecycle","Basic ML example and ML lifecycle.","Applied"),
  q("M46","Core",46,"llm","ml-vs-llm","ML vs LLM with examples.","Applied"),
  q("M47","Core",47,"llm","ml-vs-llm","Key differences between ML and LLM.","Applied"),
  q("M48","Core",48,"llm","llm-parameters","Key LLM parameters.","Applied"),
  q("M49","Core",49,"llm","choose-ml-llm","When should we use ML vs LLM?","Challenge"),
  q("M50","Core",50,"llm","structured-output","Structured output in LLMs.","Applied"),
  q("M51","Core",51,"llm","structured-output","Output Parsers and Pydantic classes.","Applied"),
  q("M52","Core",52,"rag","rag","Explain RAG and its key points.","Applied"),
  q("M53","Core",53,"rag","citations","Citations in RAG.","Applied"),
  q("M54","Core",54,"rag","rag","Explain all RAG modules.","Challenge"),
  q("M55","Core",55,"rag","response-eval","Retrieval metrics and Generation metrics in RAG.","Challenge"),
  q("M56","Core",56,"rag","mrr","What is MRR?","Applied"),
  q("M57","Core",57,"rag","hallucination","What is Hallucination Rate?","Applied"),
  q("M58","Core",58,"mlops","sentiment-project","Brief activities in a Sentiment Analysis ML project.","Applied"),
  q("M59","Core",59,"data-python","data-distribution","Data distribution analysis in ML.","Applied"),
  q("M60","Core",60,"data-python","stratify","What is Stratify in ML?"),
  q("M61","Core",61,"mlops","college-project","College ML project example.","Applied"),
  q("M62","Core",62,"mlops","churn-project","Banking Customer Churn Analysis project flow.","Challenge"),
  q("M63","Core",63,"data-python","preprocess-libs","Preprocessing libraries in Python."),
  q("M64","Core",64,"data-python","plot-libs","EDA libraries."),
  q("M65","Core",65,"data-python","numpy-broadcast","How does NumPy broadcasting improve efficiency?","Applied"),
  q("M66","Core",66,"data-python","feature-engineering","Feature Engineering using Pandas.","Applied"),
  q("M67","Core",67,"data-python","refactoring","What is Refactoring?"),
  q("M68","Core",68,"data-python","modular-code","What is Modular Code?"),
  q("M69","Core",69,"agents","ai-agent","What are AI Agents?"),
  q("M70","Core",70,"agents","rag-agent","What is a RAG Agent?","Applied"),
  q("M71","Core",71,"rag","rag","Explain RAG.","Applied"),
  q("M72","Core",72,"rag","chunking","What is Chunking?"),
  q("M73","Core",73,"rag","recursive-chunking","What is Recursive Chunking?","Applied"),
  q("M74","Core",74,"rag","embedding","What is Vectorization?"),
  q("M75","Core",75,"rag","faiss","What is FAISS?"),
  q("M76","Core",76,"rag","chroma-faiss","ChromaDB vs FAISS.","Applied"),
  q("M77","Core",77,"rag","vector-index","Indexing in FAISS.","Applied"),
  q("M78","Core",78,"rag","hallucination","How to reduce hallucinations in RAG?","Challenge"),
  q("M79","Core",79,"rag","mmr","What is MMR (Maximal Marginal Relevance)?","Applied"),
  q("M80","Core",80,"rag","response-eval","Response evaluation in RAG.","Applied"),
  q("M81","Core",81,"rag","precision-recall-k","Precision@K and Recall@K.","Applied"),
  q("M82","Core",82,"rag","rag","Simple GenAI RAG project explanation.","Applied"),
  q("M83","Core",83,"rag","rag","Detailed RAG flow.","Challenge"),
  q("M84","Core",84,"rag","chunk-size","How to decide the right chunk size?","Challenge"),
  q("M85","Core",85,"rag","vector-stores","Popular Vector Databases in the market."),
  q("M86","Core",86,"rag","chroma-faiss","Why is ChromaDB slower than FAISS?","Applied"),
  q("M87","Core",87,"rag","response-eval","Response quality evaluation.","Applied"),
  q("M88","Core",88,"agents","react","ReAct Design Pattern Agent.","Applied"),
  q("M89","Core",89,"agents","langgraph","Lang Graph Agent.","Applied"),
  q("M90","Core",90,"agents","determinism","Is Lang Graph deterministic?","Challenge"),
  q("M91","Core",91,"agents","determinism","Is Lang Graph a deterministic agent?","Challenge"),
  q("M92","Core",92,"agents","autonomous-agent","What is an Autonomous Agent?","Applied"),
  q("M93","Core",93,"llm","cot","What is Chain of Thought (CoT)?","Applied"),

  q("C1","Mock Client",1,"client-defense","assumptions","What are the main assumptions and limitations of your solution currently?","Challenge"),
  q("C2","Mock Client",2,"client-defense","non-data-limit","What else apart from the data limitations?","Challenge"),
  q("C3","Mock Client",3,"client-defense","edge-cases","What edge cases have you tested here?","Challenge"),
  q("C4","Mock Client",4,"evaluation","accuracy-fit","How would you understand whether a given accuracy is right for your use case or not?","Challenge"),
  q("C5","Mock Client",5,"evaluation","accuracy-fit","If you achieve 75%, is that good enough or do you need 80%, 85%, 90%?","Challenge"),
  q("C6","Mock Client",6,"evaluation","precision-recall","Do you understand the difference between precision and recall?","Applied"),
  q("C7","Mock Client",7,"evaluation","precision-recall","What is the trade-off between precision and recall?","Applied"),
  q("C8","Mock Client",8,"evaluation","precision-recall","Which is more important in which use case, precision or recall?","Challenge"),
  q("C9","Mock Client",9,"api-security","libraries","What different libraries have you used in this project?","Challenge"),
  q("C10","Mock Client",10,"api-security","sklearn","What is Scikit-Learn used for?"),
  q("C11","Mock Client",11,"api-security","sklearn","Exactly what are you importing from Scikit-Learn?","Challenge"),
  q("C12","Mock Client",12,"api-security","libraries","Any other major libraries?","Applied"),
  q("C13","Mock Client",13,"api-security","numpy-use","Why have you used NumPy?","Applied"),
  q("C14","Mock Client",14,"api-security","request-response","Can you explain the difference between request validation and response formatting in an API?","Applied"),
  q("C15","Mock Client",15,"api-security","request-response","What is response formatting?"),
  q("C16","Mock Client",16,"api-security","auth-authz","What is the difference between authentication and authorization?","Applied"),
  q("C17","Mock Client",17,"api-security","auth-authz","What are some key technologies used for authentication and authorization?","Applied"),
  q("C18","Mock Client",18,"api-security","auth-authz","What have you used for authentication when building an API?","Challenge"),
  q("C19","Mock Client",19,"api-security","jwt","Are you aware of JWT (JSON Web Token)?","Applied"),
  q("C20","Mock Client",20,"api-security","oauth","Are you aware of OAuth?","Applied"),
  q("C21","Mock Client",21,"rag","rag","Can you explain the end-to-end flow of documents in your RAG pipeline?","Challenge"),
  q("C22","Mock Client",22,"api-security","project-structure","Can you show your project folder structure quickly?","Challenge"),
  q("C23","Mock Client",23,"api-security","secrets","How are configs, API keys, and secrets handled across your projects?","Challenge"),
  q("C24","Mock Client",24,"api-security","rag-failures","What are the different points in a RAG pipeline where the system can malfunction or fail?","Challenge"),

  q("G26","Gladiator",26,"conversation","travel-clarify","How should the application handle a user who directly asks for a place recommendation without providing destination details?","Challenge"),
  q("G27","Gladiator",27,"conversation","travel-clarify","What type of destination or trip is the user looking for before recommendations are generated?","Applied"),
  q("G28","Gladiator",28,"conversation","travel-slots","Which destination would the user like to explore from the recommended options?","Applied"),
  q("G29","Gladiator",29,"conversation","travel-slots","How should traveler count, number of days, and budget information be collected in the conversation?","Challenge"),
  q("G30","Gladiator",30,"conversation","sequential-questions","Should days and traveler count be collected together or sequentially?","Challenge"),
  q("G31","Gladiator",31,"conversation","travel-slots","How should the chatbot behave when the traveler keyword is missing?","Challenge"),
  q("G32","Gladiator",32,"conversation","city-recognition","How should city recognition work when a city name is not matched correctly?","Challenge"),
  q("G33","Gladiator",33,"conversation","city-recognition","Should city recognition be handled through multi-turn conversations instead of keyword matching?","Challenge"),
  q("G34","Gladiator",34,"conversation","out-of-scope","How should the chatbot respond to non-travel-related questions?","Applied"),
  q("G35","Gladiator",35,"conversation","budget","How should city-specific cost differences affect budget estimation?","Challenge"),
  q("G36","Gladiator",36,"conversation","budget","What should the default budget be when the user does not specify one?","Challenge"),
  q("G37","Gladiator",37,"conversation","unavailable-city","How should the application respond when a city is not available in the database?","Applied"),
  q("G38","Gladiator",38,"conversation","live-api","How can live APIs improve the application?","Applied"),
  q("G39","Gladiator",39,"conversation","live-api","What major API-related changes would be required in the solution?","Challenge"),
  q("G40","Gladiator",40,"cloud","docker","Does deployment have to be done using Docker?","Applied"),
  q("G41","Gladiator",41,"cloud","docker","Why should Docker be used for deployment?","Applied"),
  q("G42","Gladiator",42,"cloud","docker","What problems does containerization solve?","Applied"),
  q("G43","Gladiator",43,"cloud","docker","How does containerization ensure consistency across different environments?","Applied"),
  q("G44","Gladiator",44,"cloud","kubernetes","What is Kubernetes?"),
  q("G45","Gladiator",45,"cloud","kubernetes","Why is Kubernetes used?","Applied"),
  q("G46","Gladiator",46,"cloud","kubernetes","How does Kubernetes help with scaling, load balancing, and failure recovery?","Challenge"),
  q("G47","Gladiator",47,"cloud","specialization","Which technical specialization should you choose (RAG, Databricks, AWS, Azure, etc.)?","Challenge"),
  q("G48","Gladiator",48,"cloud","ai-skills","What technical skills are required for project work?","Applied"),
  q("G49","Gladiator",49,"cloud","ai-skills","What cloud and infrastructure knowledge is expected from an AI engineer?","Applied"),
  q("G50","Gladiator",50,"cloud","junior-role","What responsibilities will junior AI engineers handle in a project?","Applied"),
  q("G51","Gladiator",51,"agents","agent-eval","How should agent testing and evaluation be performed?","Challenge"),
  q("G52","Gladiator",52,"agents","golden-dataset","How do golden datasets, ground truth, and test cases help validate AI agents?","Challenge"),
  q("G53","Gladiator",53,"documents","ocr","How do you extract text from images?","Applied"),
  q("G54","Gladiator",54,"documents","mixed-pdf","How do you handle situations like when a PDF slide consists of both image and text?","Challenge"),
  q("G55","Gladiator",55,"rag","embedding-choice","What embedding model are you using?","Challenge"),
  q("G56","Gladiator",56,"rag","embedding-choice","What is the size of the vector?","Applied"),
  q("G57","Gladiator",57,"rag","embedding","What is embedding?"),
  q("G58","Gladiator",58,"documents","vector-storage","Where are vectors stored?","Applied"),
  q("G59","Gladiator",59,"rag","retrieval-eval","How do you retrieve the most relevant chunks?","Challenge"),
  q("G60","Gladiator",60,"rag","compare-docs","How do you compare documents?","Challenge"),
];

export const CONCEPTS = new Map(TOPICS.flatMap((topic) => topic.concepts.map((concept) => [concept.key, concept] as const)));

export function getConcept(key: string) {
  return CONCEPTS.get(key);
}

export function getQuestion(id: string) {
  return QUESTIONS.find((question) => question.id === id);
}
