export const FAQ_DATA: Record<string, { question: string; answer: string }[]> = {
  'general-questions': [
    {
      question: 'Why was my essay flagged as AI?',
      answer: 'Your essay was flagged because it shares statistical patterns—sentence structure, vocabulary, transitions, or tone—with texts in the detector\'s AI training data. A flag means the text looks AI-like, not that it was certainly written by AI.',
    },
    {
      question: 'Can AI detectors be wrong?',
      answer: 'Yes. All AI detectors produce false positives and false negatives. They are probabilistic classifiers, not authorship witnesses. Their accuracy varies by text type, length, language, and the model version.',
    },
    {
      question: 'What is a false positive in AI detection?',
      answer: 'A false positive occurs when a detector labels human-written text as AI-generated. Formal academic writing, ESL writing, and technical reports are especially likely to trigger false positives.',
    },
    {
      question: 'What is a false negative in AI detection?',
      answer: 'A false negative occurs when a detector fails to identify AI-generated text as AI. This often happens with heavily edited, paraphrased, or mixed human-AI documents.',
    },
    {
      question: 'How accurate is AI detection overall?',
      answer: 'Accuracy depends on the tool, the text, and the use case. Studies show that accuracy drops for non-native English, short samples, technical prose, and edited AI text. No detector is universally reliable.',
    },
    {
      question: 'Do AI detectors understand what I wrote?',
      answer: 'No. Detectors measure statistical patterns, not meaning. They do not know whether your argument is original, whether you understand the topic, or whether you used AI.',
    },
    {
      question: 'Can a teacher fail me just because a detector flagged my essay?',
      answer: 'A fair academic-integrity process requires more than a detector score. Most institutions require supporting evidence, such as inconsistent drafts, source anomalies, or a pattern of suspicious submissions.',
    },
    {
      question: 'Is a low AI score proof that I did not use AI?',
      answer: 'No. A low score may mean the text does not match the detector\'s training patterns, but heavily edited AI text can also score low. Scores are evidence of pattern similarity, not proof of authorship.',
    },
    {
      question: 'Why do different detectors give different scores for the same text?',
      answer: 'Each detector uses different training data, model architectures, features, and thresholds. Disagreement is normal and expected. Consensus across several tools can be more informative than any single score.',
    },
    {
      question: 'Are AI detectors getting better over time?',
      answer: 'Detectors and AI models evolve together. New detectors improve on some patterns, but new AI models also learn to mimic human writing. The arms race means no final, perfect solution is likely.',
    },
  ],
  'false-positives': [
    {
      question: 'Can human writing look like AI?',
      answer: 'Yes. Clear, consistent, formal writing often resembles AI output because both optimize for readability and convention. Human writers can produce highly “AI-like” text intentionally or accidentally.',
    },
    {
      question: 'Why does my formal essay score higher than my casual writing?',
      answer: 'Formal essays use standardized transitions, balanced sentences, and objective tone. These traits reduce stylistic variation and lower perplexity, which detectors associate with AI text.',
    },
    {
      question: 'Why are ESL writers more likely to be flagged?',
      answer: 'ESL writers may use simpler syntactic variety and more conservative vocabulary. Several studies have shown that popular detectors are biased against non-native English, producing higher false-positive rates.',
    },
    {
      question: 'Can a thesaurus make my writing look more human?',
      answer: 'Occasionally, but it is risky. Replacing common words with rare synonyms can raise vocabulary diversity, but it can also make prose awkward or inaccurate. Original examples and varied sentences are safer.',
    },
    {
      question: 'Does using citations reduce the chance of being flagged?',
      answer: 'Citations alone do not guarantee a lower score, but original analysis around citations tends to introduce the kind of stylistic unpredictability that detectors associate with human writing.',
    },
    {
      question: 'Why was my technical report flagged?',
      answer: 'Technical reports use standardized terminology, passive constructions, and precise definitions. These features lower lexical diversity and can raise AI probability scores even when the author is human.',
    },
    {
      question: 'Can short essays be flagged more easily?',
      answer: 'Yes. Short samples provide fewer data points, so a few AI-like phrases can dominate the score. Detector confidence is generally lower on short texts.',
    },
    {
      question: 'Why does repetitive phrasing trigger detectors?',
      answer: 'AI models tend to reuse common phrases and structures. Repetition reduces stylistic variance, which detectors treat as evidence of machine generation.',
    },
    {
      question: 'Can a well-organized essay be flagged just because it follows a template?',
      answer: 'Yes. Templates reduce structural variation. A rigid introduction-body-conclusion essay can look more predictable—and therefore more AI-like—than a loosely structured personal essay.',
    },
    {
      question: 'What should I do if I am sure I wrote the essay myself?',
      answer: 'Gather evidence: drafts, outlines, notes, and timestamps. Run the text through additional detectors to see if scores vary. Then request a human review and explain your writing process.',
    },
  ],
  'false-negatives': [
    {
      question: 'Can AI text pass as human?',
      answer: 'Yes. Heavily edited AI text, mixed documents, and text produced with humanizing prompts can score as human on many detectors.',
    },
    {
      question: 'Why would an AI essay be missed?',
      answer: 'An AI essay may be missed if it is heavily edited, paraphrased, combined with human writing, or generated with prompts that ask for varied sentence structure and personal voice.',
    },
    {
      question: 'Does editing AI text make it undetectable?',
      answer: 'Not necessarily, but substantial editing can lower AI probability scores. The more the text deviates from default AI patterns, the harder it becomes for classifiers to identify it.',
    },
    {
      question: 'Can AI humanizer tools beat detectors?',
      answer: 'Some humanizer tools reduce detection scores by rephrasing and restructuring text. However, their effectiveness varies, and the underlying authorship issue remains unchanged.',
    },
    {
      question: 'Is mixed human-AI writing harder to detect?',
      answer: 'Yes. When human paragraphs alternate with AI paragraphs, the overall document score can average out to a human-like range, especially if the detector scores the whole text rather than individual sections.',
    },
    {
      question: 'Can prompt engineering create undetectable AI text?',
      answer: 'Prompts that request informal tone, varied sentence length, personal anecdotes, or non-native style can produce output that evades default-pattern detectors.',
    },
    {
      question: 'Does a low score mean my text is definitely human?',
      answer: 'No. A low score only means the text does not strongly match the detector\'s AI patterns. It is not a guarantee of human authorship.',
    },
    {
      question: 'Are newer AI models harder to detect?',
      answer: 'Generally, yes. Each generation of language models produces more natural, varied output, which can reduce the accuracy of detectors trained on older samples.',
    },
  ],
  'for-students': [
    {
      question: 'What should I do if my teacher says I used AI?',
      answer: 'Stay calm and ask for the specific evidence. Provide your drafts, outline, notes, and revision history. Explain your writing process and ask how the score will be used in the assessment.',
    },
    {
      question: 'Should I tell my teacher if I used AI for brainstorming?',
      answer: 'Yes, if your course policy requires disclosure. Transparency protects you and helps your teacher understand the role AI played in your work.',
    },
    {
      question: 'Can Grammarly cause my essay to be flagged?',
      answer: 'Yes. Grammar tools smooth prose and can increase AI probability scores. Keep your original draft so you can show the difference between your unedited and edited text.',
    },
    {
      question: 'How can I make my writing look less like AI?',
      answer: 'Add specific examples, vary sentence length and openings, include personal opinions or anecdotes, and use precise vocabulary from your field. Avoid generic transitions in every sentence.',
    },
    {
      question: 'Should I avoid AI detectors before submitting?',
      answer: 'You can use them to understand your text, but do not rewrite your essay just to lower a score. The goal is honest, original writing, not gaming a detector.',
    },
    {
      question: 'Can I appeal an AI detection result?',
      answer: 'Yes, if your institution has an appeals process. Submit your process evidence and request a human review. Detector scores alone are rarely sufficient for a final decision.',
    },
    {
      question: 'What counts as good evidence that I wrote my essay?',
      answer: 'Strong evidence includes dated drafts, outlines, source notes, search history, peer-review comments, and a coherent explanation of your argument development.',
    },
    {
      question: 'Is paraphrasing AI text to avoid detection allowed?',
      answer: 'No. Paraphrasing AI output to hide its origin is usually considered academic dishonesty. It also produces lower-quality writing than original work.',
    },
  ],
  'for-educators': [
    {
      question: 'How should I interpret an AI detection score?',
      answer: 'Interpret it as one clue in a larger picture. Consider the student\'s prior writing, the assignment context, and known detector biases. Do not treat the score as proof.',
    },
    {
      question: 'What is a good threshold for flagging essays?',
      answer: 'There is no universally good threshold. A threshold that catches more AI text also flags more human text. Any threshold should be disclosed and paired with human review.',
    },
    {
      question: 'Should I tell students I use AI detection?',
      answer: 'Yes. Transparency is an ethical requirement. Students should know which tools are used, how scores inform decisions, and what appeals are available.',
    },
    {
      question: 'Can I rely on Turnitin\'s AI score alone?',
      answer: 'No. Turnitin provides one signal among many. Its scores, like all detector scores, are probabilistic and subject to false positives and negatives.',
    },
    {
      question: 'How do I handle a false positive?',
      answer: 'Apologize if appropriate, remove the flag from the record if no other evidence exists, and use the case to educate students and colleagues about detector limitations.',
    },
    {
      question: 'What process evidence should I request?',
      answer: 'Request drafts, outlines, research notes, source materials, and a brief written explanation of the student\'s argument development. These materials are more reliable than a score.',
    },
    {
      question: 'How can I design assignments that reduce AI misuse?',
      answer: 'Use scaffolded drafts, in-class writing, oral defenses, annotated bibliographies, and reflective cover letters. These methods value process and originality over final output alone.',
    },
    {
      question: 'Should I report every flag to administration?',
      answer: 'Not necessarily. Report flags when you have additional evidence of misconduct or when your institution requires it. A standalone score is usually not enough.',
    },
  ],
  'technical-questions': [
    {
      question: 'What is perplexity in AI detection?',
      answer: 'Perplexity measures how surprised a language model is by the next word in a sequence. Lower perplexity means the text is more predictable, which can indicate AI generation.',
    },
    {
      question: 'What is burstiness?',
      answer: 'Burstiness measures variation in sentence length and complexity. Human writing often alternates between short and long sentences, while AI output can be more uniform.',
    },
    {
      question: 'Do detectors use watermarking?',
      answer: 'Some systems have proposed or implemented watermarking, but it is not universal. Most commercial detectors rely on statistical classifiers rather than hidden watermarks.',
    },
    {
      question: 'Can detectors identify GPT-5.5 or Gemini text?',
      answer: 'Some detectors can identify default outputs from recent models, but accuracy declines when the output is edited, prompted for variety, or combined with human text.',
    },
    {
      question: 'What is a confidence score?',
      answer: 'A confidence score is the detector\'s estimate of how likely the text is AI-generated. It is model-dependent and should not be treated as a probability calibrated across all tools.',
    },
    {
      question: 'Why do scores change when I add or remove a paragraph?',
      answer: 'Detectors analyze the whole document. Adding or removing text changes the statistical distribution of sentence lengths, vocabulary, and transitions, which can shift the score.',
    },
  ],
};
