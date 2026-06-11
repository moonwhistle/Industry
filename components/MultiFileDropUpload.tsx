'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type UploadedFile = {
  url: string;
  name: string;
  type: string;
  size: number;
  path: string;
};

type Props = {
  onUploaded: (files: UploadedFile[]) => void;
};

export default function MultiFileDropUpload({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const uploadFiles = async (files: FileList | File[]) => {
    setUploading(true);

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      alert('로그인 후 파일을 첨부할 수 있습니다.');
      setUploading(false);
      return;
    }

    const newUploadedFiles: UploadedFile[] = [];

    for (const [index, file] of Array.from(files).entries()) {
      const safeFileName = file.name.replace(/\s+/g, '_');
      const filePath = `${userData.user.id}/${Date.now()}-${index}-${safeFileName}`;

      const { error } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (error) {
        alert(`${file.name} 업로드 실패: ${error.message}`);
        continue;
      }

      const { data } = supabase.storage.from('attachments').getPublicUrl(filePath);

      newUploadedFiles.push({
        url: data.publicUrl,
        name: file.name,
        type: file.type,
        size: file.size,
        path: filePath,
      });
    }

    const mergedFiles = [...uploadedFiles, ...newUploadedFiles];

    setUploadedFiles(mergedFiles);
    onUploaded(mergedFiles);
    setUploading(false);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (event.dataTransfer.files.length > 0) {
      await uploadFiles(event.dataTransfer.files);
    }
  };

  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className="cursor-pointer rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 p-8 text-center hover:bg-blue-100"
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={async (event) => {
          if (event.target.files) {
            await uploadFiles(event.target.files);
          }
        }}
      />

      {uploading ? (
        <p className="font-semibold text-blue-800">파일 업로드 중...</p>
      ) : (
        <>
          <p className="font-semibold text-blue-900">
            여러 파일을 드래그하거나 클릭해서 첨부하세요
          </p>
          <p className="mt-2 text-sm text-gray-500">
            이미지, PDF, Word, Excel, PPT 파일 등을 여러 개 첨부할 수 있습니다.
          </p>
        </>
      )}

      {uploadedFiles.length > 0 && (
        <ul className="mt-4 space-y-2 text-left text-sm">
          {uploadedFiles.map((file) => (
            <li key={file.path} className="rounded-lg bg-white p-2 text-gray-700">
              첨부 완료: {file.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
