import React from 'react';

const Button = ({ icon, onClick, backgroundColor }) => {
  return (
    <button
      className="custom-button"
      onClick={onClick}
      style={{ backgroundColor }}
    >
      {icon}
    </button>
  );
};

export default Button;