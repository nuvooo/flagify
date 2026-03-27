import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  collectDefaultMetrics,
  Histogram,
  register,
  Registry,
} from 'prom-client'

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: Registry

  readonly httpRequestDuration: Histogram<string>

  constructor() {
    this.registry = register

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    })
  }

  onModuleInit() {
    collectDefaultMetrics({ register: this.registry })
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics()
  }

  getContentType(): string {
    return this.registry.contentType
  }
}
