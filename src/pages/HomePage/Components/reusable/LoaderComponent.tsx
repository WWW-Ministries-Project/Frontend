import React from 'react';
import loader from "@/assets/images/main_loader.gif";

const LoaderComponent = () => {
    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20">
        <img src={loader} alt="loader" />
        </div>
    );
}

export default LoaderComponent;
