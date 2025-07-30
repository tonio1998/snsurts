import React, { createContext, useContext, useState } from 'react';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
    const [isSidebarVisible, setSidebarVisible] = useState(false);

    return (
        <SidebarContext.Provider value={{ isSidebarVisible, setSidebarVisible }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => useContext(SidebarContext);
