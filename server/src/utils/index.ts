export * from './itemHelpers.js'

export const parseId = (value: unknown): number => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseInt(value, 10)
  if (Array.isArray(value) && typeof value[0] === 'string') return parseInt(value[0], 10)
  return NaN
}
