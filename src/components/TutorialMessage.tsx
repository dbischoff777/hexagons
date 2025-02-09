import React from 'react'
import { TutorialStep } from '../types/tutorial'
import './TutorialMessage.css'

interface TutorialMessageProps {
  step: TutorialStep
  canProgress: boolean
  onNext: () => void
}

export const TutorialMessage: React.FC<TutorialMessageProps> = ({ 
  step, 
  canProgress, 
  onNext 
}) => {
  if (!step) return null

  return (
    <div className={`tutorial-message ${step.position}`}>
      <div className="tutorial-content">
        <p>{step.message}</p>
        {canProgress && !step.requiresAction && (
          <button 
            className="tutorial-next-button"
            onClick={onNext}
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
} 