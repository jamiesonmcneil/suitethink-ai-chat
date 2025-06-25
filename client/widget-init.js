export function initWidget() {
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

  const scriptTag = document.currentScript || document.querySelector('script[src*="chat-widget.js"]');
  const apiKey = scriptTag.dataset.apiKey || '';

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
          <button id="shareTranscript" type="button" style="padding: 8px 12px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s;"><i class="fas fa-share"></i></button>
        </div>
        <div id="shareOptions" style="display: none; position: absolute; bottom: 60px; right: 12px; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); padding: 8px; display: flex; flex-direction: column; gap: 4px; animation: popup 0.3s ease-out;">
          <button id="downloadTranscript" style="padding: 8px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">Download PDF</button>
          <button id="emailTranscript" style="padding: 8px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">Email</button>
          <button id="smsTranscript" style="padding: 8px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">SMS</button>
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
      #thinking {
        background: #4f46e5;
        color: #ffffff;
        border-radius: 8px;
        margin: 10px auto;
        width: 80%;
        padding: 12px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        z-index: 1000;
      }
    </style>
  `;

  return { widget, toggleButton, apiKey };
}
