import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type WorkspaceDocument = Workspace & Document;

@Schema({ timestamps: true })
export class Workspace {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  slug: string;

  @Prop({ required: true, enum: ['standard', 'agency', 'child'], default: 'standard' })
  type: string;

  @Prop({ required: true, enum: ['free', 'growth', 'enterprise'], default: 'free' })
  plan: string;

  @Prop({ default: true })
  active: boolean;

  @Prop({ required: true, enum: ['INR', 'USD', 'EUR', 'GBP'], default: 'INR' })
  currency: string;

  // Billing Details & Tax Address
  @Prop({
    type: {
      companyName: { type: String, default: '' },
      taxId: { type: String, default: '' }, // GSTIN / VAT / Tax ID
      billingEmail: { type: String, default: '' },
      phone: { type: String, default: '' },
      addressLine1: { type: String, default: '' },
      addressLine2: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    default: {
      companyName: '',
      taxId: '',
      billingEmail: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
    },
  })
  billingDetails: {
    companyName: string;
    taxId: string;
    billingEmail: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  // Saved Payment Methods
  @Prop({
    type: [
      {
        id: { type: String, required: true },
        type: { type: String, enum: ['card', 'upi', 'bank_transfer'], default: 'card' },
        brand: { type: String, default: 'Visa' },
        last4: { type: String, default: '' },
        expiryMonth: { type: String, default: '' },
        expiryYear: { type: String, default: '' },
        upiId: { type: String, default: '' },
        holderName: { type: String, default: '' },
        isDefault: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  paymentMethods: Array<{
    id: string;
    type: 'card' | 'upi' | 'bank_transfer';
    brand?: string;
    last4?: string;
    expiryMonth?: string;
    expiryYear?: string;
    upiId?: string;
    holderName?: string;
    isDefault: boolean;
    createdAt?: Date;
  }>;

  // WABA configuration (Encrypted access tokens & webhook secrets)
  @Prop({
    type: {
      accessToken: { type: String, default: null }, // AES-256-GCM format
      phoneNumberId: { type: String, default: null },
      businessAccountId: { type: String, default: null },
      webhookSecret: { type: String, default: null }, // AES-256-GCM format
      qualityRating: { type: String, default: 'GREEN' },
      messagingLimit: { type: String, default: '10K' },
    },
    default: null,
  })
  waba: {
    accessToken?: string;
    phoneNumberId?: string;
    businessAccountId?: string;
    webhookSecret?: string;
    qualityRating?: string;
    messagingLimit?: string;
  } | null;

  // White-label settings
  @Prop({
    type: {
      parentAgencyId: { type: MongooseSchema.Types.ObjectId, ref: 'Workspace', default: null },
      customDomain: { type: String, default: null },
      logoUrl: { type: String, default: null },
      brandColor: { type: String, default: null },
      customCss: { type: String, default: null },
    },
    default: null,
  })
  whitelabel: {
    parentAgencyId?: string | MongooseSchema.Types.ObjectId;
    customDomain?: string;
    logoUrl?: string;
    brandColor?: string;
    customCss?: string;
  } | null;

  // Compliance settings (DPDP / GDPR)
  @Prop({
    type: {
      retentionPeriodDays: { type: Number, default: 2555 }, // Default 7 years (2555 days) for legal audit trail
      consentRequired: { type: Boolean, default: true },
      dataErasureRequested: { type: Boolean, default: false },
    },
    default: {
      retentionPeriodDays: 2555,
      consentRequired: true,
      dataErasureRequested: false,
    },
  })
  compliance: {
    retentionPeriodDays: number;
    consentRequired: boolean;
    dataErasureRequested: boolean;
  };

  // AI service configs
  @Prop({
    type: {
      sentimentAnalysisEnabled: { type: Boolean, default: true },
      replySuggestionsEnabled: { type: Boolean, default: true },
      voiceTranscriptionEnabled: { type: Boolean, default: true },
    },
    default: {
      sentimentAnalysisEnabled: true,
      replySuggestionsEnabled: true,
      voiceTranscriptionEnabled: true,
    },
  })
  aiSettings: {
    sentimentAnalysisEnabled: boolean;
    replySuggestionsEnabled: boolean;
    voiceTranscriptionEnabled: boolean;
  };

  // Portal Auto-Reply & Bot Agent Control Center
  @Prop({
    type: {
      enabled: { type: Boolean, default: false },
      systemPrompt: {
        type: String,
        default: 'You are NotifyIQ AI assistant. Answer customer questions concisely and politely using only the provided knowledge base context.',
      },
      confidenceThreshold: { type: Number, default: 0.70 },
      fallbackToHuman: { type: Boolean, default: true },
      outOfHoursOnly: { type: Boolean, default: false },
      operatingHours: {
        enabled: { type: Boolean, default: false },
        timezone: { type: String, default: 'Asia/Kolkata' },
        workDays: { type: [Number], default: [1, 2, 3, 4, 5] },
        startTime: { type: String, default: '09:00' },
        endTime: { type: String, default: '18:00' },
      },
      outOfHoursMessage: {
        type: String,
        default: 'Thank you for reaching out! Our support team is currently offline. We will respond during business hours.',
      },
    },
    default: {
      enabled: false,
      systemPrompt: 'You are NotifyIQ AI assistant. Answer customer questions concisely and politely using only the provided knowledge base context.',
      confidenceThreshold: 0.70,
      fallbackToHuman: true,
      outOfHoursOnly: false,
      operatingHours: {
        enabled: false,
        timezone: 'Asia/Kolkata',
        workDays: [1, 2, 3, 4, 5],
        startTime: '09:00',
        endTime: '18:00',
      },
      outOfHoursMessage: 'Thank you for reaching out! Our support team is currently offline. We will respond during business hours.',
    },
  })
  autoReplySettings: {
    enabled: boolean;
    systemPrompt: string;
    confidenceThreshold: number;
    fallbackToHuman: boolean;
    outOfHoursOnly: boolean;
    operatingHours: {
      enabled: boolean;
      timezone: string;
      workDays: number[];
      startTime: string;
      endTime: string;
    };
    outOfHoursMessage: string;
  };

  @Prop({ type: String, default: null })
  referralSource: string | null;

  /** Predefined business category tags for lead extraction & broadcast filtering */
  @Prop({ type: [String], default: ['Wholesale', 'Retail', 'Inquiry', 'Support', 'General'] })
  categories: string[];
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
