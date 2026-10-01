
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const DEFAULT_AVATAR = "/images/default-avatar.svg";

type UserAvatarProps = {
  src?: string | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

export default function UserAvatar({
  src,
  alt,
  width,
  height,
  className,
}: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  return (
    <Image
      src={src && !imageFailed ? src : DEFAULT_AVATAR}
      alt={alt}
      width={width}
      height={height}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setImageFailed(true)}
    />
  );
}
