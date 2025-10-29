import { GetUserOrganizationsDto } from '@/shared/dtos/organization.dto';
import { OrganizationRepository } from '@/infrastructure/core/typeOrm/repositories/organization.repository';


export class GetOrganizationByIdUseCase {

  readonly #organizationRepository: OrganizationRepository;

  constructor(organizationRepository: OrganizationRepository) {
    this.#organizationRepository = organizationRepository;
  }

  public async execute(query: GetUserOrganizationsDto): Promise<any>{
    const {userId, organizationId } = query;

    const params = {
      where: {
        user: {id: userId},
        id: organizationId
      },
      relations: ['products', 'stocks']
    }

    const userOrganization = await this.#organizationRepository.findOne(params)

    if(userOrganization === null) {
      throw new Error('User Organization not found')
    }

    return userOrganization
  }
}