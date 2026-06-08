import { Link } from '@/i18n/navigation';

type PopularPost = { id: number; title: string; like_count: number };

export default function PopularBanner({
  title,
  emptyLabel,
  posts,
}: {
  title: string;
  emptyLabel: string;
  posts: PopularPost[];
}) {
  return (
    <section className="rounded-2xl bg-gradient-to-r from-blue-900 to-blue-700 p-6 text-white shadow">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
        <span>🔥</span>
        {title}
      </h2>

      {posts.length > 0 ? (
        <ol className="space-y-2">
          {posts.map((post, index) => (
            <li key={post.id}>
              <Link
                href={`/post/${post.id}`}
                className="flex items-center gap-3 text-sm hover:underline"
              >
                <span className="w-5 shrink-0 text-center font-bold text-yellow-300">
                  {index + 1}
                </span>
                <span className="truncate">{post.title}</span>
                <span className="ml-auto shrink-0 text-xs text-blue-100">
                  ❤ {post.like_count}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-blue-100">{emptyLabel}</p>
      )}
    </section>
  );
}
