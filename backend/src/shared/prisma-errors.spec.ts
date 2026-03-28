import { isPrismaUniqueConstraintError } from './prisma-errors'

describe('isPrismaUniqueConstraintError', () => {
  it('returns true for P2002 error', () => {
    expect(isPrismaUniqueConstraintError({ code: 'P2002' })).toBe(true)
  })

  it('returns false for other Prisma error codes', () => {
    expect(isPrismaUniqueConstraintError({ code: 'P2025' })).toBe(false)
  })

  it('returns false for null', () => {
    expect(isPrismaUniqueConstraintError(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isPrismaUniqueConstraintError(undefined)).toBe(false)
  })

  it('returns false for non-object', () => {
    expect(isPrismaUniqueConstraintError('P2002')).toBe(false)
  })
})
