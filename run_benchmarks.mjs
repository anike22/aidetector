// run_benchmarks.mjs
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hzjnrmxwzkeaodvusszx.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6am5ybXh3emtlYW9kdnVzc3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMDcwOTAsImV4cCI6MjA5NTg4MzA5MH0.qs_0_MLK_y5C6ud3sefXozLpi2xWLHCe-AT5yl-mFZw";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function getGuestId() {
  const localId = `v_benchmark_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const { data, error } = await supabase.rpc('issue_or_validate_guest_session', {
    p_guest_id: localId,
    p_ip: '127.0.0.1',
    p_user_agent: 'BenchmarkNode/1.0',
    p_timezone: 'UTC',
  });
  if (error) {
    console.error("Guest session error:", error);
    return localId;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return row?.guest_id || localId;
}

async function runTest(name, text, guestId) {
  console.log(`\n========================================`);
  console.log(`RUNNING: ${name} (${text.split(/\s+/).length} words)`);
  console.log(`========================================`);
  const t0 = Date.now();
  try {
    const { data, error } = await supabase.functions.invoke('plagiarism-checker', {
      body: { text },
      headers: {
        'x-guest-id': guestId,
        'x-visitor-id': guestId,
      },
    });

    const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
    if (error) {
      console.log(`Function Error (${elapsed}s):`, error);
      return null;
    }

    console.log(`Status: ${data.status} (${elapsed}s)`);
    console.log(`Similarity Score: ${data.similarityScore}%`);
    console.log(`Exact Match Score: ${data.exactMatchScore}%`);
    console.log(`Near Match Score: ${data.nearMatchScore}%`);
    console.log(`Paraphrase Match Score: ${data.paraphraseMatchScore}%`);
    console.log(`Originality Score: ${data.originalityScore}%`);
    console.log(`Risk Level: ${data.riskLevel}`);
    console.log(`Sources Count: ${data.sources?.length || 0}`);
    if (data.sources && data.sources.length > 0) {
      data.sources.forEach((s, idx) => {
        console.log(`  Source ${idx + 1}: ${s.title} (${s.url}) - contribution: ${s.matchContribution}%`);
        if (s.spans && s.spans.length > 0) {
          console.log(`    First span: [${s.spans[0].matchType}] "${s.spans[0].submittedPassage.slice(0, 70)}..."`);
        }
      });
    }
    console.log(`Provider Telemetry:`);
    if (data.providerStatus) {
      for (const [p, stat] of Object.entries(data.providerStatus)) {
        console.log(`  - ${p}: status=${stat.status}, state=${stat.state}, sent=${stat.queriesSent}, returned=${stat.candidatesReturned}, verified=${stat.verifiedSources}${stat.failureReason ? ` [${stat.failureReason}]` : ''}`);
      }
    }
    if (data.diagnostics) {
      console.log(`Diagnostics:`);
      console.log(`  - Actual Coverage: ${data.diagnostics.actualCoveragePercentage}%`);
      console.log(`  - Exact Matches Found: ${data.diagnostics.exactMatchesFound}`);
      console.log(`  - Near Matches Found: ${data.diagnostics.nearMatchesFound}`);
      console.log(`  - Unique Matched Words: ${data.diagnostics.uniqueMatchedWords} (${data.diagnostics.uniqueMatchedWordsPercentage}%)`);
      console.log(`  - Full Text Retrieved: ${data.diagnostics.fullTextRetrievedCount}`);
      console.log(`  - Abstract Fallbacks: ${data.diagnostics.abstractSnippetFallbackCount}`);
      console.log(`  - Failed Retrievals: ${data.diagnostics.failedRetrievalsCount}`);
      if (data.diagnostics.matchEvaluations) {
        console.log(`  - Match Evaluations Count: ${data.diagnostics.matchEvaluations.length}`);
        const accepted = data.diagnostics.matchEvaluations.filter(m => m.status === 'accepted');
        console.log(`  - Accepted Evaluations: ${accepted.length}`);
      }
    }
    return data;
  } catch (err) {
    console.error(`Error running ${name}:`, err.message);
  }
}

// TEST A: Copy a distinctive passage verbatim from an accessible public webpage
const testAText = `The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles, by over 2 BLEU. On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on eight GPUs, a small fraction of the training costs of the best models from the literature. We show that the Transformer generalizes well to other tasks by applying it successfully to English constituency parsing both with large and limited training data.`;

// TEST B: 50% copied accessible text + 50% genuinely original text
const testBText = `The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train.
In our novel proprietary research initiated in autumn 2026, we explore bio-inspired neuromorphic spiking silicon designed specifically for localized marine sensor deployments. Rather than relying on power-hungry matrix multiplication accelerators, our physical units utilize passive analog event integrators. Field trials along the Puget Sound coastline validated ultra-low thermal dissipation below two milliwatts, proving viability for long-term ecological tracking.`;

// TEST C: Original writing on the same topic (Deep learning, Transformers, Attention mechanisms)
const testCText = `Modern neural architecture development increasingly examines whether sparse routing frameworks can supplant dense feedforward layers across modern sequence processing workloads. Rather than relying entirely on all-to-all token transformations, modular routing partitions representations dynamically based on token complexity metrics. Our empirical observations across localized embedded processors demonstrate that dynamic token culling achieves substantial power reductions without sacrificing predictive perplexity. By selectively bypassing inactive parameter blocks during autoregressive token emission, the system optimizes cache memory efficiency across lightweight edge computing environments.`;

async function main() {
  console.log("=== RUNNING CONTROLLED BENCHMARKS ===");
  const guestA = await getGuestId();
  await runTest("TEST A (Verbatim Public Web / Paper Excerpt)", testAText, guestA);

  const guestB = await getGuestId();
  await runTest("TEST B (50% Copied + 50% Original)", testBText, guestB);

  const guestC = await getGuestId();
  await runTest("TEST C (Original Writing on Same Topic)", testCText, guestC);

  // 1,261-word benchmark: composite document with copied sections and original analysis
  const part1 = testAText; // 169 words
  const part2 = `The recurrent models typically factor computation along the symbol positions of the input and output sequences. Aligning the positions to steps in computation time, they generate a sequence of hidden states h_t, as a function of the previous hidden state h_{t-1} and the input for position t. This inherently sequential nature precludes parallelization within training examples, which becomes critical at longer sequence lengths, as memory constraints limit batching across examples. Recent work has achieved significant improvements in computational efficiency through factorization tricks and conditional computation, while also improving model performance in case of the latter. Fundamentally, however, the constraint of sequential computation remains unbroken in standard architectures.
