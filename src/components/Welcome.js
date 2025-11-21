import React from 'react';
import './Welcome.css';

function Welcome({ onEnter }) {
  return (
    <div className="welcome-wrapper">
      <div className="welcome-logo-container">
        {/* RENAMED CLASS: welcome-logo-text */}
        <div className="welcome-logo-text">
          <span className="kaard">KAARD</span><span className="pos">pos</span>
        </div>
        
        <div className="icon-group">
          <div className="circle-bg"></div>
          <div className="icon cart"></div>
          <div className="icon receipt"></div>
          <div className="icon box"></div>
        </div>
        
        <div className="tagline">
          Managing your inventory, <span className="highlight">effortlessly!</span>
        </div>

        <button className="btn-enter" onClick={onEnter}>
          Access System &rarr;
        </button>
      </div>
    </div>
  );
}

export default Welcome;