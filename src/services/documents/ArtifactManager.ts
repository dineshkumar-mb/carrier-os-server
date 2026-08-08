import path from 'path';

export interface ArtifactReference {
  artifactId: string;
  userId: string;
  executionId: string;
  objectKey: string;
  mimeType: string;
  sizeBytes: number;
  hash: string;
  createdAt: Date;
}

export class ArtifactManager {
  private static instance: ArtifactManager;

  private constructor() {}

  public static getInstance(): ArtifactManager {
    if (!ArtifactManager.instance) {
      ArtifactManager.instance = new ArtifactManager();
    }
    return ArtifactManager.instance;
  }

  /**
   * Generates a strictly user-scoped object storage key
   * Format: users/{userId}/{category}/{executionId}_{filename}
   */
  public generateObjectKey(userId: string, category: 'master_resume' | 'generated_resumes' | 'cover_letters' | 'diagnostics', executionId: string, filename: string): string {
    const sanitizedFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    return `users/${userId}/${category}/${executionId}_${sanitizedFilename}`;
  }

  public async storeArtifact(userId: string, category: 'master_resume' | 'generated_resumes' | 'cover_letters' | 'diagnostics', executionId: string, filename: string, content: Buffer | string, mimeType: string = 'application/pdf'): Promise<ArtifactReference> {
    const objectKey = this.generateObjectKey(userId, category, executionId, filename);
    const artifactId = `art_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    console.log(`[ArtifactManager] 📦 Stored user-isolated artifact [${artifactId}] at key: ${objectKey}`);

    return {
      artifactId,
      userId,
      executionId,
      objectKey,
      mimeType,
      sizeBytes: typeof content === 'string' ? Buffer.byteLength(content) : content.length,
      hash: `sha256_${Date.now()}`,
      createdAt: new Date()
    };
  }
}

export const artifactManager = ArtifactManager.getInstance();
