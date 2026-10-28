import { useEffect, useState, useRef, type MouseEvent } from 'react';
import type { FlowNodeContract as FlowNode, FlowLayoutPayload as Flow } from '@notifyiq/schemas';
import { apiClient } from '../../lib/api/apiClient';
import { Icon } from '../../components/ui/Icon';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorAlert } from '../../components/ui/ErrorAlert';
import { EmptyState } from '../../components/ui/EmptyState';

const NODE_TYPES = [
  { type: 'trigger', label: 'Trigger', color: 'var(--sentiment-positive)', description: 'Inbound Webhook / Keyword Event' },
  { type: 'condition', label: 'Condition', color: 'var(--accent-light)', description: 'Router & Sentiment / Keyword Check' },
  { type: 'send_message', label: 'Send Message', color: '#00a4bd', description: 'WhatsApp Outbound Message' },
  { type: 'ai_respond', label: 'AI Respond', color: '#8b5cf6', description: 'Google Gemini Auto-Reply & RAG' },
  { type: 'action', label: 'Action', color: '#f59e0b', description: 'Tag Contact / Update CRM' },
  { type: 'human_handoff', label: 'Human Handoff', color: 'var(--sentiment-urgent)', description: 'Escalate to Live Inbox Agent' },
];

export default function FlowBuilderPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [activeFlow, setActiveFlow] = useState<Flow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Drag & Canvas states
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Selected node & edge states
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [targetNodeId, setTargetNodeId] = useState<string>('');
  const [edgeLabelInput, setEdgeLabelInput] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState('');
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);

  // Simulator states
  const [showSimulator, setShowSimulator] = useState(false);
  const [simInputMessage, setSimInputMessage] = useState('Hello, I need pricing information');
  const [simSentiment, setSimSentiment] = useState('neutral');
  const [simRunning, setSimRunning] = useState(false);
  const [simResult, setSimResult] = useState<any | null>(null);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);

  const loadFlows = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{ data: Flow[] }>('/api/flows');
      if (response.data && response.data.length > 0) {
        setFlows(response.data);
        const currentActive = response.data.find((f) => f.active) || response.data[0];
        setActiveFlow(currentActive);
        if (currentActive.nodes.length > 0) {
          setSelectedNodeId(currentActive.nodes[0].id);
        }
      } else {
        await handleCreateNewFlow();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch automation flow layouts from backend.');
      setActiveFlow(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlows();
  }, []);

  const handleCreateNewFlow = async () => {
    try {
      setStatusMessage('Creating new automation flow...');
      const createRes = await apiClient.post<{ data: Flow }>('/api/flows', {
        name: `Customer Support Flow ${flows.length + 1}`,
        description: 'Automated intent routing, instant messaging, and escalation flow.',
      });
      if (createRes.data) {
        const newFlow = createRes.data;
        setFlows((prev) => [newFlow, ...prev]);
        setActiveFlow(newFlow);
        if (newFlow.nodes.length > 0) setSelectedNodeId(newFlow.nodes[0].id);
        setStatusMessage('New flow created successfully!');
        setTimeout(() => setStatusMessage(''), 2500);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create new flow');
    }
  };

  const handleSelectFlow = (flowId: string) => {
    const selected = flows.find((f) => f._id === flowId);
    if (selected) {
      setActiveFlow(selected);
      setSelectedNodeId(selected.nodes.length > 0 ? selected.nodes[0].id : null);
      setSelectedEdgeId(null);
      setHighlightedNodeIds([]);
      setSimResult(null);
    }
  };

  const handleToggleActive = async () => {
    if (!activeFlow || !activeFlow._id) return;
    const newActiveState = !activeFlow.active;
    try {
      setStatusMessage(newActiveState ? 'Activating flow...' : 'Deactivating flow...');
      const res = await apiClient.patch<{ data: Flow }>(`/api/flows/${activeFlow._id}/toggle`, {
        active: newActiveState,
      });
      if (res.data) {
        const updatedFlow = res.data;
        setActiveFlow(updatedFlow);
        setFlows((prev) =>
          prev.map((f) => {
            if (f._id === updatedFlow._id) return updatedFlow;
            return f;
          })
        );
        setStatusMessage(`Flow ${newActiveState ? 'activated' : 'deactivated'} successfully!`);
        setTimeout(() => setStatusMessage(''), 2500);
      }
    } catch (err: any) {
      setStatusMessage(`Toggle failed: ${err?.message || 'Error updating flow status'}`);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleDuplicateFlow = async () => {
    if (!activeFlow || !activeFlow._id) return;
    try {
      setStatusMessage('Duplicating workflow layout...');
      const res = await apiClient.post<{ data: Flow }>(`/api/flows/${activeFlow._id}/duplicate`, {});
      if (res.data) {
        const duplicated = res.data;
        setFlows((prev) => [duplicated, ...prev]);
        setActiveFlow(duplicated);
        setSelectedNodeId(duplicated.nodes.length > 0 ? duplicated.nodes[0].id : null);
        setStatusMessage('Flow duplicated successfully!');
        setTimeout(() => setStatusMessage(''), 2500);
      }
    } catch (err: any) {
      setStatusMessage(`Duplicate failed: ${err?.message || 'Error'}`);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleDeleteActiveFlow = async () => {
    if (!activeFlow || !activeFlow._id) return;
    if (!window.confirm(`Are you sure you want to delete "${activeFlow.name}"?`)) return;

    try {
      setStatusMessage('Deleting flow...');
      await apiClient.delete(`/api/flows/${activeFlow._id}`);
      const remaining = flows.filter((f) => f._id !== activeFlow._id);
      setFlows(remaining);
      if (remaining.length > 0) {
        setActiveFlow(remaining[0]);
        setSelectedNodeId(remaining[0].nodes.length > 0 ? remaining[0].nodes[0].id : null);
      } else {
        await handleCreateNewFlow();
      }
      setStatusMessage('Flow deleted successfully!');
      setTimeout(() => setStatusMessage(''), 2500);
    } catch (err: any) {
      setStatusMessage(`Delete failed: ${err?.message || 'Error'}`);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setDraggingNodeId(nodeId);

    const node = activeFlow?.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    dragOffsetRef.current = {
      x: e.clientX - node.position.x,
      y: e.clientY - node.position.y,
    };
  };

  useEffect(() => {
    if (!draggingNodeId) return;

    const onMouseMove = (e: globalThis.MouseEvent) => {
      const newX = e.clientX - dragOffsetRef.current.x;
      const newY = e.clientY - dragOffsetRef.current.y;

      setActiveFlow((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          nodes: prev.nodes.map((n) =>
            n.id === draggingNodeId
              ? {
                  ...n,
                  position: {
                    x: Math.max(10, Math.min(1800, newX)),
                    y: Math.max(10, Math.min(1200, newY)),
                  },
                }
              : n,
          ),
        };
      });
    };

    const onMouseUp = () => {
      setDraggingNodeId(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [draggingNodeId]);

  const connectNodes = (sourceId: string, targetId: string, label?: string) => {
    if (!activeFlow || sourceId === targetId) return;
    const edgeExists = activeFlow.edges.some((e) => e.source === sourceId && e.target === targetId);
    if (edgeExists) {
      setStatusMessage('Connection already exists!');
      setTimeout(() => setStatusMessage(''), 2500);
      return;
    }
    const newEdge = {
      id: `e${sourceId}-${targetId}`,
      source: sourceId,
      target: targetId,
      label: label || undefined,
    };
    setActiveFlow({
      ...activeFlow,
      edges: [...activeFlow.edges, newEdge],
    });
    setConnectingSourceId(null);
    setStatusMessage('Connected successfully!');
    setTimeout(() => setStatusMessage(''), 2500);
  };

  const handlePaletteDragStart = (e: React.DragEvent<HTMLDivElement>, type: string) => {
    e.dataTransfer.setData('text/plain', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleCanvasDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCanvasDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!activeFlow || !canvasRef.current) return;
    const type = e.dataTransfer.getData('text/plain');
    if (!type) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const dropX = Math.max(10, Math.min(1400, e.clientX - rect.left - 80));
    const dropY = Math.max(10, Math.min(900, e.clientY - rect.top - 30));

    const newId = String(Date.now()).slice(-4);
    const typeObj = NODE_TYPES.find((t) => t.type === type);
    const newNode: FlowNode = {
      id: newId,
      type: type as any,
      data: {
        label: `${typeObj?.label || 'Node'} ${newId}`,
        ...(type === 'trigger' ? { triggerType: 'keyword', keywords: ['hello', 'help'] } : {}),
        ...(type === 'condition' ? { conditionType: 'sentiment', value: 'positive' } : {}),
        ...(type === 'send_message' ? { messageText: 'Hello! How can we help you today?' } : {}),
        ...(type === 'ai_respond' ? { useKnowledgeBase: true, systemPrompt: 'Be a polite support agent.' } : {}),
        ...(type === 'action' ? { actionType: 'add_tag', tagName: 'lead' } : {}),
        ...(type === 'human_handoff' ? { reason: 'Requires manual assistance' } : {}),
      },
      position: { x: dropX, y: dropY },
    };

    setActiveFlow({
      ...activeFlow,
      nodes: [...activeFlow.nodes, newNode],
    });
    setSelectedNodeId(newId);
  };

  const handleAddNode = (type: string) => {
    if (!activeFlow) return;
    const newId = String(Date.now()).slice(-4);
    const typeObj = NODE_TYPES.find((t) => t.type === type);
    const newNode: FlowNode = {
      id: newId,
      type: type as any,
      data: {
        label: `${typeObj?.label || 'Node'} ${newId}`,
        ...(type === 'trigger' ? { triggerType: 'any_message', keywords: [] } : {}),
        ...(type === 'condition' ? { conditionType: 'sentiment', value: 'positive' } : {}),
        ...(type === 'send_message' ? { messageText: 'Hello! How can we help you today?' } : {}),
        ...(type === 'ai_respond' ? { useKnowledgeBase: true, systemPrompt: 'Be a polite support agent.' } : {}),
        ...(type === 'action' ? { actionType: 'add_tag', tagName: 'lead' } : {}),
        ...(type === 'human_handoff' ? { reason: 'Requires manual assistance' } : {}),
      },
      position: { x: 200 + Math.floor(Math.random() * 120), y: 150 + Math.floor(Math.random() * 120) },
    };

    const updatedFlow = {
      ...activeFlow,
      nodes: [...activeFlow.nodes, newNode],
    };
    setActiveFlow(updatedFlow);
    setSelectedNodeId(newId);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!activeFlow) return;
    const updatedNodes = activeFlow.nodes.filter((n) => n.id !== nodeId);
    const updatedEdges = activeFlow.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
    setActiveFlow({
      ...activeFlow,
      nodes: updatedNodes,
      edges: updatedEdges,
    });
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(updatedNodes.length > 0 ? updatedNodes[0].id : null);
    }
  };

  const handleAddEdge = () => {
    if (!activeFlow || !selectedNodeId || !targetNodeId || selectedNodeId === targetNodeId) return;

    const newEdgeId = `e${selectedNodeId}-${targetNodeId}`;
    const edgeExists = activeFlow.edges.some((e) => e.source === selectedNodeId && e.target === targetNodeId);
    if (edgeExists) {
      setStatusMessage('Connection line already exists!');
      setTimeout(() => setStatusMessage(''), 2500);
      return;
    }

    const newEdge = {
      id: newEdgeId,
      source: selectedNodeId,
      target: targetNodeId,
      label: edgeLabelInput.trim() || undefined,
    };

    setActiveFlow({
      ...activeFlow,
      edges: [...activeFlow.edges, newEdge],
    });
    setTargetNodeId('');
    setEdgeLabelInput('');
    setStatusMessage('Connector path created!');
    setTimeout(() => setStatusMessage(''), 2500);
  };

  const handleDeleteEdge = (edgeId: string) => {
    if (!activeFlow) return;
    setActiveFlow({
      ...activeFlow,
      edges: activeFlow.edges.filter((e) => e.id !== edgeId),
    });
    if (selectedEdgeId === edgeId) setSelectedEdgeId(null);
  };

  const handleUpdateNodeConfig = (key: string, value: any) => {
    if (!activeFlow || !selectedNodeId) return;
    const updatedNodes = activeFlow.nodes.map((n) => {
      if (n.id === selectedNodeId) {
        return {
          ...n,
          data: {
            ...n.data,
            [key]: value,
          },
        };
      }
      return n;
    });

    setActiveFlow({
      ...activeFlow,
      nodes: updatedNodes,
    });
  };

  const handleUpdateNodeType = (type: string) => {
    if (!activeFlow || !selectedNodeId) return;
    const updatedNodes = activeFlow.nodes.map((n) => {
      if (n.id === selectedNodeId) {
        return {
          ...n,
          type: type as any,
        };
      }
      return n;
    });

    setActiveFlow({
      ...activeFlow,
      nodes: updatedNodes,
    });
  };

  const handleSaveFlow = async () => {
    if (!activeFlow) return;

    setStatusMessage('Saving & deploying workflow layout...');
    try {
      if (activeFlow._id) {
        const res = await apiClient.put<{ data: Flow }>(`/api/flows/${activeFlow._id}`, {
          name: activeFlow.name,
          description: activeFlow.description,
          nodes: activeFlow.nodes,
          edges: activeFlow.edges,
          active: activeFlow.active,
        });
        if (res.data) {
          const updated = res.data;
          setActiveFlow(updated);
          setFlows((prev) => prev.map((f) => (f._id === updated._id ? updated : f)));
        }
      } else {
        const res = await apiClient.post<{ data: Flow }>('/api/flows', {
          name: activeFlow.name,
          description: activeFlow.description,
          nodes: activeFlow.nodes,
          edges: activeFlow.edges,
          active: activeFlow.active,
        });
        if (res.data) {
          const created = res.data;
          setActiveFlow(created);
          setFlows((prev) => [created, ...prev]);
        }
      }
      setStatusMessage('Workflow saved & deployed successfully!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err: any) {
      setStatusMessage(`Save error: ${err.message || 'Failed to save flow'}`);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleRunSimulation = async () => {
    if (!simInputMessage.trim()) return;
    setSimRunning(true);
    setSimResult(null);
    setHighlightedNodeIds([]);
    try {
      const res = await apiClient.post<{ data: any }>('/api/flows/test-simulation', {
        inputMessage: simInputMessage,
        sentiment: simSentiment,
      });
      if (res.data) {
        setSimResult(res.data);
        if (res.data.nodesExecuted) {
          setHighlightedNodeIds(res.data.nodesExecuted);
        }
      }
    } catch (err: any) {
      setSimResult({ executed: false, reason: err?.message || 'Simulation error' });
    } finally {
      setSimRunning(false);
    }
  };

  const getBezierPath = (sourceNode: FlowNode, targetNode: FlowNode) => {
    const startX = sourceNode.position.x + 95;
    const startY = sourceNode.position.y + 60;
    const endX = targetNode.position.x + 95;
    const endY = targetNode.position.y;

    const controlPointY = startY + (endY - startY) / 2;
    return `M ${startX} ${startY} C ${startX} ${controlPointY}, ${endX} ${controlPointY}, ${endX} ${endY}`;
  };

  const selectedNode = activeFlow?.nodes.find((n) => n.id === selectedNodeId);
  const outgoingEdges = activeFlow?.edges.filter((e) => e.source === selectedNodeId) || [];

  const getNodeColor = (type: string) => {
    const found = NODE_TYPES.find((t) => t.type === type);
    return found ? found.color : 'var(--accent-light)';
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-primary)' }}>
      {/* Top Header & Flow Management Selector */}
      <header
        className="chat-header"
        style={{
          padding: '12px 24px',
          flexShrink: 0,
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          {/* Flow Switcher Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Select Flow:</span>
            <select
              value={activeFlow?._id || ''}
              onChange={(e) => handleSelectFlow(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontWeight: 'bold',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {flows.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name} {f.active ? '🟢 (ACTIVE)' : '⚪ (Draft)'} (P:{(f as any).priority ?? 10})
                </option>
              ))}
            </select>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--sentiment-positive)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                fontWeight: 'bold',
              }}
              title="Number of active workflows handling inbound traffic"
            >
              {flows.filter((f) => f.active).length} Active
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              value={activeFlow?.name || ''}
              onChange={(e) => activeFlow && setActiveFlow({ ...activeFlow, name: e.target.value })}
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'var(--text-primary)',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                width: '240px',
              }}
              placeholder="Flow Name..."
            />
            <span
              style={{
                fontSize: '11px',
                background: activeFlow?.active ? 'rgba(0, 164, 189, 0.15)' : 'var(--bg-tertiary)',
                color: activeFlow?.active ? 'var(--sentiment-positive)' : 'var(--text-muted)',
                padding: '3px 10px',
                borderRadius: '12px',
                fontWeight: 'bold',
                border: activeFlow?.active ? '1px solid var(--sentiment-positive)' : '1px solid var(--border-color)',
              }}
            >
              {activeFlow?.active ? 'LIVE ACTIVE' : 'INACTIVE DRAFT'}
            </span>

            {/* Priority Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Priority:</span>
              <input
                type="number"
                min="1"
                max="100"
                value={(activeFlow as any)?.priority ?? 10}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 1;
                  if (activeFlow) {
                    setActiveFlow({ ...activeFlow, priority: val } as any);
                  }
                }}
                title="Flow execution priority (Higher priority runs first when keywords match)"
                style={{
                  width: '48px',
                  padding: '3px 6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: '4px',
                  textAlign: 'center',
                }}
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {statusMessage && (
            <span style={{ fontSize: '13px', color: 'var(--accent-light)', fontWeight: 600 }}>{statusMessage}</span>
          )}

          <button
            onClick={() => setShowSimulator(!showSimulator)}
            style={{
              padding: '7px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 'bold',
              background: showSimulator ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: showSimulator ? '#fff' : 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Icon name="sparkles" />
            <span>{showSimulator ? 'Close Simulator' : 'Test Flow Simulator'}</span>
          </button>

          <button
            onClick={handleToggleActive}
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              background: activeFlow?.active ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: activeFlow?.active ? 'var(--sentiment-urgent)' : 'var(--sentiment-positive)',
              border: '1px solid var(--border-color)',
            }}
          >
            {activeFlow?.active ? 'Deactivate Flow' : 'Set as Active Flow'}
          </button>

          <button
            onClick={handleCreateNewFlow}
            style={{
              padding: '7px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 'bold',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
            }}
          >
            + New
          </button>

          <button
            onClick={handleDuplicateFlow}
            style={{
              padding: '7px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 'bold',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
            }}
          >
            Duplicate
          </button>

          <button
            onClick={handleDeleteActiveFlow}
            style={{
              padding: '7px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 'bold',
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--sentiment-urgent)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              cursor: 'pointer',
            }}
          >
            Delete
          </button>

          <button
            className="send-btn"
            style={{
              width: 'auto',
              padding: '8px 18px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
            onClick={handleSaveFlow}
          >
            Save Flow
          </button>
        </div>
      </header>

      {/* Main Canvas Workspace */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Left Side Component Palette */}
        <aside
          style={{
            width: '210px',
            backgroundColor: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border-color)',
            padding: '16px',
            boxSizing: 'border-box',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <h3
            style={{
              margin: '0 0 12px',
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              letterSpacing: '0.5px',
            }}
          >
            Add Flow Components
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {NODE_TYPES.map((nt) => (
              <div
                key={nt.type}
                draggable
                onDragStart={(e) => handlePaletteDragStart(e, nt.type)}
                onClick={() => handleAddNode(nt.type)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  cursor: 'grab',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: nt.color }}></span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{nt.label}</span>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{nt.description}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Central Canvas Editor */}
        <div
          ref={canvasRef}
          onDragOver={handleCanvasDragOver}
          onDrop={handleCanvasDrop}
          onClick={() => {
            setSelectedNodeId(null);
            setSelectedEdgeId(null);
            setConnectingSourceId(null);
          }}
          style={{
            flex: 1,
            position: 'relative',
            background: 'var(--bg-primary)',
            backgroundImage: 'radial-gradient(var(--border-color) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            overflow: 'hidden',
            userSelect: 'none',
          }}
        >
          {loading ? (
            <LoadingState message="Loading automation workflow canvas..." />
          ) : error ? (
            <ErrorAlert message={error} onRetry={loadFlows} title="Automation Flow Error" />
          ) : activeFlow ? (
            <>
              {/* Connector SVG Overlay */}
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-secondary)" />
                  </marker>
                </defs>

                {activeFlow.edges.map((edge) => {
                  const srcNode = activeFlow.nodes.find((n) => n.id === edge.source);
                  const tgtNode = activeFlow.nodes.find((n) => n.id === edge.target);
                  if (!srcNode || !tgtNode) return null;
                  const isSelected = edge.id === selectedEdgeId;

                  return (
                    <g key={edge.id} style={{ pointerEvents: 'all', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setSelectedEdgeId(edge.id); }}>
                      <path
                        d={getBezierPath(srcNode, tgtNode)}
                        stroke={isSelected ? 'var(--accent)' : 'var(--text-secondary)'}
                        strokeWidth={isSelected ? '3' : '2'}
                        fill="none"
                        markerEnd="url(#arrow)"
                      />
                      {edge.label && (
                        <text
                          x={(srcNode.position.x + tgtNode.position.x) / 2 + 10}
                          y={(srcNode.position.y + tgtNode.position.y) / 2 + 20}
                          fill={
                            edge.label.includes('negative') || edge.label.includes('urgent')
                              ? 'var(--sentiment-urgent)'
                              : 'var(--sentiment-positive)'
                          }
                          fontSize="11"
                          fontWeight="bold"
                        >
                          {edge.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Positioned Node Cards */}
              {activeFlow.nodes.map((node) => {
                const isSelected = node.id === selectedNodeId;
                const isHighlighted = highlightedNodeIds.includes(node.id);
                const typeColor = getNodeColor(node.type);

                return (
                  <div
                    key={node.id}
                    onMouseDown={(e) => handleMouseDown(e, node.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(node.id);
                      setSelectedEdgeId(null);
                    }}

                    style={{
                      position: 'absolute',
                      left: `${node.position.x}px`,
                      top: `${node.position.y}px`,
                      width: '190px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: isHighlighted
                        ? '2px solid #10b981'
                        : isSelected
                        ? '2px solid var(--accent)'
                        : '1px solid var(--border-color)',
                      boxShadow: isHighlighted
                        ? '0 0 15px rgba(16, 185, 129, 0.4)'
                        : isSelected
                        ? '0 4px 20px rgba(255, 92, 53, 0.25)'
                        : '0 4px 15px rgba(0, 0, 0, 0.06)',
                      cursor: 'grab',
                      zIndex: isSelected || isHighlighted ? 20 : 10,
                      transition: draggingNodeId === node.id ? 'none' : 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          color: typeColor,
                          letterSpacing: '0.5px',
                        }}
                      >
                        {node.type.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ID: {node.id}</span>
                    </div>

                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        marginTop: '6px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {node.data.label}
                    </div>

                    {/* Preview Subtitle */}
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {node.type === 'send_message' && (node.data.messageText || 'Outbound text')}
                      {node.type === 'trigger' && (node.data.triggerType === 'keyword' ? `Keywords: ${node.data.keywords?.join(', ') || 'None'}` : 'Any Inbound Message')}
                      {node.type === 'condition' && `Route: ${node.data.conditionType || 'sentiment'}`}
                      {node.type === 'action' && `Tag: ${node.data.tagName || 'lead'}`}
                      {node.type === 'ai_respond' && (node.data.useKnowledgeBase ? 'RAG Search' : 'AI Prompt')}
                      {node.type === 'human_handoff' && (node.data.reason || 'Escalate')}
                    </div>

                    {/* Quick Connect Action Button */}
                    <div style={{ marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {connectingSourceId === node.id ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConnectingSourceId(null);
                            setStatusMessage('');
                          }}
                          style={{
                            width: '100%',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: 'var(--sentiment-urgent)',
                            border: '1px dashed var(--sentiment-urgent)',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel Connection
                        </button>
                      ) : connectingSourceId ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            connectNodes(connectingSourceId, node.id);
                          }}
                          style={{
                            width: '100%',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: 'var(--sentiment-positive)',
                            border: '1px solid var(--sentiment-positive)',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            animation: 'pulse 1.5s infinite',
                          }}
                        >
                          Connect Here →
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConnectingSourceId(node.id);
                            setStatusMessage(`Click target node to connect from "${node.data.label}"`);
                          }}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--accent-light)',
                            border: '1px solid var(--border-color)',
                            fontSize: '10px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                          title="Click to connect this node to another component"
                        >
                          + Connect →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <EmptyState
              title="No Active Automation Flow"
              description="Click 'Add Flow Components' to construct a visual automation workflow layout."
              icon="sparkles"
            />
          )}
        </div>

        {/* Right Side Properties Panel */}
        <aside
          style={{
            width: '290px',
            backgroundColor: 'var(--bg-secondary)',
            borderLeft: '1px solid var(--border-color)',
            padding: '20px',
            boxSizing: 'border-box',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <h3
            style={{
              margin: '0 0 16px',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-primary)',
            }}
          >
            <Icon name="gear" style={{ color: 'var(--accent-light)' }} />
            <span>Configure Component</span>
          </h3>

          {selectedNode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Node ID</label>
                <input
                  type="text"
                  value={selectedNode.id}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    marginTop: '4px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Node Label</label>
                <input
                  type="text"
                  value={selectedNode.data.label}
                  onChange={(e) => handleUpdateNodeConfig('label', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    marginTop: '4px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Node Type</label>
                <select
                  value={selectedNode.type}
                  onChange={(e) => handleUpdateNodeType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    marginTop: '4px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {NODE_TYPES.map((nt) => (
                    <option key={nt.type} value={nt.type}>
                      {nt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Type-Specific Operational Property Fields */}
              {selectedNode.type === 'trigger' && (
                <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Trigger Event</label>
                  <select
                    value={selectedNode.data.triggerType || 'any_message'}
                    onChange={(e) => handleUpdateNodeConfig('triggerType', e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '12px' }}
                  >
                    <option value="any_message">Any Inbound Message</option>
                    <option value="keyword">Keyword Match</option>
                  </select>

                  {selectedNode.data.triggerType === 'keyword' && (
                    <div style={{ marginTop: '8px' }}>
                      <label style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700 }}>Keywords (comma separated)</label>
                      <input
                        type="text"
                        placeholder="help, price, quote"
                        value={Array.isArray(selectedNode.data.keywords) ? selectedNode.data.keywords.join(', ') : ''}
                        onChange={(e) => handleUpdateNodeConfig('keywords', e.target.value.split(',').map((s) => s.trim()))}
                        style={{ width: '100%', padding: '6px 10px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '12px' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {selectedNode.type === 'condition' && (
                <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Condition Type</label>
                  <select
                    value={selectedNode.data.conditionType || 'sentiment'}
                    onChange={(e) => handleUpdateNodeConfig('conditionType', e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '12px' }}
                  >
                    <option value="sentiment">Sentiment Classification</option>
                    <option value="keyword_match">Keyword Rule Match</option>
                  </select>

                  {selectedNode.data.conditionType === 'keyword_match' && (
                    <div style={{ marginTop: '8px' }}>
                      <label style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700 }}>Match Keyword Value</label>
                      <input
                        type="text"
                        placeholder="e.g. refund, billing"
                        value={selectedNode.data.value || ''}
                        onChange={(e) => handleUpdateNodeConfig('value', e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '12px' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {selectedNode.type === 'send_message' && (
                <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Outbound Message Text</label>
                  <textarea
                    rows={4}
                    value={selectedNode.data.messageText || ''}
                    onChange={(e) => handleUpdateNodeConfig('messageText', e.target.value)}
                    placeholder="Enter message body to dispatch..."
                    style={{ width: '100%', padding: '8px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '12px', outline: 'none' }}
                  />
                </div>
              )}

              {selectedNode.type === 'ai_respond' && (
                <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>AI Gemini System Prompt</label>
                  <textarea
                    rows={3}
                    value={selectedNode.data.systemPrompt || ''}
                    onChange={(e) => handleUpdateNodeConfig('systemPrompt', e.target.value)}
                    placeholder="e.g. Respond as a friendly customer service AI assistant..."
                    style={{ width: '100%', padding: '8px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '12px', outline: 'none' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                    <input
                      type="checkbox"
                      id="useKb"
                      checked={selectedNode.data.useKnowledgeBase !== false}
                      onChange={(e) => handleUpdateNodeConfig('useKnowledgeBase', e.target.checked)}
                    />
                    <label htmlFor="useKb" style={{ fontSize: '11px', color: 'var(--text-primary)', cursor: 'pointer' }}>Use Knowledge Base RAG Search</label>
                  </div>
                </div>
              )}

              {selectedNode.type === 'action' && (
                <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Action Type</label>
                  <select
                    value={selectedNode.data.actionType || 'add_tag'}
                    onChange={(e) => handleUpdateNodeConfig('actionType', e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '12px' }}
                  >
                    <option value="add_tag">Add Contact Tag</option>
                    <option value="remove_tag">Remove Contact Tag</option>
                  </select>

                  <div style={{ marginTop: '8px' }}>
                    <label style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700 }}>Tag Name</label>
                    <input
                      type="text"
                      placeholder="e.g. lead, vip, interested"
                      value={selectedNode.data.tagName || ''}
                      onChange={(e) => handleUpdateNodeConfig('tagName', e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '12px' }}
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === 'human_handoff' && (
                <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Escalation Reason</label>
                  <input
                    type="text"
                    value={selectedNode.data.reason || ''}
                    onChange={(e) => handleUpdateNodeConfig('reason', e.target.value)}
                    placeholder="e.g. Negative sentiment escalation"
                    style={{ width: '100%', padding: '6px 10px', marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '12px' }}
                  />
                </div>
              )}

              {/* Edge Connection Section */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                  Connect to Target Node
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <select
                    value={targetNodeId}
                    onChange={(e) => setTargetNodeId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  >
                    <option value="">Select Target Node...</option>
                    {activeFlow?.nodes
                      .filter((n) => n.id !== selectedNode.id)
                      .map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.data.label} (ID: {n.id})
                        </option>
                      ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Route Label (e.g. positive, negative, default)"
                    value={edgeLabelInput}
                    onChange={(e) => setEdgeLabelInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />

                  <button
                    onClick={handleAddEdge}
                    disabled={!targetNodeId}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      border: 'none',
                      background: targetNodeId ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: targetNodeId ? '#fff' : 'var(--text-muted)',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: targetNodeId ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Add Connector Edge
                  </button>
                </div>
              </div>

              {/* Outgoing connectors list */}
              {outgoingEdges.length > 0 && (
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Outgoing Connections
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {outgoingEdges.map((ed) => (
                      <div
                        key={ed.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          background: 'var(--bg-tertiary)',
                          borderRadius: '6px',
                          fontSize: '12px',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <span style={{ color: 'var(--text-primary)' }}>
                          To Node {ed.target} {ed.label ? `(${ed.label})` : ''}
                        </span>
                        <button
                          onClick={() => handleDeleteEdge(ed.id)}
                          style={{ border: 'none', background: 'transparent', color: 'var(--sentiment-urgent)', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delete Node action */}
              <button
                onClick={() => handleDeleteNode(selectedNode.id)}
                style={{
                  marginTop: '12px',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(224, 62, 62, 0.3)',
                  background: 'rgba(224, 62, 62, 0.08)',
                  color: 'var(--sentiment-urgent)',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Delete Component Node
              </button>
            </div>
          ) : selectedEdgeId ? (
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '8px' }}>
                Connector Selected: {selectedEdgeId}
              </div>
              <button
                onClick={() => handleDeleteEdge(selectedEdgeId)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(224, 62, 62, 0.3)',
                  background: 'rgba(224, 62, 62, 0.08)',
                  color: 'var(--sentiment-urgent)',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Delete Connector Line
              </button>
            </div>
          ) : (
            <div style={{ marginTop: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Select any component node or connector line on the canvas to configure properties.
            </div>
          )}
        </aside>
      </div>

      {/* Simulator Modal Drawer */}
      {showSimulator && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '310px',
            width: '420px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--accent)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon name="sparkles" style={{ color: 'var(--accent-light)' }} />
              <span>Interactive Flow Execution Simulator</span>
            </h4>
            <button onClick={() => setShowSimulator(false)} style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700 }}>Test Inbound Message</label>
              <input
                type="text"
                value={simInputMessage}
                onChange={(e) => setSimInputMessage(e.target.value)}
                placeholder="e.g. Hello, what is the price?"
                style={{ width: '100%', padding: '8px 10px', marginTop: '4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '12px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700 }}>Sentiment</label>
                <select
                  value={simSentiment}
                  onChange={(e) => setSimSentiment(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', marginTop: '4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '12px' }}
                >
                  <option value="positive">positive</option>
                  <option value="neutral">neutral</option>
                  <option value="negative">negative</option>
                  <option value="urgent">urgent</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  onClick={handleRunSimulation}
                  disabled={simRunning}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: simRunning ? 'wait' : 'pointer',
                  }}
                >
                  {simRunning ? 'Executing...' : 'Run Simulation'}
                </button>
              </div>
            </div>

            {simResult && (
              <div style={{ marginTop: '10px', padding: '10px', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)', maxHeight: '180px', overflowY: 'auto' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: simResult.executed ? 'var(--sentiment-positive)' : 'var(--sentiment-urgent)', marginBottom: '6px' }}>
                  {simResult.executed ? `Flow Executed: ${simResult.flowName}` : `Execution Skipped: ${simResult.reason}`}
                </div>

                {simResult.actionsTaken && simResult.actionsTaken.length > 0 && (
                  <div style={{ marginBottom: '6px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)' }}>ACTIONS TAKEN:</div>
                    {simResult.actionsTaken.map((act: string, idx: number) => (
                      <div key={idx} style={{ fontSize: '11px', color: 'var(--accent-light)', fontFamily: 'monospace' }}>• {act}</div>
                    ))}
                  </div>
                )}

                {simResult.executionLog && (
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)' }}>EXECUTION LOG:</div>
                    {simResult.executionLog.map((log: any, idx: number) => (
                      <div key={idx} style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        [{log.type}] Node {log.nodeId}: {log.detail}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
