import { useState, useEffect } from 'react';

export type LanguageCode = 'en' | 'hi' | 'es' | 'fr' | 'ar';

export const translations = {
  en: {
    inbox: 'Inbox',
    conversations: 'Conversations',
    searchPlaceholder: 'Search contacts...',
    send: 'Send',
    claudeAssist: 'Claude Assist',
    exportData: 'Export Data',
    eraseContact: 'Erase Contact',
    whisperTranscript: 'Whisper Transcription',
    workspace: 'Workspace',
    connected: 'Connected',
    mockActive: 'Mock Mode / Active',
    typeMessage: 'Type a message...',
    selectConversation: 'Select a conversation to start messaging',
    broadcasts: 'Broadcasts',
    compliance: 'DPDP Compliance',
    aiSettings: 'AI Settings',
    webhooks: 'Webhooks & API',
  },
  hi: {
    inbox: 'इनबॉक्स',
    conversations: 'बातचीत',
    searchPlaceholder: 'संपर्क खोजें...',
    send: 'भेजें',
    claudeAssist: 'क्लॉड सहायक',
    exportData: 'डेटा निर्यात',
    eraseContact: 'संपर्क हटाएं',
    whisperTranscript: 'व्हिस्पर ट्रांसक्रिप्शन',
    workspace: 'कार्यस्थान',
    connected: 'कनेक्टेड',
    mockActive: 'मॉक मोड / सक्रिय',
    typeMessage: 'एक संदेश लिखें...',
    selectConversation: 'संदेश भेजना शुरू करने के लिए एक बातचीत चुनें',
    broadcasts: 'प्रसारण',
    compliance: 'डीपीडीपी अनुपालन',
    aiSettings: 'एआई सेटिंग्स',
    webhooks: 'वेबहुक और एपीआई',
  },
  es: {
    inbox: 'Bandeja de entrada',
    conversations: 'Conversaciones',
    searchPlaceholder: 'Buscar contactos...',
    send: 'Enviar',
    claudeAssist: 'Asistencia Claude',
    exportData: 'Exportar Datos',
    eraseContact: 'Borrar Contacto',
    whisperTranscript: 'Transcripción de Whisper',
    workspace: 'Espacio de trabajo',
    connected: 'Conectado',
    mockActive: 'Modo simulado / Activo',
    typeMessage: 'Escribe un mensaje...',
    selectConversation: 'Selecciona una conversación para empezar a mensajear',
    broadcasts: 'Transmisiones',
    compliance: 'Cumplimiento DPDP',
    aiSettings: 'Ajustes de IA',
    webhooks: 'Webhooks y API',
  },
  fr: {
    inbox: 'Boîte de réception',
    conversations: 'Conversations',
    searchPlaceholder: 'Rechercher des contacts...',
    send: 'Envoyer',
    claudeAssist: 'Assistant Claude',
    exportData: 'Exporter les données',
    eraseContact: 'Effacer le contact',
    whisperTranscript: 'Transcription Whisper',
    workspace: 'Espace de travail',
    connected: 'Connecté',
    mockActive: 'Mode fictif / Actif',
    typeMessage: 'Tapez un message...',
    selectConversation: 'Sélectionnez une conversation pour commencer',
    broadcasts: 'Diffusions',
    compliance: 'Conformité DPDP',
    aiSettings: 'Paramètres IA',
    webhooks: 'Webhooks et API',
  },
  ar: {
    inbox: 'صندوق الوارد',
    conversations: 'المحادثات',
    searchPlaceholder: 'بحث عن جهات الاتصال...',
    send: 'إرسال',
    claudeAssist: 'مساعد كلود',
    exportData: 'تصدير البيانات',
    eraseContact: 'مسح جهة الاتصال',
    whisperTranscript: 'نسخ ويسبر الصوتي',
    workspace: 'مساحة العمل',
    connected: 'متصل',
    mockActive: 'وضع المحاكاة / نشط',
    typeMessage: 'اكتب رسالة...',
    selectConversation: 'اختر محادثة لبدء المراسلة',
    broadcasts: 'البث الجماعي',
    compliance: 'امتثال DPDP',
    aiSettings: 'إعدادات الذكاء الاصطناعي',
    webhooks: 'الخطافات وواجهة برمجة التطبيقات',
  },
};

export function useTranslation() {
  const [lang, setLang] = useState<LanguageCode>(() => {
    return (localStorage.getItem('notifyiq_lang') as LanguageCode) || 'en';
  });

  const changeLanguage = (newLang: LanguageCode) => {
    setLang(newLang);
    localStorage.setItem('notifyiq_lang', newLang);
  };

  useEffect(() => {
    // Handle Right-to-Left (RTL) layout for Arabic language
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: keyof typeof translations['en']): string => {
    return translations[lang][key] || translations['en'][key] || String(key);
  };

  return { t, lang, changeLanguage };
}
