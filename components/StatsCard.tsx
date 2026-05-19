export default function StatsCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow transition-transform hover:-translate-y-0.5 hover:shadow-md">
      {icon && <p className="mb-2 text-2xl">{icon}</p>}
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-1 text-3xl font-bold text-blue-900">
        {value.toLocaleString('ko-KR')}
      </p>
    </div>
  );
}
