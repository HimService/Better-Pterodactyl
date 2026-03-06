import React, { useMemo } from 'react';
import styled from 'styled-components/macro';

interface Props {
    data: number[];
    width?: number;
    height?: number;
    color?: string;
    limit?: number;
}

const SVG = styled.svg`
    overflow: visible;
`;

const Sparkline: React.FC<Props> = ({ data, width = 60, height = 16, color = 'rgb(var(--color-brand-500))', limit = 100 }) => {
    const points = useMemo(() => {
        if (data.length < 2) return '';

        // We want to show at most 20 points
        const displayData = data.slice(-20);
        const step = width / (displayData.length - 1);

        return displayData.map((v: number, i: number) => {
            const x = i * step;
            // Invert Y because SVG coordinates start from top
            const y = height - (Math.min(v, limit) / limit) * height;
            return `${x},${y}`;
        }).join(' ');
    }, [data, width, height, limit]);

    const areaPoints = useMemo(() => {
        if (data.length < 2) return '';
        const displayData = data.slice(-20);
        const step = width / (displayData.length - 1);

        const pts = displayData.map((v: number, i: number) => {
            const x = i * step;
            const y = height - (Math.min(v, limit) / limit) * height;
            return `${x},${y}`;
        });

        // Add bottom corners to close the shape for fill
        const lastX = (displayData.length - 1) * step;
        return [...pts, `${lastX},${height}`, `0,${height}`].join(' ');
    }, [data, width, height, limit]);

    if (data.length < 2) return null;

    return (
        <div style={{ width, height, display: 'flex', alignItems: 'center', position: 'relative' }}>
            <SVG width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                <defs>
                    <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
                        <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
                    </linearGradient>
                </defs>
                <polygon
                    points={areaPoints}
                    fill={`url(#grad-${color})`}
                />
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                />
            </SVG>
        </div>
    );
};

export default Sparkline;
