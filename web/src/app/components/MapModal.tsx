import { useState, useEffect, useRef } from 'react';
import { X, Radiation, Skull, Zap, Pen, Eraser, ZoomIn, ZoomOut, AlertTriangle, Crosshair, Flag, Home } from 'lucide-react';

interface Marker {
  id: string;
  x: number;
  y: number;
  type: 'radiation' | 'mutant' | 'anomaly' | 'danger' | 'target' | 'base' | 'checkpoint';
  note: string;
}

interface DrawPath {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MapModal({ isOpen, onClose }: MapModalProps) {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [drawPaths, setDrawPaths] = useState<DrawPath[]>([]);
  const [selectedTool, setSelectedTool] = useState<'radiation' | 'mutant' | 'anomaly' | 'danger' | 'target' | 'base' | 'checkpoint' | 'pen' | 'eraser' | null>(null);
  const [editingMarker, setEditingMarker] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [penColor, setPenColor] = useState('#ff0000');
  const [penWidth, setPenWidth] = useState(3);
  const [eraserWidth, setEraserWidth] = useState(10);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  const mapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('mapMarkers');
    if (stored) {
      try {
        setMarkers(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse map markers:', e);
      }
    }

    const storedPaths = localStorage.getItem('mapDrawPaths');
    if (storedPaths) {
      try {
        setDrawPaths(JSON.parse(storedPaths));
      } catch (e) {
        console.error('Failed to parse draw paths:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mapMarkers', JSON.stringify(markers));
  }, [markers]);

  useEffect(() => {
    localStorage.setItem('mapDrawPaths', JSON.stringify(drawPaths));
  }, [drawPaths]);

  // Redraw canvas when paths or zoom/pan change
  useEffect(() => {
    if (!canvasRef.current || !mapRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = mapRef.current.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawPaths.forEach(path => {
      if (path.points.length < 2) return;

      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.width * zoom;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      const firstPoint = path.points[0];
      ctx.moveTo(
        (firstPoint.x / 100 * canvas.width) * zoom + panOffset.x,
        (firstPoint.y / 100 * canvas.height) * zoom + panOffset.y
      );
      
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(
          (path.points[i].x / 100 * canvas.width) * zoom + panOffset.x,
          (path.points[i].y / 100 * canvas.height) * zoom + panOffset.y
        );
      }
      
      ctx.stroke();
    });
  }, [drawPaths, zoom, panOffset]);

  // Wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!isOpen || !mapContainerRef.current) return;
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.max(0.5, Math.min(5, prev + delta)));
    };

