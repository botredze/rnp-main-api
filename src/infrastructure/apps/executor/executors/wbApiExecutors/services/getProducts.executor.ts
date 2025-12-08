import { TaskExecutor } from '@/infrastructure/apps/executor/facrory/taskExecutor';
import axios, { AxiosInstance } from 'axios';
import { ProductCard, ProductDto } from '@/infrastructure/apps/executor/executors/wbApiExecutors/types/product.dto';
import { ProductRepository } from '@/infrastructure/core/typeOrm/repositories/product.repository';
import { ProductsModel } from '@/infrastructure/core/typeOrm/models/products.model';
import { stringifyJson } from '@/infrastructure/apps/scheduler/heplers/json.helper';
import { DeepPartial } from 'typeorm';

export class GetProductsExecutor extends TaskExecutor {
  readonly #header = {
    'Content-Type': 'application/json',
  };
  readonly #baseUrl = 'https://content-api.wildberries.ru/content/v2/get/cards/list';

  #axiosService: AxiosInstance;
  readonly #productRepository: ProductRepository;

  constructor(productRepository: ProductRepository) {
    super();
    this.#axiosService = axios.create();
    this.#productRepository = productRepository;
  }

  #initAxios(apiKey: string) {
    this.#axiosService = axios.create({
      headers: {
        ...this.#header,
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  async execute(apiKey: string, organizationId: number): Promise<void> {
    this.#initAxios(apiKey);

    let nmIDCursor = 0;
    const limit = 100;
    let hasMore = true;

    const allProducts: Array<ProductCard> = [];

    try {
      while (hasMore) {
        const body = {
          settings: {
            sort: { ascending: false },
            filter: {
              textSearch: '',
              allowedCategoriesOnly: true,
              tagIDs: [],
              objectIDs: [],
              brands: [],
              imtID: 0,
              withPhoto: -1,
            },
            cursor: {
              nmID: nmIDCursor,
              limit,
            },
          },
        };

        const response = await this.#axiosService.post<ProductDto>(this.#baseUrl, body);
        const data = response.data;

        if (!data?.cards || data.cards.length === 0) {
          hasMore = false;
          break;
        }

        allProducts.push(...data.cards);
        console.log(`Получено ${data.cards.length} товаров, курсор = ${nmIDCursor}`);

        nmIDCursor = data.cursor?.nmID || 0;

        if (data.cards.length < limit) {
          hasMore = false;
        }
      }

      console.log(`Всего получено товаров: ${allProducts.length}`);

      for (const cart of allProducts) {
        const existProduct = await this.#productRepository.exist({ nmID: cart.nmID, organizationId });

        if (existProduct) {
          const existingProduct = await this.#productRepository.findOne({ where: { nmID: cart.nmID } });

          const { id: productId } = existingProduct;

          const updatedProductPayload: DeepPartial<ProductsModel> = {
            nmID: cart.nmID,
            sku: cart.nmUUID,
            vendorCode: cart.vendorCode,
            brand: cart.brand,
            title: cart.title,
            video: cart.video,
            characteristics: stringifyJson(cart.characteristics),
            sizes: stringifyJson(cart.sizes),
            photos: stringifyJson(cart.photos),
            organizationId,
          };
          await this.#productRepository.updateById(productId, updatedProductPayload);
        } else {
          const newProductPayload: DeepPartial<ProductsModel> = {
            nmID: cart.nmID,
            sku: cart.nmUUID,
            vendorCode: cart.vendorCode,
            brand: cart.brand,
            title: cart.title,
            video: cart.video,
            characteristics: stringifyJson(cart.characteristics),
            sizes: stringifyJson(cart.sizes),
            photos: stringifyJson(cart.photos),
            organizationId,
          };
          await this.#productRepository.create(newProductPayload);
        }
      }
    } catch (error) {
      console.error('Ошибка при получении товаров WB:', error);
    }
  }
}
