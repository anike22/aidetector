export function DetectionProcessFlowchart() {
  return (
    <figure className="my-8 p-4 md:p-6 rounded-2xl bg-secondary/40 border border-border">
      <figcaption className="text-sm font-semibold text-navy mb-4 text-center">
        Figure 1: How an AI detector evaluates a submitted essay
      </figcaption>
      <svg viewBox="0 0 640 360" className="w-full h-auto" role="img" aria-label="AI detection process flowchart">
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="hsl(var(--muted-foreground))" />
          </marker>
        </defs>
        <rect x="20" y="20" width="120" height="50" rx="8" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth="2" />
        <text x="80" y="50" textAnchor="middle" fontSize="12" fill="hsl(var(--foreground))">Essay submitted</text>

        <rect x="180" y="20" width="140" height="50" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
        <text x="250" y="45" textAnchor="middle" fontSize="12" fill="hsl(var(--foreground))">Tokenize &amp; segment</text>
        <text x="250" y="60" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">sentences, words, n-grams</text>

        <rect x="360" y="20" width="120" height="50" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
        <text x="420" y="45" textAnchor="middle" fontSize="12" fill="hsl(var(--foreground))">Extract features</text>
        <text x="420" y="60" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">perplexity, burstiness, etc.</text>

        <rect x="520" y="20" width="100" height="50" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
        <text x="570" y="45" textAnchor="middle" fontSize="12" fill="hsl(var(--foreground))">Classifier</text>
        <text x="570" y="60" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">neural / statistical</text>

        <line x1="140" y1="45" x2="175" y2="45" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrow)" />
        <line x1="320" y1="45" x2="355" y2="45" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrow)" />
        <line x1="480" y1="45" x2="515" y2="45" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrow)" />

        <rect x="520" y="110" width="100" height="50" rx="8" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth="2" />
        <text x="570" y="135" textAnchor="middle" fontSize="12" fill="hsl(var(--foreground))">Confidence score</text>
        <text x="570" y="150" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">0% – 100%</text>

        <line x1="570" y1="70" x2="570" y2="105" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrow)" />

        <rect x="260" y="110" width="160" height="50" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
        <text x="340" y="135" textAnchor="middle" fontSize="12" fill="hsl(var(--foreground))">Threshold applied</text>
        <text x="340" y="150" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">e.g., 50% = AI / Human label</text>

        <line x1="520" y1="135" x2="425" y2="135" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrow)" />

        <rect x="20" y="110" width="160" height="50" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
        <text x="100" y="135" textAnchor="middle" fontSize="12" fill="hsl(var(--foreground))">Binary output</text>
        <text x="100" y="150" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">Flagged / Not flagged</text>

        <line x1="260" y1="135" x2="185" y2="135" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrow)" />

        <rect x="20" y="220" width="600" height="110" rx="8" fill="hsl(var(--muted) / 0.4)" stroke="hsl(var(--border))" strokeWidth="2" />
        <text x="320" y="250" textAnchor="middle" fontSize="12" fontWeight="bold" fill="hsl(var(--foreground))">What the output means</text>
        <text x="320" y="275" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">High score = text statistically resembles AI training patterns</text>
        <text x="320" y="295" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">Low score = text does not strongly match those patterns</text>
        <text x="320" y="315" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">Neither score proves authorship without additional evidence</text>
      </svg>
    </figure>
  );
}

