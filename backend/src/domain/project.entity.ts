export type ProjectType = 'SINGLE' | 'MULTI';

export interface ProjectProps {
  id: string;
  name: string;
  key: string;
  description: string | null;
  type: ProjectType;
  allowedOrigins: string[];
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Project {
  private constructor(private readonly props: ProjectProps) {}

  static create(props: Omit<ProjectProps, 'id' | 'createdAt' | 'updatedAt'>): Project {
    const now = new Date();
    return new Project({
      ...props,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: ProjectProps): Project {
    return new Project(props);
  }

  get id() { return this.props.id; }
  get name() { return this.props.name; }
  get key() { return this.props.key; }
  get description() { return this.props.description; }
  get type() { return this.props.type; }
  get allowedOrigins() { return [...this.props.allowedOrigins]; }
  get organizationId() { return this.props.organizationId; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
  get isMultiTenant() { return this.props.type === 'MULTI'; }

  update(data: { name?: string; description?: string | null; allowedOrigins?: string[] }): Project {
    return new Project({
      ...this.props,
      name: data.name ?? this.props.name,
      description: data.description ?? this.props.description,
      allowedOrigins: data.allowedOrigins ?? this.props.allowedOrigins,
      updatedAt: new Date(),
    });
  }

  isOriginAllowed(origin: string | null): boolean {
    if (this.props.allowedOrigins.length === 0 || this.props.allowedOrigins.includes('*')) {
      return true;
    }
    if (!origin) return false;
    
    try {
      const originDomain = new URL(origin).hostname;
      return this.props.allowedOrigins.some(allowed => {
        if (allowed === origin) return true;
        if (originDomain === allowed || originDomain.endsWith('.' + allowed)) return true;
        if (allowed.startsWith('*.')) {
          const domain = allowed.slice(2);
          return originDomain === domain || originDomain.endsWith('.' + domain);
        }
        return false;
      });
    } catch {
      return false;
    }
  }
}
