import React, { useState, useEffect, useCallback } from 'react';
import { Database, Upload, Cloud, Lock, Eye, EyeOff, RefreshCw, Clock, Cpu, CloudUpload } from 'lucide-react';
import { SYNC_API_ENDPOINT, SYNC_PASSWORD_KEY } from '../../../utils/constants';

interface DataTabProps {
    onOpenImport: () => void;
    onClose: () => void;
    onCreateBackup: () => Promise<boolean>;
}

interface BackupItem {
    key: string;
    timestamp?: string;
    expiration?: number;
    deviceId?: string;
    updatedAt?: number;
    version?: number;
}

const DataTab: React.FC<DataTabProps> = ({ onOpenImport, onClose, onCreateBackup }) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [backups, setBackups] = useState<BackupItem[]>([]);
    const [isLoadingBackups, setIsLoadingBackups] = useState(false);
    const [backupError, setBackupError] = useState<string | null>(null);
    const [isCreatingBackup, setIsCreatingBackup] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    useEffect(() => {
        setPassword(localStorage.getItem(SYNC_PASSWORD_KEY) || '');
    }, []);

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        setPassword(newVal);
        localStorage.setItem(SYNC_PASSWORD_KEY, newVal);
    };

    const getAuthHeaders = useCallback(() => {
        const storedPassword = localStorage.getItem(SYNC_PASSWORD_KEY);
        return {
            'Content-Type': 'application/json',
            ...(storedPassword ? { 'X-Sync-Password': storedPassword } : {})
        };
    }, []);

    const formatBackupTime = (backup: BackupItem) => {
        if (backup.updatedAt) {
            return new Date(backup.updatedAt).toLocaleString('zh-CN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        if (backup.timestamp) {
            return backup.timestamp.replace('T', ' ');
        }
        return '未知时间';
    };

    const formatDeviceLabel = (deviceId?: string) => {
        if (!deviceId) return '未知设备';
        const parts = deviceId.split('_');
        if (parts.length >= 3 && parts[0] === 'device') {
            const timestamp = Number(parts[1]);
            if (!Number.isNaN(timestamp)) {
                return `设备 ${new Date(timestamp).toLocaleString('zh-CN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}`;
            }
        }
        return deviceId;
    };

    const fetchBackups = useCallback(async () => {
        setIsLoadingBackups(true);
        setBackupError(null);
        try {
            const response = await fetch(`${SYNC_API_ENDPOINT}?action=backups`, {
                headers: getAuthHeaders()
            });
            const result = await response.json();
            if (!result.success) {
                setBackupError(result.error || '获取备份列表失败');
                setBackups([]);
                return;
            }
            setBackups(Array.isArray(result.backups) ? result.backups : []);
        } catch (error: any) {
            setBackupError(error.message || '网络错误');
        } finally {
            setIsLoadingBackups(false);
        }
    }, [getAuthHeaders]);

    const handleCreateBackup = useCallback(async () => {
        setIsCreatingBackup(true);
        setCreateError(null);
        try {
            const success = await onCreateBackup();
            if (!success) {
                setCreateError('备份失败，请稍后重试');
                return;
            }
            await fetchBackups();
        } finally {
            setIsCreatingBackup(false);
        }
    }, [fetchBackups, onCreateBackup]);

    useEffect(() => {
        fetchBackups();
    }, [fetchBackups]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Database size={16} className="text-slate-500" />
                    数据管理 (Data Management)
                </h4>

                {/* KV Sync Info */}
                <div className="mb-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                        <Cloud className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <div className="flex-1">
                            <div className="font-medium text-green-700 dark:text-green-300">云端自动同步已启用</div>
                            <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                                数据变更会自动同步到 Cloudflare KV，多端实时同步
                            </div>
                        </div>
                    </div>

                    {/* API Password Input */}
                    <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800/50">
                        <label className="block text-xs font-bold text-green-800 dark:text-green-200 mb-2 flex items-center gap-1.5">
                            <Lock size={12} />
                            API 访问密码 (可选)
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={handlePasswordChange}
                                placeholder="未设置密码"
                                className="w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-900 border border-green-200 dark:border-green-800 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-green-600/80 dark:text-green-400/80 mt-1.5 leading-relaxed">
                            如需增强安全性，请在 Cloudflare Pages 后台设置 <code>SYNC_PASSWORD</code> 环境变量，并在此处输入相同密码。
                        </p>
                    </div>
                </div>

                {/* Backup List */}
                <div className="mb-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/40">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">云端备份列表</div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleCreateBackup}
                                disabled={isCreatingBackup}
                                className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-200 disabled:opacity-60"
                            >
                                <CloudUpload size={12} className={isCreatingBackup ? 'animate-spin' : ''} />
                                创建备份
                            </button>
                            <button
                                type="button"
                                onClick={fetchBackups}
                                disabled={isLoadingBackups}
                                className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-60"
                            >
                                <RefreshCw size={12} className={isLoadingBackups ? 'animate-spin' : ''} />
                                刷新
                            </button>
                        </div>
                    </div>

                    {createError && (
                        <div className="mb-2 text-xs text-red-600 dark:text-red-400">{createError}</div>
                    )}

                    {isLoadingBackups && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">加载中...</div>
                    )}

                    {!isLoadingBackups && backupError && (
                        <div className="text-xs text-red-600 dark:text-red-400">{backupError}</div>
                    )}

                    {!isLoadingBackups && !backupError && backups.length === 0 && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">暂无备份</div>
                    )}

                    {!isLoadingBackups && !backupError && backups.length > 0 && (
                        <div className="space-y-2">
                            {backups.map((backup) => {
                                const deviceLabel = formatDeviceLabel(backup.deviceId);
                                const showDeviceId = backup.deviceId && deviceLabel !== backup.deviceId;
                                return (
                                <div
                                    key={backup.key}
                                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 px-3 py-2"
                                >
                                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                        <Clock size={12} />
                                        <span>{formatBackupTime(backup)}</span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                        <Cpu size={12} />
                                        <span className="break-all">{deviceLabel}</span>
                                    </div>
                                    {showDeviceId && (
                                        <div className="mt-1 pl-5 text-[10px] text-slate-500 dark:text-slate-400 break-all">
                                            {backup.deviceId}
                                        </div>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <button
                        onClick={() => {
                            onOpenImport();
                            onClose();
                        }}
                        className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 hover:border-accent hover:bg-accent/5 dark:hover:bg-accent/10 transition-all group"
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-accent group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors shadow-sm">
                            <Upload size={24} />
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-accent">导入数据</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">支持 Chrome HTML 书签或 JSON 备份导入</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataTab;
