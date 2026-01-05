'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
    children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(false);
    const [displayChildren, setDisplayChildren] = useState(children);

    useEffect(() => {
        // Start transition animation
        setIsLoading(true);

        // Short delay for fade out
        const timeout = setTimeout(() => {
            setDisplayChildren(children);
            setIsLoading(false);
        }, 150);

        return () => clearTimeout(timeout);
    }, [pathname, children]);

    return (
        <div
            className={`transition-all duration-300 ease-out ${isLoading
                    ? 'opacity-0 translate-y-2'
                    : 'opacity-100 translate-y-0'
                }`}
        >
            {displayChildren}
        </div>
    );
}
