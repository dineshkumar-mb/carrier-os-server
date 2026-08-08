import { BaseTenantRepository } from './BaseTenantRepository';
import { Application, IApplicationDocument } from '../models/Application';

export class ApplicationRepository extends BaseTenantRepository<IApplicationDocument> {
  constructor() {
    super(Application);
  }

  public async findByStatus(userId: string, status: string): Promise<IApplicationDocument[]> {
    return this.find(userId, { status });
  }

  public async checkDuplicate(userId: string, jobId: string): Promise<boolean> {
    const existing = await this.model.findOne({ userId, jobId });
    return Boolean(existing);
  }
}

export const applicationRepository = new ApplicationRepository();
