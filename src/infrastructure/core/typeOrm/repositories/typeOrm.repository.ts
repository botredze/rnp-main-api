import { DeepPartial, FindOptionsOrder, FindOptionsSelect, FindOptionsWhere, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

type EntityInput<T> = DeepPartial<T> | Partial<T>;

export abstract class TypeOrmRepository<T extends { id?: number }> {
  protected readonly repository: Repository<T>;

  constructor(repository: Repository<T>) {
    this.repository = repository;
  }

  async count(where?: FindOptionsWhere<T>, withDeleted: boolean = false): Promise<number> {
    return this.repository.count({ where, withDeleted });
  }

  async findMany(params: {
    where?: FindOptionsWhere<T>;
    relations?: Array<string>;
    select?: FindOptionsSelect<T>;
    order?: FindOptionsOrder<T>;
    take?: number;
    skip?: number;
    withDeleted?: boolean;
  }): Promise<T[]> {
    const { where, relations, select, order, take, skip, withDeleted } = params;
    return this.repository.find({
      where,
      relations,
      select,
      order,
      take,
      skip,
      withDeleted,
    });
  }

  async findOne(params: {
    where: FindOptionsWhere<T>;
    relations?: Array<string>;
    select?: FindOptionsSelect<T>;
    withDeleted?: boolean;
  }): Promise<T | null> {
    const { where, relations, select, withDeleted } = params;
    return this.repository.findOne({ where, relations, select, withDeleted });
  }

  async findOneById(
    id: number,
    relations?: Array<string>,
    select?: FindOptionsSelect<T>,
    withDeleted: boolean = false,
  ): Promise<T | null> {
    return this.repository.findOne({
      where: { id } as FindOptionsWhere<T>,
      relations,
      select,
      withDeleted,
    });
  }

  async updateById(id: number, data: DeepPartial<T>): Promise<T | null> {
    await this.repository.update({ id } as FindOptionsWhere<T>, data as QueryDeepPartialEntity<T>);

    return this.repository.findOne({
      where: { id } as FindOptionsWhere<T>,
    });
  }

  async exist(where: FindOptionsWhere<T>, withDeleted: boolean = false): Promise<boolean> {
    return this.repository.exist({ where, withDeleted });
  }

  async create(data: DeepPartial<T>, relations?: Array<string>): Promise<T> {
    const entity = this.repository.create(data as any as DeepPartial<T>);

    const saved = await this.repository.save(entity as any as DeepPartial<T>);

    if (relations && relations.length > 0) {
      return (await this.repository.findOne({
        where: { id: (saved as any).id } as FindOptionsWhere<T>,
        relations,
      })) as T;
    }

    return saved as T;
  }

  async delete(where: FindOptionsWhere<T>, softDelete: boolean = true): Promise<boolean> {
    if (softDelete) {
      const result = await this.repository.softDelete(where);
      return (result.affected ?? 0) > 0;
    } else {
      const result = await this.repository.delete(where);
      return (result.affected ?? 0) > 0;
    }
  }

  async deleteById(id: number, softDelete: boolean = true): Promise<boolean> {
    return this.delete({ id } as FindOptionsWhere<T>, softDelete);
  }
}
