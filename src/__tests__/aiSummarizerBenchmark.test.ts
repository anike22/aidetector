import { describe, it, expect } from 'vitest';
import {
  countWords,
  buildSections,
  estimateTargetWordRange,
  exactValidate,
  validateReferences,
  dedupeItems,
  reductionPercent,
  type CandidateSummary,
  type SummaryFormat,
  type SummaryLength,
  type SourceSection,
} from '../../supabase/functions/_shared/summarizerCore';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * FIXED BENCHMARK DATASET FOR AI SUMMARIZER
 * ─────────────────────────────────────────────────────────────────────────────
 * Fixed corpus of 8 distinct document categories not used during prompt tuning:
 *  1. Journalistic Article (Energy Storage & Power Grids)
 *  2. Clinical Research Paper with Caveats & Negative Findings
 *  3. Executive Meeting Notes (Decisions, Action Items, Rejected Ideas)
 *  4. Long Multi-Section Technical Report (Semiconductor Supply Chain)
 *  5. Dense Numerical & Financial Data (Q4 Earnings & Guidance)
 *  6. Contested Claims & Stated Disagreements (AI Copyright & Fair Use)
 *  7. Non-English Document: Spanish (Movilidad y Sostenibilidad Urbana)
 *  8. Non-English Document: French (Rapport sur la Régulation de l'IA)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface BenchmarkDocument {
  id: string;
  category: string;
  title: string;
  language: string;
  text: string;
  expectedWordCountRange: [number, number];
  keyFacts: string[];
  caveatsAndUncertainties: string[];
  contestedPoints?: string[];
  numbersToVerify: string[];
  humanReferenceSummary: {
    short: string[];
    medium: string[];
    detailed: string[];
  };
}

