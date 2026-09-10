import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Flow, FlowDocument } from '../database/schemas/flow.schema.js';
import { Message, MessageDocument } from '../database/schemas/message.schema.js';
import { Contact, ContactDocument } from '../database/schemas/contact.schema.js';
import { Conversation, ConversationDocument } from '../database/schemas/conversation.schema.js';
import { SocketGateway } from '../socket/socket.gateway.js';
import { RagService } from '../ai/rag.service.js';

export interface FlowExecutionResult {
  executed: boolean;
  reason?: string;
  flowId?: string;
  flowName?: string;
  nodesExecuted?: string[];
  actionsTaken?: string[];
  executionLog?: Array<{ nodeId: string; type: string; label: string; detail?: string }>;
}

@Injectable()
export class FlowExecutionEngine {
  private readonly logger = new Logger(FlowExecutionEngine.name);

  constructor(
    @InjectModel(Flow.name) private readonly flowModel: Model<FlowDocument>,
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Contact.name) private readonly contactModel: Model<ContactDocument>,
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
    private readonly socketGateway: SocketGateway,
    private readonly ragService: RagService,
  ) {}

  /**
   * Evaluates and executes active flow graph for an inbound message
   */
  async executeFlowForInboundMessage(
    workspaceId: string,
    conversation: ConversationDocument,
    contact: ContactDocument,
    messageBody: string,
    sentiment: string = 'neutral',
  ): Promise<FlowExecutionResult> {
    const flow = await this.flowModel.findOne({ workspaceId, active: true });
    if (!flow || !flow.nodes || flow.nodes.length === 0) {
      return { executed: false, reason: 'no_active_flow' };
    }

    const triggerNodes = flow.nodes.filter((n: any) => n.type === 'trigger');
    if (triggerNodes.length === 0) {
      return { executed: false, reason: 'no_trigger_node' };
    }

    // Determine matching trigger node
    let matchedTrigger = triggerNodes.find((tn: any) => {
      const config = tn.data || {};
      if (config.triggerType === 'keyword' && Array.isArray(config.keywords) && config.keywords.length > 0) {
        return config.keywords.some((kw: string) =>
          messageBody.toLowerCase().includes(kw.trim().toLowerCase())
        );
      }
      return true; // Default matches any inbound message
    });

    if (!matchedTrigger) {
      matchedTrigger = triggerNodes[0];
    }

    const visitedNodes = new Set<string>();
    const executionLog: Array<{ nodeId: string; type: string; label: string; detail?: string }> = [];
    const actionsTaken: string[] = [];

    let currentNodeId: string | null = matchedTrigger.id;
    let steps = 0;
    const maxSteps = 25;

    while (currentNodeId && steps < maxSteps) {
      steps++;
      if (visitedNodes.has(currentNodeId)) {
        this.logger.warn(`Loop detected in flow ${flow._id} at node ${currentNodeId}`);
        break;
      }

      const currentNode = flow.nodes.find((n: any) => n.id === currentNodeId);
      if (!currentNode) break;

      visitedNodes.add(currentNodeId);
      const nodeLabel = currentNode.data?.label || currentNode.type;

      switch (currentNode.type) {
        case 'trigger': {
          executionLog.push({
            nodeId: currentNode.id,
            type: 'trigger',
            label: nodeLabel,
            detail: `Matched inbound query: "${messageBody}"`,
          });
          currentNodeId = this.getNextNodeId(flow, currentNode.id, null);
          break;
        }

        case 'condition': {
          const config = currentNode.data || {};
          let selectedRoute: string | null = null;

          if (config.conditionType === 'keyword_match' && config.value) {
            const matches = messageBody.toLowerCase().includes(config.value.toLowerCase());
            selectedRoute = matches ? 'true' : 'false';
          } else {
            // Sentiment evaluation route
            selectedRoute = sentiment;
          }

          executionLog.push({
            nodeId: currentNode.id,
            type: 'condition',
            label: nodeLabel,
            detail: `Evaluated route: ${selectedRoute}`,
          });

          currentNodeId = this.getNextNodeId(flow, currentNode.id, selectedRoute);
          break;
        }

        case 'send_message': {
          const config = currentNode.data || {};
          const msgText = config.messageText || config.label || 'Thank you for contacting us!';

          const createdMsg = await this.messageModel.create({
            workspaceId,
            conversationId: conversation._id.toString(),
            waMessageId: `flow_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            direction: 'outbound',
            type: 'text',
            status: 'delivered',
            body: msgText,
          });

          this.socketGateway.emitToWorkspace(workspaceId, 'message.sent', {
            message: createdMsg,
            conversation,
          });

          actionsTaken.push(`sent_message: ${msgText}`);
          executionLog.push({
            nodeId: currentNode.id,
            type: 'send_message',
            label: nodeLabel,
            detail: `Dispatched message: "${msgText}"`,
          });

          currentNodeId = this.getNextNodeId(flow, currentNode.id, null);
          break;
        }

        case 'ai_respond': {
          const config = currentNode.data || {};
          let answerText = 'Thank you for reaching out. An agent will respond shortly.';

          if (config.useKnowledgeBase !== false) {
            try {
              const ragRes = await this.ragService.queryKnowledgeBase(workspaceId, messageBody);
              if (ragRes.answer) {
                answerText = ragRes.answer;
              }
            } catch (err: any) {
              this.logger.error(`RAG query error in flow node ${currentNode.id}: ${err.message}`);
            }
          }

          const aiMsg = await this.messageModel.create({
            workspaceId,
            conversationId: conversation._id.toString(),
            waMessageId: `flow_ai_${Date.now()}`,
            direction: 'outbound',
            type: 'text',
            status: 'delivered',
            body: answerText,
          });

          this.socketGateway.emitToWorkspace(workspaceId, 'message.sent', {
            message: aiMsg,
            conversation,
          });

          actionsTaken.push(`ai_respond: ${answerText}`);
          executionLog.push({
            nodeId: currentNode.id,
            type: 'ai_respond',
            label: nodeLabel,
            detail: `Generated AI answer: "${answerText.substring(0, 60)}..."`,
          });

          currentNodeId = this.getNextNodeId(flow, currentNode.id, null);
          break;
        }

        case 'action': {
          const config = currentNode.data || {};
          const actionType = config.actionType || 'add_tag';
          const tagName = config.tagName || 'automated_flow';

          if (actionType === 'add_tag') {
            const currentTags: string[] = (contact as any).tags || [];
            if (!currentTags.includes(tagName)) {
              currentTags.push(tagName);
              (contact as any).tags = currentTags;
              await (contact as any).save();
            }
          } else if (actionType === 'remove_tag') {
            const currentTags: string[] = (contact as any).tags || [];
            (contact as any).tags = currentTags.filter((t) => t !== tagName);
            await (contact as any).save();
          }

          actionsTaken.push(`action_${actionType}: ${tagName}`);
          executionLog.push({
            nodeId: currentNode.id,
            type: 'action',
            label: nodeLabel,
            detail: `Applied contact action ${actionType}: ${tagName}`,
          });

          currentNodeId = this.getNextNodeId(flow, currentNode.id, null);
          break;
        }

        case 'human_handoff': {
          const config = currentNode.data || {};
          const reason = config.reason || 'Escalated by automation workflow';

          conversation.sentiment = 'urgent';
          await conversation.save();

          this.socketGateway.emitToWorkspace(workspaceId, 'escalation.alert', {
            messageId: conversation._id.toString(),
            conversationId: conversation._id.toString(),
            sentiment: 'urgent',
            body: `Flow Escalation: ${reason} (User input: "${messageBody}")`,
            timestamp: new Date(),
          });

          actionsTaken.push(`human_handoff: ${reason}`);
          executionLog.push({
            nodeId: currentNode.id,
            type: 'human_handoff',
            label: nodeLabel,
            detail: `Escalated conversation to human agent: ${reason}`,
          });

          currentNodeId = this.getNextNodeId(flow, currentNode.id, null);
          break;
        }

        default: {
          currentNodeId = this.getNextNodeId(flow, currentNode.id, null);
          break;
        }
      }
    }

    return {
      executed: true,
      flowId: flow._id.toString(),
      flowName: flow.name,
      nodesExecuted: Array.from(visitedNodes),
      actionsTaken,
      executionLog,
    };
  }

  /**
   * Resolves the next node ID based on edge definitions and route label match
   */
  private getNextNodeId(flow: Flow, sourceNodeId: string, routeLabel: string | null): string | null {
    const edges = flow.edges.filter((e: any) => e.source === sourceNodeId);
    if (edges.length === 0) return null;

    if (routeLabel) {
      const routeLower = routeLabel.toLowerCase();
      // Try to find edge whose label matches or includes route string
      const matchedEdge = edges.find((e: any) => e.label && e.label.toLowerCase().includes(routeLower));
      if (matchedEdge) return matchedEdge.target;
    }

    // Default fallback to first outgoing edge or edge labeled 'default'
    const defaultEdge = edges.find((e: any) => e.label?.toLowerCase() === 'default') || edges[0];
    return defaultEdge ? defaultEdge.target : null;
  }
}