Attention mechanisms have become an integral part of compelling sequence modeling and transduction models in various tasks, allowing modeling of dependencies without regard to their distance in the input or output sequences. In all but a few cases, however, such attention mechanisms are used in conjunction with a recurrent network.
In this work we propose the Transformer, a model architecture eschewing recurrence and instead relying entirely on an attention mechanism to draw global dependencies between input and output. The Transformer allows for significantly more parallelization and can reach a new state of the art in translation quality after being trained for as little as twelve hours on eight P100 GPUs.`; // ~200 words
  const part3 = `The goal of reducing sequential computation also forms the foundation of the Extended Neural GPU, ByteNet and ConvS2S, all of which use convolutional neural networks as basic building blocks, computing hidden representations in parallel for all input and output positions. In these models, the number of operations required to relate signals from two arbitrary input or output positions grows in the distance between positions, linearly for ConvS2S and logarithmically for ByteNet. This makes it more difficult to learn dependencies between distant positions. In the Transformer this is reduced to a constant number of operations, albeit at the cost of reduced effective resolution due to averaging attention-weighted positions, an effect we counteract with Multi-Head Attention.
Self-attention, sometimes called intra-attention is an attention mechanism relating different positions of a single sequence in order to compute a representation of the sequence. Self-attention has been used successfully in a variety of tasks including reading comprehension, abstractive summarization, textual entailment and learning task-independent sentence representations. End-to-end memory networks are based on a recurrent attention mechanism instead of sequence-aligned recurrence and have been shown to perform well on simple-language question answering and language modeling tasks.
To the best of our knowledge, however, the Transformer is the first transduction model relying entirely on self-attention to compute representations of its input and output without using sequence-aligned RNNs or convolution. In the following sections, we describe the Transformer, motivate self-attention and discuss its advantages over models such as recurrent networks and convolutions.`; // ~230 words
  const part4 = `Most competitive neural sequence transduction models have an encoder-decoder structure. Here, the encoder maps an input sequence of symbol representations (x_1, ..., x_n) to a sequence of continuous representations z = (z_1, ..., z_n). Given z, the decoder then generates an output sequence (y_1, ..., y_m) of symbols one element at a time. At each step the model is auto-regressive, consuming the previously generated symbols as additional input when generating the next.