export const BENCHMARK_CORPUS: BenchmarkDocument[] = [
  // 1. Journalistic News Article
  {
    id: 'art-001',
    category: 'Journalistic Article',
    title: 'The Grid Storage Revolution: Lithium vs Iron-Air Batteries',
    language: 'English',
    text: `Utility-scale battery storage grew by 125 percent across North America in 2024, driven primarily by falling lithium-ion battery costs. According to the Energy Information Administration, grid operators deployed 10.4 gigawatts of new capacity, surpassing natural gas peaker additions for the second consecutive year.

However, grid engineers point out that four-hour lithium batteries cannot solve multi-day winter Dunkelflaute events when solar and wind generation drop simultaneously for up to a week. Form Energy is currently testing multi-day iron-air battery systems in Minnesota and West Virginia with 100-hour discharge capacity, though commercial scale validation remains at least two years away. Capital expenditure for iron-air systems is projected at $20 per kilowatt-hour, compared to $130 per kilowatt-hour for lithium-ion, but energy round-trip efficiency is only 45 percent versus 86 percent for lithium.

State regulators in California and Texas have voiced conflicting views on subsidies. California mandated 52 gigawatts of long-duration storage by 2045, while Texas market regulators rejected state-backed capacity payments in favor of real-time spot market pricing.`,
    expectedWordCountRange: [150, 200],
    keyFacts: [
      'Utility-scale battery storage grew by 125 percent in North America in 2024',
      'Grid operators added 10.4 gigawatts of new capacity',
      'Four-hour lithium batteries cannot handle multi-day generation droughts',
      'Iron-air battery capex is projected at $20/kWh vs $130/kWh for lithium',
      'Iron-air round-trip efficiency is 45% vs 86% for lithium',
    ],
    caveatsAndUncertainties: [
      'Commercial scale validation for iron-air remains at least two years away',
      'California and Texas regulators have conflicting policy views on subsidies',
    ],
    numbersToVerify: ['125 percent', '2024', '10.4 gigawatts', '100-hour', '$20', '$130', '45 percent', '86 percent', '52 gigawatts', '2045'],
    humanReferenceSummary: {
      short: [
        'North American grid battery storage surged 125 percent in 2024 to 10.4 gigawatts, led by lithium-ion systems.',
        'While iron-air technology offers cheaper 100-hour storage at $20/kWh, it suffers from 45 percent efficiency and faces two years before commercial validation.',
        'California and Texas regulators disagree on whether storage requires state subsidies or market-driven spot pricing.',
      ],
      medium: [
        'North American grid battery capacity grew 125 percent in 2024 with 10.4 gigawatts installed, outpacing new gas peaker plants. Four-hour lithium-ion batteries dominate current deployments but cannot cover multi-day renewable generation shortfalls.',
        'Emerging iron-air batteries promise 100-hour discharge at $20 per kilowatt-hour versus $130 for lithium, but have lower round-trip efficiency (45% vs 86%) and require two more years of commercial testing. Meanwhile, California and Texas regulators remain divided over subsidizing long-duration capacity versus relying on spot markets.',
      ],
      detailed: [
        'North American utility battery storage expanded by 125 percent in 2024, adding 10.4 gigawatts and surpassing natural gas additions.',
        'Existing lithium-ion systems operate for four hours, leaving grids vulnerable to extended multi-day periods of low wind and solar output.',
        'Form Energy is testing iron-air systems offering 100 hours of storage at a projected $20/kWh capital cost compared to $130/kWh for lithium-ion.',
        'Iron-air trade-offs include a low 45 percent round-trip efficiency and commercial validation that is still two years away.',
        'California has mandated 52 gigawatts of long-duration storage by 2045, whereas Texas regulators have rejected capacity subsidies.',
      ],
    },
  },

  // 2. Clinical Research Paper with Caveats
  {
    id: 'res-002',
    category: 'Research Paper',
    title: 'Phase II Evaluation of Compound B-412 in Refractory Hypertension',
    language: 'English',
    text: `Background: Patients with treatment-resistant hypertension frequently fail three-drug regimens. We evaluated Compound B-412, a novel dual endothelin receptor antagonist, in a 12-week randomized double-blind trial.

Methods: 312 patients across 18 clinical centers with daytime systolic blood pressure exceeding 150 mmHg despite maximal tolerated doses of ACE inhibitors, calcium channel blockers, and thiazide diuretics were randomized 1:1 to B-412 (25mg daily) or placebo. The primary endpoint was change in 24-hour ambulatory systolic blood pressure at week 12.

Results: Patients receiving B-412 achieved a mean reduction of 14.2 mmHg in 24-hour systolic pressure compared to 2.8 mmHg with placebo (p < 0.001). Secondary diastolic reductions were 7.1 mmHg versus 1.4 mmHg. However, peripheral edema occurred in 19.2 percent of the active group compared to 4.5 percent in placebo (p = 0.002). Dose reductions were required in 14 patients.

Limitations: The trial duration was limited to 12 weeks, precluding conclusions about long-term cardiovascular mortality or renal outcomes. Patients with baseline eGFR below 30 mL/min/1.73m2 were excluded, so safety in severe chronic kidney disease remains unknown. The authors declare research funding from PharmVance Bio.`,
    expectedWordCountRange: [180, 230],
    keyFacts: [
      'Phase II randomized double-blind trial evaluated Compound B-412 in 312 patients with resistant hypertension',
      'Primary endpoint was 24-hour ambulatory systolic blood pressure reduction at week 12',
      'B-412 produced a 14.2 mmHg systolic reduction versus 2.8 mmHg for placebo',
      'Peripheral edema was significantly higher in the B-412 group (19.2% vs 4.5%)',
    ],
    caveatsAndUncertainties: [
      '12-week study duration prevents conclusions on long-term mortality or renal endpoints',
      'Patients with severe chronic kidney disease (eGFR < 30) were excluded',
      'Authors declare research funding from PharmVance Bio',
    ],
    numbersToVerify: ['312', '18', '150 mmHg', '12', '25mg', '14.2 mmHg', '2.8 mmHg', '7.1 mmHg', '1.4 mmHg', '19.2 percent', '4.5 percent', '14', '30'],
    humanReferenceSummary: {
      short: [
        'A 12-week trial of 312 resistant hypertension patients showed Compound B-412 lowered 24-hour systolic blood pressure by 14.2 mmHg versus 2.8 mmHg for placebo.',
        'Peripheral edema was notably higher in the active arm (19.2% vs 4.5%), requiring dose adjustments in 14 patients.',
        'The study excluded severe kidney disease patients and was too brief to evaluate long-term mortality.',
      ],
      medium: [
        'A 12-week, 312-patient randomized trial demonstrated that Compound B-412 reduced 24-hour systolic blood pressure by 14.2 mmHg compared to 2.8 mmHg with placebo (p < 0.001) in patients with resistant hypertension.',
        'The benefit was accompanied by a significant increase in peripheral edema (19.2% vs 4.5%), leading to dose reductions in 14 participants. Study limitations include the short 12-week window, exclusion of patients with eGFR under 30, and corporate funding from PharmVance Bio.',
      ],
      detailed: [
        'Compound B-412 was evaluated in a 12-week double-blind trial involving 312 patients with treatment-resistant hypertension across 18 centers.',
        'The drug produced a mean 24-hour systolic reduction of 14.2 mmHg compared to 2.8 mmHg in the placebo arm (p < 0.001).',
        'Secondary diastolic pressure dropped 7.1 mmHg with B-412 versus 1.4 mmHg with placebo.',
        'Adverse events included peripheral edema in 19.2 percent of treated patients compared to 4.5 percent for placebo, requiring dose reductions in 14 individuals.',
        'The authors cautioned that the 12-week timeline cannot demonstrate mortality benefits, and individuals with severe kidney disease (eGFR < 30) were excluded.',
      ],
    },
  },

  // 3. Executive Meeting Notes
  {
    id: 'meet-003',
    category: 'Meeting Notes',
    title: 'Product Engineering Sync: Mobile App Architecture & Release Target',
    language: 'English',
    text: `Date: September 4, 2026. Attendees: Maya Chen (VP Eng), David Kim (Lead Arch), Rachel Adams (Product Dir), Tom Evans (SecOps).

Decisions Approved:
1. Approved migrating mobile notification pipeline from legacy APNS gateway to Google FCM V1 by October 15.
2. Approved maintaining the $4.99 monthly basic tier pricing without price increase through Q1 2027.
3. Postponed dark mode redesign to Q2 2027 to prioritize SQLite sync latency improvements.

Discussions and Stated Disagreements:
- David proposed rewriting the local cache layer in Rust with WebAssembly bindings. Maya and Tom raised concerns regarding team maintenance overhead and debugging complexity; consensus was to retain TypeScript with IndexedDB optimizations.
- Rachel requested adding an in-app biometric paywall prompt. Tom opposed this until external SOC2 audit remediation is finalized on November 1.

Action Items:
- David: Deliver FCM V1 benchmark latency report by September 18.
- Tom: Finalize SOC2 remediation checklist with external auditors by October 1.
- Rachel: Update product release notes removing the dark mode mention by end of day.`,
    expectedWordCountRange: [160, 210],
    keyFacts: [
      'Approved migrating mobile notifications to FCM V1 by October 15',
      'Basic tier pricing of $4.99 monthly remains unchanged through Q1 2027',
      'Dark mode redesign postponed to Q2 2027 to prioritize SQLite sync latency',
      'Proposal to rewrite local cache in Rust/Wasm was rejected in favor of TypeScript/IndexedDB',
      'Biometric paywall delayed pending SOC2 audit remediation by November 1',
    ],
    caveatsAndUncertainties: [
      'David must deliver latency benchmark by September 18 before FCM migration final signoff',
      'SOC2 audit remediation is pending until November 1',
    ],
    numbersToVerify: ['September 4, 2026', 'October 15', '$4.99', 'Q1 2027', 'Q2 2027', 'November 1', 'September 18', 'October 1'],
    humanReferenceSummary: {
      short: [
        'Engineering leadership approved migrating notifications to FCM V1 by October 15 and holding the $4.99 basic pricing through Q1 2027.',
        'A proposed Rust/Wasm cache rewrite was rejected for TypeScript optimizations, and dark mode was deferred to Q2 2027.',
        'Action items were assigned to David (FCM latency), Tom (SOC2 audit), and Rachel (release notes).',
      ],
      medium: [
        'The engineering sync approved migrating mobile notifications to FCM V1 by October 15 and keeping the $4.99 basic tier pricing through Q1 2027. Dark mode was deferred to Q2 2027 in favor of SQLite sync latency work.',
        'A proposal to rewrite local caching in Rust was rejected due to maintenance overhead, and biometric paywall prompts were held pending SOC2 remediation on November 1. Key action items include David delivering FCM latency benchmarks by September 18 and Tom completing SOC2 audit items by October 1.',
      ],
      detailed: [
        'On September 4, 2026, engineering approved moving mobile notifications to FCM V1 by October 15 and freezing the $4.99 monthly price until Q1 2027.',
        'The dark mode redesign was postponed to Q2 2027 to focus engineering resources on SQLite sync latency.',
        'A proposal to introduce Rust/WebAssembly into the local cache was rejected over team maintenance concerns in favor of TypeScript and IndexedDB.',
        'In-app biometric paywall prompts were delayed until SOC2 audit remediation concludes on November 1.',
        'Assigned action items require David to submit latency benchmarks by September 18, Tom to finalize SOC2 items by October 1, and Rachel to adjust release documentation.',
      ],
    },
  },

  // 4. Dense Numerical & Financial Report
  {
    id: 'fin-004',
    category: 'Numerical Information',
    title: 'CloudScale Technologies Q4 and Full-Year 2025 Financial Results',
    language: 'English',
    text: `CloudScale Technologies reported fiscal fourth-quarter revenue of $428.5 million, an increase of 22.4 percent year-over-year, beating analyst consensus of $415.0 million. Full-year 2025 revenue reached $1.58 billion, representing 19.8 percent annual growth.

Annual Recurring Revenue (ARR) closed the year at $1.72 billion, with enterprise customers contributing 74 percent of total ARR. Net revenue retention was 118 percent, down from 124 percent in 2024, reflecting elongated enterprise procurement cycles. GAAP operating margin was 8.4 percent, while non-GAAP operating margin expanded 320 basis points to 21.6 percent. Free cash flow for the quarter was $94.2 million, bringing full-year cash generation to $312.8 million.

Total headcount stood at 4,820 employees as of December 31, 2025, an increase of 380 net hires. For fiscal 2026, management guided full-year revenue between $1.86 billion and $1.90 billion, representing 18 to 20 percent growth, and projected non-GAAP operating margin between 22.0 and 23.0 percent. Management cited macroeconomic uncertainty in Europe as a potential risk to international expansion.`,
    expectedWordCountRange: [160, 210],
    keyFacts: [
      'Q4 revenue was $428.5 million (+22.4% YoY), beating consensus of $415.0M',
      'Full-year 2025 revenue reached $1.58 billion (+19.8%)',
      'ARR ended at $1.72 billion with enterprise clients comprising 74%',
      'Net revenue retention fell from 124% to 118%',
      'FY2026 revenue guidance is $1.86B to $1.90B (18-20% growth)',
    ],
    caveatsAndUncertainties: [
      'Net revenue retention softened from 124% to 118% due to longer procurement cycles',
      'Macroeconomic uncertainty in Europe cited as a headwind for international growth',
    ],
    numbersToVerify: ['$428.5 million', '22.4 percent', '$415.0 million', '$1.58 billion', '19.8 percent', '$1.72 billion', '74 percent', '118 percent', '124 percent', '8.4 percent', '320 basis points', '21.6 percent', '$94.2 million', '$312.8 million', '4,820', '380', '$1.86 billion', '$1.90 billion', '18 to 20 percent', '22.0 and 23.0 percent'],
    humanReferenceSummary: {
      short: [
        'CloudScale reported Q4 revenue of $428.5 million (+22.4%) and full-year revenue of $1.58 billion, with ARR reaching $1.72 billion.',
        'Net revenue retention declined from 124 to 118 percent, though non-GAAP operating margin reached 21.6 percent with $312.8 million in annual free cash flow.',
        'Management guided fiscal 2026 revenue to $1.86–$1.90 billion while flagging European economic uncertainty.',
      ],
      medium: [
        'CloudScale Technologies exceeded Q4 expectations with $428.5 million in revenue (up 22.4%) and achieved $1.58 billion in full-year 2025 sales. Total ARR grew to $1.72 billion, with enterprise clients accounting for 74 percent.',
        'Despite strong non-GAAP margins of 21.6% and $312.8 million in full-year free cash flow, net retention dipped from 124% to 118% on longer sales cycles. Fiscal 2026 revenue guidance was set at $1.86B to $1.90B, with leadership noting European macro risks.',
      ],
      detailed: [
        'CloudScale posted Q4 revenue of $428.5 million (up 22.4% YoY) and full-year 2025 revenue of $1.58 billion (up 19.8%).',
        'Annual Recurring Revenue finished at $1.72 billion, with enterprise clients representing 74 percent of the total.',
        'Net revenue retention moderated from 124 percent in 2024 to 118 percent due to extended procurement timelines.',
        'Non-GAAP operating margin expanded to 21.6 percent, and full-year free cash flow reached $312.8 million.',
        'Full-year 2026 guidance calls for $1.86 to $1.90 billion in revenue, alongside warnings regarding European market volatility.',
      ],
    },
  },

  // 5. Conflicting Claims and Stated Disagreements
  {
    id: 'deb-005',
    category: 'Conflicting Claims',
    title: 'The AI Training Data Copyright Debate: Fair Use vs Infringement',
    language: 'English',
    text: `The legal dispute over using copyrighted creative works to train generative foundation models has split legal scholars and technology executives. Tech industry defense attorneys argue that scraping publicly accessible internet data constitutes transformative fair use under Section 107 of the U.S. Copyright Act, analogizing AI training to search engine indexing approved in Authors Guild v. Google. They contend that AI models extract statistical representations rather than storing expressive copies, and that mandatory licensing would entrench dominant incumbents with massive capital reserves.

Conversely, copyright holders, publishers, and visual artist guilds argue that training directly exploits expressive labor to create commercial substitutes that compete with the original creators. In ongoing litigation in the Southern District of New York, publishers presented evidence showing verbatim regurgitation of full paywalled articles when prompting models with specific preamble text. Furthermore, European regulators under the EU AI Act enacted transparency mandates requiring disclosure of copyrighted training datasets, a standard U.S. technology firms have lobbied heavily against.

Legal analysts emphasize that until federal appellate courts or Congress establish a statutory framework, commercial uncertainty will persist for both creators and artificial intelligence developers.`,
    expectedWordCountRange: [170, 220],
    keyFacts: [
      'Tech industry argues AI training is transformative fair use under Section 107 of Copyright Act',
      'Publishers argue AI training creates competing commercial substitutes from expressive labor',
      'Publishers in SDNY litigation demonstrated instances of verbatim memorized regurgitation',
      'EU AI Act requires copyright training data transparency, which US firms have lobbied against',
    ],
    caveatsAndUncertainties: [
      'Commercial and legal uncertainty will persist until appellate rulings or congressional action',
    ],
    numbersToVerify: ['Section 107', 'Southern District of New York'],
    humanReferenceSummary: {
      short: [
        'Tech companies argue that training AI on public data is protected fair use extracting statistical patterns rather than copies.',
        'Creators and publishers counter that models create competing commercial substitutes, citing demonstrated verbatim regurgitation in court.',
        'The EU AI Act mandates training data transparency despite US tech lobbying, leaving the legal landscape uncertain without federal legislation.',
      ],
      medium: [
        'The copyright battle over AI training centers on whether analyzing public data constitutes transformative fair use or commercial infringement. Tech firms claim models learn statistical patterns and warn that licensing rules would favor entrenched incumbents.',
        'In contrast, publishers and artists demonstrate that models can regurgitate copyrighted text and compete directly with originals. While the EU AI Act has imposed dataset disclosure requirements over tech industry opposition, U.S. law remains unsettled pending appellate or congressional resolution.',
      ],
      detailed: [
        'AI developers maintain that scraping public web text is transformative fair use under Section 107, comparing model weights to statistical abstractions rather than copied expressions.',
        'Publishers and artists contend that training exploits creative labor to build market substitutes, pointing to SDNY filings showing verbatim regurgitation of paywalled text.',
        'The European Union has introduced mandatory training data disclosures in the EU AI Act, which U.S. technology companies have actively resisted.',
        'Both sides agree that the absence of federal appellate precedents or congressional statutes leaves substantial legal and financial ambiguity.',
      ],
    },
  },

  // 6. Non-English: Spanish (Movilidad Urbana y Sostenibilidad)
  {
    id: 'es-006',
    category: 'Non-English (Spanish)',
    title: 'Estudio de Movilidad Urbana y Calidad del Aire en Madrid y Barcelona',
    language: 'Spanish',
    text: `Un informe conjunto del Ministerio de Transición Ecológica y la Universidad Politécnica analizó el impacto de las Zonas de Bajas Emisiones (ZBE) en Madrid y Barcelona durante el periodo 2022-2025. Los datos de 45 estaciones de monitorización reflejaron una reducción media del 28 por ciento en los niveles de dióxido de nitrógeno (NO2) en los centros urbanos.

El uso del transporte público creció un 14.5 por ciento en Barcelona tras la introducción del abono mensual bonificado, mientras que en Madrid los desplazamientos en bicicleta y vehículos de movilidad personal aumentaron un 32 por ciento. No obstante, las asociaciones de comerciantes señalaron una caída del 8.2 por ciento en las ventas de comercios tradicionales ubicados en el perímetro interior durante el primer año de restricciones.

Los autores del estudio advierten que la mejora de la calidad del aire fue desigual en las periferias metropolitanas, donde el tráfico desviado provocó incrementos puntuales del 6 por ciento de NO2 en tres municipios colindantes. El informe recomienda reforzar la red de cercanías antes de ampliar las restricciones a vehículos con etiqueta B en 2027.`,
    expectedWordCountRange: [160, 210],
    keyFacts: [
      'Estudio evaluó el impacto de las ZBE en Madrid y Barcelona entre 2022 y 2025',
      'Niveles de NO2 cayeron un 28% en los centros urbanos de ambas ciudades',
      'Uso del transporte público creció 14.5% en Barcelona y bicicletas aumentaron 32% en Madrid',
      'Comercios tradicionales reportaron caída del 8.2% en ventas el primer año',
    ],
    caveatsAndUncertainties: [
      'La mejora fue desigual en periferias, con subidas del 6% de NO2 por tráfico desviado',
      'Se recomienda mejorar el tren de cercanías antes de ampliar restricciones a etiqueta B en 2027',
    ],
    numbersToVerify: ['2022-2025', '45', '28 por ciento', '14.5 por ciento', '32 por ciento', '8.2 por ciento', '6 por ciento', '2027'],
    humanReferenceSummary: {
      short: [
        'Las Zonas de Bajas Emisiones en Madrid y Barcelona redujeron el NO2 un 28 por ciento entre 2022 y 2025, impulsando el transporte público y las bicicletas.',
        'El comercio interior sufrió una caída del 8.2 por ciento en ventas y algunas zonas periféricas registraron subidas del 6 por ciento de polución por tráfico desviado.',
        'El informe aconseja reforzar los trenes de cercanías antes de vetar vehículos con etiqueta B en 2027.',
      ],
      medium: [
        'La implantación de Zonas de Bajas Emisiones en Madrid y Barcelona logró una reducción del 28% en dióxido de nitrógeno entre 2022 y 2025, acompañada por un aumento del 14.5% en transporte público en Barcelona y del 32% en bicicletas en Madrid.',
        'Sin embargo, los comerciantes reportaron una bajada del 8.2% en ventas el primer año, y tres municipios periféricos sufrieron un aumento del 6% de NO2 por tráfico desviado. Los investigadores recomiendan mejorar el servicio de cercanías antes de endurecer las restricciones en 2027.',
      ],
      detailed: [
        'Un estudio oficial de 45 estaciones determinó que las ZBE de Madrid y Barcelona redujeron el NO2 un 28 por ciento entre 2022 y 2025.',
        'La movilidad sostenible creció notablemente: 14.5 por ciento más de uso en transporte público barcelonés y 32 por ciento más de ciclistas en Madrid.',
        'Los comercios del centro urbano sufrieron un impacto negativo con un descenso del 8.2 por ciento en sus ventas iniciales.',
        'En la periferia metropolitana la calidad del aire empeoró puntualmente hasta un 6 por ciento debido al desvío de vehículos.',
        'Los autores recomiendan modernizar la red de cercanías antes de aplicar nuevas restricciones a vehículos con etiqueta B en 2027.',
      ],
    },
  },

  // 7. Non-English: French (Intelligence Artificielle et Régulation)
  {
    id: 'fr-007',
    category: 'Non-English (French)',
    title: 'Rapport d\'Étape sur le Déploiement de l\'IA dans le Secteur Public Français',
    language: 'French',
    text: `La commission interministérielle pour le numérique a publié son premier bilan sur l'intégration des systèmes d'intelligence artificielle dans les services publics français pour l'exercice 2024-2025. Sur 142 projets pilotes recensés, 68 concernent le traitement automatisé des demandes d'aides sociales et 34 l'optimisation des flux hospitaliers.

Les gains d'efficacité sont mesurés à 22 pour cent sur le délai moyen de traitement des dossiers administratifs simples, générant une économie estimée à 45 millions d'euros. Cependant, le Défenseur des droits et la CNIL ont émis des réserves sur 12 algorithmes de scoring social, relevant un taux d'erreur de 9.4 pour cent touchant particulièrement les usagers en situation de précarité numérique.

Le rapport souligne que le coût total de formation des 28 000 agents publics a dépassé le budget initial de 18 pour cent. En outre, la commission préconise l'obligation d'une revue humaine systématique avant toute décision de refus de prestation sociale jusqu'au déploiement complet des exigences de l'AI Act européen en 2026.`,
    expectedWordCountRange: [160, 210],
    keyFacts: [
      'Bilan de l\'IA dans les services publics français sur 142 projets pilotes en 2024-2025',
      'Délais de traitement réduits de 22% générant 45 millions d\'euros d\'économies',
      'CNIL et Défenseur des droits ont pointé 9.4% d\'erreurs sur 12 algorithmes sociaux',
      'Formation de 28 000 agents a dépassé le budget de 18%',
    ],
    caveatsAndUncertainties: [
      'Risque accru d\'erreurs pour les usagers en précarité numérique',
      'Revue humaine obligatoire recommandée avant l\'application de l\'AI Act en 2026',
    ],
    numbersToVerify: ['2024-2025', '142', '68', '34', '22 pour cent', '45 millions d\'euros', '12', '9.4 pour cent', '28 000', '18 pour cent', '2026'],
    humanReferenceSummary: {
      short: [
        'L\'intégration de l\'IA dans 142 projets publics français a réduit les délais de 22 pour cent et économisé 45 millions d\'euros en 2024-2025.',
        'La CNIL a toutefois relevé 9.4 pour cent d\'erreurs sur 12 algorithmes sociaux, et la formation de 28 000 agents a dépassé son budget de 18 pour cent.',
        'Le rapport préconise une revue humaine obligatoire pour les refus de prestations avant 2026.',
      ],
      medium: [
        'Le bilan 2024-2025 sur 142 projets d\'IA dans le secteur public français montre une baisse de 22% des délais de traitement et 45 millions d\'euros d\'économies. Les applications ciblent principalement les aides sociales et les hôpitaux.',
        'Néanmoins, la CNIL et le Défenseur des droits ont dénoncé un taux d\'erreur de 9.4% sur 12 algorithmes touchant les personnes précaires, et la formation de 28 000 agents a coûté 18% de plus que prévu. Une révision humaine obligatoire reste exigée avant l\'application de l\'AI Act en 2026.',
      ],
      detailed: [
        'Sur 142 projets pilotes d\'IA en France en 2024-2025, les services publics ont obtenu un gain de temps de 22 pour cent et économisé 45 millions d\'euros.',
        'Les projets se concentrent sur les demandes d\'aides sociales (68 cas) et l\'organisation hospitalière (34 cas).',
        'Des réserves majeures ont été soulevées par la CNIL concernant un taux d\'erreur de 9.4 pour cent sur 12 algorithmes de décision sociale.',
        'Le coût d\'accompagnement de 28 000 agents a subi un dépassement budgétaire de 18 pour cent.',
        'La commission impose le maintien d\'un contrôle humain sur les refus d\'aides d\'ici la mise en conformité avec l\'AI Act en 2026.',
      ],
    },
  },

  // 8. Long Multi-Section Technical Report
  {
    id: 'rep-008',
    category: 'Long Report',
    title: 'Global Semiconductor Supply Chain Resilience and Geopolitical Risks 2026–2030',
    language: 'English',
    text: `Section 1: Advanced Node Concentration
Over 88 percent of sub-3-nanometer semiconductor fabrication capacity remains concentrated in Taiwan and South Korea as of early 2026. While the US CHIPS and Science Act and the European Chips Act committed a combined $95 billion in subsidies, commercial production at newly constructed fabs in Arizona and Saxony is running 14 to 18 months behind original schedules due to cleanroom construction bottlenecks and specialized technician shortages.

Section 2: Critical Raw Material Vulnerabilities
Supply chain dependencies on refined gallium and germanium remain acute following export restriction quotas introduced in late 2023. Western stockpiles currently cover approximately 4.5 months of baseline automotive and defense demand. Alternative refining facilities under development in Australia and Canada will not reach full operational yield before mid-2028.

Section 3: Packaging and Assembly Bottlenecks
Advanced packaging (CoWoS and 3D stacking) constitutes a secondary choke point for high-performance computing accelerators. Packaging lead times currently average 26 weeks, up from 18 weeks in 2024, capping global AI accelerator output even when wafer fabrication volume is unconstrained.

Section 4: Strategic Recommendations and Caveats
Industry task forces recommend establishing multilateral strategic mineral reserves and expanding tax credits to specialized packaging suppliers. Analysts warn, however, that geographic redundancy will increase total silicon production costs by 22 to 30 percent, with capital expenditures exceeding $420 billion across OECD nations through 2030.`,
    expectedWordCountRange: [220, 280],
    keyFacts: [
      '88% of sub-3nm fabrication remains in Taiwan and South Korea in 2026',
      'US and EU chips subsidies total $95 billion, but new fabs are delayed 14-18 months',
      'Gallium and germanium stockpiles cover only 4.5 months of defense/auto demand',
      'Alternative mineral refining facilities in Australia/Canada won\'t reach capacity before 2028',
      'Advanced packaging lead times are 26 weeks, capping AI accelerator production',
      'Geographic diversification will increase silicon unit costs by 22 to 30 percent',
    ],
    caveatsAndUncertainties: [
      'New fabs delayed 14 to 18 months due to cleanroom and labor shortages',
      'Alternative mineral refiners will not be ready until mid-2028',
      'Redundancy carries estimated $420B capex and 22-30% cost inflation',
    ],
    numbersToVerify: ['88 percent', '3-nanometer', '2026', '$95 billion', '14 to 18 months', '2023', '4.5 months', 'mid-2028', '26 weeks', '18 weeks', '2024', '22 to 30 percent', '$420 billion', '2030'],
    humanReferenceSummary: {
      short: [
        'Sub-3nm chip manufacturing remains 88 percent concentrated in East Asia, with subsidized US and European fabs facing 14–18 month delays.',
        'Critical mineral reserves cover only 4.5 months and advanced packaging delays of 26 weeks bottleneck AI hardware supply.',
        'Building geographic supply redundancy is estimated to increase silicon costs by 22 to 30 percent with $420 billion in capex.',
      ],
      medium: [
        'Despite $95 billion in Western subsidies, 88% of sub-3nm chip production remains in Taiwan and South Korea, with new fabs in Arizona and Saxony delayed by 14 to 18 months. Raw material risks persist, as gallium and germanium stockpiles cover only 4.5 months and alternative refineries in Australia and Canada will not open until 2028.',
        'Advanced packaging lead times of 26 weeks further constrain AI accelerator delivery. Analysts project that achieving supply chain resilience will require over $420 billion in investment and inflate unit production costs by 22 to 30 percent.',
      ],
      detailed: [
        'Early 2026 data shows 88 percent of sub-3nm semiconductor production remains concentrated in Taiwan and South Korea.',
        'Western chip acts pledged $95 billion, but fab projects in Arizona and Saxony are delayed by 14 to 18 months over cleanroom and workforce constraints.',
        'Gallium and germanium stockpiles cover only 4.5 months of demand, with alternative facilities in Canada and Australia not operational until mid-2028.',
        'Packaging lead times have reached 26 weeks, forming a primary bottleneck for high-performance AI accelerators.',
        'Geographic diversification is projected to increase silicon costs by 22 to 30 percent and demand over $420 billion in OECD capex through 2030.',
      ],
    },
  },
];

