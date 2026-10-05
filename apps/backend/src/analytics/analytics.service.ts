import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from '../database/schemas/message.schema.js';
import { Conversation, ConversationDocument } from '../database/schemas/conversation.schema.js';
import { Contact, ContactDocument } from '../database/schemas/contact.schema.js';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Contact.name) private readonly contactModel: Model<ContactDocument>,
  ) {}

  async getExecutiveOverview(workspaceId: string, daysCount: number = 7) {
    const workspaceObjectIds = Types.ObjectId.isValid(workspaceId)
      ? [workspaceId, new Types.ObjectId(workspaceId)]
      : [workspaceId];
    const workspaceFilter = { workspaceId: { $in: workspaceObjectIds } };

    const totalMessages = await this.messageModel.countDocuments(workspaceFilter);
    const outboundMessages = await this.messageModel.countDocuments({ ...workspaceFilter, direction: 'outbound' });
    const deliveredMessages = await this.messageModel.countDocuments({
      ...workspaceFilter,
      direction: 'outbound',
      status: { $in: ['delivered', 'read'] },
    });

    const deliveryRate = outboundMessages > 0 ? (deliveredMessages / outboundMessages) * 100 : 0;

    const totalConversations = await this.conversationModel.countDocuments(workspaceFilter);
    const urgentConversations = await this.conversationModel.countDocuments({ ...workspaceFilter, sentiment: 'urgent' });
    const totalContacts = await this.contactModel.countDocuments(workspaceFilter);

    // AI Containment Rate (percentage of conversations resolved without human escalation)
    const escalatedCount = urgentConversations;
    const botContainmentRate = totalConversations > 0 ? Math.max(0, 100 - (escalatedCount / totalConversations) * 100) : 0;

    const wholesaleRate = 0.002;
    const totalAccruedCost = outboundMessages * wholesaleRate;

    // Calculate actual daily message telemetry for requested date range
    const days = Math.max(1, Math.min(daysCount, 90));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const dailyAggregate = await this.messageModel.aggregate([
      {
        $match: {
          workspaceId: { $in: workspaceObjectIds },
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            dateStr: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            direction: '$direction',
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Map of YYYY-MM-DD -> { dayLabel, inbound, outbound }
    const dateMap = new Map<string, { dateStr: string; dayLabel: string; inbound: number; outbound: number }>();

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const isoDate = d.toISOString().split('T')[0];
      
      let dayLabel = '';
      if (days <= 7) {
        dayLabel = dayNames[d.getDay()];
      } else {
        dayLabel = `${monthNames[d.getMonth()]} ${d.getDate()}`;
      }

      dateMap.set(isoDate, { dateStr: isoDate, dayLabel, inbound: 0, outbound: 0 });
    }

    for (const item of dailyAggregate) {
      const isoDate = item._id.dateStr;
      if (dateMap.has(isoDate)) {
        const entry = dateMap.get(isoDate)!;
        if (item._id.direction === 'inbound') {
          entry.inbound += item.count;
        } else {
          entry.outbound += item.count;
        }
      }
    }

    const dailyMetrics = Array.from(dateMap.values()).map((entry) => ({
      day: entry.dayLabel,
      dateStr: entry.dateStr,
      inbound: entry.inbound,
      outbound: entry.outbound,
    }));

    return {
      workspaceId,
      totalMessages,
      outboundMessages,
      deliveredMessages,
      deliveryRatePercent: parseFloat(deliveryRate.toFixed(1)),
      totalConversations,
      urgentConversations,
      totalContacts,
      botContainmentRatePercent: parseFloat(botContainmentRate.toFixed(1)),
      totalAccruedCost: parseFloat(totalAccruedCost.toFixed(2)),
      dailyMetrics,
    };
  }
}

