import React, { useMemo, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ServerPowerState } from '@/api/server/getServerResourceUsage';
import tw from 'twin.macro';
import styled, { keyframes } from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldAlt } from '@fortawesome/free-solid-svg-icons';

export interface RadarServerData {
    id: number;
    uuid: string;
    name: string;
    cpu: number; // Percentage
    ram: number; // Percentage (0-100)
    ramUsageRaw: number;
    diskUsageRaw: number;
    status: string;
    node?: string;
    isNodeMaintenance?: boolean;
}

export interface RadarNodeData {
    id: number;
    name: string;
    is_maintenance: boolean;
}

interface TotalLoadRadarProps {
    servers: RadarServerData[];
    nodes?: RadarNodeData[];
    onSelect: (server: RadarServerData) => void;
    selectedId?: number;
}

const scanRotate = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

const RadarContainer = styled.div`
    ${tw`relative w-full h-[450px] md:h-[500px] bg-neutral-900/40 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden mb-8 shadow-2xl flex items-center justify-center`};
    &::before {
        content: '';
        ${tw`absolute inset-0 opacity-[0.03] pointer-events-none`};
        background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0);
        background-size: 24px 24px;
    }
`;

const ScannerLayer = styled.div`
    ${tw`absolute w-[400px] h-[400px] pointer-events-none`};
    background: conic-gradient(from 0deg, transparent 0%, rgba(16, 185, 129, 0.1) 10%, rgba(16, 185, 129, 0.2) 25%, transparent 26%);
    border-radius: 50%;
    animation: ${scanRotate} 6s linear infinite;
`;

