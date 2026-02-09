import { getImagePath } from "./PlaceholderImages";

interface FolderViewerProps {
  isOpen: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

export function FolderViewer({ isOpen, onToggle, children }: FolderViewerProps) {
  return (
    <div 
      className="fixed w-[440px] h-[560px] left-[34vw] group folder-root"
      style={{ 
        perspective: "2600px",
        transformStyle: "preserve-3d",
        zIndex: 1100,
        scale: "1.50",
      }}
    >
      {/* Задняя часть папки */}
      <div 
        className="absolute top-0 left-[6.5px] w-full h-full bg-cover bg-center z-[1]"
        style={{ 
          scale: "1.03",
          backgroundImage: `url(${getImagePath("folder_back.png")})`,
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Документы внутри папки */}
      <div 
        className="absolute inset-0 z-[500] pointer-events-none"
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
      </div>

      {/* Крышка */}
      <div 
        className={`absolute inset-0 z-[1000] cursor-pointer folder-cover ${isOpen ? "open" : ""}`}
        onClick={onToggle}
      >
        {/* Внешняя сторона крышки */}
        <div 
          className="absolute inset-0 bg-cover bg-center folder-cover-front"
          style={{ 
            backgroundImage: `url(${getImagePath("folder_cover.png")})`,
            transform: "scaleX(-1)",
          }}
        />

        {/* Внутренняя сторона крышки */}
        <div 
          className="absolute inset-0 bg-cover bg-center folder-cover-inside"
          style={{ 
            backgroundImage: `url(${getImagePath("folder_inside.png")})`,
            transform: "rotateY(180deg)",
          }}
        />
      </div>

      {/* CSS */}
      <style>
        {`
          /* Папка при наведении слегка поднимается */
          .folder-root:hover {
            transform: translateY(-18px) scale(1.08);
            transition: transform 2.6s ease;
          }

          /* Крышка — закрыта */
          .folder-cover {
            transform-origin: left center;
            transform-style: preserve-3d;
            transition: transform 2.8s cubic-bezier(.25,.8,.25,1);
            transform: rotateY(0deg);
          }

          /* При наведении — лёгкое приоткрытие */
          .folder-root:hover .folder-cover:not(.open) {
            transform: rotateY(-22deg);
          }

          /* При клике — полностью открыта */
          .folder-cover.open {
            transform: rotateY(-180deg);
          }

          /* Лицевая сторона крышки */
          .folder-cover-front {
            backface-visibility: hidden;
            z-index: 2;
          }

          /* Внутренняя сторона крышки */
          .folder-cover-inside {
            backface-visibility: hidden;
            z-index: 1;
          }
        `}
      </style>
    </div>
  );
}
