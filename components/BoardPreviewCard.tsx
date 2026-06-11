import { Link } from '@/i18n/navigation';

type PreviewPost = { id: number; title: string; created_at: string };

export default function BoardPreviewCard({
  title,
  href,
  seeAllLabel,
  emptyLabel,
  posts,
  dateLocale,
}: {
  title: string;
  href: string;
  seeAllLabel: string;
  emptyLabel: string;
  posts: PreviewPost[];
  dateLocale: string;
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        <Link href={href} className="text-xs text-blue-600 hover:underline">
          {seeAllLabel}
        </Link>
      </div>

      {posts.length > 0 ? (
        <ul className="divide-y divide-gray-100">
          {posts.map((post) => (
            <li key={post.id} className="py-2">
              <Link
                href={`/post/${post.id}`}
                className="flex items-center justify-between gap-3 text-sm hover:text-blue-700"
              >
                <span className="truncate text-gray-700">{post.title}</span>
                <span className="shrink-0 text-xs text-gray-400">
                  {new Date(post.created_at).toLocaleDateString(dateLocale)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400">{emptyLabel}</p>
      )}
    </section>
  );
}
