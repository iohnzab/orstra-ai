export interface User {
  id: string
  email: string
  full_name?: string
}

export interface Agent {
  id: string
  name: string
  description?: string
  industry?: string
  status: 'active' | 'paused' | 'draft'
  trigger_type?: string
  trigger_config: Record<string, unknown>
  tools_enabled: string[]
  system_prompt?: string
  guardrails: GuardrailRule[]
  version: number
  created_at: string
  updated_at: string
}

export type GuardrailRuleType =
  | 'keyword_escalate'
  | 'confidence_threshold'
  | 'cost_limit'
  | 'custom_instruction'

export interface GuardrailRule {
  id: string
  type: GuardrailRuleType
  keywords?: string[]
  threshold?: number
  max_usd?: number
  instruction?: string
  action?: string
}

export interface Connector {
  id: string
  service: string
  display_name: string
  is_active: boolean
  created_at: string
}

export interface TaskRun {
  id: string
  agent_id: string
  agent_name?: string
  trigger_data: Record<string, unknown>
  status: 'running' | 'completed' | 'escalated' | 'failed'
  intent?: string
  confidence?: number
  tools_called: ToolCall[]
  ai_calls: AiCall[]
  escalated: boolean
  escalation_reason?: string
  output: Record<string, string | number | boolean | null | undefined>
  cost_usd: number
  duration_ms?: number
  error?: string
  created_at: string
}

export interface ToolCall {
  tool: string
  input: string
  output: string
  duration_ms: number
}

export interface AiCall {
  step: string
  model: string
  prompt_tokens: number
  completion_tokens: number
  cost_usd: number
  response: unknown
}

export interface AgentVersion {
  id: string
  version: number
  snapshot: Agent
  created_at: string
}

export interface Document {
  id: string
  filename: string
  chunk_count: number
  created_at: string
}

export interface ToolDefinition {
  name: string
  description: string
  category: string
  icon: string
  requires_connector: string | null
}

export interface DashboardStats {
  total_agents: number
  active_agents: number
  runs_today: number
  success_rate: number
  total_cost_this_month: number
  recent_runs: TaskRun[]
}

export interface ApiError {
  error: string
  code: string
  details: Record<string, unknown>
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user_id: string
  email: string
}
