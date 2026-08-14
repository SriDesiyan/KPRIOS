import { Case } from '../types/case';
import { EvidenceItem } from '../types/evidence';
import { EvidenceGraph } from '../types/graph';
import { TimelineEvent, TimelineResponse } from '../types/timeline';
import { Entity, EntityMergeProposal } from '../types/entity';
import {
  InvestigationState,
  CandidateAction,
  DependencyImpact,
  AgentTraceLog,
  Hypothesis,
  Contradiction,
  EvidenceGap,
  PendingAction,
} from '../types/agent';
import { User } from '../types/auth';

export const DEMO_CASE_ID = '6d4df869-62c3-4919-885a-c75aee28fa75';

export const DEMO_CASES: Case[] = [
  {
    id: DEMO_CASE_ID,
    case_number: 'CR-KP-ACPIA-2026-001',
    title: 'Operation CyberShield — Digital Forensics Investigation',
    description: 'Investigation into distributed peer-to-peer child exploitation ring utilizing encrypted channels and contradictory geolocation traces.',
    status: 'ACTIVE',
    created_by_id: 'officer-uuid-001',
    created_at: '2026-08-14T01:00:00Z',
    updated_at: '2026-08-14T01:15:00Z',
    evidence_count: 3,
    entity_count: 3,
    fact_count: 5,
    hypothesis_count: 2,
    gap_count: 1,
  },
  {
    id: 'case-002-uuid',
    case_number: 'CR-KP-ACPIA-2026-002',
    title: 'Operation BlueLight — Telegram Channel Takedown',
    description: 'Cross-jurisdictional attribution inquiry involving multi-device synchronization and anonymous wallet transactions.',
    status: 'ACTIVE',
    created_by_id: 'officer-uuid-001',
    created_at: '2026-08-13T10:00:00Z',
    updated_at: '2026-08-13T14:30:00Z',
    evidence_count: 2,
    entity_count: 2,
    fact_count: 3,
    hypothesis_count: 2,
    gap_count: 0,
  },
];

export const DEMO_EVIDENCE: EvidenceItem[] = [
  {
    id: 'ev-001-chat',
    case_id: DEMO_CASE_ID,
    file_name: 'chat_intercept_alpha.txt',
    mime_type: 'text/plain',
    hash: '5d41402abc4b2a76b9719d911017c5925d41402abc4b2a76b9719d911017c592',
    modality: 'CHAT_LOG',
    file_size_bytes: 4096,
    source_fingerprint: 'fp_chat_alpha_1',
    trust_vector: {
      reliability: 0.95,
      authenticity: 0.98,
      freshness: 0.92,
      provenance_score: 0.96,
    },
    metadata_payload: { lines: 142, sender: '@anand_cyber' },
    ingested_at: '2026-08-14T01:05:00Z',
  },
  {
    id: 'ev-002-photo',
    case_id: DEMO_CASE_ID,
    file_name: 'suspect_device_photo.jpg',
    mime_type: 'image/jpeg',
    hash: '7d824e707fed5b265e204d5d51f264d17d824e707fed5b265e204d5d51f264d1',
    modality: 'IMAGE',
    file_size_bytes: 204800,
    source_fingerprint: 'fp_photo_exif_2',
    trust_vector: {
      reliability: 0.92,
      authenticity: 0.95,
      freshness: 0.9,
      provenance_score: 0.93,
    },
    metadata_payload: { gps: '11.2588, 75.7804', camera: 'OnePlus 11' },
    ingested_at: '2026-08-14T01:07:00Z',
  },
  {
    id: 'ev-003-wifi',
    case_id: DEMO_CASE_ID,
    file_name: 'hotel_wifi_auth_log.json',
    mime_type: 'application/json',
    hash: '6b86b273ff34fce19d6b804eff5a3f576b86b273ff34fce19d6b804eff5a3f57',
    modality: 'DOCUMENT',
    file_size_bytes: 8192,
    source_fingerprint: 'fp_wifi_radius_3',
    trust_vector: {
      reliability: 0.9,
      authenticity: 0.94,
      freshness: 0.88,
      provenance_score: 0.91,
    },
    metadata_payload: { ssid: 'GatewayHotel_Guest', mac: '48:2C:6A:11:22:33' },
    ingested_at: '2026-08-14T01:10:00Z',
  },
];

