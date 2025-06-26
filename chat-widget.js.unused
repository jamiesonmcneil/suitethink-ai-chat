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
  toggleButton.style.animation = 'pulse 2s infinite';
  document.body.appendChild(toggleButton);

  widget.innerHTML = `
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
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
      <div id="conversation"></div>
      <div id="thinking" style="display: none; text-align: center; padding: 8px; font-size: 12px; color: #6b7280;">
        <span>Thinking</span><span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
      </div>
      <div id="working" style="display: none; text-align: center; padding: 8px; font-size: 12px; color: #6b7280;">
        <span>Working</span><span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
      </div>
      <div id="supportPrompt" style="display: none; text-align: center; padding: 8px; font-size: 12px; color: #374151;">
        <p>Would you like for me to send this conversation to our support team for them to contact you to follow up?</p>
        <button id="supportEmail" style="padding: 6px 12px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 12px; margin: 4px;">Email</button>
        <button id="supportNo" style="padding: 6px 12px; background: #ef4444; color: #fff; border: none; border-radius: 6px; font-size: 12px; margin: 4px;">No</button>
      </div>
      <div id="confirmClose" style="display: none; text-align: center; padding: 8px; font-size: 12px; color: #374151;">
        <p>Are you sure you want to end the chat?</p>
        <button id="confirmYes" style="padding: 6px 12px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 12px; margin: 4px;">Yes</button>
        <button id="confirmNo" style="padding: 6px 12px; background: #ef4444; color: #fff; border: none; border-radius: 6px; font-size: 12px; margin: 4px;">No</button>
      </div>
    </div>
    <form id="queryForm" style="padding: 12px; border-top: 1px solid #e5e7eb;">
      <!-- Commented out initial form for future reference
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
      -->
      <div id="question-input">
        <div style="display: flex; gap: 8px;">
          <input id="queryInput" type="text" style="flex: 1; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px 0 0 6px; font-size: 14px; background: #f3f4f6;" placeholder="Type your response...">
          <button type="submit" style="padding: 8px 12px; background: #4f46e5; color: #fff; border: none; border-radius: 0 6px 6px 0; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s;">Send</button>
          <button id="shareTranscript" type="button" style="padding: 8px 12px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s;"><i class="fas fa-share"></i></button>
        </div>
        <div id="shareOptions" style="display: none; position: absolute; bottom: 60px; right: 12px; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); padding: 8px; display: flex; flex-direction: column; gap: 4px; animation: popup 0.3s ease-out;">
          <button id="downloadTranscript" style="padding: 8px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;"><i class="fas fa-download"></i> <span>Download PDF</span></button>
          <button id="emailTranscript" style="padding: 8px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;"><i class="fas fa-envelope"></i> <span>Email</span></button>
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
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }
      .chat-bubble-user {
        background: #c7d2fe !important;
        color: #1e3a8a !important;
        border-radius: 12px 12px 0 12px !important;
        margin-left: 20%;
        padding: 10px !important;
        margin-bottom: 2px !important;
      }
      .chat-bubble-assistant {
        background: #e5e7eb !important;
        color: #1f2937 !important;
        border-radius: 12px 12px 12px 0 !important;
        margin-right: 20%;
        padding: 10px !important;
        margin-bottom: 2px !important;
      }
      #downloadTranscript.working, #emailTranscript.working {
        background: #6b7280 !important;
      }
      #downloadTranscript.working span, #emailTranscript.working span {
        display: none;
      }
      #downloadTranscript.working::before, #emailTranscript.working::before {
        content: 'Working...';
        display: inline-block;
        animation: blink 1s infinite;
      }
    </style>
  `;

  try {
    const form = widget.querySelector('#queryForm');
    const queryInput = widget.querySelector('#queryInput');
    const chat = widget.querySelector('#chat');
    const conversation = widget.querySelector('#conversation');
    const questionInput = widget.querySelector('#question-input');
    const userInfo = widget.querySelector('#user-info');
    const userLabel = widget.querySelector('#user-label');
    const shareOptions = widget.querySelector('#shareOptions');
    const minimizeChat = widget.querySelector('#minimizeChat');
    const closeChat = widget.querySelector('#closeChat');
    const downloadTranscript = widget.querySelector('#downloadTranscript');
    const emailTranscript = widget.querySelector('#emailTranscript');
    const supportEmail = widget.querySelector('#supportEmail');
    const supportNo = widget.querySelector('#supportNo');
    const thinking = widget.querySelector('#thinking');
    const working = widget.querySelector('#working');
    const supportPrompt = widget.querySelector('#supportPrompt');
    const confirmClose = widget.querySelector('#confirmClose');
    const confirmYes = widget.querySelector('#confirmYes');
    const confirmNo = widget.querySelector('#confirmNo');
    let userData = null;
    let conversationHistory = [];
    let lastQuery = '';
    let pendingSupportMethod = '';
    let transcriptId = null;
    let followupMethod = null;
    let contactStep = 'firstName'; // Tracks contact collection: firstName, lastName, email

    if (!form || !queryInput || !chat || !conversation || !questionInput || !userInfo || !userLabel || !shareOptions || !minimizeChat || !closeChat || !downloadTranscript || !emailTranscript || !supportEmail || !supportNo || !thinking || !working || !supportPrompt || !confirmClose || !confirmYes || !confirmNo) {
      throw new Error('Missing DOM elements');
    }

    console.log('Chat widget initialized');

    function addMessage(sender, text) {
      console.log(`Adding message: ${sender} - ${text}`);
      const div = document.createElement('div');
      div.className = sender === 'User' ? 'mb-3 flex justify-end' : 'mb-3 flex justify-start';
      const formattedText = text.split('\n').map(line => `<p class="mb-1 text-sm">${line}</p>`).join('');
      div.innerHTML = `<div class="max-w-[80%] p-3 rounded-lg text-sm chat-bubble-${sender.toLowerCase()} shadow-sm">${formattedText}</div>`;
      conversation.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
    }

    function clearConversation() {
      conversation.innerHTML = '';
    }

    function generateTranscript() {
      const user = userData ? `${userData.firstName || ''} ${userData.lastName || ''} (${userData.email || 'No email'})` : 'Anonymous';
      let transcript = `Storio Self Storage Chat Transcript\n\nUser: ${user}\n\n`;
      conversationHistory.forEach(msg => {
        const role = msg.role === 'user' ? 'You' : 'Assistant';
        transcript += `${role}:\n${msg.content}\n\n`;
      });
      return transcript;
    }

    function downloadPDF() {
      downloadTranscript.classList.add('working');
      working.style.display = 'block';
      if (!window.jspdf) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF();
          let y = 10;
          const user = userData ? `${userData.firstName || ''} ${userData.lastName || ''} (${userData.email || 'No email'})` : 'Anonymous';
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
          working.style.display = 'none';
          downloadTranscript.classList.remove('working');
          shareOptions.style.display = 'none';
        };
        document.head.appendChild(script);
      } else {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let y = 10;
        const user = userData ? `${userData.firstName || ''} ${userData.lastName || ''} (${userData.email || 'No email'})` : 'Anonymous';
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
        working.style.display = 'none';
        downloadTranscript.classList.remove('working');
        shareOptions.style.display = 'none';
      }
    }

    async function sendEmailTranscript() {
      downloadTranscript.classList.add('working');
      working.style.display = 'block';
      if (!userData.email) {
        pendingSupportMethod = 'emailTranscript';
        addMessage('Assistant', 'Please type your email address to send the transcript.');
        working.style.display = 'none';
        downloadTranscript.classList.remove('working');
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
      } finally {
        working.style.display = 'none';
        downloadTranscript.classList.remove('working');
        shareOptions.style.display = 'none';
      }
    }

    async function submitSupportRequest(method) {
      supportEmail.classList.add('working');
      working.style.display = 'block';
      if (method === 'email' && !userData.email) {
        pendingSupportMethod = 'supportEmail';
        addMessage('Assistant', 'Please type your email address to send the support request.');
        working.style.display = 'none';
        supportEmail.classList.remove('working');
        return;
      }
      followupMethod = method;
      try {
        const response = await fetch('/submit-support-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: lastQuery,
            method,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            transcript_id: transcriptId
          }),
        });
        const data = await response.json();
        addMessage('Assistant', data.message || `Support request sent via ${method}.`);
        supportPrompt.style.display = 'none';
      } catch (error) {
        console.error('Support request error:', error);
        addMessage('Assistant', 'Failed to submit support request.');
      } finally {
        working.style.display = 'none';
        supportEmail.classList.remove('working');
        shareOptions.style.display = 'none';
      }
    }

    async function updateUserContact(contact, type) {
      working.style.display = 'block';
      try {
        userData[type] = contact;
        userLabel.textContent = `${userData.firstName || 'Guest'} ${userData.lastName || ''} (${userData.email || 'No email'})`;
        userInfo.style.display = 'block';
        await fetch('/update-user-contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userData.email, firstName: userData.firstName, lastName: userData.lastName })
        });
        if (pendingSupportMethod === 'emailTranscript') {
          await sendEmailTranscript();
        } else if (pendingSupportMethod === 'supportEmail') {
          await submitSupportRequest('email');
        }
        pendingSupportMethod = '';
      } catch (error) {
        console.error('Update contact error:', error);
        addMessage('Assistant', 'Failed to update contact information.');
      } finally {
        working.style.display = 'none';
      }
    }

    toggleButton.addEventListener('click', () => {
      console.log('Toggle button clicked');
      widget.style.display = widget.style.display === 'none' ? 'flex' : 'none';
      toggleButton.style.display = widget.style.display === 'none' ? 'block' : 'none';
      shareOptions.style.display = 'none';
      if (widget.style.display === 'flex' && !userData) {
        userData = {};
        questionInput.style.display = 'block';
        const welcomeMessage = 'Hi! How can I help you with storage or parking at Storio Self Storage? May I have your first name, please?';
        addMessage('Assistant', welcomeMessage);
        conversationHistory.push({ role: 'assistant', content: welcomeMessage });
      }
    });

    minimizeChat.addEventListener('click', () => {
      console.log('Minimize button clicked');
      widget.style.display = 'none';
      toggleButton.style.display = 'block';
      shareOptions.style.display = 'none';
    });

    closeChat.addEventListener('click', () => {
      console.log('Close button clicked');
      confirmClose.style.display = 'block';
      closeChat.disabled = true;
    });

    confirmYes.addEventListener('click', () => {
      console.log('Confirm Yes clicked');
      widget.style.display = 'none';
      toggleButton.style.display = 'block';
      conversationHistory = [];
      userData = null;
      transcriptId = null;
      followupMethod = null;
      contactStep = 'firstName';
      clearConversation();
      questionInput.style.display = 'block';
      userInfo.style.display = 'none';
      shareOptions.style.display = 'none';
      confirmClose.style.display = 'none';
      thinking.style.display = 'none';
      working.style.display = 'none';
      supportPrompt.style.display = 'none';
      closeChat.disabled = false;
    });

    confirmNo.addEventListener('click', () => {
      console.log('Confirm No clicked');
      confirmClose.style.display = 'none';
      closeChat.disabled = false;
    });

    downloadTranscript.addEventListener('click', downloadPDF);
    emailTranscript.addEventListener('click', sendEmailTranscript);
    supportEmail.addEventListener('click', () => submitSupportRequest('email'));
    supportNo.addEventListener('click', () => {
      console.log('Support No clicked');
      supportPrompt.style.display = 'none';
      addMessage('Assistant', 'Okay, let me know how else I can assist you.');
    });

    shareTranscript.addEventListener('click', () => {
      console.log('Share Transcript clicked');
      shareOptions.style.display = shareOptions.style.display === 'none' ? 'flex' : 'none';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Form submitted');
      const query = queryInput.value.trim();

      if (!query) {
        return;
      }

      console.log('Sending query:', query);
      addMessage('User', query);
      conversationHistory.push({ role: 'user', content: query });
      queryInput.value = '';
      thinking.style.display = 'block';
      lastQuery = query;

      if (contactStep === 'firstName') {
        userData.firstName = query;
        contactStep = 'lastName';
        addMessage('Assistant', 'Thank you! May I have your last name, please?');
        thinking.style.display = 'none';
        return;
      } else if (contactStep === 'lastName') {
        userData.lastName = query;
        contactStep = 'email';
        addMessage('Assistant', 'Great! What is your email address?');
        thinking.style.display = 'none';
        return;
      } else if (contactStep === 'email' && !userData.email) {
        if (query.includes('@')) {
          await updateUserContact(query, 'email');
          contactStep = 'complete';
          addMessage('Assistant', 'Thank you for providing your details! How can I assist you with storage or parking today?');
          thinking.style.display = 'none';
          return;
        } else {
          addMessage('Assistant', 'Please enter a valid email address.');
          thinking.style.display = 'none';
          return;
        }
      }

      if (pendingSupportMethod) {
        if (pendingSupportMethod.includes('email') && query.includes('@')) {
          await updateUserContact(query, 'email');
          return;
        }
      }

      if (query.toLowerCase().includes('send') && query.toLowerCase().includes('copy') || query.toLowerCase().includes('share') && query.toLowerCase().includes('conversation')) {
        if (userData.email) {
          await sendEmailTranscript();
        } else {
          addMessage('Assistant', 'Please provide an email address to share the transcript.');
          supportPrompt.style.display = 'block';
        }
        thinking.style.display = 'none';
        return;
      }

      try {
        const response = await fetch('/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, conversationHistory, ...userData }),
        });
        thinking.style.display = 'none';
        const data = await response.json();
        if (data.error || data.response.includes('Error processing') || data.response === 'cannot answer') {
          addMessage('Assistant', data.response);
          addMessage('Assistant', "Sorry, I couldn't answer that. You can call 907-341-4198 or would you like for me to send this conversation to our support team for them to contact you to follow up?");
          supportPrompt.style.display = 'block';
        } else {
          addMessage('Assistant', data.response);
        }
        conversationHistory.push({ role: 'assistant', content: data.response });

        if (!transcriptId) {
          const transcript = generateTranscript();
          const saveResponse = await fetch('/save-transcript', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript, is_require_followup: followupMethod !== null, followup_method: followupMethod }),
          });
          const saveData = await saveResponse.json();
          if (saveData.url) {
            transcriptId = saveData.url.split('/').pop();
          } else {
            console.error('Failed to save transcript:', saveData);
            addMessage('Assistant', 'Failed to save conversation. Please try again.');
          }
        }
      } catch (error) {
        console.error('Fetch error:', error);
        thinking.style.display = 'none';
        if (followupMethod) {
          addMessage('Assistant', `Sorry, I couldn't answer that. Our team will follow up with you via ${followupMethod}.`);
        } else {
          addMessage('Assistant', "Sorry, I couldn't answer that. You can call 907-341-4198 or would you like for me to send this conversation to our support team for them to contact you to follow up?");
          supportPrompt.style.display = 'block';
        }
      }
    });
  } catch (error) {
    console.error('Widget initialization error:', error);
    widget.innerHTML = '<p style="color: #dc2626; padding: 12px; text-align: center;">Error loading chat. Please refresh the page.</p>';
  }
})();
