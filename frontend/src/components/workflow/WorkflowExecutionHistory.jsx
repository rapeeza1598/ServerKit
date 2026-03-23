import React, { useState, useEffect, useCallback } from 'react';
import { X, Clock, CheckCircle, XCircle, Loader2, List, FileText, RefreshCw, Activity } from 'lucide-react';
import api from '../../services/api';

const WorkflowExecutionHistory = ({ workflowId, onClose }) => {
    const [executions, setExecutions] = useState([]);
    const [selectedExecution, setSelectedExecution] = useState(null);
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLogsLoading, setIsLogsLoading] = useState(false);

    const fetchExecutions = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.getWorkflowExecutions(workflowId);
            setExecutions(response.executions || []);
        } catch (error) {
            console.error('Failed to fetch executions:', error);
        } finally {
            setIsLoading(false);
        }
    }, [workflowId]);

    const fetchLogs = useCallback(async (executionId) => {
        setIsLogsLoading(true);
        try {
            const response = await api.getWorkflowExecutionLogs(executionId);
            setLogs(response.logs || []);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setIsLogsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExecutions();
    }, [fetchExecutions]);

    useEffect(() => {
        if (selectedExecution) {
            fetchLogs(selectedExecution.id);
        }
    }, [selectedExecution, fetchLogs]);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success': return <CheckCircle size={16} className="text-green-500" />;
            case 'failed': return <XCircle size={16} className="text-red-500" />;
            case 'running': return <Loader2 size={16} className="text-blue-500 animate-spin" />;
            default: return <Clock size={16} className="text-gray-500" />;
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content max-w-4xl w-full h-[80vh] flex flex-col p-0 overflow-hidden">
                <div className="modal-header p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                    <div className="flex items-center gap-2">
                        <Activity size={20} className="text-blue-400" />
                        <h2 className="text-lg font-semibold">Execution History</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={fetchExecutions}
                            className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
                            title="Refresh"
                        >
                            <RefreshCw size={18} />
                        </button>
                        <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Executions List */}
                    <div className="w-1/3 border-r border-gray-700 overflow-y-auto bg-gray-900/30">
                        {isLoading ? (
                            <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-500" /></div>
                        ) : executions.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">No executions found</div>
                        ) : (
                            <div className="divide-y divide-gray-800">
                                {executions.map((exec) => (
                                    <div 
                                        key={exec.id}
                                        className={`p-3 cursor-pointer transition-colors hover:bg-gray-800/50 ${selectedExecution?.id === exec.id ? 'bg-blue-900/20 border-l-2 border-blue-500' : ''}`}
                                        onClick={() => setSelectedExecution(exec)}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-mono text-gray-400">#{exec.id}</span>
                                            {getStatusIcon(exec.status)}
                                        </div>
                                        <div className="text-sm font-medium">{exec.trigger_type} trigger</div>
                                        <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(exec.started_at).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Execution Details & Logs */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-gray-900/50">
                        {selectedExecution ? (
                            <>
                                <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-sm font-semibold flex items-center gap-2">
                                            Execution Details #{selectedExecution.id}
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                                                selectedExecution.status === 'success' ? 'bg-green-900/30 text-green-400 border border-green-500/30' : 
                                                selectedExecution.status === 'failed' ? 'bg-red-900/30 text-red-400 border border-red-500/30' : 
                                                'bg-blue-900/30 text-blue-400 border border-blue-500/30'
                                            }`}>
                                                {selectedExecution.status}
                                            </span>
                                        </h3>
                                        <div className="text-[10px] text-gray-500 mt-1">
                                            Duration: {selectedExecution.duration ? `${selectedExecution.duration.toFixed(2)}s` : 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
                                    <div className="flex items-center gap-2 text-gray-400 mb-4 border-b border-gray-800 pb-2">
                                        <FileText size={14} />
                                        <span>Execution Logs</span>
                                    </div>

                                    {isLogsLoading ? (
                                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-500" /></div>
                                    ) : logs.length === 0 ? (
                                        <div className="text-gray-600 italic">No logs available for this execution.</div>
                                    ) : (
                                        <div className="space-y-1">
                                            {logs.map((log) => (
                                                <div key={log.id} className="flex gap-3 py-0.5 hover:bg-white/5 px-1 rounded transition-colors">
                                                    <span className="text-gray-600 shrink-0">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                                    <span className={`shrink-0 w-12 font-bold ${
                                                        log.level === 'ERROR' ? 'text-red-400' : 
                                                        log.level === 'WARNING' ? 'text-yellow-400' : 
                                                        log.level === 'DEBUG' ? 'text-gray-500' : 'text-blue-400'
                                                    }`}>
                                                        {log.level}
                                                    </span>
                                                    {log.node_id && (
                                                        <span className="text-indigo-400 shrink-0">[{log.node_id}]</span>
                                                    )}
                                                    <span className="text-gray-300 break-all">{log.message}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
                                <Activity size={48} className="mb-4 opacity-20" />
                                <p>Select an execution to view details and logs</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkflowExecutionHistory;
