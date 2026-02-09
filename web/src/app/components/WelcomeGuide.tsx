import { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';

export function WelcomeGuide() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('hasSeenWelcomeGuide');
    if (!hasSeenGuide) {
      setIsVisible(true);
    }
  }, []);

  const steps = [
    {
      title: 'Добро пожаловать в Зону',
      description: 'Это ваш личный интерактивный стол сталкера. Здесь вы можете хранить документы, контакты и важную информацию.',
    },
    {
      title: 'Папка с документами',
      description: 'Нажмите на папку, чтобы открыть её. Добавляйте документы через кнопку "+" внизу слева. Перетаскивайте документы вправо для удаления.',
    },
    {
      title: 'USB-накопитель',
      description: 'Храните фото, видео и аудио файлы на USB. Нажмите на USB справа для доступа к хранилищу.',
    },
    {
      title: 'КПК (PDA)',
      description: 'Ваш персональный компьютер для управления контактами и задачами. Нажмите на PDA для доступа.',
    },
    {
      title: 'Карта',
      description: 'Планируйте маршруты и отмечайте важные места. Нажмите на карту в левом верхнем углу.',
    },
  ];

  const handleClose = () => {
    localStorage.setItem('hasSeenWelcomeGuide', 'true');
    setIsVisible(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  if (!isVisible) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100000]">
      <div className="bg-[#1a1a1a] border-2 border-[#3a5a3a] rounded-lg w-[min(90vw,500px)] shadow-[0_0_50px_rgba(58,90,58,0.5)] overflow-hidden">
        <div className="bg-gradient-to-b from-[#2a4a2a] to-[#1a3a1a] h-12 px-4 flex items-center justify-between border-b-2 border-[#3a5a3a]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-green-400 text-sm font-mono tracking-wider">ОБУЧЕНИЕ</span>
          </div>
          <button 
            className="w-8 h-8 bg-red-900/50 border border-red-700 rounded hover:bg-red-800/70 transition-all flex items-center justify-center"
            onClick={handleClose}
          >
            <X className="w-5 h-5 text-red-400" />
          </button>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-mono text-green-400 mb-4">{step.title}</h2>
          <p className="text-gray-300 font-mono text-sm mb-6 leading-relaxed">{step.description}</p>

          <div className="flex items-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all ${
                  index === currentStep 
                    ? 'bg-green-500' 
                    : index < currentStep 
                    ? 'bg-green-700' 
                    : 'bg-[#2a4a2a]'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-[#2a4a2a] border border-[#3a5a3a] rounded-lg hover:bg-[#3a5a3a] transition-all text-gray-400 font-mono text-sm"
            >
              ПРОПУСТИТЬ
            </button>
            <button
              onClick={handleNext}
              className="flex-1 px-4 py-3 bg-green-900/50 border border-green-700 rounded-lg hover:bg-green-900/70 transition-all text-green-400 font-mono text-sm flex items-center justify-center gap-2"
            >
              {currentStep === steps.length - 1 ? 'НАЧАТЬ' : 'ДАЛЕЕ'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
