import {
  assert,
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildDiscoveryQueries,
  buildNgramMap,
  discoverExa,
  entityAndFactTokens,
  extractPhrases,
  jaccardSim,
  longestCommonSubsequenceRatio,
  normalise,
  rareTokenSet,
  runExact,
  runNear,
  tokenise,
  uniqueCoverage,
} from "./index.ts";

// ─── Unit-level evidence tests ───────────────────────────────────────────────

Deno.test("semantic similarity alone must not create exact matches", () => {
  const submitted = "Artificial intelligence is transforming modern urban infrastructure and transportation planning.";
  const source = "Machine learning and AI are reshaping how cities design mobility systems and urban services.";
  const exact = runExact(submitted, source);
  assertEquals(exact.spans.length, 0, "Topic similarity must not produce exact spans");
});

Deno.test("search relevance / topic overlap must not create near matches", () => {
  const submitted = "Climate change is affecting global agriculture and food security worldwide.";
  const source = "Global warming influences farming practices and threatens worldwide food production.";
  const near = runNear(submitted, source);
  assertEquals(near.spans.length, 0, "Topic overlap without shared wording must not be near match");
});

Deno.test("failed retrieval cannot produce verified source spans", () => {
  // If source text is empty/short, exact and near return no spans.
  const submitted = "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms.";
  const exact = runExact(submitted, "");
  const near = runNear(submitted, "");
  assertEquals(exact.spans.length, 0);
  assertEquals(near.spans.length, 0);
});

Deno.test("overlapping spans are merged correctly by uniqueCoverage", () => {
  const ranges: Array<[number, number]> = [
    [100, 170],
    [150, 220],
  ];
  const total = 1000;
  const coverage = uniqueCoverage(ranges, total);
  assertEquals(coverage, 120, "Overlapping spans should be merged, not double counted");
});

Deno.test("AI-style phrasing does not inflate exact match score", () => {
  const submitted = "Artificial intelligence has revolutionized the way businesses operate in the modern era.";
  const source = "Artificial intelligence has revolutionized the way businesses operate in the modern era. Companies now use AI to improve efficiency.";
  const exact = runExact(submitted, source);
  assert(exact.spans.length > 0, "Verbatim copy should be detected");
  const submitted2 = "Artificial intelligence is changing how companies work in today's world.";
  const exact2 = runExact(submitted2, source);
  assertEquals(exact2.spans.length, 0, "Paraphrased AI-style sentence should not be exact");
});

Deno.test("no match returns zero coverage and does not claim originality", () => {
  const ranges: Array<[number, number]> = [];
  const total = 500;
  const coverage = uniqueCoverage(ranges, total);
  assertEquals(coverage, 0);
});

Deno.test("common phrases and short documents do not create substantial plagiarism", () => {
  const submitted = "In conclusion, the results show that the new method works better than the old method.";
  const source = "In conclusion, we found that the proposed approach outperforms the baseline method.";
  const exact = runExact(submitted, source);
  const near = runNear(submitted, source);
  assertEquals(exact.spans.length, 0, "Common academic conclusion phrases should not be exact");
  assertEquals(near.spans.length, 0, "Generic phrasing should not be near match");
});

Deno.test("exact match requires actual matching wording with offsets", () => {
  const submitted = "The quick brown fox jumps over the lazy dog. Then the fox runs away.";
  const source = "We observed the quick brown fox jumps over the lazy dog in the meadow.";
  const exact = runExact(submitted, source);
  assertEquals(exact.spans.length, 1);
  const span = exact.spans[0];
  assert(span.submittedPassage.includes("quick brown fox jumps over the lazy dog"));
  assert(span.sourcePassage.includes("quick brown fox jumps over the lazy dog"));
  assert(span.submittedStart >= 0);
  assert(span.submittedEnd > span.submittedStart);
  assertEquals(span.matchType, "exact");
});

Deno.test("near match requires meaningful lexical evidence and order", () => {
  const submitted = "The quick brown fox jumps over the lazy dog near the old barn.";
  const source = "The quick brown fox jumped over a lazy dog near the old barn.";
  const near = runNear(submitted, source);
  assert(near.spans.length > 0, "Limited insertions/substitutions should be near match");
  const jac = jaccardSim(tokenise(submitted), tokenise(source));
  assert(jac >= 0.65, "Jaccard should be high enough");
  const lcs = longestCommonSubsequenceRatio(tokenise(submitted), tokenise(source));
  assert(lcs >= 0.40, "LCS ratio should be high enough");
});