export const DEMO_GRAPH: EvidenceGraph = {
  case_id: DEMO_CASE_ID,
  node_count: 8,
  edge_count: 6,
  dedup_clusters: {
    fp_chat_alpha_1: ['ev-001-chat'],
    fp_photo_exif_2: ['ev-002-photo'],
    fp_wifi_radius_3: ['ev-003-wifi'],
  },
  nodes: [
    {
      id: 'ent-anand',
      label: 'Anand Kumar',
      node_type: 'entity',
      sub_type: 'PERSON',
      confidence: 0.92,
      source_ids: ['ev-001-chat'],
      attributes: { role: 'Suspected Admin', phone: '+91-9847000000' },
    },
    {
      id: 'ent-alias',
      label: '@anand_cyber',
      node_type: 'entity',
      sub_type: 'ONLINE_ALIAS',
      confidence: 0.95,
      source_ids: ['ev-001-chat'],
      attributes: { platform: 'Telegram', handle: '@anand_cyber' },
    },
    {
      id: 'ent-device',
      label: 'OnePlus 11 (MAC: 48:2C:6A:11:22:33)',
      node_type: 'entity',
      sub_type: 'DEVICE',
      confidence: 0.88,
      source_ids: ['ev-002-photo', 'ev-003-wifi'],
      attributes: { imei: '869402051234567' },
    },
    {
      id: 'fact-kozhikode',
      label: 'Device GPS in Kozhikode (11.2588, 75.7804)',
      node_type: 'fact',
      sub_type: 'GEOLOCATION',
      confidence: 0.92,
      source_ids: ['ev-002-photo'],
      attributes: { timestamp: '2026-08-14T00:30:00Z', city: 'Kozhikode' },
    },
    {
      id: 'fact-tvm',
      label: 'Hotel Wi-Fi in Thiruvananthapuram (8.5241, 76.9366)',
      node_type: 'fact',
      sub_type: 'GEOLOCATION',
      confidence: 0.9,
      source_ids: ['ev-003-wifi'],
      attributes: { timestamp: '2026-08-14T00:30:30Z', city: 'Thiruvananthapuram' },
    },
    {
      id: 'hyp-h1',
      label: 'H1: Suspect operated primary exploitation channel',
      node_type: 'hypothesis',
      sub_type: 'PRIMARY_ACTOR',
      confidence: 0.72,
      source_ids: ['ev-001-chat', 'ev-002-photo'],
      attributes: { status: 'CONTESTED', prior: 0.5, posterior: 0.72 },
    },
    {
      id: 'hyp-h2',
      label: 'H2: Device compromised via remote access trojan (RAT)',
      node_type: 'hypothesis',
      sub_type: 'COMPROMISED_PROXY',
      confidence: 0.28,
      source_ids: ['ev-003-wifi'],
      attributes: { status: 'ACTIVE', prior: 0.5, posterior: 0.28 },
    },
    {
      id: 'ev-001-chat',
      label: 'chat_intercept_alpha.txt',
      node_type: 'evidence',
      sub_type: 'CHAT_LOG',
      confidence: 0.98,
      source_ids: ['ev-001-chat'],
      attributes: { sha256: '5d41402abc4b2a76b9719d911017c592' },
    },
  ],
  edges: [
    {
      id: 'edge-1',
      source: 'ent-alias',
      target: 'ent-anand',
      relationship_type: 'associated_with',
      confidence: 0.88,
      source_ids: ['ev-001-chat'],
      attributes: {},
    },
    {
      id: 'edge-2',
      source: 'ent-anand',
      target: 'ent-device',
      relationship_type: 'associated_with',
      confidence: 0.9,
      source_ids: ['ev-002-photo'],
      attributes: {},
    },
    {
      id: 'edge-3',
      source: 'fact-kozhikode',
      target: 'hyp-h1',
      relationship_type: 'supports',
      confidence: 0.85,
      source_ids: ['ev-002-photo'],
      attributes: {},
    },
    {
      id: 'edge-4',
      source: 'fact-kozhikode',
      target: 'fact-tvm',
      relationship_type: 'contradicts',
      confidence: 0.96,
      source_ids: ['ev-002-photo', 'ev-003-wifi'],
      attributes: {},
    },
    {
      id: 'edge-5',
      source: 'fact-tvm',
      target: 'hyp-h2',
      relationship_type: 'supports',
      confidence: 0.8,
      source_ids: ['ev-003-wifi'],
      attributes: {},
    },
    {
      id: 'edge-6',
      source: 'ev-001-chat',
      target: 'ent-alias',
      relationship_type: 'derives_from',
      confidence: 0.98,
      source_ids: ['ev-001-chat'],
      attributes: {},
    },
  ],
};

