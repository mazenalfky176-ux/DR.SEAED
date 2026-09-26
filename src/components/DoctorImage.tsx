import { useState, useEffect } from 'react';
export function DoctorImage({ src, alt, className = '', priority = false }: {
    src: string;
    alt: string;
    className?: string;
    priority?: boolean;
}) {
    const [failed, setFailed] = useState(false);
    const [fallbackFailed, setFallbackFailed] = useState(false);
    useEffect(() => { setFailed(false); setFallbackFailed(false); }, [src]);
    if (fallbackFailed)
        return <div className={className} role="img" aria-label={alt}/>;
    return <img src={failed ? '/doctor-original.jpg' : src} alt={alt} width={976} height={1085} loading={priority ? 'eager' : 'lazy'} decoding="async" fetchPriority={priority ? 'high' : 'auto'} className={className} onError={() => failed ? setFallbackFailed(true) : setFailed(true)}/>;
}
