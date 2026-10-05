"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductRecord } from "@/Data/products";
import { useWishlist } from "@/hooks/useWishlist";
import { getBaseUrl } from "@/utils/url";
import { useAuth } from "@/hooks/useAuth";

export function useProductDetailEngagement(product: ProductRecord) {
  const router = useRouter();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [copied, setCopied] = useState(false);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [togglingLike, setTogglingLike] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const redirectToLogin = () => {
    sessionStorage.setItem(
      "dunnis:returnTo",
      `${window.location.pathname}${window.location.search}`
    );
    router.push("/login");
  };

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        setLoadingLikes(true);
        const url = new URL(`${getBaseUrl()}/api/products/${product.id}/likes`);
        if (user?.uid) url.searchParams.set("userId", user.uid);
        const response = await fetch(url.toString());
        if (response.ok) {
          const data = await response.json();
          setLikes(data.likeCount || 0);
          setIsLiked(data.isLikedByUser || false);
        } else {
          setLikes(0);
          setIsLiked(false);
        }
      } catch (error) {
        console.error("Error fetching likes:", error);
        setLikes(0);
        setIsLiked(false);
      } finally {
        setLoadingLikes(false);
      }
    };

    if (isClient) {
      fetchLikes();
    }
  }, [product.id, user?.uid, isClient]);

  const handleToggleLike = async () => {
    if (authLoading) return;
    if (isAdmin) {
      alert("Admin users cannot like products");
      return;
    }
    if (!isAuthenticated || !user) {
      redirectToLogin();
      return;
    }

    try {
      setTogglingLike(true);
      const response = await fetch(
        `${getBaseUrl()}/api/products/${product.id}/likes`,
        { method: "POST" }
      );
      if (response.status === 401) {
        redirectToLogin();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setLikes(data.likeCount || 0);
        setIsLiked(data.liked || false);
      } else {
        console.error("Failed to toggle like");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setTogglingLike(false);
    }
  };

  const handleWishlistToggle = () => {
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      href: product.href,
    });
  };

  const handleCopyLink = async () => {
    if (typeof window === "undefined" || !window?.location) return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${product.href}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link", error);
    }
  };

  return {
    user,
    isAuthenticated,
    authLoading,
    copied,
    likes,
    isLiked,
    loadingLikes,
    togglingLike,
    wishlisted: isInWishlist(product.id),
    handleToggleLike,
    handleWishlistToggle,
    handleCopyLink,
  };
}
