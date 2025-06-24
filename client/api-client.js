import { state } from './state-manager.js';
import { addMessage } from './ui-utils.js';

export async function queryAPI(query, apiKey, chat) {
  try {
    const response = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify({ query, conversationHistory: state.conversationHistory, ...state.userData, user_id: state.userId }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    addMessage('Assistant', 'Failed to process query. Please try again.', chat);
    return { error: true };
  }
}

export async function saveTranscript(transcript, is_require_followup, followup_method, apiKey, chat) {
  try {
    const response = await fetch('/api/save-transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify({ 
        transcript, 
        is_require_followup, 
        followup_method,
        fk_user_email_id: state.userEmailId,
        fk_user_phone_id: state.userPhoneId
      }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Save transcript error:', error);
    addMessage('Assistant', 'Failed to save transcript. Please try again.', chat);
    return { error: true };
  }
}

export async function updateTranscript(transcriptId, is_require_followup, followup_method, apiKey, chat) {
  try {
    const response = await fetch('/api/update-transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify({ 
        transcript_id: transcriptId, 
        is_require_followup, 
        followup_method,
        fk_user_email_id: state.userEmailId,
        fk_user_phone_id: state.userPhoneId
      }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Update transcript error:', error);
    addMessage('Assistant', 'Failed to update transcript. Please try again.', chat);
    return { error: true };
  }
}

export async function submitSupportRequest(query, method, apiKey, chat) {
  try {
    const response = await fetch('/api/submit-support-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify({
        query,
        method,
        email: state.userData.email,
        phone: state.userData.phone,
        name: state.userData.name,
        transcript_id: state.transcriptId
      }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Support request error:', error);
    addMessage('Assistant', 'Failed to submit support request. Please try again.', chat);
    return { error: true };
  }
}

export async function updateUserContact(contact, type, isPrimary, apiKey, chat) {
  try {
    const previousEmail = state.userData.email;
    if (type === 'email') {
      state.userData.email = contact.toUpperCase() === 'YES' ? state.userData.email : contact;
    } else if (type === 'phone') {
      state.userData.phone = contact.toUpperCase() === 'YES' ? state.userData.phone : contact;
    }
    const response = await fetch('/api/update-user-contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify({ 
        email: state.userData.email, 
        phone: state.userData.phone, 
        is_primary: isPrimary,
        user_id: state.userId
      }),
    });
    const data = await response.json();
    if (type === 'email') {
      state.userEmailId = data.user_email_id;
      if (previousEmail !== state.userData.email && previousEmail) {
        await fetch('/api/update-user-contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
          body: JSON.stringify({ 
            email: previousEmail, 
            phone: state.userData.phone, 
            is_primary: false,
            user_id: state.userId
          }),
        });
      }
    } else if (type === 'phone') {
      state.userPhoneId = data.user_phone_id;
    }
    if (state.transcriptId) {
      await updateTranscript(
        state.transcriptId, 
        state.followupMethod !== null, 
        state.followupMethod, 
        apiKey,
        chat
      );
    }
    return data;
  } catch (error) {
    console.error('Update contact error:', error);
    addMessage('Assistant', 'Failed to update contact information. Please try again.', chat);
    return { error: true };
  }
}

export async function checkUserContact(email, phone, apiKey, chat) {
  try {
    const response = await fetch('/api/check-user-contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify({ email, phone })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Check user contact error:', error);
    addMessage('Assistant', 'Failed to check user contact. Please try again.', chat);
    return { error: true };
  }
}

export async function submitConsent(keyword, type, apiKey, chat) {
  try {
    const isConsent = keyword.toUpperCase() === 'CONSENT';
    if (type === 'email') {
      state.emailConsent = isConsent;
    } else if (type === 'phone') {
      state.smsConsent = isConsent;
      state.voiceConsent = isConsent;
    }
    const response = await fetch('/api/submit-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify({
        user_id: state.userId || 'Guest',
        is_consent: isConsent,
        consent_keyword: keyword.toUpperCase(),
        phone: type === 'phone' ? state.userData.phone : null,
        email: type === 'email' ? state.userData.email : null
      }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Consent submission error:', error);
    addMessage('Assistant', 'Failed to submit consent. Please try again.', chat);
    return { error: true };
  }
}
