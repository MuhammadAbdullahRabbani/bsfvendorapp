import { useState, useEffect } from 'react';
import { Package, Users, TrendingUp, CheckCircle } from 'lucide-react';
import { Progress } from './ui/progress';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const steps = [
    { label: 'Loading vendor data...', delay: 800 },
    { label: 'Initializing Excel engine...', delay: 600 },
    { label: 'Setting up analytics...', delay: 500 },
    { label: 'Preparing interface...', delay: 700 },
    { label: 'Ready to manage vendors!', delay: 400 }
  ];

  useEffect(() => {
    let currentProgress = 0;
    let stepIndex = 0;

    const progressTimer = setInterval(() => {
      if (stepIndex < steps.length) {
        setCurrentStep(steps[stepIndex].label);
        
        const stepProgress = (stepIndex + 1) * (100 / steps.length);
        
        const progressInterval = setInterval(() => {
          currentProgress += 2;
          setProgress(Math.min(currentProgress, stepProgress));
          
          if (currentProgress >= stepProgress) {
            clearInterval(progressInterval);
          }
        }, 30);

        setTimeout(() => {
          stepIndex++;
          if (stepIndex >= steps.length) {
            clearInterval(progressTimer);
            setTimeout(onComplete, 500);
          }
        }, steps[stepIndex].delay);
      }
    }, 100);

    return () => clearInterval(progressTimer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl floating-animation"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/10 rounded-full blur-3xl floating-animation" style={{ animationDelay: '-2s' }}></div>
        <div className="absolute top-1/3 right-1/3 w-32 h-32 bg-primary/5 rounded-full blur-2xl floating-animation" style={{ animationDelay: '-4s' }}></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-md mx-auto px-6">
        {/* Logo and rotating icon */}
        <div className="mb-8">
          <div className="relative inline-block">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-material-xl animate-bounce-in pulse-glow">
              <Package className="w-10 h-10 text-primary-foreground animate-spin-slow" />
            </div>
            
            {/* Orbiting icons */}
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center animate-rotate shadow-material-md">
              <Users className="w-4 h-4 text-accent-foreground" />
            </div>
            <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-success rounded-full flex items-center justify-center animate-rotate shadow-material-md" style={{ animationDirection: 'reverse' }}>
              <TrendingUp className="w-4 h-4 text-success-foreground" />
            </div>
          </div>
        </div>

        {/* Brand name and tagline */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
            Black Source
          </h1>
          <p className="text-muted-foreground text-sm">
            From Source to Success
          </p>
        </div>

        {/* Progress section */}
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Progress value={progress} className="w-full h-2" />
          
          <div className="flex items-center justify-center gap-2 min-h-[1.5rem]">
            {progress < 100 ? (
              <>
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-muted-foreground animate-pulse">
                  {currentStep}
                </span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-success animate-scale-in" />
                <span className="text-sm text-success font-medium">
                  {currentStep}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mt-8 grid grid-cols-2 gap-4 text-xs text-muted-foreground animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            Excel Export/Import
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full"></div>
            Real-time Analytics
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            Smart Filtering
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-warning rounded-full"></div>
            Mobile Ready
          </div>
        </div>
      </div>
    </div>
  );
};