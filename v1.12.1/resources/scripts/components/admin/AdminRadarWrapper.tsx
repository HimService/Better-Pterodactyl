import React, { useEffect, useState } from 'react';
import getServers from '@/api/getServers';
import getServerResourceUsage from '@/api/server/getServerResourceUsage';
import TotalLoadRadar, { RadarServerData } from '@/components/dashboard/TotalLoadRadar';
import { motion, AnimatePresence } from 'framer-motion';
import { bytesToString } from '@/lib/formatters';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt, faHdd, faMemory, faMicrochip, faTerminal, faTimes } from '@fortawesome/free-solid-svg-icons';

const AdminRadarWrapper = () => {
    const [radarData, setRadarData] = useState<RadarServerData[]>([]);
    const [selectedServer, setSelectedServer] = useState<RadarServerData | null>(null);
    const [filter, setFilter] = useState<'all' | 'running' | 'offline'>('all');

    useEffect(() => {
        const fetchStats = () => {
            // Check for injected servers first (Admin View)
            const injectedServers = (window as any).AdminRadarServers;

            const getServersPromise = (injectedServers && injectedServers.length > 0)
                ? Promise.resolve({ items: injectedServers })
                : getServers({ page: 1, type: 'admin' });

            getServersPromise
                .then(servers => {
                    console.log(`AdminRadarWrapper: Processing ${servers.items.length} servers`);
                    if (servers.items.length === 0) {
                        setRadarData([]);
                        return;
                    }
                    return Promise.all(servers.items.slice(0, 20).map((s: any) =>
                        getServerResourceUsage(s.uuid)
                            .then(stats => ({
                                id: s.id,
                                uuid: s.uuid,
                                name: s.name,
                                cpu: stats.cpuUsagePercent,
                                ram: s.limits?.memory > 0
                                    ? Math.min((stats.memoryUsageInBytes / (s.limits.memory * 1024 * 1024)) * 100, 100)
                                    : 0, // Handle unlimited or unknown as 0 for visualization or use a heuristic
                                ramUsageRaw: stats.memoryUsageInBytes,
                                diskUsageRaw: stats.diskUsageInBytes,
                                status: stats.status,
                                node: s.node,
                                isNodeMaintenance: s.is_maintenance,
                            }))
                            .catch((err) => {
                                console.warn(`Radar: Failed to fetch stats for ${s.name}`, err);
                                return {
                                    id: s.id,
                                    uuid: s.uuid,
                                    name: s.name,
                                    cpu: 0,
                                    ram: 0,
                                    ramUsageRaw: 0,
                                    diskUsageRaw: 0,
                                    status: 'offline' as any,
                                    node: s.node,
                                    isNodeMaintenance: s.is_maintenance,
                                };
                            })
                    ));
                })
                .then(results => {
                    if (results) {
                        setRadarData(results.filter(r => r !== null) as RadarServerData[]);
                    }
                })
                .catch(err => console.error('Radar: Global fetch error:', err));
        };

        fetchStats();
        const interval = setInterval(fetchStats, 10000); // 10s for admin to be safe
        return () => clearInterval(interval);
    }, []);

    const filteredData = radarData.filter(s => {
        if (filter === 'all') return true;
        if (filter === 'running') return s.status === 'running';
        if (filter === 'offline') return s.status === 'offline';
        return true;
    });

    const hasNodes = ((window as any).AdminRadarNodes || []).length > 0;

    if (radarData.length === 0 && !hasNodes) {
        return (
            <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.5)' }}>
                Searching for active servers...
            </div>
        );
    }

    return (
        <div style={{ marginTop: '24px', position: 'relative' }} className="p-4">
            {/* Filter HUD - Moved down slightly to avoid potential overlaps with top bars */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 flex bg-neutral-900/50 backdrop-blur-md p-1.5 rounded-xl border border-white/10 z-30 gap-1 shadow-xl">
                {(['all', 'running', 'offline'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all ${filter === f ? 'bg-brand-500 text-white' : 'text-neutral-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <TotalLoadRadar
                servers={filteredData}
                nodes={(window as any).AdminRadarNodes || []}
                onSelect={s => setSelectedServer(s)}
                selectedId={selectedServer?.id}
            />

            <AnimatePresence>
                {selectedServer && (
                    <motion.div
                        initial={{ opacity: 0, x: 50, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.95 }}
                        // Added max-height and overflow-y: auto to prevent breaking out of radar container
                        className="fixed md:absolute top-4 right-4 bottom-4 w-72 md:w-80 bg-neutral-900/95 backdrop-blur-2xl border border-white/10 z-[60] p-6 flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.6)] rounded-3xl overflow-y-auto"
                        style={{ maxHeight: 'calc(100% - 32px)' }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white truncate pr-4">{selectedServer.name}</h2>
                            <button
                                onClick={() => setSelectedServer(null)}
                                className="text-neutral-500 hover:text-white transition-colors"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-4 mb-8">
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <div className="flex items-center gap-3 mb-1 text-neutral-400 text-[10px] uppercase font-bold">
                                    <FontAwesomeIcon icon={faMicrochip} className="text-brand-500" />
                                    <span>CPU Usage</span>
                                </div>
                                <div className="text-2xl font-mono font-bold text-white">
                                    {selectedServer.cpu.toFixed(2)}%
                                </div>
                                <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-brand-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(selectedServer.cpu, 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <div className="flex items-center gap-3 mb-1 text-neutral-400 text-[10px] uppercase font-bold">
                                    <FontAwesomeIcon icon={faMemory} className="text-purple-500" />
                                    <span>Memory usage</span>
                                </div>
                                <div className="text-xl font-mono font-bold text-white pr-2">
                                    {bytesToString(selectedServer.ramUsageRaw)}
                                </div>
                                <div className="text-xs text-neutral-500">
                                    Approx. {selectedServer.ram.toFixed(1)}% of limit
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <div className="flex items-center gap-3 mb-1 text-neutral-400 text-[10px] uppercase font-bold">
                                    <FontAwesomeIcon icon={faHdd} className="text-blue-500" />
                                    <span>Disk Usage</span>
                                </div>
                                <div className="text-xl font-mono font-bold text-white pr-2">
                                    {bytesToString(selectedServer.diskUsageRaw)}
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto flex flex-col gap-3">
                            <a
                                href={`/server/${selectedServer.uuid}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition-all"
                            >
                                <FontAwesomeIcon icon={faTerminal} />
                                <span>Manage Server</span>
                            </a>
                            <a
                                href={`/admin/servers/view/${selectedServer.id}`}
                                className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/10"
                            >
                                <FontAwesomeIcon icon={faExternalLinkAlt} />
                                <span>Admin Details</span>
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminRadarWrapper;
