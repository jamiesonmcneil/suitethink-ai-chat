import { state } from './state-manager.js';

export function addMessage(sender, text, chat) {
  console.log(`Adding message: ${sender} - ${text}`);
  const div = document.createElement('div');
  div.className = sender === 'User' ? 'mb-3 flex justify-end' : 'mb-3 flex justify-start';
  const formattedText = text.split('\n').map(line => `<p class="mb-1 text-sm">${line}</p>`).join('');
  div.innerHTML = `<div class="max-w-[80%] p-3 rounded-lg text-sm chat-bubble-${sender.toLowerCase()} shadow-sm">${formattedText}</div>`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

export function generateTranscript() {
  const user = state.userData ? `${state.userData.name || 'Guest'} (${state.userData.email || state.userData.phone || 'No contact'})` : 'Anonymous';
  let transcript = `Storio Self Storage Chat Transcript\n\nUser: ${user}\n\n`;
  state.conversationHistory.forEach(msg => {
    const role = msg.role === 'user' ? 'You' : 'Assistant';
    transcript += `${role}:\n${msg.content}\n\n`;
  });
  return transcript;
}

export function downloadPDF(shareOptions) {
  if (!window.jspdf) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => generatePDF(shareOptions);
    document.head.appendChild(script);
  } else {
    generatePDF(shareOptions);
  }
}

function generatePDF(shareOptions) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;
  const user = state.userData ? `${state.userData.name || 'Guest'} (${state.userData.email || state.userData.phone || 'No contact'})` : 'Anonymous';
  doc.setFontSize(12);
  doc.text(`Storio Self Storage Chat Transcript`, 10, y);
  y += 10;
  doc.setFontSize(10);
  doc.text(`User: ${user}`, 10, y);
  y += 10;
  state.conversationHistory.forEach(msg => {
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
  shareOptions.style.display = 'none';
}
