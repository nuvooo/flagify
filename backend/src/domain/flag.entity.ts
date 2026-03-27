import { generateObjectId } from '../shared/utils'

export type FlagType = 'BOOLEAN' | 'STRING' | 'NUMBER' | 'JSON'

export interface FlagProps {
  id: string
  key: string
  name: string
  description: string | null
  type: FlagType
  projectId: string
  organizationId: string
  createdById: string
  createdAt: Date
  updatedAt: Date
}

export class Flag {
  private constructor(private readonly props: FlagProps) {}

  static create(
    props: Omit<FlagProps, 'id' | 'createdAt' | 'updatedAt'>
  ): Flag {
    const now = new Date()
    return new Flag({
      ...props,
      id: generateObjectId(),
      createdAt: now,
      updatedAt: now,
    })
  }

  static reconstitute(props: FlagProps): Flag {
    return new Flag(props)
  }

  get id() {
    return this.props.id
  }
  get key() {
    return this.props.key
  }
  get name() {
    return this.props.name
  }
  get description() {
    return this.props.description
  }
  get type() {
    return this.props.type
  }
  get projectId() {
    return this.props.projectId
  }
  get organizationId() {
    return this.props.organizationId
  }
  get createdById() {
    return this.props.createdById
  }
  get createdAt() {
    return this.props.createdAt
  }
  get updatedAt() {
    return this.props.updatedAt
  }

  update(data: { name?: string; description?: string | null }): Flag {
    return new Flag({
      ...this.props,
      name: data.name ?? this.props.name,
      description: data.description ?? this.props.description,
      updatedAt: new Date(),
    })
  }

  parseValue(value: string): unknown {
    switch (this.props.type) {
      case 'BOOLEAN':
        return value === 'true'
      case 'NUMBER':
        return Number(value)
      case 'JSON':
        return JSON.parse(value)
      default:
        return value
    }
  }
}