    const container = mapContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [isOpen]);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    if (selectedTool === 'pen' || selectedTool === 'eraser' || isPanning) return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left - panOffset.x) / (rect.width * zoom)) * 100;
    const y = ((e.clientY - rect.top - panOffset.y) / (rect.height * zoom)) * 100;

    if (selectedTool && ['radiation', 'mutant', 'anomaly', 'danger', 'target', 'base', 'checkpoint'].includes(selectedTool)) {
      const newMarker: Marker = {
        id: `marker-${Date.now()}`,
        x,
        y,
        type: selectedTool as Marker['type'],
        note: ''
      };

      setMarkers(prev => [...prev, newMarker]);
      setSelectedTool(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;

    // Middle mouse or space key + left click = pan
    if (e.button === 1 || (!selectedTool && e.button === 0)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    if (selectedTool !== 'pen' && selectedTool !== 'eraser') return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left - panOffset.x) / (rect.width * zoom)) * 100;
    const y = ((e.clientY - rect.top - panOffset.y) / (rect.height * zoom)) * 100;

    setIsDrawing(true);
    setCurrentPath([{ x, y }]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    if (!isDrawing || !mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left - panOffset.x) / (rect.width * zoom)) * 100;
    const y = ((e.clientY - rect.top - panOffset.y) / (rect.height * zoom)) * 100;

    setCurrentPath(prev => [...prev, { x, y }]);

    // Draw on canvas in real-time
    if (canvasRef.current && currentPath.length > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const lastPoint = currentPath[currentPath.length - 1];
      
      if (selectedTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = eraserWidth * zoom;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penWidth * zoom;
      }
      
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(
        (lastPoint.x / 100 * canvas.width) * zoom + panOffset.x,
        (lastPoint.y / 100 * canvas.height) * zoom + panOffset.y
      );
      ctx.lineTo(
        (x / 100 * canvas.width) * zoom + panOffset.x,
        (y / 100 * canvas.height) * zoom + panOffset.y
      );
      ctx.stroke();
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!isDrawing) return;

    if (currentPath.length > 1) {
      if (selectedTool === 'eraser') {
        const newPaths = drawPaths.filter(path => {
          return !pathsIntersect(path.points, currentPath, eraserWidth);
        });
        setDrawPaths(newPaths);
      } else {
        const newPath: DrawPath = {
          id: `path-${Date.now()}`,
          points: currentPath,
          color: penColor,
          width: penWidth
        };
        setDrawPaths(prev => [...prev, newPath]);
      }
    }

    setIsDrawing(false);
    setCurrentPath([]);
  };

  const pathsIntersect = (path1: {x: number, y: number}[], path2: {x: number, y: number}[], eraserWidth: number) => {
    for (let i = 0; i < path1.length - 1; i++) {
      for (let j = 0; j < path2.length - 1; j++) {
        const distance = Math.sqrt(
          Math.pow(path1[i].x - path2[j].x, 2) + 
          Math.pow(path1[i].y - path2[j].y, 2)
        );
        if (distance < eraserWidth / 5) {
          return true;
        }
      }
    }
    return false;
  };

  const handleMarkerClick = (e: React.MouseEvent, markerId: string) => {
    e.stopPropagation();
    const marker = markers.find(m => m.id === markerId);
    if (marker) {
      setEditingMarker(markerId);
      setNoteText(marker.note);
    }
  };

  const saveNote = () => {
    if (editingMarker) {
      setMarkers(prev => prev.map(m => 
        m.id === editingMarker ? { ...m, note: noteText } : m
      ));
      setEditingMarker(null);
      setNoteText('');
    }
  };

  const deleteMarker = (markerId: string) => {
    setMarkers(prev => prev.filter(m => m.id !== markerId));
    setEditingMarker(null);
  };

  const deletePath = (pathId: string) => {
    setDrawPaths(prev => prev.filter(p => p.id !== pathId));
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.3, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.3, 0.5));
  };

  const resetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const panLeft = () => setPanOffset(prev => ({ ...prev, x: prev.x + 100 }));
  const panRight = () => setPanOffset(prev => ({ ...prev, x: prev.x - 100 }));
  const panUp = () => setPanOffset(prev => ({ ...prev, y: prev.y + 100 }));
  const panDown = () => setPanOffset(prev => ({ ...prev, y: prev.y - 100 }));

  const getMarkerIcon = (type: Marker['type']) => {
    switch (type) {
      case 'radiation':
        return <Radiation className="w-6 h-6" />;
      case 'mutant':
        return <Skull className="w-6 h-6" />;
      case 'anomaly':
        return <Zap className="w-6 h-6" />;
      case 'danger':
        return <AlertTriangle className="w-6 h-6" />;
      case 'target':
        return <Crosshair className="w-6 h-6" />;
      case 'base':
        return <Home className="w-6 h-6" />;
      case 'checkpoint':
        return <Flag className="w-6 h-6" />;
    }
  };

  const getMarkerColor = (type: Marker['type']) => {
    switch (type) {
      case 'radiation':
        return 'bg-yellow-500 border-yellow-600 text-yellow-900';
      case 'mutant':
        return 'bg-red-500 border-red-600 text-white';
      case 'anomaly':
        return 'bg-purple-500 border-purple-600 text-white';
      case 'danger':
        return 'bg-orange-500 border-orange-600 text-white';
      case 'target':
        return 'bg-blue-500 border-blue-600 text-white';
      case 'base':
        return 'bg-green-500 border-green-600 text-white';
      case 'checkpoint':
        return 'bg-cyan-500 border-cyan-600 text-white';
    }
  };

  const getMarkerName = (type: Marker['type']) => {
    switch (type) {
      case 'radiation': return 'РАДИАЦИЯ';
      case 'mutant': return 'МУТАНТЫ';
      case 'anomaly': return 'АНОМАЛИИ';
      case 'danger': return 'ОПАСНОСТЬ';
      case 'target': return 'ЦЕЛЬ';
      case 'base': return 'БАЗА';
      case 'checkpoint': return 'ТОЧКА';
    }
  };

  if (!isOpen) return null;

  const markerTypes: Marker['type'][] = ['radiation', 'mutant', 'anomaly', 'danger', 'target', 'base', 'checkpoint'];

  return (
    <div 
      ref={mapContainerRef}
      className="fixed inset-0 bg-black/95 flex items-center justify-center z-[99999] pointer-events-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Close Button - в самом углу */}
      <button 
        className="fixed top-0 right-0 w-10 h-10 bg-red-900/70 border-b-2 border-l-2 border-red-700 hover:bg-red-800/90 transition-all flex items-center justify-center z-[100005]"
        onClick={onClose}
      >
        <X className="w-5 h-5 text-red-400" />
      </button>

      {/* Toolbar - Left edge */}
      <div className="fixed top-0 left-0 bottom-0 bg-[#0f0f0f]/95 border-r-2 border-[#2a4a2a] p-3 flex flex-col gap-2 z-[100004] max-h-screen overflow-y-auto w-48">
        <div className="text-green-400 font-mono text-xs mb-2 border-b border-[#2a4a2a] pb-2 text-center">МАРКЕРЫ</div>
        
        {markerTypes.map(type => (
          <button
            key={type}
            onClick={() => setSelectedTool(selectedTool === type ? null : type)}
            className={`px-3 py-2 rounded-lg border-2 transition-all font-mono text-xs flex items-center gap-2 justify-center ${
              selectedTool === type
                ? `${getMarkerColor(type)} opacity-80`
                : 'bg-[#1a1a1a] border-[#2a4a2a] text-gray-400 hover:border-[#3a5a3a]'
            }`}
          >
            {getMarkerIcon(type)}
            <span className="text-center">{getMarkerName(type)}</span>
          </button>
        ))}

        <div className="h-px bg-[#2a4a2a] my-2" />
        <div className="text-green-400 font-mono text-xs mb-2 border-b border-[#2a4a2a] pb-2 text-center">ИНСТРУМЕНТЫ</div>

        <button
          onClick={() => setSelectedTool(selectedTool === 'pen' ? null : 'pen')}
          className={`px-3 py-2 rounded-lg border-2 transition-all font-mono text-xs flex items-center gap-2 justify-center ${
            selectedTool === 'pen'
              ? 'bg-blue-500/20 border-blue-500 text-blue-400'
              : 'bg-[#1a1a1a] border-[#2a4a2a] text-gray-400 hover:border-[#3a5a3a]'
          }`}
        >
          <Pen className="w-4 h-4" />
          КАРАНДАШ
        </button>

        {selectedTool === 'pen' && (
          <div className="space-y-2 px-2">
            <input 
              type="color"
              value={penColor}
              onChange={(e) => setPenColor(e.target.value)}
              className="w-full h-6 rounded cursor-pointer"
            />
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs font-mono">Размер:</span>
              <input 
                type="range"
                min="1"
                max="10"
                value={penWidth}
                onChange={(e) => setPenWidth(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-green-400 text-xs font-mono">{penWidth}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => setSelectedTool(selectedTool === 'eraser' ? null : 'eraser')}
          className={`px-3 py-2 rounded-lg border-2 transition-all font-mono text-xs flex items-center gap-2 justify-center ${
            selectedTool === 'eraser'
              ? 'bg-gray-500/20 border-gray-500 text-gray-300'
              : 'bg-[#1a1a1a] border-[#2a4a2a] text-gray-400 hover:border-[#3a5a3a]'
          }`}
        >
          <Eraser className="w-4 h-4" />
          ЛАСТИК
        </button>

        {selectedTool === 'eraser' && (
          <div className="space-y-2 px-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs font-mono">Размер:</span>
              <input 
                type="range"
                min="5"
                max="30"
                value={eraserWidth}
                onChange={(e) => setEraserWidth(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-green-400 text-xs font-mono">{eraserWidth}</span>
            </div>
          </div>
        )}
      </div>

      {/* Zoom Controls - единый стиль */}
      <div className="fixed bottom-6 right-6 bg-[#0f0f0f]/95 border-2 border-[#2a4a2a] rounded-lg p-2 flex flex-col gap-2 z-[100004]">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-[#1a1a1a] border border-[#2a4a2a] rounded hover:border-[#3a5a3a] hover:bg-[#2a2a2a] transition-all"
        >
          <ZoomIn className="w-5 h-5 text-green-400" />
        </button>
        <button
          onClick={resetZoom}
          className="p-2 bg-[#1a1a1a] border border-[#2a4a2a] rounded hover:border-[#3a5a3a] hover:bg-[#2a2a2a] transition-all text-green-400 font-mono text-xs text-center"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-[#1a1a1a] border border-[#2a4a2a] rounded hover:border-[#3a5a3a] hover:bg-[#2a2a2a] transition-all"
        >
          <ZoomOut className="w-5 h-5 text-green-400" />
        </button>
      </div>

      {/* Pan Controls - по краям экрана в едином стиле */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 bg-[#0f0f0f]/95 border-r-2 border-t-2 border-b-2 border-[#2a4a2a] rounded-r-lg p-2 z-[100004]">
        <button
          onClick={panLeft}
          className="p-3 bg-[#1a1a1a] border border-[#2a4a2a] rounded hover:border-[#3a5a3a] hover:bg-[#2a2a2a] transition-all"
        >
          <div className="w-0 h-0 border-t-[6px] border-t-transparent border-r-[10px] border-r-green-400 border-b-[6px] border-b-transparent"></div>
        </button>
      </div>

      <div className="fixed right-0 top-1/2 -translate-y-1/2 bg-[#0f0f0f]/95 border-l-2 border-t-2 border-b-2 border-[#2a4a2a] rounded-l-lg p-2 z-[100004]">
        <button
          onClick={panRight}
          className="p-3 bg-[#1a1a1a] border border-[#2a4a2a] rounded hover:border-[#3a5a3a] hover:bg-[#2a2a2a] transition-all"
        >
          <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-green-400 border-b-[6px] border-b-transparent"></div>
        </button>
      </div>

      <div className="fixed top-0 left-1/2 -translate-x-1/2 bg-[#0f0f0f]/95 border-b-2 border-l-2 border-r-2 border-[#2a4a2a] rounded-b-lg p-2 z-[100004]">
        <button
          onClick={panUp}
          className="p-3 bg-[#1a1a1a] border border-[#2a4a2a] rounded hover:border-[#3a5a3a] hover:bg-[#2a2a2a] transition-all"
        >
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-b-[10px] border-b-green-400 border-r-[6px] border-r-transparent"></div>
        </button>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 bg-[#0f0f0f]/95 border-t-2 border-l-2 border-r-2 border-[#2a4a2a] rounded-t-lg p-2 z-[100004]">
        <button
          onClick={panDown}
          className="p-3 bg-[#1a1a1a] border border-[#2a4a2a] rounded hover:border-[#3a5a3a] hover:bg-[#2a2a2a] transition-all"
        >
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-t-[10px] border-t-green-400 border-r-[6px] border-r-transparent"></div>
        </button>
      </div>

      {/* Ruler/Scale */}
      <div className="fixed bottom-24 left-60 bg-[#0f0f0f]/95 border-2 border-[#2a4a2a] rounded-lg p-3 z-[100004]">
        <div className="text-green-400 font-mono text-xs mb-2 text-center">МАСШТАБ</div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-1 bg-green-400"></div>
          <span className="text-green-400 font-mono text-xs text-center">{Math.round(100 / zoom)}м</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="w-full h-full flex items-center justify-center overflow-hidden">
        <div 
          ref={mapRef}
          className="relative bg-cover bg-center overflow-hidden"
          style={{ 
            backgroundImage: `url(/icons/map.bmp)`,
            cursor: selectedTool === 'pen' ? 'crosshair' : selectedTool === 'eraser' ? 'cell' : isPanning ? 'grabbing' : selectedTool ? 'crosshair' : 'grab',
            width: `${90}vw`,
            height: `${90}vh`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isPanning || isDrawing ? 'none' : 'transform 0.2s ease-out',
          }}
          onClick={handleMapClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Canvas for drawing - привязан к карте */}
          <canvas 
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{
              width: '100%',
              height: '100%',
            }}
          />

          {/* Markers - привязаны к карте */}
          {markers.map(marker => {
            const size = Math.max(32, 40 / zoom);
            return (
              <div
                key={marker.id}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-125 ${getMarkerColor(marker.type)} shadow-lg group`}
                style={{
                  left: `${marker.x}%`,
                  top: `${marker.y}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                }}
                onClick={(e) => handleMarkerClick(e, marker.id)}
              >
                <div style={{ transform: `scale(${Math.min(1, size / 40)})` }}>
                  {getMarkerIcon(marker.type)}
                </div>
                {marker.note && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                    !
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMarker(marker.id);
                  }}
                  className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            );
          })}

          {/* Delete button for paths */}
          {drawPaths.map((path) => {
            if (path.points.length === 0) return null;
            const firstPoint = path.points[0];
            return (
              <button
                key={path.id}
                onClick={() => deletePath(path.id)}
                className="absolute w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity"
                style={{
                  left: `${firstPoint.x}%`,
                  top: `${firstPoint.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <X className="w-3 h-3 text-white" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Marker Edit Modal */}
      {editingMarker && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100010]">
          <div className="bg-[#1a1a1a] w-[min(90vw,400px)] border-2 border-[#3a5a3a] rounded-lg overflow-hidden">
            <div className="bg-gradient-to-b from-[#2a4a2a] to-[#1a3a1a] h-10 px-4 flex items-center justify-between border-b-2 border-[#3a5a3a]">
              <span className="text-green-400 text-sm font-mono text-center flex-1">ЗАМЕТКА</span>
              <button 
                onClick={() => {
                  setEditingMarker(null);
                  setNoteText('');
                }}
                className="w-6 h-6 bg-red-900/50 border border-red-700 rounded hover:bg-red-800/70 transition-all flex items-center justify-center"
              >
                <X className="w-4 h-4 text-red-400" />
              </button>
            </div>

            <div className="p-4">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Добавьте заметку..."
                className="w-full p-3 bg-[#0f0f0f] border border-[#2a4a2a] rounded text-green-400 font-mono text-sm focus:border-[#3a5a3a] focus:outline-none resize-none"
                rows={4}
                autoFocus
              />

              <div className="flex gap-2 mt-4">
                <button
                  onClick={saveNote}
                  className="flex-1 px-4 py-2 bg-green-900/50 border border-green-700 rounded hover:bg-green-900/70 transition-all text-green-400 font-mono text-sm text-center"
                >
                  СОХРАНИТЬ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
