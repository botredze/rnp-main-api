import { OrganizationRepository } from '@/infrastructure/core/typeOrm/repositories/organization.repository';
import { GetUserOrganizationsDto } from '@/shared/dtos/organization.dto';


export class GetOrganizationListUseCase {
  readonly #organizationRepository: OrganizationRepository;

  constructor(
    organizationRepository: OrganizationRepository,
  ) {
    this.#organizationRepository = organizationRepository;
  }

  public async execute(query: GetUserOrganizationsDto): Promise<any> {
    const {userId} = query;

    const params = {
    where: {
      user: {id: userId}
    },
      relations: ['products']
    }
    const userOrganizations = await  this.#organizationRepository.findMany(params)

    if(userOrganizations.length === 0) {
      throw new Error('User Organizations not found')
    }

    return userOrganizations;
  }
}