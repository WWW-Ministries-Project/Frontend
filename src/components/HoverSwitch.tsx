// HoverSwitch.js
import React, { useState } from 'react';
import ChurchLogo from './ChurchLogo';
import LoginIcon from '@/assets/sidebar/LoginIcon';


const HoverSwitch = () => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isHovered ? <LoginIcon/> : <ChurchLogo/> }
    </div>
  );
};

export default HoverSwitch;
