import { useState, useEffect } from 'react';

export const useTutorial = () => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  
  console.log('🎓 Tutorial state:', { showTutorial, tutorialCompleted });

  useEffect(() => {
    // Check if tutorial was already completed or skipped
    const completed = localStorage.getItem('tutorialCompleted');
    const skipped = localStorage.getItem('tutorialSkipped');
    
    if (completed === 'true') {
      setTutorialCompleted(true);
    } else if (skipped === 'true') {
      setTutorialCompleted(true);
    }
    // Tutorial is now only accessible through the manual button
  }, []);

  const startTutorial = () => {
    console.log('🎓 Tutorial started!');
    setShowTutorial(true);
    localStorage.removeItem('tutorialSkipped');
  };

  const closeTutorial = () => {
    setShowTutorial(false);
  };

  const completeTutorial = () => {
    setShowTutorial(false);
    setTutorialCompleted(true);
    localStorage.setItem('tutorialCompleted', 'true');
  };

  const resetTutorial = () => {
    localStorage.removeItem('tutorialCompleted');
    localStorage.removeItem('tutorialSkipped');
    setTutorialCompleted(false);
    setShowTutorial(true);
  };

  return {
    showTutorial,
    tutorialCompleted,
    startTutorial,
    closeTutorial,
    completeTutorial,
    resetTutorial
  };
};
