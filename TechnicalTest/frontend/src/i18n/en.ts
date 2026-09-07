/**
 * English (en) translations.
 * This is the canonical translation file — all other languages mirror its keys.
 */
export const en = {
  nav: {
    title: 'FoodSearch',
    subtitle: 'Find packaged food products',
    login: 'Login',
    logout: 'Logout',
    subscription: 'Subscription',
  },
  search: {
    placeholder: 'Search for a food product (e.g. "chocolate", "milk")',
    button: 'Search',
    noResults: 'No products found for "{{query}}".',
    noResultsHint: 'Try a different search term or check your spelling.',
    loading: 'Searching...',
    recentTitle: 'Recent Searches',
    resultsCount: '{{count}} products found',
  },
  product: {
    brand: 'Brand',
    categories: 'Categories',
    unknownBrand: 'Unknown brand',
    noCategoryInfo: 'No category information',
    noImage: 'No image available',
  },
  nutrition: {
    title: 'Nutrition Facts',
    per100g: 'per 100g',
    energy: 'Energy',
    fat: 'Fat',
    saturatedFat: 'of which saturates',
    carbohydrates: 'Carbohydrates',
    sugars: 'of which sugars',
    fiber: 'Fibre',
    proteins: 'Protein',
    salt: 'Salt',
    notAvailable: 'Nutrition information not available for this product.',
    unit: {
      kcal: 'kcal',
      g: 'g',
    },
  },
  subscription: {
    required: 'Nutrition details require a subscription',
    description: 'Subscribe to unlock detailed nutritional information for all products.',
    subscribe: 'Subscribe — €4.99/month',
    manage: 'Manage Subscription',
    cancel: 'Cancel Plan',
    status: 'Subscription Status',
    active: 'Active',
    inactive: 'Inactive',
    canceled: 'Canceled',
    successTitle: 'Subscription activated!',
    successMessage: 'You can now view nutrition details on all products.',
    canceledTitle: 'Checkout canceled',
    canceledMessage: 'Your subscription was not changed.',
    pageTitle: 'Your Subscription',
    pageDescription: 'Manage your monthly food data subscription.',
    noSubscription: 'You do not have an active subscription.',
  },
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in to search for food products',
    email: 'Email address',
    password: 'Password',
    button: 'Sign in',
    loggingIn: 'Signing in...',
    error: 'Invalid email or password. Please try again.',
    demoNote: 'Demo credentials',
    demoEmail: 'demo@example.com',
    demoPassword: 'password',
  },
  errors: {
    searchFailed: 'Unable to search products. Please try again.',
    generic: 'Something went wrong. Please try again.',
    networkError: 'Cannot connect to the server. Is the backend running?',
  },
};

export type Translations = typeof en;
