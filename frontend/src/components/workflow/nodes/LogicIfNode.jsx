import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch, Check, X } from 'lucide-react';

const LogicIfNode = ({ data, selected }) => {
    const { 
        condition = '', 
        label = 'If/Else'
    } = data;

    return (
        <div className={`workflow-node node-logic ${selected ? 'node-selected' : ''}`}>
            <Handle
                type="target"
                position={Position.Top}
                id="input"
                className="handle-input"
            />
            
            <div className="node-icon bg-gray-800">
                <GitBranch size={16} className="text-orange-400" />
            </div>
            <div className="node-content">
                <div className="node-label">{label}</div>
                <div className="node-sublabel">
                    {condition || 'No condition'}
                </div>
            </div>
            
            <div className="node-outputs flex justify-around w-full mt-2 border-t border-gray-700 pt-2">
                <div className="flex flex-col items-center">
                    <span className="text-[10px] text-green-400 font-bold mb-1">TRUE</span>
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="true"
                        className="handle-output handle-true !left-[25%]"
                    />
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] text-red-400 font-bold mb-1">FALSE</span>
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="false"
                        className="handle-output handle-false !left-[75%]"
                    />
                </div>
            </div>
        </div>
    );
};

export default memo(LogicIfNode);
