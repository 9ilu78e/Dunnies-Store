"use client";

import { Suspense } from "react";
import Loader from "@/components/ui/Loader";

interface ProductDetailWrapperProps {
  children: React.ReactNode;
}

function ProductDetailLoading() {
  return <Loader text="Loading product details..." />;
}

export default function ProductDetailWrapper({
  children,
}: ProductDetailWrapperProps) {
  return <Suspense fallback={<ProductDetailLoading />}>{children}</Suspense>;
}
