import { redirect } from "next/navigation";

type CategoryDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CategoryDetailPage({
  params,
}: CategoryDetailPageProps) {
  const { id } = await params;
  
  redirect(`/product?category=${id}`);
}
