import Badge from '../shared/Badge'

export default function AgentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'green' | 'yellow' | 'red' | 'gray' }> = {
    active: { label: 'Active', variant: 'green' },
    paused: { label: 'Paused', variant: 'yellow' },
    draft: { label: 'Draft', variant: 'gray' },
  }
  const { label, variant } = map[status] || { label: status, variant: 'gray' }
  return <Badge variant={variant}>{label}</Badge>
}
