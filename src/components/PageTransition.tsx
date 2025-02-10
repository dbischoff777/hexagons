import React from 'react'
import './PageTransition.css'

interface PageTransitionProps {
  children: React.ReactNode
  isExiting: boolean
  onExitComplete?: () => void
}

const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  isExiting,
  onExitComplete 
}) => {
  return (
    <div 
      className={`page-transition ${isExiting ? 'exit' : 'enter'}`}
      onAnimationEnd={(e) => {
        if (e.animationName === 'fadeOut' && onExitComplete) {
          onExitComplete()
        }
      }}
    >
      {children}
    </div>
  )
}

export default PageTransition 