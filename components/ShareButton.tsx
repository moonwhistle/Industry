'use client';

export default function ShareButton({
  title,
  url,
}: {
  title: string;
  url?: string;
}) {
  const handleShare = async () => {
    const shareUrl = url || window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: title,
          url: shareUrl,
        });
      } catch {
        return;
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert('게시글 링크가 복사되었습니다.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
    >
      공유하기
    </button>
  );
}