export function FalsePositiveInfographic() {
  return (
    <figure className="my-8 p-4 md:p-6 rounded-2xl bg-secondary/40 border border-border">
      <figcaption className="text-sm font-semibold text-navy mb-4 text-center">
        Figure 2: Common causes of false positives
      </figcaption>
      <svg viewBox="0 0 640 280" className="w-full h-auto" role="img" aria-label="Common causes of false positives">
        <rect x="220" y="20" width="200" height="40" rx="8" fill="hsl(var(--destructive) / 0.15)" stroke="hsl(var(--destructive))" strokeWidth="2" />
        <text x="320" y="45" textAnchor="middle" fontSize="13" fill="hsl(var(--foreground))">Human essay flagged as AI</text>

        <line x1="320" y1="60" x2="320" y2="90" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />

        <circle cx="80" cy="120" r="50" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
        <text x="80" y="115" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">Formal</text>
        <text x="80" y="130" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">academic style</text>

        <circle cx="220" cy="120" r="50" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
        <text x="220" y="115" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">ESL writing</text>
        <text x="220" y="130" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">patterns</text>

        <circle cx="360" cy="120" r="50" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
        <text x="360" y="115" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">Technical /</text>
        <text x="360" y="130" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">scientific</text>

        <circle cx="500" cy="120" r="50" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
        <text x="500" y="115" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">Grammar tool</text>
        <text x="500" y="130" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">usage</text>

        <line x1="80" y1="170" x2="80" y2="200" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
        <line x1="220" y1="170" x2="220" y2="200" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
        <line x1="360" y1="170" x2="360" y2="200" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
        <line x1="500" y1="170" x2="500" y2="200" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />

        <rect x="20" y="205" width="140" height="50" rx="6" fill="hsl(var(--muted) / 0.4)" stroke="hsl(var(--border))" strokeWidth="1" />
        <text x="90" y="225" textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))">Uniform sentence</text>
        <text x="90" y="240" textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))">structure</text>

        <rect x="160" y="205" width="140" height="50" rx="6" fill="hsl(var(--muted) / 0.4)" stroke="hsl(var(--border))" strokeWidth="1" />
        <text x="230" y="225" textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))">Conservative</text>
        <text x="230" y="240" textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))">vocabulary</text>

        <rect x="300" y="205" width="140" height="50" rx="6" fill="hsl(var(--muted) / 0.4)" stroke="hsl(var(--border))" strokeWidth="1" />
        <text x="370" y="225" textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))">Passive voice &amp;</text>
        <text x="370" y="240" textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))">standardized terms</text>

        <rect x="440" y="205" width="180" height="50" rx="6" fill="hsl(var(--muted) / 0.4)" stroke="hsl(var(--border))" strokeWidth="1" />
        <text x="530" y="225" textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))">Smoothed, predictable</text>
        <text x="530" y="240" textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))">transitions</text>
      </svg>
    </figure>
  );
}

export function FalseNegativeInfographic() {
  return (
    <figure className="my-8 p-4 md:p-6 rounded-2xl bg-secondary/40 border border-border">
      <figcaption className="text-sm font-semibold text-navy mb-4 text-center">
        Figure 3: Common causes of false negatives
      </figcaption>
      <svg viewBox="0 0 640 260" className="w-full h-auto" role="img" aria-label="Common causes of false negatives">
        <rect x="200" y="20" width="240" height="40" rx="8" fill="hsl(var(--success) / 0.15)" stroke="hsl(var(--success))" strokeWidth="2" />
        <text x="320" y="45" textAnchor="middle" fontSize="13" fill="hsl(var(--foreground))">AI essay missed by detector</text>

        <line x1="320" y1="60" x2="320" y2="90" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />

        <rect x="40" y="110" width="120" height="60" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
        <text x="100" y="135" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">Heavy human</text>
        <text x="100" y="150" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">editing &amp;</text>
        <text x="100" y="165" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">paraphrasing</text>

        <rect x="200" y="110" width="120" height="60" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
        <text x="260" y="135" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">Mixed human</text>
        <text x="260" y="150" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">and AI</text>
        <text x="260" y="165" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">paragraphs</text>

        <rect x="360" y="110" width="120" height="60" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
        <text x="420" y="135" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">Prompt</text>
        <text x="420" y="150" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">engineering</text>
        <text x="420" y="165" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">for variety</text>

        <rect x="520" y="110" width="100" height="60" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
        <text x="570" y="135" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">AI</text>
        <text x="570" y="150" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">humanizer</text>
        <text x="570" y="165" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">tool</text>

        <line x1="320" y1="90" x2="100" y2="110" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
        <line x1="320" y1="90" x2="260" y2="110" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
        <line x1="320" y1="90" x2="420" y2="110" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
        <line x1="320" y1="90" x2="570" y2="110" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />

        <rect x="80" y="210" width="480" height="35" rx="6" fill="hsl(var(--muted) / 0.4)" stroke="hsl(var(--border))" strokeWidth="1" />
        <text x="320" y="232" textAnchor="middle" fontSize="11" fill="hsl(var(--foreground))">
          Result: statistical AI signature is diluted, masked, or transformed into human-like patterns
        </text>
      </svg>
    </figure>
  );
}

