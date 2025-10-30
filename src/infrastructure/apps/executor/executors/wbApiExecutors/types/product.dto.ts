export interface IPaginateCursor {
  updatedAt: string; // Дата/время обновления для следующего запроса
  nmID: number;      // Артикул WB, с которого начинать следующий запрос
  total: number;     // Общее количество возвращённых карточек товаров
}

// Интерфейс для отдельной карточки товара
export interface ProductCard {
  nmID: number;
  imtID: number;
  nmUUID: string;
  subjectID?: number;
  subjectName?: string;
  vendorCode: string;
  brand: string;
  title: string;
  description?: string;
  needKiz?: boolean;
  photos?: Array<{ url: string; type?: string }>;
  video?: string;
  wholesale?: any;
  dimensions?: any;
  characteristics?: Array<any>;
  sizes?: Array<any>;
  tags?: Array<any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductDto {
  cards: Array<ProductCard>;
  cursor: IPaginateCursor;
}
