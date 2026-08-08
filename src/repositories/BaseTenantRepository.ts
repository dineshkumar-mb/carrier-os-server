import mongoose, { Model, Document } from 'mongoose';
import { TenantContext } from '../core/tenant/TenantContext';

export abstract class BaseTenantRepository<T extends Document> {
  constructor(protected readonly model: Model<T>) {}

  private isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  protected tenantFilter(context: TenantContext): Record<string, any> {
    if (!context || !context.userId) {
      throw new Error('[BaseTenantRepository] Missing or unauthenticated TenantContext.');
    }
    return {
      userId: context.userId,
      ...(context.tenantId ? { tenantId: context.tenantId } : {})
    };
  }

  public async findById(context: TenantContext | string, id: string): Promise<T | null> {
    if (!id || !this.isConnected()) return null;
    const filter = typeof context === 'string'
      ? { userId: context }
      : this.tenantFilter(context);

    return this.model.findOne({ _id: id, ...filter } as any);
  }

  public async find(context: TenantContext | string, filter: Record<string, any> = {}): Promise<T[]> {
    if (!this.isConnected()) return [];
    const tenantFilter = typeof context === 'string'
      ? { userId: context }
      : this.tenantFilter(context);

    return this.model.find({ ...filter, ...tenantFilter } as any);
  }

  public async updateOne(context: TenantContext | string, id: string, updateData: Record<string, any>): Promise<T | null> {
    if (!id || !this.isConnected()) return null;
    const filter = typeof context === 'string'
      ? { userId: context }
      : this.tenantFilter(context);

    return this.model.findOneAndUpdate(
      { _id: id, ...filter } as any,
      { $set: updateData },
      { new: true }
    );
  }

  public async deleteOne(context: TenantContext | string, id: string): Promise<boolean> {
    if (!id || !this.isConnected()) return false;
    const filter = typeof context === 'string'
      ? { userId: context }
      : this.tenantFilter(context);

    const res = await this.model.deleteOne({ _id: id, ...filter } as any);
    return res.deletedCount > 0;
  }
}
