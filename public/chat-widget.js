(function() {
  const widget = document.createElement('div');
  widget.id = 'storio-chat-widget';
  widget.style.position = 'fixed';
  widget.style.bottom = '20px';
  widget.style.right = '20px';
  widget.style.width = '350px';
  widget.style.height = '500px';
  widget.style.backgroundColor = '#fff';
  widget.style.borderRadius = '12px';
  widget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
  widget.style.zIndex = '1000';
  widget.style.display = 'none';
  widget.style.flexDirection = 'column';
  widget.style.overflow = 'hidden';
  document.body.appendChild(widget);

  const toggleButton = document.createElement('button');
  toggleButton.innerHTML = '?';
  toggleButton.style.position = 'fixed';
  toggleButton.style.bottom = '20px';
  toggleButton.style.right = '20px';
  toggleButton.style.width = '50px';
  toggleButton.style.height = '50px';
  toggleButton.style.background = '#4f46e5';
  toggleButton.style.color = '#fff';
  toggleButton.style.border = 'none';
  toggleButton.style.borderRadius = '50%';
  toggleButton.style.fontSize = '24px';
  toggleButton.style.fontWeight = 'bold';
  toggleButton.style.cursor = 'pointer';
  toggleButton.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  toggleButton.style.zIndex = '1001';
  document.body.appendChild(toggleButton);

  widget.innerHTML = `
    <div style="background: linear-gradient(to right, #e0e7ff, #c3dafe); padding: 12px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
      <h2 style="margin: 0; font-size: 18px; font-weight: bold; color: #4f46e5;">Storio Self Storage</h2>
      <div>
        <button id="minimizeChat" style="background: none; border: none; color: #4f46e5; font-size: 16px; cursor: pointer; margin-right: 8px;">_</button>
        <button id="closeChat" style="background: none; border: none; color: #4f46e5; font-size: 16px; cursor: pointer;">✕</button>
      </div>
    </div>
    <div id="user-info" style="display: none; padding: 12px; border-bottom: 1px solid #e5e7eb;">
      <p id="user-label" style="margin: 0; font-size: 14px; font-weight: 600; color: #1f2937;"></p>
    </div>
    <div id="chat" style="flex: 1; padding: 12px; overflow-y: auto; background: #f9fafb; position: relative;">
      <div id="thinking" style="display: none; text-align: center; padding: 8px; font-size: 12px; color: #6b7280;">
        <span>Thinking</span><span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
      </div>
      <div id="supportPrompt" style="display: none; text-align: center; padding: 8px; font-size: 12px; color: #374151;">
        <p>Sorry, I couldn't answer that. Would you like a Support Specialist to follow up?</p>
        <button id="supportEmail" style="padding: 6px 12px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 12px; margin: 4px;">Email</button>
        <button id="supportSMS" style="padding: 6px 12px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 12px; margin: 4px;">SMS</button>
        <button id="supportCall" style="padding: 6px 12px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 12px; margin: 4px;">Phone Call</button>
      </div>
      <div id="contactPrompt" style="display: none; text-align: center; padding: 8px; font-size: 12px; color: #374151;">
        <p>Please provide your contact information.</p>
        <input id="contactInput" type="text" style="width: 80%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; margin-bottom: 8px;" placeholder="Enter email or phone">
        <button id="submitContact" style="padding: 6px 12px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 12px;">Submit</button>
      </div>
    </div>
    <form id="queryForm" style="padding: 12px; border-top: 1px solid #e5e7eb;">
      <div id="initial-inputs">
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <label style="display: block; font-size: 12px; font-weight: 500; color: #374151; margin-bottom: 4px;">Name (Optional)</label>
            <input id="nameInput" type="text" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; background: #f3f4f6;" placeholder="Your name">
          </div>
          <div>
            <label style="display: block; font-size: 12px; font-weight: 500; color: #374151; margin-bottom: 4px;">Email or Phone (One Required)</label>
            <input id="emailInput" type="email" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; background: #f3f4f6;" placeholder="Email">
            <input id="phoneInput" type="tel" style="width: 100%; margin-top: 8px; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; background: #f3f4f6;" placeholder="Phone">
          </div>
          <button type="submit" id="startChat" style="width: 100%; padding: 8px; background: #4f46e5; color: #fff; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s;">Start Chat</button>
        </div>
      </div>
      <div id="question-input" style="display: none;">
        <div style="display: flex; gap: 8px;">
          <input id="queryInput" type="text" style="flex: 1; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px 0 0 6px; font-size: 14px; background: #f3f4f6;" placeholder="Ask about storage or parking...">
          <button type="submit" style="padding: 8px 12px; background: #4f46e5; color: #fff; border: none; border-radius: 0 6px 6px 0; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s;">Send</button>
          <button id="shareTranscript" type="button" style="padding: 8px 12px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s;">Share</button>
        </div>
        <div id="shareOptions" style="display: none; position: absolute; bottom: 60px; right: 12px; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); padding: 8px; display: flex; flex-direction: column; gap: 4px; animation: popup 0.3s ease-out;">
          <button id="downloadTranscript" style="padding: 8px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">Download PDF</button>
          <button id="emailTranscript" style="padding: 8px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">Email</button>
          <button id="smsTranscript" style="padding: 8px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">SMS</button>
          <button id="copyLink" style="padding: 8px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">Copy Link</button>
        </div>
      </div>
    </form>
    <style>
      .dot {
        animation: blink 1s infinite;
        display: inline-block;
      }
      .dot:nth-child(2) { animation-delay: 0.2s; }
      .dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes blink {
        0%, 20% { opacity: 1; }
        40%, 100% { opacity: 0; }
      }
      @keyframes popup {
        from { transform: scale(0.8); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
    </style>
  `;

  try {
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
    const downloadTranscript = widget.querySelector('#downloadTranscript');
    const emailTranscript = widget.querySelector('#emailTranscript');
    const smsTranscript = widget.querySelector('#smsTranscript');
    const copyLink = widget.querySelector('#copyLink');
    const thinking = widget.querySelector('#thinking');
    const supportPrompt = widget.querySelector('#supportPrompt');
    const supportEmail = widget.querySelector('#supportEmail');
    const supportSMS = widget.querySelector('#supportSMS');
    const supportCall = widget.querySelector('#supportCall');
    const contactPrompt = widget.querySelector('#contactPrompt');
    const contactInput = widget.querySelector('#contactInput');
    const submitContact = widget.querySelector('#submitContact');
    let userData = null;
    let conversationHistory = [];
    let lastQuery = '';
    let pendingSupportMethod = '';

    if (!form || !nameInput || !emailInput || !phoneInput || !queryInput || !chat || !initialInputs || !questionInput || !userInfo || !userLabel || !minimizeChat || !closeChat || !shareTranscript || !downloadTranscript || !emailTranscript || !smsTranscript || !copyLink || !thinking || !supportPrompt || !supportEmail || !supportSMS || !supportCall || !contactPrompt || !contactInput || !submitContact) {
      throw new Error('Missing DOM elements');
    }

    console.log('Chat widget initialized');

    function addMessage(sender, text) {
      console.log(`Adding message: ${sender} - ${text}`);
      const div = document.createElement('div');
      div.className = sender === 'User' ? 'mb-3 flex justify-end' : 'mb-3 flex justify-start';
      const formattedText = text.split('\n').map(line => `<p class="mb-1 text-sm">${line}</p>`).join('');
      div.innerHTML = `<div class="max-w-[80%] p-3 rounded-lg text-sm ${sender === 'User' ? 'bg-indigo-200 text-indigo-900' : 'bg-gray-300 text-gray-900'} shadow-sm">${formattedText}</div>`;
      chat.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
    }

    function generateTranscript() {
      const user = userData ? `${userData.name || 'Guest'} (${userData.email || userData.phone})` : 'Anonymous';
      let transcript = `Storio Self Storage Chat Transcript\n\nUser: ${user}\n\n`;
      conversationHistory.forEach(msg => {
        const role = msg.role === 'user' ? 'You' : 'Assistant';
        transcript += `${role}:\n${msg.content}\n\n`;
      });
      return transcript;
    }

    function downloadPDF() {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      let y = 10;
      const user = userData ? `${userData.name || 'Guest'} (${userData.email || userData.phone})` : 'Anonymous';
      doc.setFontSize(12);
      doc.text(`Storio Self Storage Chat Transcript`, 10, y);
      y += 10;
      doc.setFontSize(10);
      doc.text(`User: ${user}`, 10, y);
      y += 10;
      conversationHistory.forEach(msg => {
        const role = msg.role === 'user' ? 'You' : 'Assistant';
        const lines = msg.content.split('\n');
        if (y > 280) {
          doc.addPage();
          y = 10;
        }
        doc.text(`${role}:`, 10, y);
        y += 5;
        lines.forEach(line => {
          const split = doc.splitTextToSize(line, 180);
          split.forEach(splitLine => {
            if (y > 280) {
              doc.addPage();
              y = 10;
            }
            doc.text(splitLine, 15, y);
            y += 5;
          });
        });
        y += 5;
      });
      doc.save(`storio-chat-transcript-${Date.now()}.pdf`);
    }

    async function sendEmailTranscript() {
      if (!userData.email) {
        addMessage('Assistant', 'Please provide an email to send the transcript.');
        pendingSupportMethod = 'emailTranscript';
        contactPrompt.style.display = 'block';
        contactInput.placeholder = 'Enter email';
        return;
      }
      const transcript = generateTranscript();
      try {
        const response = await fetch('/send-transcript-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userData.email, transcript }),
        });
        const data = await response.json();
        addMessage('Assistant', data.message || 'Transcript sent to your email.');
      } catch (error) {
        console.error('Email transcript error:', error);
        addMessage('Assistant', 'Failed to send email. Please try again.');
      }
    }

    async function sendSMSTranscript() {
      if (!userData.phone) {
        addMessage('Assistant', 'Please provide a phone number to send the transcript.');
        pendingSupportMethod = 'smsTranscript';
        contactPrompt.style.display = 'block';
        contactInput.placeholder = 'Enter phone';
        return;
      }
      const transcript = generateTranscript();
      try {
        const response = await fetch('/send-transcript-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: userData.phone, transcript }),
        });
        const data = await response.json();
        addMessage('Assistant', data.message || 'Transcript sent via SMS.');
      } catch (error) {
        console.error('SMS transcript error:', error);
        addMessage('Assistant', 'Failed to send SMS. Please try again.');
      }
    }

    async function copyTranscriptLink() {
      const transcript = generateTranscript();
      try {
        const response = await fetch('/save-transcript', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript }),
        });
        const data = await response.json();
        if (data.url) {
          navigator.clipboard.write(data.url);
          addMessage('Assistant', 'Transcript link copied to clipboard.');
        } else {
          addMessage('Assistant', 'Failed to generate link.');
        }
      } catch (error) {
        console.error('Copy link error:', error);
        addMessage('Assistant', 'Failed to copy link. Please try again.');
      }
    }

    async function submitSupportRequest(method) {
      if (method === 'email' && !userData.email) {
        pendingSupportMethod = 'supportEmail';
        contactPrompt.style.display = 'block';
        contactInput.placeholder = 'Enter email';
        return;
      }
      if (method === 'sms' && !userData.phone) {
        pendingSupportMethod = 'supportSMS';
        contactPrompt.style.display = 'block';
        contactInput.placeholder = 'Enter phone';
        return;
      }
      if (method === 'call' && !userData.phone) {
        pendingSupportMethod = 'supportCall';
        contactPrompt.style.display = 'block';
        contactInput.placeholder = 'Enter phone';
        return;
      }
      try {
        const response = await fetch('/submit-support-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: lastQuery,
            method,
            email: userData.email,
            phone: userData.phone
          }),
        });
        const data = await response.json();
        addMessage('Assistant', data.message || `Support request sent via ${method}.`);
        supportPrompt.style.display = 'none';
      } catch (error) {
        console.error('Support request error:', error);
        addMessage('Assistant', 'Failed to submit support request.');
      }
    }

    async function updateUserContact(contact, type) {
      try {
        userData[type] = contact;
        userLabel.textContent = `${userData.name || 'Guest'} (${userData.email || userData.phone})`;
        if (pendingSupportMethod === 'emailTranscript') {
          await sendEmailTranscript();
        } else if (pendingSupportMethod === 'smsTranscript') {
          await sendSMSTranscript();
        } else if (pendingSupportMethod === 'supportEmail') {
          await submitSupportRequest('email');
        } else if (pendingSupportMethod === 'supportSMS') {
          await submitSupportRequest('sms');
        } else if (pendingSupportMethod === 'supportCall') {
          await submitSupportRequest('call');
        }
        pendingSupportMethod = '';
        contactPrompt.style.display = 'none';
        contactInput.value = '';
      } catch (error) {
        console.error('Update contact error:', error);
        addMessage('Assistant', 'Failed to update contact information.');
      }
    }

    toggleButton.addEventListener('click', () => {
      widget.style.display = widget.style.display === 'none' ? 'flex' : 'none';
      toggleButton.style.display = widget.style.display === 'none' ? 'block' : 'none';
    });

    minimizeChat.addEventListener('click', () => {
      widget.style.display = 'none';
      toggleButton.style.display = 'block';
    });

    closeChat.addEventListener('click', () => {
      widget.style.display = 'none';
      toggleButton.style.display = 'block';
      conversationHistory = [];
      userData = null;
      chat.innerHTML = '<div id="thinking" style="display: none; text-align: center; padding: 8px; font-size: 12px; color: #6b7280;"><span>Thinking</span><span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></div><div id="supportPrompt" style="display: none; text-align: center; padding: 8px; font-size: 12px; color: #374151;"><p>Sorry, I couldn\'t answer that. Would you like a Support Specialist to follow up?</p><button id="supportEmail" style="padding: 6px 12px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 12px; margin: 4px;">Email</button><button id="supportSMS" style="padding: 6px 12px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 12px; margin: 4px;">SMS</button><button id="supportCall" style="padding: 6px 12px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 12px; margin: 4px;">Phone Call</button></div><div id="contactPrompt" style="display: none; text-align: center; padding: 8px; font-size: 12px; color: #374151;"><p>Please provide your contact information.</p><input id="contactInput" type="text" style="width: 80%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; margin-bottom: 8px;" placeholder="Enter email or phone"><button id="submitContact" style="padding: 6px 12px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 12px;">Submit</button></div>';
      initialInputs.style.display = 'block';
      questionInput.style.display = 'none';
      userInfo.style.display = 'none';
    });

    shareTranscript.addEventListener('click', () => {
      shareOptions.style.display = shareOptions.style.display === 'none' ? 'flex' : 'none';
    });

    downloadTranscript.addEventListener('click', () => {
      if (!window.jspdf) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = downloadPDF;
        document.head.appendChild(script);
      } else {
        downloadPDF();
      }
    });

    emailTranscript.addEventListener('click', () => {
      sendEmailTranscript();
    });

    smsTranscript.addEventListener('click', () => {
      sendSMSTranscript();
    });

    copyLink.addEventListener('click', () => {
      copyTranscriptLink();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Form submitted');
      const query = queryInput.value.trim();
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const phone = phoneInput.value.trim();

      if (!userData) {
        console.log('Checking initial inputs:', { name, email, phone });
        if (!email && !phone) {
          addMessage('Assistant', 'Please provide an email or phone number.');
          return;
        }
        try {
          userData = { name, email, phone };
          console.log('Toggling UI: hiding initial inputs, showing chat');
          initialInputs.style.display = 'none';
          questionInput.style.display = 'block';
          queryInput.setAttribute('required', 'required');
          userInfo.style.display = 'block';
          userLabel.textContent = `${name || 'Guest'} (${email || phone})`;
          const welcomeMessage = 'Hi! How can I help you with storage or parking at Storio Self Storage?';
          addMessage('Assistant', welcomeMessage);
          conversationHistory.push({ role: 'assistant', content: welcomeMessage });
        } catch (error) {
          console.error('Error starting chat:', error);
          addMessage('Assistant', 'Failed to start chat. Please try again.');
        }
        return;
      }

      if (!query) {
        addMessage('Assistant', 'Please enter a question.');
        return;
      }

      console.log('Sending query:', query);
      addMessage('User', query);
      conversationHistory.push({ role: 'user', content: query });
      queryInput.value = '';
      thinking.style.display = 'block';
      lastQuery = query;

      try {
        const response = await fetch('/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, conversationHistory, ...userData }),
        });
        thinking.style.display = 'none';
        const data = await response.json();
        if (data.error || data.response.includes('Error processing') || data.response.includes('cannot answer')) {
          addMessage('Assistant', "Sorry, I couldn't answer that.");
          supportPrompt.style.display = 'block';
        } else {
          addMessage('Assistant', data.response);
          conversationHistory.push({ role: 'assistant', content: data.response });
        }
      } catch (error) {
        console.error('Fetch error:', error);
        thinking.style.display = 'none';
        addMessage('Assistant', "Sorry, I couldn't answer that.");
        supportPrompt.style.display = 'block';
      }
    });

    supportEmail.addEventListener('click', () => {
      submitSupportRequest('email');
    });

    supportSMS.addEventListener('click', () => {
      submitSupportRequest('sms');
    });

    supportCall.addEventListener('click', () => {
      submitSupportRequest('call');
    });

    submitContact.addEventListener('click', () => {
      const contact = contactInput.value.trim();
      if (!contact) {
        addMessage('Assistant', 'Please enter a valid contact.');
        return;
      }
      if (pendingSupportMethod.includes('email') && !contact.includes('@')) {
        addMessage('Assistant', 'Please enter a valid email.');
        return;
      }
      if (pendingSupportMethod.includes('sms') || pendingSupportMethod.includes('call')) {
        if (!contact.match(/^\+?\d{10,15}$/)) {
          addMessage('Assistant', 'Please enter a valid phone number.');
          return;
        }
      }
      updateUserContact(contact, pendingSupportMethod.includes('email') ? 'email' : 'phone');
    });
  } catch (error) {
    console.error('Widget initialization error:', error);
    widget.innerHTML = '<p style="color: #dc2626; padding: 12px; text-align: center;">Error loading chat. Please refresh the page.</p>';
  }
})();
