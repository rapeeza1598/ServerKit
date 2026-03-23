"""
Advanced Workflow & Automation Engine

Executes event-driven workflows with logic nodes, triggers, and cross-server actions.
"""

import json
import logging
import traceback
from datetime import datetime
from typing import Dict, List, Any, Optional

from app import db
from app.models import Workflow, WorkflowExecution, WorkflowLog, User
from app.services.workflow_service import WorkflowService
from app.services.docker_service import DockerService
from app.services.database_service import DatabaseService
from app.services.notification_service import NotificationService


class WorkflowEngine:
    """Engine for executing advanced workflows."""

    @staticmethod
    def execute_workflow(workflow_id: int, trigger_type: str = 'manual', context: Dict[str, Any] = None) -> int:
        """
        Execute a workflow by ID.

        Returns:
            ID of the created WorkflowExecution
        """
        workflow = Workflow.query.get(workflow_id)
        if not workflow:
            raise ValueError(f"Workflow {workflow_id} not found")

        # Create execution record
        execution = WorkflowExecution(
            workflow_id=workflow_id,
            trigger_type=trigger_type,
            status='running',
            context=json.dumps(context or {}),
            started_at=datetime.utcnow()
        )
        db.session.add(execution)
        db.session.commit()

        # Update workflow last run
        workflow.last_run_at = execution.started_at
        db.session.commit()

        try:
            # Run the execution in the background or synchronously for now
            WorkflowEngine._run_execution(execution.id)
        except Exception as e:
            WorkflowEngine.log(execution.id, f"Engine Error: {str(e)}", level='ERROR')
            execution.status = 'failed'
            execution.completed_at = datetime.utcnow()
            workflow.last_status = 'failed'
            db.session.commit()

        return execution.id

    @staticmethod
    def _run_execution(execution_id: int):
        """Internal method to run the execution logic."""
        execution = WorkflowExecution.query.get(execution_id)
        workflow = execution.workflow
        
        WorkflowEngine.log(execution_id, f"Starting workflow: {workflow.name}")

        try:
            nodes = json.loads(workflow.nodes) if workflow.nodes else []
            edges = json.loads(workflow.edges) if workflow.edges else []
            
            if not nodes:
                WorkflowEngine.log(execution_id, "Workflow has no nodes", level='WARNING')
                execution.status = 'success'
                execution.completed_at = datetime.utcnow()
                db.session.commit()
                return

            # Build adjacency list and find start nodes
            adj = {}
            for edge in edges:
                source = edge['source']
                target = edge['target']
                if source not in adj: adj[source] = []
                adj[source].append(target)

            # Find trigger nodes or start nodes (no incoming edges)
            incoming_count = {node['id']: 0 for node in nodes}
            for edge in edges:
                target = edge['target']
                if target in incoming_count:
                    incoming_count[target] += 1
            
            # Start with nodes that have no incoming edges (usually triggers)
            queue = [node for node in nodes if incoming_count[node['id']] == 0]
            
            if not queue:
                # If everything is cyclic, just start with the first node
                queue = [nodes[0]]

            # Execution state
            results = {}
            context = json.loads(execution.context) if execution.context else {}
            
            # Simple linear/BFS execution for now
            # TODO: Implement full DAG execution with branch support
            processed = set()
            
            while queue:
                node = queue.pop(0)
                if node['id'] in processed:
                    continue
                
                WorkflowEngine.log(execution_id, f"Executing node: {node.get('data', {}).get('label', node['id'])} ({node['type']})", node_id=node['id'])
                
                # Execute node
                try:
                    node_result = WorkflowEngine._execute_node(node, edges, execution, context, results)
                    results[node['id']] = node_result
                    
                    if not node_result.get('success', True):
                        WorkflowEngine.log(execution_id, f"Node failed: {node_result.get('error')}", level='ERROR', node_id=node['id'])
                        if node_result.get('critical', True):
                            execution.status = 'failed'
                            break
                    
                    # Add next nodes to queue
                    if node['id'] in adj:
                        for next_id in adj[node['id']]:
                            next_node = next((n for n in nodes if n['id'] == next_id), None)
                            if next_node:
                                queue.append(next_node)
                
                except Exception as e:
                    WorkflowEngine.log(execution_id, f"Node Execution Error: {str(e)}", level='ERROR', node_id=node['id'])
                    WorkflowEngine.log(execution_id, traceback.format_exc(), level='DEBUG', node_id=node['id'])
                    execution.status = 'failed'
                    break
                
                processed.add(node['id'])

            if execution.status != 'failed':
                execution.status = 'success'
            
            execution.results = json.dumps(results)
            execution.completed_at = datetime.utcnow()
            workflow.last_status = execution.status
            db.session.commit()
            
            WorkflowEngine.log(execution_id, f"Workflow finished with status: {execution.status}")

        except Exception as e:
            WorkflowEngine.log(execution_id, f"Execution Loop Error: {str(e)}", level='ERROR')
            WorkflowEngine.log(execution_id, traceback.format_exc(), level='DEBUG')
            execution.status = 'failed'
            execution.completed_at = datetime.utcnow()
            db.session.commit()

    @staticmethod
    def _execute_node(node: Dict, edges: List, execution: WorkflowExecution, context: Dict, results: Dict) -> Dict:
        """Execute a single node and return its results."""
        node_type = node.get('type')
        node_data = node.get('data', {})
        
        if node_type == 'trigger':
            return {'success': True, 'output': context}
        
        elif node_type in ('database', 'dockerApp', 'service', 'domain'):
            # Delegate to WorkflowService
            res = WorkflowService.deploy_node(node, edges, execution.workflow.user_id, results)
            return res
        
        elif node_type == 'notification':
            channel = node_data.get('channel', 'discord')
            message = node_data.get('message', 'Workflow notification')
            # Replace placeholders in message from context/results
            # TODO: Implementation
            
            NotificationService.send_notification(
                user_id=execution.workflow.user_id,
                title=f"Workflow: {execution.workflow.name}",
                message=message,
                level='info'
            )
            return {'success': True}
        
        elif node_type == 'script':
            script_type = node_data.get('language', 'bash')
            content = node_data.get('content', '')
            
            if script_type == 'bash':
                import subprocess
                try:
                    res = subprocess.run(content, shell=True, capture_output=True, text=True)
                    return {
                        'success': res.returncode == 0,
                        'stdout': res.stdout,
                        'stderr': res.stderr,
                        'returncode': res.returncode
                    }
                except Exception as e:
                    return {'success': False, 'error': str(e)}
            
            return {'success': False, 'error': f"Unsupported script language: {script_type}"}

        elif node_type == 'logic_if':
            condition = node_data.get('condition', '')
            # TODO: Evaluate condition using context/results
            return {'success': True, 'branch': 'true'} # Dummy
            
        return {'success': True, 'message': f"Node type {node_type} not implemented yet"}

    @staticmethod
    def log(execution_id: int, message: str, level: str = 'INFO', node_id: str = None):
        """Add a log entry for an execution."""
        log = WorkflowLog(
            execution_id=execution_id,
            level=level,
            message=message,
            node_id=node_id
        )
        db.session.add(log)
        db.session.commit()
        # Also print to stdout for debugging
        print(f"[{level}] Workflow {execution_id}: {message}")