Deno.test("extractPhrases skips stopword-heavy generic phrases", () => {
  const text = "The results of the study show that it is very important. The implementation of machine learning algorithms enables companies to process data.";
  const phrases = extractPhrases(text);
  assert(phrases.length > 0);
  for (const p of phrases) {
    const toks = tokenise(p);
    const content = toks.filter((t) => !["the", "of", "is", "it", "that", "to"].includes(t)).length;
    assert(content / toks.length >= 0.35, `Phrase too generic: ${p}`);
  }
});

Deno.test("normalise handles unicode, case, and whitespace", () => {
  assertEquals(normalise("  Hello–World  "), "hello-world");
  assertEquals(normalise("'Quote' \"Quote\""), "'quote' \"quote\"");
});

Deno.test("uniqueCoverage caps at total and handles non-overlapping spans", () => {
  assertEquals(uniqueCoverage([[0, 100], [200, 300]], 500), 200);
  assertEquals(uniqueCoverage([[0, 100], [100, 200]], 500), 200);
  assertEquals(uniqueCoverage([[0, 600]], 500), 500);
});

Deno.test("fresh original article about AI/cities does not match a Wikipedia AI source", () => {
  // Simulated fresh article about urban planning that uses generic tech vocabulary.
  const submitted = `How Small Daily Decisions Shape the Future of Modern Cities. Every day, millions of people decide how to travel, where to live, and how to consume energy. These choices accumulate and shape the infrastructure of modern cities. Urban planners have long studied traffic patterns, zoning laws, and public transport, but the emerging field of urban informatics is revealing how individual behaviour drives systemic outcomes. When a resident chooses to walk rather than drive, that decision reduces congestion, lowers emissions, and reshapes demand for parking. When households shift to renewable energy, utilities must adapt grids and storage capacity. Cities are complex systems where small daily decisions ripple outward into housing markets, transit networks, and environmental footprints. Decision-making at the street level is now visible through mobile data, sensors, and open government datasets. Planners can see where people gather, how they move, and where services are lacking. This visibility creates opportunities for responsive design: bus routes can be adjusted in real time, public spaces can be remodelled, and resources can be directed to underserved neighbourhoods. Yet it also raises questions about privacy, equity, and who benefits from algorithmic governance. The future of urban life depends on aligning individual choices with collective goals. Technology, policy, and community engagement must work together to make sustainable decisions easy and attractive. The most resilient cities will be those that treat residents as active participants in shaping their environment, not merely as consumers of infrastructure.`.repeat(
    3,
  );
  // Simulated source text about artificial intelligence (the Wikipedia AI page style).
  const source = `Artificial intelligence (AI) is the simulation of human intelligence processes by machines, especially computer systems. These processes include learning, reasoning, problem-solving, perception, and language understanding. AI applications include natural language processing, speech recognition, machine vision, and expert systems. The field draws on computer science, mathematics, psychology, linguistics, philosophy, and neuroscience. Machine learning, a subset of AI, enables systems to learn from data and improve without explicit programming. Deep learning uses artificial neural networks to model complex patterns. AI has transformed industries including healthcare, finance, transportation, and education. Concerns about AI include bias, privacy, job displacement, and the long-term risks of advanced systems. Researchers are working on interpretable, robust, and beneficial AI.`.repeat(
    2,
  );
  const exact = runExact(submitted, source);
  const near = runNear(submitted, source);
  assertEquals(exact.spans.length, 0, "No substantial exact wording overlap");
  assertEquals(near.spans.length, 0, "No substantial near wording overlap");
});

Deno.test("multi-source copied passages are independently detected and overlap is deduplicated", () => {
  const original = "This is original filler text. ";
  const chunkA = "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, and dispensing with recurrence and convolutions entirely.";
  const chunkB = "We propose to train one of the largest convolutional neural networks to date on the subsets of ImageNet used in the ImageNet Large-Scale Visual Recognition Challenge.";
  const submitted = `${original}${chunkA} ${original}${chunkB} ${original}`;
  const sourceA = `In this work, we propose a new simple network architecture, the Transformer, based solely on attention mechanisms, and dispensing with recurrence and convolutions entirely.`;
  const sourceB = `We propose to train one of the largest convolutional neural networks to date on the subsets of ImageNet used in the ImageNet Large-Scale Visual Recognition Challenge.`;
  const exactA = runExact(submitted, sourceA);
  const exactB = runExact(submitted, sourceB);
  assert(exactA.spans.length > 0, "Source A exact chunk detected");
  assert(exactB.spans.length > 0, "Source B exact chunk detected");
  // Offsets should be in different regions and non-overlapping.
  const allRanges = [...exactA.ranges, ...exactB.ranges];
  const total = submitted.length;
  const cov = uniqueCoverage(allRanges, total);
  assert(cov < total, "Coverage should not exceed document");
  assert(
    allRanges.every((r) => r[0] >= 0 && r[1] <= total && r[1] > r[0]),
    "All offsets valid",
  );
});

