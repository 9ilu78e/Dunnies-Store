export type CategoryType = "product" | "gift" | "souvenir";

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  _count?: {
    products: number;
  };
}

const categoryRequests = new Map<CategoryType, Promise<Category[]>>();

export function getCategories(type: CategoryType): Promise<Category[]> {
  const cachedRequest = categoryRequests.get(type);
  if (cachedRequest) return cachedRequest;

  const request = fetch(`/api/categories?type=${type}`, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Unable to fetch ${type} categories`);
      }
      const data: { categories?: Category[] } = await response.json();
      return data.categories ?? [];
    })
    .catch((error: unknown) => {
      categoryRequests.delete(type);
      throw error;
    });

  categoryRequests.set(type, request);
  return request;
}
