import clsx from 'clsx'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export default function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          checked ? 'bg-brand-500' : 'bg-gray-300'
        )}
      >
        <span
          className={clsx(
            'pointer-events-none inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5'
          )}
        />
      </button>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  )
}
