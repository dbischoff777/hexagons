import React, { useState } from 'react';
import { getProfile, updateProfile } from '../utils/profileUtils';
import './ProfilePage.css';
import { FaEdit, FaUserCircle } from 'react-icons/fa';
import { getPlayerProgress } from '../utils/progressionUtils';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../utils/firebaseConfig';
import { getStatistics } from '../utils/gameStateUtils';
import AchievementsView from './AchievementsView';
import { formatNumber } from '../utils/formatNumbers';

interface ProfilePageProps {
  onClose: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onClose }) => {
  const [profile, setProfile] = useState(getProfile());
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const playerProgress = getPlayerProgress();
  const [activeView, setActiveView] = useState<'profile' | 'stats' | 'achievements'>('profile');
  const stats = getStatistics();

  const handleSave = () => {
    const updatedProfile = {
      ...profile,
      name: editName,
    };
    updateProfile(updatedProfile);
    setProfile(updatedProfile);
    setIsEditing(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const updatedProfile = {
        ...profile,
        name: result.user.displayName || profile.name,
        avatar: result.user.photoURL || profile.avatar,
        email: result.user.email || undefined,
        uid: result.user.uid
      };
      updateProfile(updatedProfile);
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      const updatedProfile = {
        ...profile,
        uid: undefined,
        email: undefined,
        photoURL: undefined
      };
      updateProfile(updatedProfile);
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-page-sidebar">
        <div className="profile-page-avatar-container">
          <div className="profile-page-avatar-wrapper">
            <div className="profile-page-avatar">
              {profile.avatar && profile.avatar !== '/avatars/default.png' ? (
                <img src={profile.avatar} alt="Profile" />
              ) : (
                <div className="profile-page-avatar-default">
                  <FaUserCircle />
                </div>
              )}
            </div>
            <button className="profile-page-avatar-edit">
              <FaEdit />
            </button>
          </div>
          
          {isEditing ? (
            <div className="profile-page-edit">
              <input
                className="profile-page-edit-input"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter your name"
              />
              <div className="profile-page-edit-buttons">
                <button className="profile-page-edit-button" onClick={handleSave}>Save</button>
                <button className="profile-page-edit-button secondary" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="profile-page-info">
              <h2>{profile.name}</h2>
              <div className="profile-page-level">
                <div className="level-info">
                  <div className="level-badge">
                    <div className="level-label">Level</div>
                    <span className="level-number">{formatNumber(playerProgress.level)}</span>
                  </div>
                </div>
              </div>
              <button className="profile-page-edit-button" onClick={() => setIsEditing(true)}>
                <FaEdit /> Edit Profile
              </button>
              {!profile.uid ? (
                <button 
                  className="google-sign-in-button"
                  onClick={handleGoogleSignIn}
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </button>
              ) : (
                <button 
                  className="google-sign-in-button signout"
                  onClick={handleSignOut}
                >
                  Sign Out
                </button>
              )}
            </div>
          )}
        </div>

        <div className="profile-page-quick-stats">
          <div className="quick-stat">
            <div className="stat-icon">🎮</div>
            <div className="stat-info">
              <span className="value">{formatNumber(profile.stats.gamesPlayed)}</span>
              <span className="label">Games Played</span>
            </div>
          </div>
          <div className="quick-stat">
            <div className="stat-icon">🏆</div>
            <div className="stat-info">
              <span className="value">{formatNumber(profile.stats.highScore)}</span>
              <span className="label">High Score</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-page-content">
        <div className="profile-page-nav">
          <button 
            className={`profile-nav-button ${activeView === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveView('profile')}
          >
            Profile
          </button>
          <button 
            className={`profile-nav-button ${activeView === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveView('stats')}
          >
            Statistics
          </button>
          <button 
            className={`profile-nav-button ${activeView === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveView('achievements')}
          >
            Achievements
          </button>
        </div>

        <div className="profile-page-view">
          {activeView === 'profile' && (
            <div className="profile-overview">
              <div className="profile-overview-section">
                <h3>Account Info</h3>
                <div className="profile-info-grid">
                  <div className="info-item">
                    <label>Email</label>
                    <span>{profile.email || 'Not connected'}</span>
                  </div>
                  <div className="info-item">
                    <label>Account Type</label>
                    <span>{profile.uid ? 'Google Account' : 'Local Account'}</span>
                  </div>
                  <div className="info-item">
                    <label>Member Since</label>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="profile-overview-section">
                <h3>Game Progress</h3>
                <div className="profile-info-grid">
                  <div className="info-item">
                    <label>Current Level</label>
                    <span>{formatNumber(playerProgress.level)}</span>
                  </div>
                  <div className="info-item">
                    <label>Achievements</label>
                    <span>{formatNumber(profile.achievements.length)}</span>
                  </div>
                  <div className="info-item">
                    <label>Experience</label>
                    <span>{formatNumber(playerProgress.experience)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'stats' && (
            <div className="stats-grid">
              <div className="stat-item">
                <label>High Score</label>
                <span>{formatNumber(stats.highScore)}</span>
              </div>
              <div className="stat-item">
                <label>Games Played</label>
                <span>{formatNumber(stats.gamesPlayed)}</span>
              </div>
              <div className="stat-item">
                <label>Average Score</label>
                <span>{formatNumber(stats.gamesPlayed > 0 ? Math.round(stats.totalScore / stats.gamesPlayed) : 0)}</span>
              </div>
              <div className="stat-item">
                <label>Longest Combo</label>
                <span>{formatNumber(stats.longestCombo)}</span>
              </div>
              <div className="stat-item">
                <label>Total Play Time</label>
                <span>{formatNumber(Math.round(stats.totalPlayTime / 60))} mins</span>
              </div>
              <div className="stat-item">
                <label>Last Played</label>
                <span>{new Date(stats.lastPlayed).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          {activeView === 'achievements' && (
            <div className="achievements-container">
              <AchievementsView onClose={() => setActiveView('profile')} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 