import { useEffect, useState } from "react";
import Image from "next/image";

interface CVData {
  cvPath: string;
  thumbnails: string[];
  pageCount: number;
}

const CVPreview = () => {
  const [cvData, setCVData] = useState<CVData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCV = async () => {
      try {
        const response = await fetch("/api/cv-thumbnails");
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to load CV");
        }
        const data = await response.json();
        setCVData(data);
      } catch (error) {
        console.error("Error loading CV:", error);
        setError(error instanceof Error ? error.message : "Failed to load CV");
      } finally {
        setIsLoading(false);
      }
    };

    loadCV();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (!cvData) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="rounded-lg border bg-white p-4">
        <h3 className="mb-4 text-sm font-medium">CV Preview</h3>
        <div className="space-y-4">
          {cvData.thumbnails.map((pageUrl, index) => (
            <div
              key={index}
              className="relative aspect-[1240/1754] w-full overflow-hidden rounded-lg border shadow-sm"
            >
              <Image
                src={pageUrl}
                alt={`CV Page ${index + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 800px"
                priority={index === 0}
              />
              <div className="absolute bottom-2 right-2 rounded-full bg-white/80 px-2 py-1 text-xs font-medium">
                Page {index + 1} of {cvData.pageCount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CVPreview;
