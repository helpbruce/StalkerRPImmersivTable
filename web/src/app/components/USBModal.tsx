import { useState, useEffect } from 'react';
import { Folder, Image, Video, Music, X, ChevronLeft } from 'lucide-react';

interface USBFile {
  url: string;
  name: string;
  createdAt: string;
}

interface USBFiles {
  photo: USBFile[];
  video: USBFile[];
  audio: USBFile[];
}

interface USBModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFile: (context: 'usb') => void;
}

export function USBModal({ isOpen, onClose, onAddFile }: USBModalProps) {
  const [usbView, setUsbView] = useState<'root' | 'photo' | 'video' | 'audio'>('root');
  const [usbFiles, setUsbFiles] = useState<USBFiles>({
    photo: [],
    video: [],
    audio: []
  });
  const [viewerFile, setViewerFile] = useState<USBFile | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number>(0);
  const [currentType, setCurrentType] = useState<'photo' | 'video' | 'audio' | null>(null);
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('usbFiles');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.photo && parsed.video && parsed.audio) {
          setUsbFiles(parsed);
        }
      } catch (e) {
        console.error('Failed to parse USB files:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('usbFiles', JSON.stringify(usbFiles));
  }, [usbFiles]);

  useEffect(() => {
    if (isOpen) {
      setShowLoading(true);
      setTimeout(() => {
        setShowLoading(false);
      }, 1500);
    }
  }, [isOpen]);

  const detectFileType = (url: string): 'photo' | 'video' | 'audio' => {
    const lower = url.toLowerCase();
    
    if (lower.match(/\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v)$/i) || 
        lower.startsWith('data:video') ||
        lower.includes('youtube.com') ||
        lower.includes('vimeo.com')) {
      return 'video';
    }
    
    if (lower.match(/\.(mp3|wav|ogg|flac|aac|m4a|wma)$/i) || 
        lower.startsWith('data:audio')) {
      return 'audio';
    }
    
    return 'photo';
  };

  const getFileIcon = (type: 'photo' | 'video' | 'audio') => {
    switch(type) {
      case 'video': return <Video className="w-8 h-8 text-blue-400" />;
      case 'audio': return <Music className="w-8 h-8 text-purple-400" />;
      default: return <Image className="w-8 h-8 text-green-400" />;
    }
  };

  const addUSBFile = (url: string) => {
    const type = detectFileType(url);
    const name = prompt('Введите название файла:', 'Новый файл') || 'Новый файл';
    
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const createdAt = `${day}.${month}.${year}`;

    setUsbFiles(prev => ({
      ...prev,
      [type]: [...prev[type], { url, name, createdAt }]
    }));

    setUsbView('root');
  };

  useEffect(() => {
    (window as any).__addUSBFile = addUSBFile;
    return () => {
      delete (window as any).__addUSBFile;
    };
  }, [usbFiles]);

  const openViewer = (file: USBFile, index: number, type: 'photo' | 'video' | 'audio') => {
    setViewerFile(file);
    setViewerIndex(index);
    setCurrentType(type);
  };

  const closeViewer = () => {
    setViewerFile(null);
    setCurrentType(null);
  };

  const deleteFile = () => {
    if (!viewerFile || !currentType) return;
    
    const newFiles = usbFiles[currentType].filter((_, i) => i !== viewerIndex);
    setUsbFiles(prev => ({
      ...prev,
      [currentType]: newFiles
    }));

    if (newFiles.length === 0) {
      closeViewer();
    } else {
      const newIndex = Math.min(viewerIndex, newFiles.length - 1);
      setViewerFile(newFiles[newIndex]);
      setViewerIndex(newIndex);
    }
  };

  const nextFile = () => {
    if (!currentType || !viewerFile) return;
    const files = usbFiles[currentType];
    if (viewerIndex < files.length - 1) {
      setViewerIndex(viewerIndex + 1);
      setViewerFile(files[viewerIndex + 1]);
    }
  };

  const prevFile = () => {
    if (!currentType || !viewerFile) return;
    if (viewerIndex > 0) {
      setViewerIndex(viewerIndex - 1);
      setViewerFile(usbFiles[currentType][viewerIndex - 1]);
    }
  };

  if (!isOpen) return null;

  const folders = [
    { key: 'photo' as const, title: 'Фото', Icon: Image, color: 'text-green-400', count: usbFiles.photo.length },
    { key: 'video' as const, title: 'Видео', Icon: Video, color: 'text-blue-400', count: usbFiles.video.length },
    { key: 'audio' as const, title: 'Аудио', Icon: Music, color: 'text-purple-400', count: usbFiles.audio.length }
  ];

  return (
    <>
      {showLoading && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
            <div className="text-green-400 font-mono text-sm">ЗАГРУЗКА USB...</div>
          </div>
        </div>
      )}

      <div className="bg-[#1a1a1a] w-full h-full border-2 border-[#3a5a3a] rounded-md shadow-[0_0_50px_rgba(58,90,58,0.5)] overflow-hidden flex flex-col" style={{ opacity: showLoading ? 0 : 1, transition: 'opacity 0.3s' }}>
        <div className="bg-gradient-to-b from-[#2a4a2a] to-[#1a3a1a] h-12 px-4 flex items-center justify-between border-b-2 border-[#3a5a3a]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-green-400 text-sm font-mono tracking-wider">💾 USB‑ХРАНИЛИЩЕ</span>
          </div>
          <button 
            className="w-8 h-8 bg-red-900/50 border border-red-700 rounded hover:bg-red-800/70 transition-all flex items-center justify-center"
            onClick={onClose}
          >
            <X className="w-5 h-5 text-red-400" />
          </button>
        </div>

        <div className="flex-1 p-5 overflow-y-auto usb-scrollbar bg-[#0f0f0f]">
          {usbView === 'root' ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
              {folders.map(folder => (
                <div
                  key={folder.key}
                  className="p-6 bg-[#1a1a1a] rounded-lg border-2 border-[#2a4a2a] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-[#2a2a2a] transition-all hover:scale-105 hover:border-[#3a5a3a]"
                  onClick={() => setUsbView(folder.key)}
                >
                  <folder.Icon className={`w-16 h-16 ${folder.color}`} />
                  <div className="text-base font-mono text-green-400">{folder.title}</div>
                  <div className="text-sm text-gray-500 font-mono">{folder.count} файлов</div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <button
                className="mb-4 px-4 py-2 bg-[#1a1a1a] border border-[#2a4a2a] rounded cursor-pointer hover:bg-[#2a2a2a] hover:border-[#3a5a3a] flex items-center gap-2 transition-all text-green-400 font-mono text-sm"
                onClick={() => setUsbView('root')}
              >
                <ChevronLeft className="w-4 h-4" />
                Назад
              </button>
              
              <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
                {usbFiles[usbView].map((file, index) => (
                  <div
                    key={index}
                    className="p-4 bg-[#1a1a1a] rounded-lg border border-[#2a4a2a] flex flex-col items-center gap-2 cursor-pointer hover:bg-[#2a2a2a] transition-all hover:scale-105 hover:border-[#3a5a3a]"
                    onClick={() => openViewer(file, index, usbView)}
                  >
                    {getFileIcon(usbView)}
                    <div className="text-xs font-mono text-green-400 text-center truncate w-full">{file.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{file.createdAt}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="px-4 py-3 border-t-2 border-[#2a4a2a] bg-[#1a1a1a]">
          <button
            className="px-4 py-2 bg-[#2a4a2a] text-green-400 border border-[#3a5a3a] rounded cursor-pointer hover:bg-[#3a5a3a] text-sm transition-all font-mono"
            onClick={() => onAddFile('usb')}
          >
            ➕ Добавить файл
          </button>
        </div>
      </div>

      {viewerFile && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100000]">
          <button
            onClick={closeViewer}
            className="absolute top-6 right-6 p-3 rounded-lg bg-red-900/50 border border-red-700 hover:bg-red-800/70 transition-all z-10"
          >
            <X className="w-6 h-6 text-red-400" />
          </button>

          {viewerIndex > 0 && (
            <button
              onClick={prevFile}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-lg bg-[#1a1a1a] border border-[#2a4a2a] hover:bg-[#2a2a2a] hover:border-[#3a5a3a] transition-all z-10"
            >
              <ChevronLeft className="w-6 h-6 text-green-400" />
            </button>
          )}

          {currentType && viewerIndex < usbFiles[currentType].length - 1 && (
            <button
              onClick={nextFile}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-lg bg-[#1a1a1a] border border-[#2a4a2a] hover:bg-[#2a2a2a] hover:border-[#3a5a3a] transition-all z-10"
            >
              <ChevronLeft className="w-6 h-6 rotate-180 text-green-400" />
            </button>
          )}

          <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            {currentType === 'video' ? (
              <video 
                src={viewerFile.url} 
                controls 
                autoPlay 
                className="max-w-[90vw] max-h-[90vh] rounded-lg border-2 border-[#3a5a3a]"
              />
            ) : currentType === 'audio' ? (
              <div className="bg-[#1a1a1a] border-2 border-[#3a5a3a] p-12 rounded-xl">
                <Music className="w-24 h-24 text-green-400 mx-auto mb-6" />
                <audio 
                  src={viewerFile.url} 
                  controls 
                  autoPlay
                  className="w-full"
                />
              </div>
            ) : (
              <img 
                src={viewerFile.url} 
                alt={viewerFile.name}
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg border-2 border-[#3a5a3a]"
              />
            )}
          </div>

          <button
            onClick={deleteFile}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-900/50 text-red-400 border border-red-700 rounded-lg cursor-pointer z-[100001] hover:bg-red-900/70 transition-all font-mono"
          >
            🗑️ Уничтожить
          </button>
        </div>
      )}

      <style>
        {`
          .usb-scrollbar::-webkit-scrollbar {
            width: 10px;
          }
          .usb-scrollbar::-webkit-scrollbar-track {
            background: #0f0f0f;
            border-left: 1px solid #2a4a2a;
          }
          .usb-scrollbar::-webkit-scrollbar-thumb {
            background: #2a4a2a;
            border-radius: 2px;
          }
          .usb-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #3a5a3a;
          }
        `}
      </style>
    </>
  );
}
