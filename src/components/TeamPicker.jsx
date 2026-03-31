import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getTeamsByDivision, divisionOrder } from '../data/teams';
import './TeamPicker.css';

export default function TeamPicker({ onSelect, onClose, isFirstVisit }) {
  const grouped = getTeamsByDivision();

  // Body scroll lock + keyboard handling
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape' && !isFirstVisit) onClose();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [isFirstVisit, onClose]);

  const handleOverlayClick = () => {
    if (!isFirstVisit) onClose();
  };

  return createPortal(
    <div className="team-picker-overlay" onClick={handleOverlayClick}>
      <div
        className="team-picker-modal modal-enter"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="team-picker-header">
          <div className="team-picker-title">Choose Your Team</div>
          {!isFirstVisit && (
            <button className="team-picker-close" onClick={onClose} aria-label="Close">
              &times;
            </button>
          )}
        </div>

        {divisionOrder.map((div) => (
          <div key={div} className="team-picker-division">
            <div className="team-picker-division-label">{div}</div>
            <div className="team-picker-grid">
              {grouped[div].map((t) => (
                <button
                  key={t.id}
                  className="team-picker-btn"
                  onClick={() => onSelect(t.id)}
                >
                  <img src={t.logo} alt={t.name} loading="lazy" />
                  <span>{t.shortName}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {isFirstVisit && (
          <button className="team-picker-skip" onClick={onClose}>
            Skip for now
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
