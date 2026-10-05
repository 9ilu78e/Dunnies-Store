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

async function fetchCategories(type: CategoryType): Promise<Category[]> {
  const url = `/api/categories?type=${type}`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
      if (!response.ok) {
        throw new Error(`Unable to fetch ${type} categories (${response.status})`);
      }
      const data: { categories?: Category[] } = await response.json();
      return data.categories ?? [];
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error(`Unable to fetch ${type} categories`);
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }

  throw lastError ?? new Error(`Unable to fetch ${type} categories`);
}

export function getCategories(type: CategoryType): Promise<Category[]> {
  const cachedRequest = categoryRequests.get(type);
  if (cachedRequest) return cachedRequest;

  const request = fetchCategories(type)
    .catch((error: unknown) => {
      categoryRequests.delete(type);
      throw error;
    });

  categoryRequests.set(type, request);
  return request;
}
