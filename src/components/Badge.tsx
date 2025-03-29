import React from 'react';

interface BadgeProps {
    children: string;
    className?: string;
}

const Badge: React.FC<BadgeProps> = ({children, className}) => {
    return ( 
        <div>
            <div className={` ${className? className:"bg-blue-50  text-blue-700 border-blue-200 text-xs"}  font-semibold  rounded-full  px-2 border flex items-center justify-center`}>
                        <p>{children}</p>
                    </div>
        </div>
     );
}
 
export default Badge;