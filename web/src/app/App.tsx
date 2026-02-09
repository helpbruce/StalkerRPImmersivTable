import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Trash2 } from 'lucide-react';
import { DocumentStack } from './components/DocumentStack';
import { USBModal } from './components/USBModal';
import { PDAModal } from './components/PDAModal';
import { AddFileModal } from './components/AddFileModal';
import { WelcomeGuide } from './components/WelcomeGuide';
import { MapModal } from './components/MapModal';
import { getImagePath } from './components/PlaceholderImages';
import { FolderViewer } from './components/FolderViewer';

interface Document {
  url: string;
  id: string;
}

export default function App() {
  const [isUSBOpen, setIsUSBOpen] = useState(false);
  const [isPDAOpen, setIsPDAOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addContext, setAddContext] = useState<'folder' | 'usb'>('folder');
  const [screenSlide, setScreenSlide] = useState(false);
  const [marlboroClicked, setMarlboroClicked] = useState(false);
  const [zippoClicked, setZippoClicked] = useState(false);
  const [smokeVisible, setSmokeVisible] = useState(false);

  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [isPDAAnimating, setIsPDAAnimating] = useState(false);
  const [showPDALoading, setShowPDALoading] = useState(false);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  const sound1Ref = useRef<HTMLAudioElement>(null);
  const sound2Ref = useRef<HTMLAudioElement>(null);
  const sound3Ref = useRef<HTMLAudioElement>(null);

  // Определяем активные блокировки
  const isAnyModalOpen = isUSBOpen || isPDAOpen || isMapOpen || isFolderOpen;

  useEffect(() => {
    const stored = localStorage.getItem('documents');
    if (stored) {
      try {
        const urls = JSON.parse(stored) as string[];
        setDocuments(urls.map((url, index) => ({ url, id: `doc-${index}` })));
      } catch (e) {
        console.error('Failed to parse documents:', e);
      }
    }
  }, []);

  useEffect(() => {
    const urls = documents.map(doc => doc.url);
    localStorage.setItem('documents', JSON.stringify(urls));
  }, [documents]);

  useEffect(() => {
    if (!isFolderOpen) {
      setCurrentIndex(0);
    }
  }, [isFolderOpen]);

  const handleUSBClick = () => {
    if (isAnyModalOpen) return;
    setScreenSlide(true);
    setTimeout(() => {
      setIsUSBOpen(true);
    }, 800);
  };

  const handleUSBClose = () => {
    setIsUSBOpen(false);
    setScreenSlide(false);
  };

  const handlePDAClick = () => {
    if (isAnyModalOpen) return;
    setIsPDAAnimating(true);
    setShowPDALoading(true);
    
    setTimeout(() => {
      setShowPDALoading(false);
    }, 1500);

    setTimeout(() => {
      setIsPDAOpen(true);
    }, 1800);
  };

  const handlePDAClose = () => {
    setIsPDAOpen(false);
    setTimeout(() => {
      setIsPDAAnimating(false);
    }, 300);
  };

  const handleAddFile = (context: 'folder' | 'usb') => {
    setAddContext(context);
    setIsAddModalOpen(true);
  };

  const handleConfirmAdd = (url: string) => {
    if (addContext === 'folder') {
      setDocuments(prev => [...prev, { url, id: `doc-${Date.now()}` }]);
    } else if (addContext === 'usb') {
      if ((window as any).__addUSBFile) {
        (window as any).__addUSBFile(url);
      }
    }
  };

  const handleDeleteDocument = (index: number) => {
    const newDocs = documents.filter((_, i) => i !== index);
    setDocuments(newDocs);
    setCurrentIndex(Math.min(currentIndex, newDocs.length - 1));
  };

  const handleMarlboroClick = () => {
    if (isAnyModalOpen) return;
    setMarlboroClicked(true);
    sound1Ref.current?.play();
  };

  const handleZippoClick = () => {
    if (!marlboroClicked || isAnyModalOpen) return;
    
    setZippoClicked(true);
    sound2Ref.current?.play();
    
    setTimeout(() => {
      if (sound3Ref.current) {
        sound3Ref.current.volume = 0.5;
        sound3Ref.current.play();
      }
    }, 1000);

    setTimeout(() => {
      setSmokeVisible(true);
    }, 3000);

    setTimeout(() => {
      setSmokeVisible(false);
    }, 6000);
  };

  const handleNextPage = () => {
    if (isFolderOpen && currentIndex < documents.length - 1) {
      setCurrentIndex(currentIndex + 1);
      if (fullscreenIndex !== null) {
        setFullscreenIndex(currentIndex + 1);
      }
    }
  };

  const handlePrevPage = () => {
    if (isFolderOpen && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      if (fullscreenIndex !== null) {
        setFullscreenIndex(currentIndex - 1);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFolderOpen) return;
      
      if (e.key === 'ArrowRight') handleNextPage();
      if (e.key === 'ArrowLeft') handlePrevPage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFolderOpen, currentIndex, documents.length, fullscreenIndex]);

  useEffect(() => {
    if (fullscreenIndex !== null) {
      setCurrentIndex(fullscreenIndex);
    }
  }, [fullscreenIndex]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-cover bg-center bg-fixed flex items-center justify-center"
      style={{ backgroundImage: `url(${getImagePath('background.jpg')})` }}
    >
      <audio ref={sound1Ref} src="/sounds/sound1.mp3" />
      <audio ref={sound2Ref} src="/sounds/sound2.mp3" />
      <audio ref={sound3Ref} src="/sounds/sound3.mp3" />

      <video 
        className="fixed left-1/2 top-1/2 w-[2500px] h-auto -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[9999] transition-opacity duration-[2s]"
        style={{ 
          opacity: smokeVisible ? 1 : 0,
          mixBlendMode: 'screen',
        }}
        src="/video/smoke.mp4"
        autoPlay
        muted
        loop
      />

      {/* Map Corner */}
      <div 
        className="fixed top-0 left-0 w-48 h-48 cursor-pointer transition-all duration-300 hover:scale-110 z-[1000] group"
        onClick={() => !isAnyModalOpen && setIsMapOpen(true)}
        style={{
          backgroundImage: `url(${getImagePath('map_corner.png')})`,
          backgroundSize: 'cover',
          backgroundPosition: 'top left',
          filter: 'drop-shadow(5px 5px 10px rgba(0,0,0,0.5))',
          pointerEvents: isAnyModalOpen ? 'none' : 'auto',
          opacity: isAnyModalOpen ? 0.5 : 1,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 via-yellow-500/0 to-yellow-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Screen Wrapper */}
      <div 
        className="w-screen h-screen flex items-center justify-center relative transition-transform duration-[800ms] ease-out"
        style={{ 
          transform: screenSlide ? 'translateX(-15vw)' : 'translateX(0)',
          pointerEvents: isMapOpen || isUSBOpen ? 'none' : 'auto',
        }}
      >
        {/* Folder Viewer */}
        <FolderViewer 
          isOpen={isFolderOpen}
          onToggle={() => !isAnyModalOpen && setIsFolderOpen(prev => !prev)}
        >
          {documents.length > 0 && (
            <DocumentStack
              pages={documents}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              onDelete={handleDeleteDocument}
              onOpenFullscreen={(index) => setFullscreenIndex(index)}
              isFolderOpen={isFolderOpen}
            />
          )}
        </FolderViewer>

        {/* USB Icon */}
        <div 
          className="fixed right-[5vw] top-[45vh] w-56 h-56 bg-contain bg-no-repeat bg-center cursor-pointer transition-all duration-300 hover:scale-110 hover:brightness-125 pointer-events-auto"
          style={{ 
            backgroundImage: `url(${getImagePath('usb.png')})`,
            filter: 'drop-shadow(5px 5px 15px rgba(0,0,0,0.7))',
            zIndex: isUSBOpen ? 400 : 500,
            pointerEvents: isAnyModalOpen ? 'none' : 'auto',
            opacity: isAnyModalOpen ? 0.5 : 1,
          }}
          onClick={handleUSBClick}
        />

        {/* PDA Device */}
        <div 
          className={`fixed transition-all duration-[1500ms] ease-out pointer-events-auto ${
            isPDAAnimating 
              ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,1100px)] h-[min(85vh,700px)] z-[9998]'
              : 'right-[-10vw] bottom-[65vh] w-[min(48vw,600px)] h-[min(48vw,600px)] rotate-[19deg] hover:translate-y-[-20px] hover:scale-105 z-[500]'
          } bg-contain bg-no-repeat bg-center cursor-pointer`}
          style={{ 
            backgroundImage: `url(${getImagePath('pda.png')})`,
            filter: isPDAAnimating ? 'none' : 'drop-shadow(15px 15px 30px rgba(0,0,0,0.8))',
            pointerEvents: isPDAAnimating || !isAnyModalOpen ? 'auto' : 'none',
            opacity: !isPDAAnimating && isAnyModalOpen ? 0.5 : 1,
          }}
          onClick={!isPDAAnimating ? handlePDAClick : undefined}
        >
          {showPDALoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
            </div>
          )}

          {isPDAOpen && (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <PDAModal 
                isOpen={isPDAOpen}
                onClose={handlePDAClose}
              />
            </div>
          )}
        </div>

        {/* Marlboro */}
        {!marlboroClicked && (
          <img 
            src={getImagePath('malboro.png')}
            className="fixed left-[1090px] bottom-[-300px] w-[341px] h-[512px] rotate-[-2deg] cursor-pointer transition-all duration-[3s] ease-[cubic-bezier(.25,.8,.25,1)] hover:translate-y-[-60px] hover:scale-[1.15]"
            style={{ 
              filter: 'drop-shadow(45px 45px 45px rgba(0,0,0,1))',
              pointerEvents: isAnyModalOpen ? 'none' : 'auto',
              opacity: isAnyModalOpen ? 0.5 : 1,
              zIndex: isUSBOpen ? 400 : 500,
            }}
            onClick={handleMarlboroClick}
            alt="Marlboro"
          />
        )}

        {/* Zippo */}
        {!zippoClicked && (
          <img 
            src={getImagePath('zipo.png')}
            className={`fixed left-[942px] bottom-[-170px] w-[247px] h-[361px] rotate-[-6deg] transition-all duration-[1.4s] ease-[cubic-bezier(.25,.8,.25,1)] hover:translate-y-[-50px] hover:scale-[1.15] ${
              marlboroClicked && !isAnyModalOpen ? 'cursor-pointer' : 'cursor-not-allowed opacity-100'
            }`}
            style={{ 
              filter: 'drop-shadow(15px 15px 15px rgba(0,0,0,1))',
              pointerEvents: isAnyModalOpen ? 'none' : 'auto',
              opacity: isAnyModalOpen ? 0.5 : 1,
              zIndex: isUSBOpen ? 400 : 500,
            }}
            onClick={handleZippoClick}
            alt="Zippo"
          />
        )}
      </div>

      {/* USB Modal */}
      {isUSBOpen && (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,800px)] h-[min(85vh,600px)] z-[10000]">
          <USBModal 
            isOpen={isUSBOpen}
            onClose={handleUSBClose}
            onAddFile={() => handleAddFile('usb')}
          />
        </div>
      )}

      {/* Fullscreen Modal */}
      {fullscreenIndex !== null && documents[fullscreenIndex] && (
        <div className="fixed inset-0 bg-black/95 z-[99999] flex items-center justify-center">
          <button
            onClick={() => setFullscreenIndex(null)}
            className="absolute top-6 right-6 p-3 bg-red-900/70 border-2 border-red-700 text-white hover:bg-red-800/90 transition-all duration-200 hover:scale-110 active:scale-95 z-10 rounded-lg flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>

          {fullscreenIndex > 0 && (
            <button
              onClick={() => setFullscreenIndex(fullscreenIndex - 1)}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-[#1a1a1a]/90 border-2 border-[#2a4a2a] text-green-400 hover:bg-[#2a2a2a]/90 hover:border-[#3a5a3a] transition-all duration-200 hover:scale-110 active:scale-95 z-10 rounded-lg flex items-center justify-center"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {fullscreenIndex < documents.length - 1 && (
            <button
              onClick={() => setFullscreenIndex(fullscreenIndex + 1)}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-[#1a1a1a]/90 border-2 border-[#2a4a2a] text-green-400 hover:bg-[#2a2a2a]/90 hover:border-[#3a5a3a] transition-all duration-200 hover:scale-110 active:scale-95 z-10 rounded-lg flex items-center justify-center"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          <div className="w-full h-full p-8 flex flex-col items-center justify-center">
            <img 
              src={documents[fullscreenIndex].url} 
              className="max-w-full max-h-full object-contain pointer-events-none"
              alt=""
            />
          </div>

          <button
            onClick={() => {
              const newDocs = documents.filter((_, i) => i !== fullscreenIndex);
              setDocuments(newDocs);
              if (newDocs.length === 0) {
                setFullscreenIndex(null);
              } else {
                setFullscreenIndex(Math.min(fullscreenIndex, newDocs.length - 1));
              }
            }}
            className="fixed bottom-8 left-8 px-6 py-3 bg-red-900/70 border-2 border-red-700 text-red-400 rounded-lg hover:bg-red-800/90 transition-all z-10 font-mono flex items-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            УНИЧТОЖИТЬ
          </button>
        </div>
      )}

      {/* Кнопка добавления */}
      <div 
        className="fixed bottom-8 left-8 z-[1000]"
        style={{ pointerEvents: isMapOpen || isUSBOpen ? 'none' : 'auto' }}
      >
        <button 
          className="w-14 h-14 bg-[#2a4a2a] rounded-lg border-2 border-[#3a5a3a] cursor-pointer relative flex items-center justify-center overflow-visible shadow-[0_0_20px_rgba(58,90,58,0.5)] transition-all duration-200 hover:scale-110 hover:shadow-[0_0_30px_rgba(58,90,58,0.7)] active:scale-95 group"
          onClick={() => handleAddFile('folder')}
          disabled={isAnyModalOpen}
          style={{
            opacity: isAnyModalOpen ? 0.5 : 1,
            pointerEvents: isAnyModalOpen ? 'none' : 'auto',
          }}
        >
          <div className="absolute inset-0 bg-green-500/10 rounded-lg blur-sm group-hover:bg-green-500/20 transition-all" />
          <div className="relative z-10 text-green-400 text-2xl font-bold font-mono">+</div>
          <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </button>
      </div>

      {/* Modals */}
      <MapModal 
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
      />

      <AddFileModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleConfirmAdd}
      />

      <WelcomeGuide />
    </div>
  );
}
