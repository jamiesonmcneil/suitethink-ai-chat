import { state, resetState } from './state-manager.js';
import { addMessage, generateTranscript, downloadPDF } from './ui-utils.js';
import { queryAPI, saveTranscript, updateTranscript, submitSupportRequest, updateUserContact, checkUserContact, submitConsent } from './api-client.js';

export function setupEventListeners({ widget, toggleButton, apiKey }) {
  const form = widget.querySelector('#queryForm');
  const nameInput = widget.querySelector('#nameInput');
  const emailInput = widget.querySelector('#emailInput');
  const phoneInput = widget.querySelector('#phoneInput');
  const queryInput = widget.querySelector('#queryInput');
  const chat = widget.querySelector('#chat');
  const initialInputs = widget.querySelector('#initial-inputs');
  const questionInput = widget.querySelector('#question-input');
  const userInfo = widget.querySelector('#user-info');
  const userLabel = widget.querySelector('#user-label');
  const minimizeChat = widget.querySelector('#minimizeChat');
  const closeChat = widget.querySelector('#closeChat');
  const shareTranscript = widget.querySelector('#shareTranscript');
  const shareOptions = widget.querySelector('#shareOptions');
  const downloadTranscript = widget.querySelector('#downloadTranscript');
  const emailTranscript = widget.querySelector('#emailTranscript');
  const smsTranscript = widget.querySelector('#smsTranscript');
  const thinking = widget.querySelector('#thinking');
  const supportPrompt = widget.querySelector('#supportPrompt');
  const supportEmail = widget.querySelector('#supportEmail');
  const supportSMS = widget.querySelector('#supportSMS');
  const supportCall = widget.querySelector('#supportCall');
  const supportNo = widget.querySelector('#supportNo');
  const contactPrompt = widget.querySelector('#contactPrompt');
  const contactInput = widget.querySelector('#contactInput');
  const contactText = widget.querySelector('#contactText');
  const submitContact = widget.querySelector('#submitContact');
  const consentPrompt = widget.querySelector('#consentPrompt');
  const consentInput = widget.querySelector('#consentInput');
  const submitConsentBtn = widget.querySelector('#submitConsentBtn');
  const closeConfirmPrompt = widget.querySelector('#closeConfirmPrompt');
  const confirmClose = widget.querySelector('#confirmClose');
  const cancelClose = widget.querySelector('#cancelClose');

  if (!form || !nameInput || !emailInput || !phoneInput || !queryInput || !chat || !initialInputs || !questionInput || !userInfo || !userLabel || !minimizeChat || !closeChat || !shareTranscript || !downloadTranscript || !emailTranscript || !smsTranscript || !thinking || !supportPrompt || !supportEmail || !supportSMS || !supportCall || !supportNo || !contactPrompt || !contactInput || !contactText || !submitContact || !consentPrompt || !consentInput || !submitConsentBtn || !closeConfirmPrompt || !confirmClose || !cancelClose) {
    throw new Error('Missing DOM elements');
  }

  toggleButton.addEventListener('click', () => {
    widget.style.display = widget.style.display === 'none' ? 'flex' : 'none';
    toggleButton.style.display = widget.style.display === 'none' ? 'block' : 'none';
    shareOptions.style.display = 'none';
  });

  minimizeChat.addEventListener('click', () => {
    widget.style.display = 'none';
    toggleButton.style.display = 'block';
    shareOptions.style.display = 'none';
  });

  closeChat.addEventListener('click', (e) => {
    e.preventDefault();
    closeConfirmPrompt.style.display = 'block';
  });

  confirmClose.addEventListener('click', () => {
    widget.style.display = 'none';
    toggleButton.style.display = 'block';
    resetState();
    chat.innerHTML = `
      <div id="thinking" style="display: none; text-align: center; padding: 12px; font-size: 18px; color: #ffffff; font-weight: bold; background: #4f46e5; border-radius: 8px; margin: 10px auto; width: 80%; z-index: 1000; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
        <span>Thinking</span><span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
      </div>
      <div id="supportPrompt" style="display: none; text-align: center; padding: 8px; font-size: 12px; color: #374151;">
        <p>Would you like for me to send this conversation to our support team for them to contact you to follow up?</p>
        <button id="supportEmail" style="padding: 6px 12px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 12px; margin: 4px;">Email</button>
        <button id="supportSMS" style="padding: 6px 12px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 12px; margin: 4px;">SMS</button>
        <button id="supportCall" style="padding: 6px 12px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 12px; margin: 4px;">Phone</button>
        <button id="supportNo" style="padding: 6px 12px; background: #ef4444; color: #fff; border: none; border-radius: 6px; font-size: 12px; margin: 4px;">No</button>
      </div>
      <div id="contactPrompt" style="display: none; text-align: center; padding: 8px; font-size: 12px; color: #374151;">
        <p id="contactText">Please provide your contact information.</p>
        <input id="contactInput" type="text" style="width: 80%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; margin-bottom: 8px;" placeholder="Enter email or phone">
        <button id="submitContact" style="padding: 6px 12px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 12px;">Submit</button>
      </div>
      <div id="consentPrompt" style="display: none; text-align: center; padding: 8px; font-size: 12px; color: #374151;">
        <p id="consentText">Do you consent to receive notifications from Storio Self Storage? Reply CONSENT to opt-in or STOP to opt-out.</p>
        <input id="consentInput" type="text" style="width: 80%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; margin-bottom: 8px;" placeholder="Enter CONSENT or STOP">
        <button id="submitConsentBtn" style="padding: 6px 12px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 12px;">Submit</button>
      </div>
      <div id="closeConfirmPrompt" style="display: none; text-align: center; padding: 8px; font-size: 12px; color: #374151;">
        <p>Are you sure you want to close the chat? This will clear your session data.</p>
        <button id="confirmClose" style="padding: 6px 12px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 12px; margin: 4px;">Yes</button>
        <button id="cancelClose" style="padding: 6px 12px; background: #ef4444; color: #fff; border: none; border-radius: 6px; font-size: 12px; margin: 4px;">No</button>
      </div>`;
    initialInputs.style.display = 'block';
    questionInput.style.display = 'none';
    userInfo.style.display = 'none';
    shareOptions.style.display = 'none';
    closeConfirmPrompt.style.display = 'none';
  });

  cancelClose.addEventListener('click', () => {
    closeConfirmPrompt.style.display = 'none';
  });

  shareTranscript.addEventListener('click', () => {
    shareOptions.style.display = shareOptions.style.display === 'none' ? 'flex' : 'none';
  });

  downloadTranscript.addEventListener('click', (e) => {
    e.preventDefault();
    downloadPDF(shareOptions);
  });

  emailTranscript.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!state.userData.email) {
      addMessage('Assistant', 'Please provide an email to send the transcript.', chat);
      state.pendingSupportMethod = 'emailTranscript';
      contactPrompt.style.display = 'block';
      contactText.textContent = 'Please provide your email address.';
      contactInput.placeholder = 'Enter email';
      return;
    }
    emailTranscript.disabled = true;
    emailTranscript.textContent = 'Sending...';
    const transcript = generateTranscript();
    try {
      const response = await fetch('/api/send-transcript-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
        body: JSON.stringify({ email: state.userData.email, transcript }),
      });
      const data = await response.json();
      addMessage('Assistant', data.message || 'Transcript sent to your email.', chat);
      shareOptions.style.display = 'none';
    } catch (error) {
      console.error('Email transcript error:', error);
      addMessage('Assistant', 'Failed to send email. Please try again.', chat);
    } finally {
      emailTranscript.disabled = false;
      emailTranscript.textContent = 'Email';
    }
  });

  smsTranscript.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!state.userData.phone) {
      addMessage('Assistant', 'Please provide a phone number to send the transcript.', chat);
      state.pendingSupportMethod = 'smsTranscript';
      contactPrompt.style.display = 'block';
      contactText.textContent = 'Please provide your phone number.';
      contactInput.placeholder = 'Enter phone';
      return;
    }
    smsTranscript.disabled = true;
    smsTranscript.textContent = 'Sending...';
    const transcript = generateTranscript();
    try {
      const response = await fetch('/api/send-transcript-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
        body: JSON.stringify({ phone: state.userData.phone, transcript }),
      });
      const data = await response.json();
      addMessage('Assistant', data.message || 'Transcript sent via SMS.', chat);
      shareOptions.style.display = 'none';
    } catch (error) {
      console.error('SMS transcript error:', error);
      addMessage('Assistant', `Sorry, I couldn't send the transcript via SMS. Is ${state.userData.phone} the correct phone number? Reply YES to confirm or enter a different phone number.`, chat);
      state.pendingSupportMethod = 'smsTranscript';
      contactPrompt.style.display = 'block';
      contactText.textContent = `Confirm or enter a different phone number.`;
      contactInput.placeholder = state.userData.phone;
    } finally {
      smsTranscript.disabled = false;
      smsTranscript.textContent = 'SMS';
    }
  });

  supportEmail.addEventListener('click', () => {
    state.pendingSupportMethod = 'supportEmail';
    if (state.userData.email) {
      addMessage('Assistant', `Is ${state.userData.email} the correct email for follow-up? Reply YES to confirm or enter a different email.`, chat);
      contactPrompt.style.display = 'block';
      contactText.textContent = `Confirm or enter a different email.`;
      contactInput.placeholder = state.userData.email;
    } else {
      contactPrompt.style.display = 'block';
      contactText.textContent = 'Please provide your email address.';
      contactInput.placeholder = 'Enter email';
    }
  });

  supportSMS.addEventListener('click', () => {
    state.pendingSupportMethod = 'supportSMS';
    if (state.userData.phone) {
      addMessage('Assistant', `Is ${state.userData.phone} the correct phone number for follow-up? Reply YES to confirm or enter a different phone number.`, chat);
      contactPrompt.style.display = 'block';
      contactText.textContent = `Confirm or enter a different phone number.`;
      contactInput.placeholder = state.userData.phone;
    } else {
      contactPrompt.style.display = 'block';
      contactText.textContent = 'Please provide your phone number.';
      contactInput.placeholder = 'Enter phone';
    }
  });

  supportCall.addEventListener('click', () => {
    state.pendingSupportMethod = 'supportCall';
    if (state.userData.phone) {
      addMessage('Assistant', `Is ${state.userData.phone} the correct phone number for follow-up? Reply YES to confirm or enter a different phone number.`, chat);
      contactPrompt.style.display = 'block';
      contactText.textContent = `Confirm or enter a different phone number.`;
      contactInput.placeholder = state.userData.phone;
    } else {
      contactPrompt.style.display = 'block';
      contactText.textContent = 'Please provide your phone number.';
      contactInput.placeholder = 'Enter phone';
    }
  });

  supportNo.addEventListener('click', () => {
    supportPrompt.style.display = 'none';
    addMessage('Assistant', 'Okay, let me know how else I can assist you.', chat);
  });

  submitContact.addEventListener('click', async () => {
    const contact = contactInput.value.trim();
    if (!contact) {
      addMessage('Assistant', 'Please enter a valid contact or reply YES to confirm.', chat);
      return;
    }
    if ((state.pendingSupportMethod === 'supportEmail' || state.pendingSupportMethod === 'emailTranscript') && contact !== 'YES' && !contact.includes('@')) {
      addMessage('Assistant', 'Please enter a valid email or reply YES to confirm.', chat);
      return;
    }
    if ((state.pendingSupportMethod === 'supportSMS' || state.pendingSupportMethod === 'supportCall' || state.pendingSupportMethod === 'smsTranscript') && contact !== 'YES' && !contact.match(/^\+?\d{10,15}$/)) {
      addMessage('Assistant', 'Please enter a valid phone number or reply YES to confirm.', chat);
      return;
    }
    const isPrimary = contact.toUpperCase() !== 'YES';
    const type = state.pendingSupportMethod.includes('Email') || state.pendingSupportMethod === 'emailTranscript' ? 'email' : 'phone';
    const data = await updateUserContact(contact, type, isPrimary, apiKey, chat);
    if (!data.error) {
      userLabel.textContent = `${state.userData.name || 'Guest'} (${state.userData.email || state.userData.phone || 'No contact'})`;
      contactPrompt.style.display = 'none';
      contactInput.value = '';
      if (state.pendingSupportMethod.includes('Email') || state.pendingSupportMethod === 'smsTranscript') {
        addMessage('Assistant', `Please consent to receive ${state.pendingSupportMethod.includes('Email') ? 'email' : 'SMS'} notifications.`, chat);
        consentPrompt.style.display = 'block';
      }
    }
  });

  submitConsentBtn.addEventListener('click', async () => {
    const keyword = consentInput.value.trim().toUpperCase();
    if (!keyword || !['CONSENT', 'STOP'].includes(keyword)) {
      addMessage('Assistant', 'Please enter CONSENT or STOP.', chat);
      return;
    }
    const type = state.pendingSupportMethod.includes('Email') ? 'email' : 'phone';
    const data = await submitConsent(keyword, type, apiKey, chat);
    if (!data.error) {
      consentPrompt.style.display = 'none';
      consentInput.value = '';
      addMessage('Assistant', data.message || (keyword === 'CONSENT' ? `${type === 'email' ? 'Email' : 'SMS and voice'} consent granted.` : `${type === 'email' ? 'Email' : 'SMS and voice'} consent declined.`), chat);
      if (keyword === 'CONSENT') {
        if (state.pendingSupportMethod === 'supportEmail') {
          state.followupMethod = 'email';
          const data = await submitSupportRequest(state.lastQuery, 'email', apiKey, chat);
          if (!data.error) {
            addMessage('Assistant', data.message || 'Support request sent via email.', chat);
            supportPrompt.style.display = 'none';
          }
        } else if (state.pendingSupportMethod === 'supportSMS') {
          state.followupMethod = 'sms';
          const data = await submitSupportRequest(state.lastQuery, 'sms', apiKey, chat);
          if (!data.error) {
            addMessage('Assistant', data.message || 'Support request sent via SMS.', chat);
            supportPrompt.style.display = 'none';
          }
        } else if (state.pendingSupportMethod === 'supportCall') {
          state.followupMethod = 'call';
          const data = await submitSupportRequest(state.lastQuery, 'call', apiKey, chat);
          if (!data.error) {
            addMessage('Assistant', data.message || 'Support request sent via phone.', chat);
            supportPrompt.style.display = 'none';
          }
        } else if (state.pendingSupportMethod === 'smsTranscript') {
          const transcript = generateTranscript();
          const response = await fetch('/api/send-transcript-sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
            body: JSON.stringify({ phone: state.userData.phone, transcript }),
          });
          const data = await response.json();
          addMessage('Assistant', data.message || 'Transcript sent via SMS.', chat);
          shareOptions.style.display = 'none';
        }
      }
      state.pendingSupportMethod = '';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    const query = queryInput.value.trim();
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!state.userData) {
      console.log('Checking initial inputs:', { name, email, phone });
      if (!email && !phone) {
        addMessage('Assistant', 'Please provide an email or phone number.', chat);
        return;
      }
      state.userData = { name, email, phone };
      const data = await checkUserContact(email, phone, apiKey, chat);
      if (!data.error) {
        state.userId = data.user_id || null;
        state.userEmailId = data.user_email_id || null;
        state.userPhoneId = data.user_phone_id || null;
        const updateData = await updateUserContact(email || phone, email ? 'email' : 'phone', false, apiKey, chat);
        if (!updateData.error) {
          state.userEmailId = updateData.user_email_id || state.userEmailId;
          state.userPhoneId = updateData.user_phone_id || state.userPhoneId;
          state.userId = updateData.user_id || state.userId;
          const transcript = generateTranscript();
          const saveData = await saveTranscript(transcript, false, null, apiKey, chat);
          if (!saveData.error) {
            state.transcriptId = saveData.id;
            initialInputs.style.display = 'none';
            questionInput.style.display = 'block';
            userInfo.style.display = 'block';
            userLabel.textContent = `${name || 'Guest'} (${email || phone || 'No contact'})`;
            const welcomeMessage = 'Hi! How can I help you with storage or parking at Storio Self Storage?';
            addMessage('Assistant', welcomeMessage, chat);
            state.conversationHistory.push({ role: 'assistant', content: welcomeMessage });
          }
        }
      }
      return;
    }

    if (!query) {
      addMessage('Assistant', 'Please enter a question.', chat);
      return;
    }

    if (query.toUpperCase() === 'CONSENT' || query.toUpperCase() === 'STOP') {
      addMessage('User', query, chat);
      state.conversationHistory.push({ role: 'user', content: query });
      queryInput.value = '';
      consentPrompt.style.display = 'block';
      submitConsent(query.toUpperCase(), state.userData.email ? 'email' : 'phone', apiKey, chat);
      return;
    }

    console.log('Sending query:', query);
    addMessage('User', query, chat);
    state.conversationHistory.push({ role: 'user', content: query });
    queryInput.value = '';
    thinking.style.display = 'block';
    state.lastQuery = query;

    const data = await queryAPI(query, apiKey, chat);
    thinking.style.display = 'none';
    if (data.error || data.response.includes('Error processing') || data.response === 'cannot answer') {
      if (state.followupMethod) {
        addMessage('Assistant', `Sorry, I couldn't answer that. Our team will follow up with you via ${state.followupMethod}.`, chat);
      } else {
        addMessage('Assistant', "Sorry, I couldn't answer that. You can call us at 907-341-4198 or would you like for me to send this conversation to our support team for them to contact you to follow up?", chat);
        supportPrompt.style.display = 'block';
      }
    } else {
      addMessage('Assistant', data.response, chat);
      state.conversationHistory.push({ role: 'assistant', content: data.response });
    }
  });
}
