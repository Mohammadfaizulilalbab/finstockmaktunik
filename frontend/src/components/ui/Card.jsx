import React from 'react';

const Card = ({ children, className = '', title, subtitle, action, noPadding = false, topBorderColor }) => {
  
  const getGradientClass = () => {
    switch (topBorderColor) {
      case 'primary': return 'from-blue-600 to-cyan-300';
      case 'success': return 'from-emerald-500 to-teal-200'; 
      case 'warning': return 'from-orange-500 to-yellow-300';
      case 'danger': return 'from-rose-500 to-pink-300';
      case 'indigo': return 'from-indigo-600 to-blue-300';
      default: return ''; 
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-neutral-200 overflow-hidden relative ${className}`}>
      {topBorderColor && (
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${getGradientClass()}`}></div>
      )}
      {(title || action) && (
        <div className={`px-6 py-4 flex justify-between items-center bg-white ${noPadding ? 'border-b border-neutral-100' : ''}`}>
          <div>
            {title && <h3 className="text-sm font-bold text-neutral-800">{title}</h3>}
            {subtitle && <p className="text-[11px] text-neutral-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};

export default Card;


