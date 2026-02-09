import { Trash2 } from 'lucide-react';
import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useRef 
} from "react";

interface Page {
  id: string;
  url: string;
}

interface DocumentStackProps {
  pages: Page[];
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
  onDelete: (index: number) => void;
  onOpenFullscreen: (index: number) => void;
  isFolderOpen: boolean;
}

export function DocumentStack({
  pages,
  currentIndex,
  setCurrentIndex,
  onDelete,
  onOpenFullscreen,
  isFolderOpen,
}: DocumentStackProps) {
  const [flippingIndex, setFlippingIndex] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  
  // Drag to delete states
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPage, setDraggedPage] = useState<number | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null);
  const [showDeleteZone, setShowDeleteZone] = useState(false);
  const [isOverDeleteZone, setIsOverDeleteZone] = useState(false);
  const deleteZoneRef = useRef<HTMLDivElement>(null);

  const nextPage = useCallback(() => {
    if (!isFolderOpen) return;
    if (currentIndex < pages.length - 1) {
      setFlippingIndex(currentIndex);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setFlippingIndex(null);
      }, 450);
    }
  }, [currentIndex, pages.length, setCurrentIndex, isFolderOpen]);

  const prevPage = useCallback(() => {
    if (!isFolderOpen) return;
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex, setCurrentIndex, isFolderOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!showDeleteZone && isFolderOpen) {
      setTouchStart(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null || showDeleteZone || !isFolderOpen) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextPage();
      } else {
        prevPage();
      }
    }
    
    setTouchStart(null);
  };

  const openFullscreen = (index: number) => {
    if (!isDragging && isFolderOpen && index === currentIndex) {
      onOpenFullscreen(index);
    }
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    if (index !== currentIndex || !isFolderOpen) return;
    
    e.preventDefault();
    const timer = setTimeout(() => {
      setShowDeleteZone(true);
      setIsDragging(true);
      setDraggedPage(index);
      setDragPosition({ x: e.clientX, y: e.clientY });
    }, 500);
    
    setHoldTimer(timer);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && draggedPage !== null) {
      setDragPosition({ x: e.clientX, y: e.clientY });
      
      if (deleteZoneRef.current) {
        const rect = deleteZoneRef.current.getBoundingClientRect();
        const isOver = e.clientX >= rect.left && 
                       e.clientX <= rect.right && 
                       e.clientY >= rect.top && 
                       e.clientY <= rect.bottom;
        setIsOverDeleteZone(isOver);
      }
    }
  };

  const handleMouseUp = () => {
    if (holdTimer) {
      clearTimeout(holdTimer);
      setHoldTimer(null);
    }

    if (isDragging && draggedPage !== null && isOverDeleteZone) {
      onDelete(draggedPage);
    }

    setIsDragging(false);
    setDraggedPage(null);
    setShowDeleteZone(false);
    setIsOverDeleteZone(false);
  };

  const handleMouseLeave = () => {
    if (holdTimer) {
      clearTimeout(holdTimer);
      setHoldTimer(null);
    }
  };

  const getPageStyle = (index: number) => {
    const offset = index - currentIndex;

    if (isDragging && draggedPage === index) {
      return {
        transform: `translate(${dragPosition.x - window.innerWidth / 2}px, ${dragPosition.y - window.innerHeight / 2}px) scale(0.9)`,
        zIndex: 9999,
        boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
        opacity: 1,
        cursor: 'grabbing',
      };
    }

    if (flippingIndex === index && isFolderOpen) {
      return {
        transform: `translate(-250%, -50%) rotate(-5deg) translateZ(-20px) scale(0.95)`,
        opacity: 1,
        zIndex: 998,
        transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.45s ease',
      };
    }

    // Default position when folder is closed
    if (!isFolderOpen) {
      const stackOffset = index * 0.5;
      return {
        transform: `translate(-50%, calc(-50% + ${stackOffset}px)) rotate(0deg) scale(0.95)`,
        zIndex: 900 + index,
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        opacity: 1,
      };
    }

    if (offset === 0) {
      return {
        transform: `translate(-50%, -50%) rotate(0deg) translateZ(10px) scale(1)`,
        zIndex: 999,
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        opacity: 1,
      };
    }

    // LEFT STACK
    if (offset < 0) {
      const leftOffset = Math.abs(offset);
      const x = -184 - leftOffset * 1.2;
      const y = -50 + leftOffset * 1.5;
      const rot = -3 - leftOffset * 0.5;
      const z = 5 - leftOffset * 4;

      return {
        transform: `translate(${x}%, ${y}%) rotate(${rot}deg) translateZ(${z}px) scale(${1.0 - leftOffset * 0.02})`,
        zIndex: 1200 - leftOffset,
        boxShadow: `0 ${10 + leftOffset * 2}px ${30 + leftOffset * 3}px rgba(0,0,0,${0.2 + leftOffset * 0.03})`,
        opacity: 1,
      };
    }

    // RIGHT STACK
    const x = -50 + offset * 2.5;
    const y = -50 + offset * 1.8;
    const rot = offset * 0.7;
    const z = 10 - offset * 5;

    return {
      transform: `translate(${x}%, ${y}%) rotate(${rot}deg) translateZ(${z}px) scale(${1 - offset * 0.02})`,
      zIndex: 999 - Math.abs(offset),
      boxShadow: `0 ${12 + offset * 2}px ${35 + offset * 4}px rgba(0,0,0,${0.25 + offset * 0.04})`,
      opacity: 1,
    };
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center pointer-events-none"
      style={{ perspective: '1500px', transformStyle: 'preserve-3d', zIndex: isFolderOpen ? 1200 : 1050 }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {showDeleteZone && (
        <div className="fixed inset-0 bg-black/70 z-[9998] pointer-events-none transition-all duration-300 animate-in fade-in" />
      )}

      <div 
        className="relative w-full h-full max-w-2xl max-h-[85vh] pointer-events-none"
        style={{ transformStyle: 'preserve-3d' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {pages.map((page, index) => (
          <div
            key={page.id}
            className={`absolute left-50 top-70 w-[60%] h-[55%] overflow-hidden pointer-events-auto ${
              index === currentIndex && !isDragging && isFolderOpen ? 'cursor-grab' : ''
            } ${isDragging && draggedPage === index ? 'cursor-grabbing' : ''}`}
            style={{
              ...getPageStyle(index),
              transition: isDragging && draggedPage === index
                ? 'none'
                : flippingIndex === index && isFolderOpen
                ? 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.45s ease'
                : 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: showDeleteZone && draggedPage !== index ? 'brightness(0.3)' : 'none',
            }}
            onMouseDown={(e) => handleMouseDown(e, index)}
            onClick={() => openFullscreen(index)}
          >
            <img 
              src={page.url} 
              alt=""
              className="w-full h-full object-contain pointer-events-none"
              draggable={false}
              style={{ background: 'transparent' }}
            />
          </div>
        ))}
      </div>

      {/* DELETE ZONE - правый край экрана */}
      {showDeleteZone && (
        <div
          ref={deleteZoneRef}
          className={`fixed right-0 top-0 bottom-0 w-48 z-[99999] flex items-center justify-center transition-all duration-300 pointer-events-auto ${
            isOverDeleteZone 
              ? 'bg-red-500/30 border-l-4 border-red-500' 
              : 'bg-white/10 border-l-2 border-white/30'
          } animate-in slide-in-from-right`}
        >
          <div className="flex flex-col items-center gap-4">
            <Trash2 className={`w-12 h-12 transition-all duration-200 ${
              isOverDeleteZone ? 'text-red-500 scale-125' : 'text-white/70'
            }`} />
            <p className={`text-sm text-center transition-colors ${
              isOverDeleteZone ? 'text-red-500' : 'text-white/70'
            }`}>
              {isOverDeleteZone ? 'Отпустите для удаления' : 'Перетащите сюда'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
