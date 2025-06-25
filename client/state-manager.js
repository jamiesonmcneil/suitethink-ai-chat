export const state = {
  userData: null,
  conversationHistory: [],
  lastQuery: '',
  pendingSupportMethod: '',
  transcriptId: null,
  followupMethod: null,
  emailConsent: false,
  smsConsent: false,
  voiceConsent: false,
  userId: null,
  userEmailId: null,
  userPhoneId: null
};

export function resetState() {
  state.userData = null;
  state.conversationHistory = [];
  state.lastQuery = '';
  state.pendingSupportMethod = '';
  state.transcriptId = null;
  state.followupMethod = null;
  state.emailConsent = false;
  state.smsConsent = false;
  state.voiceConsent = false;
  state.userId = null;
  state.userEmailId = null;
  state.userPhoneId = null;
}