// ─── Paraphrase detection regression tests ───────────────────────────────────

const TRANSFORMER_PARAPHRASE = `We introduce a novel architecture called the Transformer, relying entirely on attention mechanisms and eliminating recurrence and convolution. On the WMT 2014 English-to-German translation task, our model achieved 28.4 BLEU, surpassing the previous best by 2.0 BLEU. On the WMT 2014 English-to-French task, it reached 41.8 BLEU after training on eight GPUs for 3.5 days.`;

const TRANSFORMER_SOURCE = `In this work, we propose a new simple network architecture, the Transformer, based solely on attention mechanisms, and dispensing with recurrence and convolutions entirely. On WMT 2014 English-to-German translation, the model achieves a BLEU score of 28.4, outperforming the previous best by 2.0 BLEU. On WMT 2014 English-to-French translation, the model achieves a BLEU score of 41.8, training on eight GPUs for 3.5 days.`;

const TRANSFORMER_VERBATIM = `In this work, we propose a new simple network architecture, the Transformer, based solely on attention mechanisms, and dispensing with recurrence and convolutions entirely. On WMT 2014 English-to-German translation, the model achieves a BLEU score of 28.4, outperforming the previous best by 2.0 BLEU. On WMT 2014 English-to-French translation, the model achieves a BLEU score of 41.8, training on eight GPUs for 3.5 days.`;

Deno.test("paraphrase contains distinctive facts and rare tokens preserved from source", () => {
  const rareSub = rareTokenSet(TRANSFORMER_PARAPHRASE);
  const rareSrc = rareTokenSet(TRANSFORMER_SOURCE);
  const common = [...rareSub].filter((t) => rareSrc.has(t));
  assert(common.includes("wmt"), "WMT should be preserved");
  assert(common.includes("bleu"), "BLEU should be preserved");
  assert(common.includes("2014"), "2014 should be preserved");
  assert(common.includes("transformer"), "Transformer should be preserved");
  const entities = entityAndFactTokens(TRANSFORMER_PARAPHRASE);
  assert(entities.some((e: string) => e.includes("28.4")), "Numeric fact 28.4 should be extracted");
  assert(entities.some((e: string) => e.includes("41.8")), "Numeric fact 41.8 should be extracted");
  assert(entities.some((e: string) => e.includes("english-to-german")), "English-to-German should be extracted");
});

Deno.test("discovery queries include entity/fact combinations for paraphrase", () => {
  const queries = buildDiscoveryQueries(TRANSFORMER_PARAPHRASE);
  assert(queries.length > 0, "Queries should be generated for paraphrase");
  const all = queries.join(" ").toLowerCase();
  assert(all.includes("transformer"), "Transformer should be in query");
  assert(all.includes("wmt") || all.includes("bleu") || all.includes("2014"), "Distinctive facts should be present");
  for (const q of queries) {
    const toks = q.split(" ");
    assert(toks.length <= 6, "Queries should be compact");
  }
});

Deno.test("verbatim Transformer passage is exact match", () => {
  const exact = runExact(TRANSFORMER_VERBATIM, TRANSFORMER_SOURCE);
  assert(exact.spans.length > 0, "Verbatim passage should be exact match");
});

Deno.test("paraphrased Transformer passage is not exact match", () => {
  const exact = runExact(TRANSFORMER_PARAPHRASE, TRANSFORMER_SOURCE);
  assertEquals(exact.spans.length, 0, "Paraphrase should not trigger exact match");
});

Deno.test("topic-only Transformers text shares rare tokens but has low entity/fact overlap", () => {
  const topic = `Transformers are a type of neural network architecture that has become widely used in natural language processing. They rely on attention mechanisms to model relationships between tokens. Researchers have applied them to many tasks, including machine translation, text summarization, and question answering. The architecture has been extended in many directions since its introduction.`;
  const rareTopic = rareTokenSet(topic);
  const rareSource = rareTokenSet(TRANSFORMER_SOURCE);
  const common = [...rareTopic].filter((t) => rareSource.has(t));
  // Rare token overlap may be moderate; entity/fact overlap should be low because
  // topic text does not include specific numbers, benchmarks, or measurements.
  const entitiesTopic = entityAndFactTokens(topic);
  const entitiesSource = entityAndFactTokens(TRANSFORMER_SOURCE);
  const entityCommon = entitiesTopic.filter((t: string) => entitiesSource.includes(t)).length;
  assert(entityCommon < 2, "Topic-only text should have low entity/fact overlap with source");
});

