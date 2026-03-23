"""
Discovery Service

Handles auto-discovery of new servers on the local network.
Uses UDP broadcast to find agents.
"""

import socket
import json
import threading
import time
from datetime import datetime
from typing import List, Dict

from app import db
from app.models.server import Server


class DiscoveryService:
    """
    Service for discovering new servers/agents on the network.
    """

    def __init__(self, port=9000):
        self.port = port
        self._discovered_agents = {}  # agent_id -> info
        self._is_scanning = False
        self._lock = threading.Lock()

    def start_scan(self, duration=10) -> List[Dict]:
        """
        Start a network scan for agents.
        """
        if self._is_scanning:
            return list(self._discovered_agents.values())

        self._is_scanning = True
        self._discovered_agents = {}
        
        # Start listening thread
        listen_thread = threading.Thread(target=self._listen_for_responses, daemon=True)
        listen_thread.start()
        
        # Send broadcast requests
        self._send_broadcast_request()
        
        # Wait for duration
        time.sleep(duration)
        
        self._is_scanning = False
        return list(self._discovered_agents.values())

    def _send_broadcast_request(self):
        """Send UDP broadcast request to discover agents"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
            sock.settimeout(2)
            
            message = json.dumps({
                'type': 'discovery_request',
                'timestamp': int(time.time() * 1000)
            })
            
            # Broadcast to common local networks
            sock.sendto(message.encode(), ('255.255.255.255', self.port))
            sock.close()
        except Exception as e:
            print(f"Error sending discovery broadcast: {e}")

    def _listen_for_responses(self):
        """Listen for UDP discovery responses from agents"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.bind(('', self.port + 1))  # Listen on port + 1
            sock.settimeout(1)
            
            start_time = time.time()
            while self._is_scanning:
                try:
                    data, addr = sock.recvfrom(4096)
                    try:
                        info = json.loads(data.decode())
                        if info.get('type') == 'discovery':
                            agent_id = info.get('agent_id')
                            if agent_id:
                                # Add IP address from sender
                                info['ip_address'] = addr[0]
                                
                                # Check if already registered
                                server = Server.query.filter_by(agent_id=agent_id).first()
                                info['is_registered'] = server is not None
                                if server:
                                    info['server_name'] = server.name
                                    info['server_id'] = server.id
                                
                                with self._lock:
                                    self._discovered_agents[agent_id] = info
                    except Exception as e:
                        print(f"Error parsing discovery response: {e}")
                except socket.timeout:
                    continue
            sock.close()
        except Exception as e:
            print(f"Error in discovery listener: {e}")

    def get_discovered_agents(self) -> List[Dict]:
        """Get currently discovered agents"""
        with self._lock:
            return list(self._discovered_agents.values())


discovery_service = DiscoveryService()
