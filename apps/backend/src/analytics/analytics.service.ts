import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

  async getExecutiveOverview(workspaceId: string) {
    const totalMessages = await this.messageModel.countDocuments({ workspaceId });
    const outboundMessages = await this.messageModel.countDocuments({ workspaceId, direction: 'outbound' });
    const deliveredMessages = await this.messageModel.countDocuments({ workspaceId, direction: 'outbound', status: { $in: ['delivered', 'read'] } });

    const deliveryRate = outboundMessages > 0 ? (deliveredMessages / outboundMessages) * 100 : 0;

    const totalConversations = await this.conversationModel.countDocuments({ workspaceId });
    const urgentConversations = await this.conversationModel.countDocuments({ workspaceId, sentiment: 'urgent' });
    const totalContacts = await this.contactModel.countDocuments({ workspaceId });

    // AI Containment Rate (percentage of conversations resolved without human escalation)
    const escalatedCount = urgentConversations;
    const botContainmentRate = totalConversations > 0 ? Math.max(0, 100 - (escalatedCount / totalConversations) * 100) : 0;

    const wholesaleRate = 0.002;
    const totalAccruedCost = outboundMessages * wholesaleRate;

    // Calculate actual 7-day daily message telemetry
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyAggregate = await this.messageModel.aggregate([
      {
        $match: {
          workspaceId,
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: '$createdAt' },
            direction: '$direction',
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysMap = new Map<string, { inbound: number; outbound: number }>();

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const name = dayNames[d.getDay()];
      daysMap.set(name, { inbound: 0, outbound: 0 });
    }

    for (const item of dailyAggregate) {
      const dayName = dayNames[(item._id.dayOfWeek - 1) % 7];
      if (daysMap.has(dayName)) {
        const entry = daysMap.get(dayName)!;
        if (item._id.direction === 'inbound') {
          entry.inbound += item.count;
        } else {
          entry.outbound += item.count;
        }
      }
    }

    const dailyMetrics = Array.from(daysMap.entries()).map(([day, counts]) => ({
      day,
      inbound: counts.inbound,
      outbound: counts.outbound,
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