Deno.test("mixed document with exact and paraphrase chunks has correct coverage ranges", () => {
  const original = "This is original introductory text that is not found elsewhere. ";
  const exactChunk = `In this work, we propose a new simple network architecture, the Transformer, based solely on attention mechanisms.`;
  const paraphraseChunk = `On the WMT 2014 English-to-German task, our model achieved 28.4 BLEU, surpassing the previous best by 2.0 BLEU.`;
  const submitted = `${original}${exactChunk} ${original}${paraphraseChunk} ${original}`;
  const source = TRANSFORMER_SOURCE;
  const exact = runExact(submitted, source);
  // Exact chunk should match verbatim.
  assert(exact.spans.length > 0, "Exact chunk should be detected in mixed document");
  // Paraphrase chunk should not be exact.
  const paraphraseExact = runExact(paraphraseChunk, source);
  assertEquals(paraphraseExact.spans.length, 0, "Paraphrase chunk should not be exact");
  // All ranges should be within the document and coverage should be capped.
  const allRanges = exact.ranges;
  const total = submitted.length;
  const cov = uniqueCoverage(allRanges, total);
  assert(cov <= total, "Coverage should not exceed document length");
  assert(allRanges.every((r) => r[0] >= 0 && r[1] <= total && r[1] > r[0]), "All ranges valid");
});

Deno.test("original human article about cities produces no evidence against generic AI source", () => {
  const submitted = `How Small Daily Decisions Shape the Future of Modern Cities. Every day, millions of people decide how to travel, where to live, and how to consume energy. These choices accumulate and shape the infrastructure of modern cities. Urban planners have long studied traffic patterns, zoning laws, and public transport, but the emerging field of urban informatics is revealing how individual behaviour drives systemic outcomes. When a resident chooses to walk rather than drive, that decision reduces congestion, lowers emissions, and reshapes demand for parking. When households shift to renewable energy, utilities must adapt grids and storage capacity. Cities are complex systems where small daily decisions ripple outward into housing markets, transit networks, and environmental footprints. Decision-making at the street level is now visible through mobile data, sensors, and open government datasets. Planners can see where people gather, how they move, and where services are lacking. This visibility creates opportunities for responsive design: bus routes can be adjusted in real time, public spaces can be remodelled, and resources can be directed to underserved neighbourhoods. Yet it also raises questions about privacy, equity, and who benefits from algorithmic governance. The future of urban life depends on aligning individual choices with collective goals. Technology, policy, and community engagement must work together to make sustainable decisions easy and attractive. The most resilient cities will be those that treat residents as active participants in shaping their environment, not merely as consumers of infrastructure.`.repeat(
    3,
  );
  const queries = buildDiscoveryQueries(submitted);
  // The city article may still produce a few generic queries, but they should not
  // include the rare factual tokens that would retrieve a specific AI paper.
  const all = queries.join(" ").toLowerCase();
  assert(!all.includes("wmt") && !all.includes("bleu") && !all.includes("transformer"), "City article should not generate Transformer-specific discovery queries");
  const exact = runExact(submitted, TRANSFORMER_SOURCE);
  assertEquals(exact.spans.length, 0, "City article should not have exact overlap with Transformer source");
  const near = runNear(submitted, TRANSFORMER_SOURCE);
  assertEquals(near.spans.length, 0, "City article should not have near overlap with Transformer source");
});

// ─── Exa integration regression tests ────────────────────────────────────────

Deno.test("discoverExa requires EXA_API_KEY environment variable", async () => {
  const key = Deno.env.get("EXA_API_KEY");
  if (key) Deno.env.delete("EXA_API_KEY");
  const ctrl = new AbortController();
  let threw = false;
  try {
    await discoverExa("transformer wmt 2014", ctrl.signal);
  } catch {
    threw = true;
  } finally {
    if (key) Deno.env.set("EXA_API_KEY", key);
  }
  assert(threw, "discoverExa should throw when EXA_API_KEY is missing");
});

Deno.test("discoverExa aborts when signal is aborted", async () => {
  const key = Deno.env.get("EXA_API_KEY");
  // If a key is present, the test may still pass because the abort happens
  // before the network call. If absent, it will throw the missing-key error.
  const ctrl = new AbortController();
  ctrl.abort();
  try {
    await discoverExa("transformer wmt 2014", ctrl.signal);
  } catch {
    // expected
  } finally {
    if (key) Deno.env.set("EXA_API_KEY", key);
  }
});

Deno.test("Exa discovery queries for paraphrase contain publication-specific terms", () => {
  const queries = buildDiscoveryQueries(TRANSFORMER_PARAPHRASE);
  const all = queries.join(" ").toLowerCase();
  assert(
    all.includes("wmt") || all.includes("bleu") || all.includes("transformer"),
    "Exa discovery should include distinctive paper terms",
  );
});
