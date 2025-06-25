import { initWidget } from './widget-init.js';
import { setupEventListeners } from './event-handlers.js';

(function() {
  try {
    const { widget, toggleButton, apiKey } = initWidget();
    setupEventListeners({ widget, toggleButton, apiKey });
  } catch (error) {
    console.error('Widget initialization error:', error);
    const widget = document.querySelector('#storio-chat-widget');
    if (widget) {
      widget.innerHTML = '<p style="color: #dc2626; padding: 12px; text-align: center;">Error loading chat. Please refresh the page.</p>';
    }
  }
})();