export const DEMO_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'evt-001',
    case_id: DEMO_CASE_ID,
    timestamp: '2026-08-14T00:15:00Z',
    title: 'Channel Initialization Broadcast',
    description: 'Encrypted channel initialization message broadcast by @anand_cyber on Telegram.',
    confidence: 0.95,
    event_type: 'COMMUNICATION',
    source_ids: ['ev-001-chat'],
    evidence_file_name: 'chat_intercept_alpha.txt',
    attributes: { handle: '@anand_cyber', channel: 'AlphaForensic' },
  },
  {
    id: 'evt-002',
    case_id: DEMO_CASE_ID,
    timestamp: '2026-08-14T00:30:00Z',
    title: 'Device Geotag in Kozhikode',
    description: 'Device EXIF geotag captured at Kozhikode beach promenade (11.2588, 75.7804).',
    confidence: 0.92,
    event_type: 'GEO_LOCATION',
    source_ids: ['ev-002-photo'],
    evidence_file_name: 'suspect_device_photo.jpg',
    attributes: { lat: 11.2588, lon: 75.7804, device: 'OnePlus 11' },
  },
  {
    id: 'evt-003',
    case_id: DEMO_CASE_ID,
    timestamp: '2026-08-14T00:30:30Z',
    title: 'Wi-Fi Authentication in Thiruvananthapuram',
    description: 'Wi-Fi RADIUS authentication logged at Thiruvananthapuram Hotel Gateway (8.5241, 76.9366). Contradicts event #2.',
    confidence: 0.9,
    event_type: 'GEO_LOCATION',
    source_ids: ['ev-003-wifi'],
    evidence_file_name: 'hotel_wifi_auth_log.json',
    attributes: { ssid: 'GatewayHotel_Guest', mac: '48:2C:6A:11:22:33', contradiction: true },
  },
];

export const DEMO_TIMELINE_RESPONSE: TimelineResponse = {
  case_id: DEMO_CASE_ID,
  total_events: DEMO_TIMELINE_EVENTS.length,
  events: DEMO_TIMELINE_EVENTS,
};

const demoSourceEntity: Entity = {
  id: 'ent-alias',
  case_id: DEMO_CASE_ID,
  name: '@anand_cyber',
  entity_type: 'ONLINE_SERVICE',
  attributes: { platform: 'Telegram' },
  source_ids: ['ev-001-chat'],
  is_merged: false,
  confidence: 0.95,
  created_at: '2026-08-14T01:06:00Z',
};

const demoTargetEntity: Entity = {
  id: 'ent-anand',
  case_id: DEMO_CASE_ID,
  name: 'Anand Kumar',
  entity_type: 'PERSON',
  attributes: { role: 'Suspect' },
  source_ids: ['ev-001-chat'],
  is_merged: false,
  confidence: 0.92,
  created_at: '2026-08-14T01:06:00Z',
};

export const DEMO_PROPOSALS: EntityMergeProposal[] = [
  {
    id: 'prop-001',
    case_id: DEMO_CASE_ID,
    source_entity: demoSourceEntity,
    target_entity: demoTargetEntity,
    similarity_score: 0.88,
    reason: 'Lexical alignment of alias string with legal surname and shared phone number recovery in chat metadata.',
    status: 'PENDING',
    created_at: '2026-08-14T01:12:00Z',
  },
];

export const DEMO_RECOMMENDATIONS: CandidateAction[] = [
  {
    id: 'rec-001',
    action_type: 'request_isp_subscriber_records',
    description: 'Subpoena BSNL Kerala for IP session allocation and MAC correlation records.',
    eig_score: 0.412,
    justification: 'Obtaining IP session logs from BSNL/Jio will definitively isolate whether the Kozhikode or Thiruvananthapuram connection was authentic, resolving the spatiotemporal contradiction.',
    tier: 'REVIEW',
    payload: { isp: 'BSNL Kerala', ip_address: '117.218.45.12' },
    discriminates_between: ['H1 (Primary Actor)', 'H2 (Compromised Proxy)'],
    is_poc_approximation: true,
  },
  {
    id: 'rec-002',
    action_type: 'extract_browser_history_db',
    description: 'Run automated parser on OnePlus SQLite database artifacts for remote administration tool downloads.',
    eig_score: 0.285,
    justification: 'Automated extraction of SQLite history files from OnePlus device image to check for remote administration tool downloads.',
    tier: 'AUTO',
    payload: { artifact_type: 'CHROME_HISTORY' },
    discriminates_between: ['H2 (Compromised Proxy)'],
    is_poc_approximation: true,
  },
];

export const DEMO_HYPOTHESES: Hypothesis[] = [
  {
    id: 'hyp-h1',
    statement: 'Suspect Anand Kumar operated primary digital exploitation channel.',
    status: 'CONTESTED',
    belief: 0.72,
    prior_probability: 0.5,
    support_count: 2,
    attack_count: 1,
    source_ids: ['ev-001-chat', 'ev-002-photo'],
  },
  {
    id: 'hyp-h2',
    statement: 'Suspect device compromised via remote access trojan (RAT) acting as third-party proxy.',
    status: 'ACTIVE',
    belief: 0.28,
    prior_probability: 0.5,
    support_count: 1,
    attack_count: 0,
    source_ids: ['ev-003-wifi'],
  },
];

