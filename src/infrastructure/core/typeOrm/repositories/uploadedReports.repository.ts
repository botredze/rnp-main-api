// infrastructure/core/typeOrm/repositories/uploadedReports.repository.ts
import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadedReportModel } from '@/infrastructure/core/typeOrm/models/uploadedReports.model';

export class UploadedReportsRepository extends TypeOrmRepository<UploadedReportModel> {
  constructor(@InjectRepository(UploadedReportModel) repository: Repository<UploadedReportModel>) {
    super(repository);
  }

  /**
   * Проверить существование файла по хешу
   */
  async fileExists(params: {
    organizationId: number;
    fileHash: string;
    reportType: string;
  }): Promise<UploadedReportModel | null> {
    const { organizationId, fileHash, reportType } = params;

    return await this.repository.findOne({
      where: {
        organizationId,
        fileHash,
        reportType,
      },
    });
  }

  async getUploadHistory(params: {
    organizationId: number;
    reportType?: string;
    limit?: number;
  }): Promise<UploadedReportModel[]> {
    const { organizationId, reportType, limit = 50 } = params;

    const query = this.repository
      .createQueryBuilder('upload')
      .where('upload.organizationId = :organizationId', { organizationId });

    if (reportType) {
      query.andWhere('upload.reportType = :reportType', { reportType });
    }

    return await query.orderBy('upload.uploadedAt', 'DESC').limit(limit).getMany();
  }
}
