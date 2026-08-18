import { useMemo } from 'react'

import { Select } from '..'
import type { Location as ItemLocation } from '../../types/location'

interface LocationSelectFieldProps {
  value: number | null
  locations: ItemLocation[] // <-- Use custom type alias
  onChange: (locationId: number | null) => void
}

export default function LocationSelectField({
  value,
  locations,
  onChange,
}: LocationSelectFieldProps) {
  const locationOptions = useMemo(() => {
    return locations.map((loc) => ({
      value: loc.id,
      label: loc.label,
      badge: loc.userId ? '🔒 (Private)' : undefined,
    }))
  }, [locations])

  return (
    <div className="w-full min-w-0">
      <label className="block font-medium text-slate-700 mb-1.5">
        Location <span className="text-rose-500 font-bold">*</span>
      </label>
      <Select<string | number>
        options={locationOptions}
        value={value ?? ''}
        onChange={(val: string | number) => onChange(val ? Number(val) : null)}
        placeholder="Select a location..."
        required
      />
    </div>
  )
}
