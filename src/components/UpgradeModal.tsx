import React from 'react';
import { TileUpgrade, GridUpgrade } from '../types/upgrades';
import './UpgradeModal.css';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tileUpgrades: TileUpgrade[];
  gridUpgrades: GridUpgrade[];
  points: number;
  onUpgrade: (upgradeId: string, type: 'tile' | 'grid') => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  tileUpgrades,
  gridUpgrades,
  points,
  onUpgrade,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="upgrade-modal-overlay" onClick={handleOverlayClick}>
      <div className="upgrade-modal">
        <h2>Upgrades</h2>
        <div className="points-display">
          Available Points: {points}
        </div>
        
        <div className="upgrades-container">
          <div className="upgrade-section">
            <h3>Tile Upgrades</h3>
            <div className="upgrade-grid">
              {tileUpgrades.map(upgrade => (
                <div key={upgrade.id} className="upgrade-card">
                  <div className="upgrade-icon">{upgrade.icon}</div>
                  <h4>{upgrade.name}</h4>
                  <p>{upgrade.description}</p>
                  <div className="upgrade-level">
                    Level: {upgrade.currentLevel}/{upgrade.maxLevel}
                  </div>
                  <div className="upgrade-effect">
                    Current: {upgrade.effect.value + (upgrade.currentLevel * upgrade.effect.increment)}
                  </div>
                  <button
                    className="upgrade-button"
                    disabled={upgrade.currentLevel >= upgrade.maxLevel || points < upgrade.cost}
                    onClick={() => onUpgrade(upgrade.id, 'tile')}
                  >
                    Upgrade ({upgrade.cost} points)
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="upgrade-section">
            <h3>Grid Upgrades</h3>
            <div className="upgrade-grid">
              {gridUpgrades.map(upgrade => (
                <div key={upgrade.id} className="upgrade-card">
                  <div className="upgrade-icon">{upgrade.icon}</div>
                  <h4>{upgrade.name}</h4>
                  <p>{upgrade.description}</p>
                  <div className="upgrade-level">
                    Level: {upgrade.currentLevel}/{upgrade.maxLevel}
                  </div>
                  <div className="upgrade-effect">
                    Current: {upgrade.effect.value + (upgrade.currentLevel * upgrade.effect.increment)}
                  </div>
                  <button
                    className="upgrade-button"
                    disabled={upgrade.currentLevel >= upgrade.maxLevel || points < upgrade.cost}
                    onClick={() => onUpgrade(upgrade.id, 'grid')}
                  >
                    Upgrade ({upgrade.cost} points)
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal; 