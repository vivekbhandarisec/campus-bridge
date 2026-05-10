import { revalidatePath, revalidateTag } from 'next/cache';

export const PUBLIC_POSTS_CACHE_TAG = 'public-posts';

export function revalidatePostViews() {
  revalidateTag(PUBLIC_POSTS_CACHE_TAG);
  revalidatePath('/feed');
}
