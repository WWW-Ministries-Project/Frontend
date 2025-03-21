import React from 'react';

interface BadgeProps {
    children: string;
    className?: string;
}

const Badge: React.FC<BadgeProps> = ({children, className}) => {
    return ( 
        <div className={` ${className? className:"bg-blue-50  text-blue-700 border-blue-200 text-xs"} font-semibold  rounded-full  px-3 border `}>
                        {children}
                    </div>
     );
}
 
export default Badge;