import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Flow, FlowDocument } from '../database/schemas/flow.schema.js';
import { Message, MessageDocument } from '../database/schemas/message.schema.js';
import { Contact, ContactDocument } from '../database/schemas/contact.schema.js';
import { Conversation, ConversationDocument } from '../database/schemas/conversation.schema.js';
import { SocketGateway } from '../socket/socket.gateway.js';
import { RagService } from '../ai/rag.service.js';
import { MessagesService } from '../messages/messages.service.js';
import { OutboundWebhookDispatcher } from '../outbound-webhooks/outbound-webhook.dispatcher.js';

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
    private readonly messagesService: MessagesService,
    @Optional() private readonly dispatcher?: OutboundWebhookDispatcher,
  ) { }


  /**
   * Evaluates and executes active flow graph for an inbound message
   */
  async executeFlowForInboundMessage(
    workspaceId: string,
    conversation: ConversationDocument,
    contact: ContactDocument,
    messageBody: string,
    sentiment: string = 'neutral',
    isSimulation: boolean = false,
  ): Promise<FlowExecutionResult> {
    const activeFlows = await this.flowModel
      .find({ workspaceId, active: true })
      .sort({ priority: -1, createdAt: -1 });

    if (!activeFlows || activeFlows.length === 0) {
      return { executed: false, reason: 'no_active_flow' };
    }

    let targetFlow: FlowDocument | null = null;
    let matchedTriggerNode: any = null;

    // 1. Pass 1: Look for explicit keyword / button match across active flows
    for (const flowItem of activeFlows) {
      if (!flowItem.nodes || flowItem.nodes.length === 0) continue;
      const triggers = flowItem.nodes.filter((n: any) => n.type === 'trigger');

      for (const tn of triggers) {
        const config = tn.data || {};
        if (config.triggerType === 'keyword' && Array.isArray(config.keywords) && config.keywords.length > 0) {
          const isKeywordMatched = config.keywords.some((kw: string) => {
            if (!kw) return false;
            const cleanKw = kw.trim().toLowerCase();
            return cleanKw.length > 0 && messageBody.toLowerCase().includes(cleanKw);
          });
          if (isKeywordMatched) {
            targetFlow = flowItem;
            matchedTriggerNode = tn;
            break;
          }
        }
      }
      if (targetFlow) break;
    }

    // 2. Pass 2: If no explicit keyword matched, find default catch-all active flow
    if (!targetFlow) {
      for (const flowItem of activeFlows) {
        if (!flowItem.nodes || flowItem.nodes.length === 0) continue;
        const defaultTrigger = flowItem.nodes.find(
          (n: any) => n.type === 'trigger' && (n.data?.triggerType === 'any_message' || !n.data?.keywords?.length)
        );
        if (defaultTrigger) {
          targetFlow = flowItem;
          matchedTriggerNode = defaultTrigger;
          break;
        }
      }
    }

    if (!targetFlow || !matchedTriggerNode) {
      return { executed: false, reason: 'no_matching_trigger' };
    }

    const flow = targetFlow;
    const matchedTrigger = matchedTriggerNode;

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
            const matches = messageBody.toLowerCase().includes(config.value.toLowerCase().trim());
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

          if (!isSimulation && contact?.phone) {
            try {
              await this.messagesService.sendTextMessage(workspaceId, {
                to: contact.phone,
                body: msgText,
              });
            } catch (err: any) {
              this.logger.error(`Failed to dispatch Meta WhatsApp message for flow node ${currentNode.id}: ${err.message}`);
            }
          }

          actionsTaken.push(`sent_message: ${msgText}`);
          executionLog.push({
            nodeId: currentNode.id,
            type: 'send_message',
            label: nodeLabel,
            detail: isSimulation ? `[Simulation] Dispatched message: "${msgText}"` : `Dispatched message: "${msgText}"`,
          });

          currentNodeId = this.getNextNodeId(flow, currentNode.id, null);
          break;
        }

        case 'ai_respond': {
          const config = currentNode.data || {};
          let answerText = 'Thank you for reaching out. An agent will respond shortly.';

          if (config.useKnowledgeBase !== false) {
            try {
              const ragRes = await this.ragService.queryKnowledgeBase(
                workspaceId,
                messageBody,
                conversation?._id ? conversation._id.toString() : undefined,
              );
              if (ragRes.answer) {
                answerText = ragRes.answer;
              }
            } catch (err: any) {
              this.logger.error(`RAG query error in flow node ${currentNode.id}: ${err.message}`);
            }
          }
          this.logger.log(`[Flow Simulation] , isSimulation: ${isSimulation} and contact phone: ${contact?.phone} AI response: ${answerText}`);
          if (!isSimulation && contact?.phone) {
            try {
              await this.messagesService.sendTextMessage(workspaceId, {
                to: contact.phone,
                body: answerText,
              });
            } catch (err: any) {
              this.logger.error(`Failed to dispatch Meta WhatsApp AI response for flow node ${currentNode.id}: ${err.message}`);
            }
          }

          actionsTaken.push(`ai_respond: ${answerText}`);
          executionLog.push({
            nodeId: currentNode.id,
            type: 'ai_respond',
            label: nodeLabel,
            detail: isSimulation ? `[Simulation] Generated AI answer: "${answerText.substring(0, 60)}..."` : `Generated AI answer: "${answerText.substring(0, 60)}..."`,
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
          } else if (actionType === 'update_lead_status' || actionType === 'lead_status') {
            const newStatus = config.leadStatus || config.status || 'qualified';
            const previousStatus = (contact as any).leadStatus || 'new';
            (contact as any).leadStatus = newStatus;
            await (contact as any).save();

            // Dispatch outbound webhook: lead.status_changed
            if (this.dispatcher) {
              this.dispatcher.dispatchEvent(workspaceId, 'lead.status_changed', {
                contactId: contact._id.toString(),
                phone: contact.phone,
                name: contact.name,
                fromStatus: previousStatus,
                toStatus: newStatus,
                flowId: flow._id.toString(),
                flowName: flow.name,
              }).catch((err) => this.logger.error(`[FlowEngine] Dispatcher (lead.status_changed) error: ${err.message}`));
            }
          }

          actionsTaken.push(`action_${actionType}: ${config.leadStatus || config.status || tagName}`);
          executionLog.push({
            nodeId: currentNode.id,
            type: 'action',
            label: nodeLabel,
            detail: `Applied contact action ${actionType}: ${config.leadStatus || config.status || tagName}`,
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
      const routeLower = routeLabel.toLowerCase().trim();
      // Try exact or substring match
      const matchedEdge = edges.find((e: any) => {
        if (!e.label) return false;
        const edgeLabelLower = e.label.toLowerCase().trim();
        if (edgeLabelLower.includes(routeLower) || routeLower.includes(edgeLabelLower)) return true;
        // Synonym checks for boolean condition routing
        if ((routeLower === 'true' || routeLower === 'positive') && /^(true|yes|match|matched|positive|pass)/.test(edgeLabelLower)) return true;
        if ((routeLower === 'false' || routeLower === 'negative') && /^(false|no|unmatched|negative|fail)/.test(edgeLabelLower)) return true;
        if (routeLower === 'urgent' && /urgent|escalate/.test(edgeLabelLower)) return true;
        return false;
      });
      if (matchedEdge) return matchedEdge.target;
    }

    // Default fallback to first outgoing edge or edge labeled 'default'
    const defaultEdge = edges.find((e: any) => e.label?.toLowerCase() === 'default') || edges[0];
    return defaultEdge ? defaultEdge.target : null;
  }
}
