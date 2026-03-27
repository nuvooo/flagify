import { TogglelyClient } from '../index'

describe('TogglelyClient Logic', () => {
  let client: TogglelyClient

  beforeEach(() => {
    client = new TogglelyClient({
      apiKey: 'test-key',
      project: 'test-project',
      environment: 'development',
      baseUrl: 'http://localhost:4000',
      autoFetch: false,
    })
  })

  it('should return false if boolean flag is disabled (enabled=false) even if value is true', async () => {
    // Mock the response from getValue
    jest.spyOn(client, 'getValue').mockResolvedValue({
      value: true,
      enabled: false,
      flagType: 'BOOLEAN',
    })

    const isEnabled = await client.isEnabled('test-flag')
    expect(isEnabled).toBe(false)
  })

  it('should return true if boolean flag is enabled (enabled=true) and value is true', async () => {
    jest.spyOn(client, 'getValue').mockResolvedValue({
      value: true,
      enabled: true,
      flagType: 'BOOLEAN',
    })

    const isEnabled = await client.isEnabled('test-flag')
    expect(isEnabled).toBe(true)
  })

  it('should return false if boolean flag is enabled (enabled=true) but value is false', async () => {
    jest.spyOn(client, 'getValue').mockResolvedValue({
      value: false,
      enabled: true,
      flagType: 'BOOLEAN',
    })

    const isEnabled = await client.isEnabled('test-flag')
    expect(isEnabled).toBe(false)
  })

  it('should fall back to enabled status for non-boolean flags (existing behavior)', async () => {
    jest.spyOn(client, 'getValue').mockResolvedValue({
      value: 'some-string',
      enabled: true,
      flagType: 'STRING',
    })

    const isEnabled = await client.isEnabled('test-flag')
    expect(isEnabled).toBe(true)
  })

  it('should return defaultValue if flag is not found', async () => {
    jest.spyOn(client, 'getValue').mockResolvedValue(null)

    const isEnabled = await client.isEnabled('missing-flag', true)
    expect(isEnabled).toBe(true)

    const isEnabled2 = await client.isEnabled('missing-flag', false)
    expect(isEnabled2).toBe(false)
  })
})