const PulseRing = ({ delay = 0 }: { delay?: number }) => (
    <motion.div
        initial={{ scale: 0, opacity: 0.5 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{
            duration: 4,
            repeat: Infinity,
            delay: delay,
            ease: "easeOut"
        }}
        className="absolute w-64 h-64 border border-brand-500/20 rounded-full pointer-events-none"
    />
);

const TotalLoadRadar: React.FC<TotalLoadRadarProps> = ({ servers, nodes = [], onSelect, selectedId }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [zoom, setZoom] = useState(1);
    const [nodeStatuses, setNodeStatuses] = useState<Record<string, boolean>>((window as any).AdminRadarNodeStatuses || {});

    // Listen for node status updates from the vanilla JS in Blade
    useEffect(() => {
        const handleStatusUpdate = (e: any) => {
            if (e.detail && e.detail.statuses) {
                setNodeStatuses(e.detail.statuses);
            }
        };
        window.addEventListener('radar:node-status-update', handleStatusUpdate);
        return () => window.removeEventListener('radar:node-status-update', handleStatusUpdate);
    }, []);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const preventDefault = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) return;
            e.preventDefault();
            e.stopPropagation();
            setZoom(prev => Math.min(Math.max(prev - e.deltaY * 0.001, 0.5), 3));
        };

        el.addEventListener('wheel', preventDefault, { passive: false });
        return () => el.removeEventListener('wheel', preventDefault);
    }, []);
    // Cluster calculation: 
    // 1. Panel (Hub) is at the center (160, 160)
    // 2. Assign each node a center point in the middle orbit (distance ~90)
    // 3. Cluster servers around their node center based on their own metrics
    // Generate centers based on PROVIDED nodes (Node-Centric)
    const { serverPoints, nodeCenters } = useMemo(() => {
        // If nodes prop is provided, use it. Fallback to deriving from servers for non-admin view.
        const nodeNames = nodes.length > 0
            ? nodes.map(n => n.name)
            : Array.from(new Set(servers.map(s => s.node || 'Unknown')));

        const centers = nodeNames.map((name, i) => {
            const angle = (i / nodeNames.length) * Math.PI * 2;
            const distance = 110;

            // Find node info if available
            const nodeInfo = nodes.find(n => n.name === name);
            const nodeServers = servers.filter(s => (s.node || 'Unknown') === name);

            // Status: 
            let isNodeDead = false;
            if (nodeInfo && nodeStatuses[nodeInfo.id] !== undefined) {
                isNodeDead = !nodeStatuses[nodeInfo.id] || nodeInfo.is_maintenance;
            } else {
                const explicitMaintenance = nodeServers.length > 0 ? nodeServers[0].isNodeMaintenance : (nodeInfo?.is_maintenance || false);
                isNodeDead = explicitMaintenance || (nodeServers.length > 0 && nodeServers.every(s => s.status === 'offline' || !s.status));
            }

            return {
                id: nodeInfo?.id,
                name,
                x: 250 + distance * Math.cos(angle) || 250,
                y: 250 + distance * Math.sin(angle) || 250,
                isOffline: isNodeDead,
            };
        });

        // Calculate Server points relative to their node centers
        const points = servers.map((server) => {
            const nodeCenter = centers.find(c => c.name === (server.node || 'Unknown')) || centers[0];

            // Random-ish but stable distribution around the node center
            const charCodeSum = server.uuid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const serverAngle = (charCodeSum % 360) * (Math.PI / 180);

            const isServerOffline = nodeCenter.isOffline || server.status === 'offline' || !server.status;

            // Distance from node center based on CPU (increased spacing even more)
            const cpuFactor = Math.min(server.cpu, 100) / 100;
            const clusterRadius = 100;
            const variation = (charCodeSum % 40);
            const distance = 45 + cpuFactor * (clusterRadius - 25) + variation;

            const x = nodeCenter.x + distance * Math.cos(serverAngle);
            const y = nodeCenter.y + distance * Math.sin(serverAngle);

            return {
                ...server,
                x: x || nodeCenter.x,
                y: y || nodeCenter.y,
                centerX: nodeCenter.x,
                centerY: nodeCenter.y,
                isOffline: isServerOffline,
                size: Math.min(4 + ((server.ram || 0) / 100) * 8, 20),
            };
        });

        return { serverPoints: points, nodeCenters: centers };
    }, [servers, nodes, nodeStatuses]);

    return (
        <RadarContainer ref={containerRef} style={{ cursor: 'crosshair' }}>
            <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                animate={{ scale: zoom }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                {/* Scanning Beam */}
                <ScannerLayer />

                {/* Background Grid / Rings */}
                {[1, 2, 3, 4].map((ring) => (
                    <div
                        key={ring}
                        className="absolute border border-white/5 rounded-full"
                        style={{ width: `${ring * 80}px`, height: `${ring * 80}px` }}
                    />
                ))}

                {/* Tactical Axes */}
                <div className="absolute w-[320px] h-px bg-white/5"></div>
                <div className="absolute h-[320px] w-px bg-white/5"></div>
                {[0, 90, 180, 270].map(deg => (
                    <div
                        key={deg}
                        className="absolute text-[8px] font-mono text-neutral-600 pointer-events-none"
                        style={{
                            transform: `rotate(${deg}deg) translateY(-170px)`,
                        }}
                    >
                        {deg}°
                    </div>
                ))}

                {/* Scanning Pulse rings */}
                <PulseRing delay={0} />
                <PulseRing delay={2} />

                {/* Dynamic Rotating Glow */}
                <motion.div
                    className="absolute inset-0 z-0 pointer-events-none"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                >
                    <div className="absolute top-1/2 left-1/2 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/20 to-emerald-500/80 -translate-y-1/2 origin-left scale-x-125" />
                </motion.div>

                {/* Central Panel Hub - Visual Background */}
                <div className="flex flex-col items-center justify-center z-10 bg-neutral-900 border border-emerald-500/50 rounded-full w-14 h-14 shadow-[0_0_40px_rgba(16,185,129,0.4)] backdrop-blur-md">
                    <FontAwesomeIcon icon={faShieldAlt} className="text-emerald-400 text-xl" />
                </div>

                <svg className="absolute w-[500px] h-[500px] overflow-visible pointer-events-auto" viewBox="0 0 500 500">
                    {/* Node Orbit Path (subtle ring) */}
                    <circle cx="250" cy="250" r="110" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="2 4" className="opacity-10" />

                    {/* Central Hub Label (Precise SVG alignment) */}
                    <text
                        x="250"
                        y="288"
                        textAnchor="middle"
                        className="fill-emerald-500 text-[8px] font-bold uppercase tracking-widest pointer-events-none"
                    >
                        Panel Hub
                    </text>

                    {/* Connection Lines (Panel to Nodes) - Tactical Animation */}
                    {nodeCenters.map((center: any) => (
                        <motion.line
                            key={`path-${center.name}`}
                            x1="250"
                            y1="250"
                            x2={center.x}
                            y2={center.y}
                            stroke={center.isOffline ? "rgba(255,255,255,0.05)" : "rgba(16, 185, 129, 0.3)"}
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                        />
                    ))}

                    {/* Node Centers */}
                    {nodeCenters.map((center: any) => (
                        <g key={`node-${center.name}`}>
                            <circle
                                cx={center.x}
                                cy={center.y}
                                r="5"
                                fill={center.isOffline ? "#262626" : "rgba(var(--color-brand-600), 0.4)"}
                                stroke={center.isOffline ? "#404040" : "rgba(var(--color-brand-400), 0.8)"}
                                strokeWidth="1.5"
                                className={center.isOffline ? "" : "animate-pulse"}
                            />
                            <text
                                x={center.x}
                                y={center.y - 12}
                                textAnchor="middle"
                                className={`text-[7px] font-mono uppercase font-bold pointer-events-none ${center.isOffline ? 'fill-neutral-600' : 'fill-brand-400'}`}
                            >
                                {center.name} {center.isOffline ? '(OFFLINE)' : ''}
                            </text>
                        </g>
                    ))}

                    {/* Connection Lines (Server to Node) - Tactical Animation */}
                    {serverPoints.map((point: any) => (
                        <motion.line
                            key={`line-${point.id}`}
                            x1={point.centerX}
                            y1={point.centerY}
                            x2={point.x}
                            y2={point.y}
                            stroke={point.isOffline ? "rgba(255,255,255,0.03)" : "rgba(16, 185, 129, 0.25)"}
                            strokeWidth="0.6"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1, delay: 0.5 }}
                        />
                    ))}

                    {/* Server Nodes */}
                    <AnimatePresence>
                        {serverPoints.map((point: any) => {
                            const isHighLoad = point.cpu > 90;
                            const isSelected = selectedId === point.id;
                            const isHovered = hoveredId === point.id;

                            const color = point.status === 'running'
                                ? (isHighLoad ? '#ef4444' : '#10b981')
                                : (point.status === 'offline' ? '#6b7280' : '#f59e0b');

                            return (
                                <g
                                    key={point.id}
                                    className="cursor-pointer"
                                    onMouseEnter={() => setHoveredId(point.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    onClick={() => onSelect?.(point)}
                                >
                                    {(isHighLoad || isSelected) && (
                                        <motion.circle
                                            cx={point.x}
                                            cy={point.y}
                                            r={point.size + (isSelected ? 8 : 4)}
                                            fill="transparent"
                                            stroke={color}
                                            strokeWidth={isSelected ? 2 : 1}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: isSelected ? [1, 1.2, 1] : 2, opacity: isSelected ? 0.3 : 0 }}
                                            transition={{
                                                duration: isSelected ? 2 : 1,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                        />
                                    )}
                                    <motion.circle
                                        initial={{ scale: 0 }}
                                        animate={{
                                            scale: isHovered || isSelected ? 1.4 : 1,
                                            filter: `drop-shadow(0 0 ${isHovered || isSelected || isHighLoad ? '8px' : '4px'} ${color}80)`
                                        }}
                                        exit={{ scale: 0 }}
                                        cx={point.x}
                                        cy={point.y}
                                        r={point.size}
                                        fill={color}
                                        className="shadow-xl"
                                    />

                                    {/* HUD Label for Hover/Selected - Flipping Logic */}
                                    {(isHovered || isSelected) && (
                                        <motion.g
                                            initial={{ opacity: 0, x: point.x > 250 ? -10 : 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                        >
                                            {/* Smart positioning: Flip to left if on right side of radar */}
                                            {(() => {
                                                const labelWidth = Math.max(160, point.name.length * 8 + 10);
                                                const onRightSide = point.x > 250;
                                                const labelX = onRightSide ? point.x - labelWidth - 12 : point.x + 12;
                                                const textX = labelX + 6;

                                                return (
                                                    <g>
                                                        <rect
                                                            x={labelX}
                                                            y={point.y - 12}
                                                            width={labelWidth}
                                                            height="32"
                                                            rx="4"
                                                            fill="rgba(0,0,0,0.95)"
                                                            className="backdrop-blur-md border border-white/10"
                                                        />
                                                        <text
                                                            x={textX}
                                                            y={point.y + 2}
                                                            fill="white"
                                                            className="text-[10px] font-bold"
                                                        >
                                                            {point.name}
                                                        </text>
                                                        <text
                                                            x={textX}
                                                            y={point.y + 12}
                                                            fill={color}
                                                            className="text-[8px] font-mono"
                                                        >
                                                            CPU: {point.cpu.toFixed(1)}% | RAM: {point.ram.toFixed(1)}%
                                                        </text>
                                                    </g>
                                                );
                                            })()}
                                        </motion.g>
                                    )}
                                </g>
                            );
                        })}
                    </AnimatePresence>
                </svg>
            </motion.div>

            {/* Radar Legend/Title */}
            <div className="absolute top-6 left-8 flex flex-col z-20 pointer-events-none">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-500 mb-1">Network Sonar</span>
                <span className="text-sm font-bold text-white uppercase tracking-wider">{nodeCenters.length} Active Nodes</span>
            </div>

            {/* Stats Summary (Right side) */}
            <div className="absolute top-6 right-8 hidden md:flex flex-col items-end z-20 pointer-events-none">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-neutral-500 uppercase font-bold">Avg Load</span>
                        <span className="text-lg font-mono font-bold text-brand-400">
                            {(servers.reduce((acc, s) => acc + s.cpu, 0) / (servers.length || 1)).toFixed(1)}%
                        </span>
                    </div>
                    <div className="w-px h-8 bg-white/10 mx-1"></div>
                    <div className="flex flex-col items-end">
                        <span tw="text-neutral-500 mr-2">Online Nodes:</span>
                        <span tw="text-brand-400 font-mono">
                            {nodeCenters.filter(n => !n.isOffline).length} / {nodeCenters.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Zoom Indicator */}
            <div className="absolute bottom-6 right-8 text-[10px] font-mono text-neutral-500 z-20 uppercase tracking-widest pointer-events-none">
                Zoom: {zoom.toFixed(1)}x
            </div>
        </RadarContainer>
    );
};

export default TotalLoadRadar;
