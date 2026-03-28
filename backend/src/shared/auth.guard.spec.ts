import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'
import * as jwt from 'jsonwebtoken'
import { AuthGuard } from './auth.guard'

jest.mock('jsonwebtoken')

const mockJwt = jwt as jest.Mocked<typeof jwt>

function createGuard() {
  const config = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret'
      return undefined
    }),
  } as any

  const guard = new AuthGuard(config)
  return { guard, config }
}

function createMockContext(authHeader?: string) {
  const request = {
    headers: {
      authorization: authHeader,
    },
    user: undefined as any,
  }

  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as any

  return { context, request }
}

describe('AuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('allows valid token and sets user on request', () => {
    const { guard } = createGuard()
    const { context, request } = createMockContext('Bearer valid-token')
    const decoded = { sub: 'user-1', email: 'test@example.com' }
    mockJwt.verify.mockReturnValue(decoded as any)

    const result = guard.canActivate(context)

    expect(result).toBe(true)
    expect(request.user).toEqual(decoded)
    expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret')
  })

  it('throws when no authorization header', () => {
    const { guard } = createGuard()
    const { context } = createMockContext(undefined)

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException)
  })

  it('throws when authorization header does not start with Bearer', () => {
    const { guard } = createGuard()
    const { context } = createMockContext('Basic abc123')

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException)
  })

  it('throws when token is invalid', () => {
    const { guard } = createGuard()
    const { context } = createMockContext('Bearer invalid-token')
    mockJwt.verify.mockImplementation(() => {
      throw new Error('invalid token')
    })

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException)
  })

  it('throws InternalServerError when JWT_SECRET is not configured', () => {
    const config = {
      get: jest.fn().mockReturnValue(undefined),
    } as any
    const guard = new AuthGuard(config)
    const { context } = createMockContext('Bearer some-token')

    expect(() => guard.canActivate(context)).toThrow(
      InternalServerErrorException
    )
  })
})
