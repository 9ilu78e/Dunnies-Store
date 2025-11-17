export const defaultNavigation = [
  {
    label: 'Home',
    href: '/',
  },
  {
    label: 'Categories',
    children: [
      {
        label: 'Birthday Gifts',
        href: '/categories/birthday',
      },
      {
        label: 'Jewelry',
        href: '/categories/jewelry',
      },
      {
        label: 'Bags',
        href: '/categories/bags',
      },
      {
        label: 'Plushies',
        href: '/categories/plushies',
      },
    ],
  },
  {
    label: 'Collections',
    children: [
      {
        label: 'New Arrivals',
        href: '/collections/new-arrivals',
      },
      {
        label: 'Best Sellers',
        href: '/collections/best-sellers',
      },
      {
        label: 'Sale',
        href: '/collections/sale',
      },
      {
        label: 'Trending',
        href: '/collections/trending',
      },
    ],
  },
  {
    label: 'Special Offers',
    children: [
      {
        label: '🎉 Flash Sale',
        href: '/offers/flash-sale',
      },
      {
        label: '⭐ Premium Members',
        href: '/offers/premium',
      },
      {
        label: '🎁 Gift Bundles',
        href: '/offers/bundles',
      },
      {
        label: '💝 Free Shipping',
        href: '/offers/free-shipping',
      },
    ],
  },
  {
    label: 'About',
    href: '/about',
  },
  {
    label: 'Contact',
    href: '/contact',
  },
]

export type NavItem = (typeof defaultNavigation)[number]