export function FlaggedEssayDecisionTree() {
  return (
    <figure className="my-8 p-4 md:p-6 rounded-2xl bg-secondary/40 border border-border">
      <figcaption className="text-sm font-semibold text-navy mb-4 text-center">
        Figure 4: Decision tree for educators when an essay is flagged
      </figcaption>
      <svg viewBox="0 0 720 420" className="w-full h-auto" role="img" aria-label="Decision tree for handling flagged essays">
        <rect x="280" y="20" width="160" height="50" rx="8" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth="2" />
        <text x="360" y="50" textAnchor="middle" fontSize="12" fill="hsl(var(--foreground))">Essay flagged by detector</text>

        <line x1="360" y1="70" x2="360" y2="100" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
        <text x="375" y="90" fontSize="11" fill="hsl(var(--muted-foreground))">Yes</text>

        <rect x="240" y="100" width="240" height="50" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
        <text x="360" y="125" textAnchor="middle" fontSize="12" fill="hsl(var(--foreground))">Request process evidence</text>
        <text x="360" y="140" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">drafts, outlines, notes, revision history</text>

        <line x1="360" y1="150" x2="360" y2="180" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />

        <rect x="220" y="180" width="280" height="50" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
        <text x="360" y="205" textAnchor="middle" fontSize="12" fill="hsl(var(--foreground))">Does evidence support human authorship?</text>

        <line x1="220" y1="205" x2="120" y2="205" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
        <line x1="500" y1="205" x2="600" y2="205" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
        <text x="175" y="200" fontSize="11" fill="hsl(var(--muted-foreground))">Yes</text>
        <text x="555" y="200" fontSize="11" fill="hsl(var(--muted-foreground))">No / unclear</text>

        <rect x="20" y="250" width="180" height="50" rx="8" fill="hsl(var(--success) / 0.15)" stroke="hsl(var(--success))" strokeWidth="2" />
        <text x="110" y="275" textAnchor="middle" fontSize="12" fill="hsl(var(--foreground))">Remove flag</text>
        <text x="110" y="290" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">document as false positive</text>

        <rect x="540" y="250" width="160" height="50" rx="8" fill="hsl(var(--destructive) / 0.15)" stroke="hsl(var(--destructive))" strokeWidth="2" />
        <text x="620" y="275" textAnchor="middle" fontSize="12" fill="hsl(var(--foreground))">Further review</text>
        <text x="620" y="290" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">human panel, interview</text>

        <line x1="120" y1="300" x2="120" y2="340" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
        <line x1="620" y1="300" x2="620" y2="340" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />

        <rect x="20" y="340" width="180" height="50" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
        <text x="110" y="365" textAnchor="middle" fontSize="12" fill="hsl(var(--foreground))">Inform student</text>
        <text x="110" y="380" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">explain detector limits</text>

        <rect x="540" y="340" width="160" height="50" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
        <text x="620" y="365" textAnchor="middle" fontSize="12" fill="hsl(var(--foreground))">Follow institutional</text>
        <text x="620" y="380" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">integrity policy</text>
      </svg>
    </figure>
  );
}
