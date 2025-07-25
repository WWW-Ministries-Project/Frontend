import React from 'react';

interface MoreEventsIndicatorProps {
  count: number;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
  singularText?: string;
  pluralText?: string;
  renderContent?: (count: number) => React.ReactNode;
}

const MoreEventsIndicator: React.FC<MoreEventsIndicatorProps> = ({
  count,
  onClick,
  className = 'text-primary text-xs font-bold cursor-pointer hover:underline',
  style,
  singularText = 'more event',
  pluralText = 'more events',
  renderContent,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(e);
  };

  const defaultContent = (
    <>
      {count} {count === 1 ? singularText : pluralText}
    </>
  );

  return (
    <div
      className={className}
      style={style}
      onClick={handleClick}
    >
      {renderContent ? renderContent(count) : defaultContent}
    </div>
  );
};

export default MoreEventsIndicator;