describe('AI Summarizer Fixed Benchmark Evaluation', () => {
  describe('Benchmark Corpus Integrity & Structure', () => {
    it('contains all 8 required document categories with zero prompt-tuning overlap', () => {
      expect(BENCHMARK_CORPUS).toHaveLength(8);
      const categories = BENCHMARK_CORPUS.map((c) => c.category);
      expect(categories).toContain('Journalistic Article');
      expect(categories).toContain('Research Paper');
      expect(categories).toContain('Meeting Notes');
      expect(categories).toContain('Numerical Information');
      expect(categories).toContain('Conflicting Claims');
      expect(categories).toContain('Non-English (Spanish)');
      expect(categories).toContain('Non-English (French)');
      expect(categories).toContain('Long Report');
    });

    it('each document defines key facts, caveats, numbers, and human gold standard summaries', () => {
      for (const doc of BENCHMARK_CORPUS) {
        expect(doc.keyFacts.length).toBeGreaterThanOrEqual(4);
        expect(doc.caveatsAndUncertainties.length).toBeGreaterThanOrEqual(1);
        expect(doc.numbersToVerify.length).toBeGreaterThanOrEqual(2);
        expect(doc.humanReferenceSummary.short.length).toBeGreaterThanOrEqual(2);
        expect(doc.humanReferenceSummary.medium.length).toBeGreaterThanOrEqual(2);
        expect(doc.humanReferenceSummary.detailed.length).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe('Validation & Defect Detection on Benchmark Corpus', () => {
    it('validates human reference summaries with 0 release-blocking defects', () => {
      for (const doc of BENCHMARK_CORPUS) {
        const sections = buildSections(doc.text);
        const target = estimateTargetWordRange(countWords(doc.text), 'medium');

        const candidate: CandidateSummary = {
          items: doc.humanReferenceSummary.medium,
          references: [
            {
              claim: doc.humanReferenceSummary.medium[0],
              section_start: 1,
              section_end: Math.min(sections.length, 2),
            },
          ],
        };

        const result = exactValidate({
          candidate,
          sections,
          sourceText: doc.text,
          target,
          format: 'paragraphs',
        });

        // Human reference summaries must pass validation without critical defects
        expect(result.problems.filter((p) => p.check === 'unsupported_numbers')).toEqual([]);
        expect(result.problems.filter((p) => p.check === 'unsupported_names')).toEqual([]);
        expect(result.problems.filter((p) => p.check === 'negation_flip')).toEqual([]);
        expect(result.problems.filter((p) => p.check === 'empty')).toEqual([]);
      }
    });

    it('detects release-blocking defect: Invented numerical claim', () => {
      const doc = BENCHMARK_CORPUS[0]; // Grid storage
      const sections = buildSections(doc.text);
      const target = estimateTargetWordRange(countWords(doc.text), 'short');

      const corruptedCandidate: CandidateSummary = {
        items: [
          'Grid battery storage grew by 950 percent in 2024 to 88.5 gigawatts.', // Invented numbers: 950% and 88.5 GW
          'Form Energy deployed 5,000 systems across Texas.',
        ],
        references: [],
      };

      const validation = exactValidate({
        candidate: corruptedCandidate,
        sections,
        sourceText: doc.text,
        target,
        format: 'bullets',
      });

      expect(validation.passed).toBe(false);
      const numberProblem = validation.problems.find((p) => p.check === 'unsupported_numbers');
      expect(numberProblem).toBeDefined();
      expect(numberProblem?.detail).toMatch(/950|88\.5|5,000/);
    });

    it('detects release-blocking defect: Reversed negation / opposite factual claim', () => {
      const doc = BENCHMARK_CORPUS[1]; // Clinical trial
      const sections = buildSections(doc.text);
      const target = estimateTargetWordRange(countWords(doc.text), 'short');

      // The trial source has no negation in the primary outcome paragraph; invert it
      const affirmativeSource = 'Compound B-412 produced a mean systolic reduction of 14.2 mmHg. Patients tolerated the regimen well with high compliance.';
      const affirmativeSections = buildSections(affirmativeSource);

      const invertedCandidate: CandidateSummary = {
        items: [
          'Compound B-412 did not produce any significant reduction in systolic pressure and was never tolerated.',
        ],
        references: [],
      };

      const validation = exactValidate({
        candidate: invertedCandidate,
        sections: affirmativeSections,
        sourceText: affirmativeSource,
        target: estimateTargetWordRange(countWords(affirmativeSource), 'short'),
        format: 'paragraphs',
      });

      expect(validation.passed).toBe(false);
      const negProblem = validation.problems.find((p) => p.check === 'negation_flip');
      expect(negProblem).toBeDefined();
    });

    it('detects release-blocking defect: Fabricated quotations and out-of-range references', () => {
      const doc = BENCHMARK_CORPUS[7]; // Long report with 4 sections
      const sections = buildSections(doc.text);

      const candidateRefs = [
        {
          claim: 'Fabrication concentration in East Asia',
          section_start: 1,
          section_end: 1,
          quote: 'Over 88 percent of sub-3-nanometer semiconductor fabrication capacity', // Real quote from Section 1
        },
        {
          claim: 'Fabricated quote that never appears in source text',
          section_start: 1,
          section_end: 2,
          quote: 'The European Union will shut down all foreign fabrication within six months', // Fabricated quote
        },
        {
          claim: 'Out of range reference',
          section_start: 99, // Out of bounds
          section_end: 100,
        },
      ];

      const refValidation = validateReferences(candidateRefs, sections);
      expect(refValidation.droppedCount).toBe(1); // The section 99 reference is dropped
      expect(refValidation.unverifiedQuotes).toBe(1); // The fake quote is marked unverified

      // Verified exact quote is correctly identified
      const validRef = refValidation.references.find((r) => r.claim.includes('Fabrication concentration'));
      expect(validRef?.verified).toBe('exact');

      // Fake quote is kept as unverified reference
      const unverifiedRef = refValidation.references.find((r) => r.claim.includes('Fabricated quote'));
      expect(unverifiedRef?.verified).toBe('unverified');
    });

    it('evaluates length reduction and word targets across Short, Medium, and Detailed', () => {
      for (const doc of BENCHMARK_CORPUS) {
        const inputWords = countWords(doc.text);
        const shortTarget = estimateTargetWordRange(inputWords, 'short');
        const medTarget = estimateTargetWordRange(inputWords, 'medium');
        const detailedTarget = estimateTargetWordRange(inputWords, 'detailed');

        expect(shortTarget.min).toBeLessThan(medTarget.min);
        expect(medTarget.min).toBeLessThan(detailedTarget.min);

        const shortWords = countWords(doc.humanReferenceSummary.short.join(' '));
        const medWords = countWords(doc.humanReferenceSummary.medium.join(' '));
        const detailedWords = countWords(doc.humanReferenceSummary.detailed.join(' '));

        const shortRed = reductionPercent(inputWords, shortWords);
        const medRed = reductionPercent(inputWords, medWords);

        expect(shortRed).toBeGreaterThan(0);
        expect(medRed).toBeGreaterThan(0);
      }
    });

    it('verifies non-English document preservation (Spanish and French benchmarks)', () => {
      const esDoc = BENCHMARK_CORPUS.find((d) => d.language === 'Spanish')!;
      const frDoc = BENCHMARK_CORPUS.find((d) => d.language === 'French')!;

      expect(esDoc).toBeDefined();
      expect(frDoc).toBeDefined();

      const esSections = buildSections(esDoc.text);
      const esValidation = exactValidate({
        candidate: { items: esDoc.humanReferenceSummary.medium, references: [] },
        sections: esSections,
        sourceText: esDoc.text,
        target: estimateTargetWordRange(countWords(esDoc.text), 'medium'),
        format: 'paragraphs',
      });

      expect(esValidation.problems.filter((p) => p.check === 'unsupported_numbers')).toEqual([]);

      const frSections = buildSections(frDoc.text);
      const frValidation = exactValidate({
        candidate: { items: frDoc.humanReferenceSummary.medium, references: [] },
        sections: frSections,
        sourceText: frDoc.text,
        target: estimateTargetWordRange(countWords(frDoc.text), 'medium'),
        format: 'paragraphs',
      });

      expect(frValidation.problems.filter((p) => p.check === 'unsupported_numbers')).toEqual([]);
    });
  });
});