The Transformer follows this overall architecture using stacked self-attention and point-wise, fully connected layers for both the encoder and decoder, shown in the left and right halves of Figure 1, respectively.
The encoder is composed of a stack of N = 6 identical layers. Each layer has two sub-layers. The first is a multi-head self-attention mechanism, and the second is a simple, position-wise fully connected feed-forward network. We employ a residual connection around each of the two sub-layers, followed by layer normalization. That is, the output of each sub-layer is LayerNorm(x + Sublayer(x)), where Sublayer(x) is the function implemented by the sub-layer itself. To facilitate these residual connections, all sub-layers in the model, as well as the embedding layers, produce outputs of dimension d_model = 512.
The decoder is also composed of a stack of N = 6 identical layers. In addition to the two sub-layers in each encoder layer, the decoder inserts a third sub-layer, which performs multi-head attention over the output of the encoder stack. Similar to the encoder, we employ residual connections around each of the sub-layers, followed by layer normalization. We also modify the self-attention sub-layer in the decoder stack to prevent positions from attending to subsequent positions. This masking, combined with fact that the output embeddings are offset by one position, ensures that the predictions for position i can depend only on the known outputs at positions less than i.`; // ~310 words
  const part5 = `An attention function can be described as mapping a query and a set of key-value pairs to an output, where the query, keys, values, and output are all vectors. The output is computed as a weighted sum of the values, where the weight assigned to each value is computed by a compatibility function of the query with the corresponding key.
We call our particular attention Scaled Dot-Product Attention. The input consists of queries and keys of dimension d_k, and values of dimension d_v. We compute the dot products of the query with all keys, divide each by square root of d_k, and apply a softmax function to obtain the weights on the values.
In practice, we compute the attention function on a set of queries simultaneously, packed together into a matrix Q. The keys and values are also packed into matrices K and V. We compute the matrix of outputs as Softmax(Q K^T / sqrt(d_k)) V.
The two most commonly used attention functions are additive attention, and dot-product (multiplicative) attention. Dot-product attention is identical to our algorithm, except for the scaling factor of 1 / sqrt(d_k). Additive attention computes the compatibility function using a feed-forward network with a single hidden layer. While the two are similar in theoretical complexity, dot-product attention is much faster and more space-efficient in practice, since it can be implemented using highly optimized matrix multiplication code.
While for small values of d_k the two mechanisms perform similarly, additive attention outperforms dot product attention without scaling for larger values of d_k. We suspect that for large values of d_k, the dot products grow large in magnitude, pushing the softmax function into regions where it has extremely small gradients. To counteract this effect, we scale the dot products by 1 / sqrt(d_k).`; // ~310 words
  const part6 = `In this comprehensive analysis conducted for benchmark validation, we also present unique original text evaluating modern transformer scaling laws. In contrast to historical dense architectures, emerging neuromorphic and sparse mixture-of-experts architectures alter the linear relationship between parameter capacity and compute requirements during token routing. Our independent benchmark suite measures real-world memory access patterns across edge hardware topologies, demonstrating that sparsity allows models to retain broad knowledge representations while cutting dynamic inference energy consumption by up to sixty-four percent across heterogeneous mobile and embedded computing clusters.`; // ~90 words

  const benchmark1261 = `${part1}\n\n${part2}\n\n${part3}\n\n${part4}\n\n${part5}\n\n${part6}`;
  const guest1261 = await getGuestId();
  await runTest("1,261-WORD HIGH-SIMILARITY BENCHMARK", benchmark1261, guest1261);
}

main();
