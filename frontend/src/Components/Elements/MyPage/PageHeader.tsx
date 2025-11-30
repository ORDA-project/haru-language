import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export default function PageHeader({
  title,
  showBackButton = false,
  onBackClick,
}: PageHeaderProps) {
  return (
    <div className="pt-6 pb-4">
      <div className="flex items-center">
        {showBackButton && (
          <button
            onClick={onBackClick}
            className="text-black mr-4 text-2xl hover:opacity-70 transition-opacity"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <span className="text-black font-bold text-2xl">{title}</span>
      </div>
    </div>
  );
}