export const DEMO_CONTRADICTIONS: Contradiction[] = [
  {
    id: 'contra-001',
    fact_ids: ['fact-kozhikode', 'fact-tvm'],
    conflict_type: 'SPATIOTEMPORAL_CONFLICT',
    description: 'Physical impossibility: Device logged in Kozhikode and Thiruvananthapuram (370 km distance) within 30 seconds.',
    status: 'UNRESOLVED',
    source_ids: ['ev-002-photo', 'ev-003-wifi'],
  },
];

export const DEMO_GAPS: EvidenceGap[] = [
  {
    id: 'gap-001',
    gap_type: 'MISSING_SUBSCRIBER_CDR',
    description: 'No ISP cell tower CDR records ingested for time window 00:00–01:00 UTC.',
    status: 'OPEN',
    source_ids: [],
    target_entity_id: 'ent-anand',
  },
];

export const DEMO_PENDING_ACTIONS: PendingAction[] = [
  {
    id: 'act-merge-001',
    action_type: 'merge_entity_identity',
    tier: 'REVIEW',
    status: 'PENDING',
    requested_at: '2026-08-14T01:14:00Z',
    description: 'Merge candidate @anand_cyber into Anand Kumar (Requires Tier-2 Investigator Signature)',
    payload: { source_id: 'ent-alias', target_id: 'ent-anand' },
  },
];

export const DEMO_DEPENDENCIES: DependencyImpact[] = [
  {
    evidence_id: 'ev-001-chat',
    hypothesis_id: 'hyp-h1',
    file_name: 'chat_intercept_alpha.txt',
    baseline_belief: 0.72,
    ablated_belief: 0.48,
    dependency_impact_pp: -24.0,
    unit: 'pp',
    interpretation: 'Critical primary support artifact. Removal destabilizes hypothesis belief by 24 percentage points.',
  },
  {
    evidence_id: 'ev-002-photo',
    hypothesis_id: 'hyp-h1',
    file_name: 'suspect_device_photo.jpg',
    baseline_belief: 0.72,
    ablated_belief: 0.59,
    dependency_impact_pp: -13.0,
    unit: 'pp',
    interpretation: 'Corroborating geolocation artifact.',
  },
];

export const DEMO_AUDIT_LOGS: AgentTraceLog[] = [
  {
    id: 'trace-001',
    agent: 'InvestigationAgent',
    step: 'Observe & Ingest',
    input_summary: 'chat_intercept_alpha.txt',
    output_summary: 'Found 2 entities: Anand Kumar, @anand_cyber. SHA-256 integrity verified.',
    timestamp: '2026-08-14T01:06:00Z',
  },
  {
    id: 'trace-002',
    agent: 'InvestigationAgent',
    step: 'Contradiction Detection',
    input_summary: 'Kozhikode vs Thiruvananthapuram (delta = 30s)',
    output_summary: 'Spatiotemporal conflict detected (speed required > 44,000 km/h). Proposition marked CONTESTED.',
    timestamp: '2026-08-14T01:11:00Z',
  },
  {
    id: 'trace-003',
    agent: 'StrategyAgent',
    step: 'EIG Ranking & Planning',
    input_summary: 'Hypotheses: [hyp-h1, hyp-h2]',
    output_summary: 'Ranked request_isp_subscriber_records as #1 (EIG: 0.412 bits, PoC approximation).',
    timestamp: '2026-08-14T01:14:00Z',
  },
];

export const DEMO_STATE: InvestigationState = {
  case_id: DEMO_CASE_ID,
  version: 4,
  status: 'ACTIVE',
  current_agent: 'InvestigationAgent',
  working_notes: 'Investigation Agent observed contradiction between EXIF GPS (Kozhikode) and Wi-Fi auth (Thiruvananthapuram). Strategy Agent recommends ISP CDR subpoena (EIG: 0.412 bits). Tier-2 entity merge pending human approval.',
  hypotheses: DEMO_HYPOTHESES,
  evidence: DEMO_EVIDENCE.map((e) => ({ ...e })),
  evidence_graph: {},
  evidence_gaps: DEMO_GAPS,
  contradictions: DEMO_CONTRADICTIONS,
  completed_actions: [],
  failed_actions: [],
  pending_actions: DEMO_PENDING_ACTIONS,
  candidate_actions: DEMO_RECOMMENDATIONS,
  authorization_log: [],
  audit_log: DEMO_AUDIT_LOGS,
};

export const DEMO_USER: User = {
  id: 'officer-uuid-001',
  email: 'investigator@kpyrios.police.in',
  role: 'investigator',
  created_at: '2026-08-14T00:00:00Z',
};
