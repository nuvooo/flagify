import { HttpStatus } from '@nestjs/common'
import { HealthController } from './health.controller'

function createController() {
  const prisma = {
    $runCommandRaw: jest.fn(),
  } as any

  const controller = new HealthController(prisma)
  return { controller, prisma }
}

function createMockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as any
  return res
}

describe('HealthController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('health', () => {
    it('returns ok status with timestamp', () => {
      const { controller } = createController()

      const result = controller.health()

      expect(result.status).toBe('ok')
      expect(result.timestamp).toBeDefined()
    })
  })

  describe('deepHealth', () => {
    it('returns ok with database latency when DB is healthy', async () => {
      const { controller, prisma } = createController()
      prisma.$runCommandRaw.mockResolvedValue({ ok: 1 })
      const res = createMockResponse()

      await controller.deepHealth(res)

      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ok',
          services: expect.objectContaining({
            database: expect.objectContaining({
              status: 'connected',
              latencyMs: expect.any(Number),
            }),
          }),
        })
      )
    })

    it('returns degraded status when DB is unreachable', async () => {
      const { controller, prisma } = createController()
      prisma.$runCommandRaw.mockRejectedValue(new Error('Connection refused'))
      const res = createMockResponse()

      await controller.deepHealth(res)

      expect(res.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'degraded',
          services: expect.objectContaining({
            database: expect.objectContaining({
              status: 'disconnected',
            }),
          }),
        })
      )
    })
  })
})
