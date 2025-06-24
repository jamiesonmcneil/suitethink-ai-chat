(()=>{var T=(t,o)=>()=>(t&&(o=t(t=0)),o);var fe=(t,o)=>()=>(o||t((o={exports:{}}).exports,o),o.exports);function te(){let t=document.createElement("div");t.id="storio-chat-widget",t.style.position="fixed",t.style.bottom="20px",t.style.right="20px",t.style.width="350px",t.style.height="500px",t.style.backgroundColor="#fff",t.style.borderRadius="12px",t.style.boxShadow="0 4px 20px rgba(0,0,0,0.2)",t.style.zIndex="1000",t.style.display="none",t.style.flexDirection="column",t.style.overflow="hidden",document.body.appendChild(t);let o=document.createElement("button");o.innerHTML="?",o.style.position="fixed",o.style.bottom="20px",o.style.right="20px",o.style.width="50px",o.style.height="50px",o.style.background="#4f46e5",o.style.color="#fff",o.style.border="none",o.style.borderRadius="50%",o.style.fontSize="24px",o.style.fontWeight="bold",o.style.cursor="pointer",o.style.boxShadow="0 2px 10px rgba(0,0,0,0.2)",o.style.zIndex="1001",document.body.appendChild(o);let s=(document.currentScript||document.querySelector('script[src*="chat-widget.js"]')).dataset.apiKey||"";return t.innerHTML=`
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <div style="background: linear-gradient(to right, #e0e7ff, #c3dafe); padding: 12px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
      <h2 style="margin: 0; font-size: 18px; font-weight: bold; color: #4f46e5;">Storio Self Storage</h2>
      <div>
        <button id="minimizeChat" style="background: none; border: none; color: #4f46e5; font-size: 16px; cursor: pointer; margin-right: 8px;">_</button>
        <button id="closeChat" style="background: none; border: none; color: #4f46e5; font-size: 16px; cursor: pointer;">\u2715</button>
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
  `,{widget:t,toggleButton:o,apiKey:s}}var oe=T(()=>{});function ne(){e.userData=null,e.conversationHistory=[],e.lastQuery="",e.pendingSupportMethod="",e.transcriptId=null,e.followupMethod=null,e.emailConsent=!1,e.smsConsent=!1,e.voiceConsent=!1,e.userId=null,e.userEmailId=null,e.userPhoneId=null}var e,z=T(()=>{e={userData:null,conversationHistory:[],lastQuery:"",pendingSupportMethod:"",transcriptId:null,followupMethod:null,emailConsent:!1,smsConsent:!1,voiceConsent:!1,userId:null,userEmailId:null,userPhoneId:null}});function a(t,o,n){console.log(`Adding message: ${t} - ${o}`);let s=document.createElement("div");s.className=t==="User"?"mb-3 flex justify-end":"mb-3 flex justify-start";let i=o.split(`
`).map(d=>`<p class="mb-1 text-sm">${d}</p>`).join("");s.innerHTML=`<div class="max-w-[80%] p-3 rounded-lg text-sm chat-bubble-${t.toLowerCase()} shadow-sm">${i}</div>`,n.appendChild(s),n.scrollTop=n.scrollHeight}function E(){let o=`Storio Self Storage Chat Transcript

User: ${e.userData?`${e.userData.name||"Guest"} (${e.userData.email||e.userData.phone||"No contact"})`:"Anonymous"}

`;return e.conversationHistory.forEach(n=>{let s=n.role==="user"?"You":"Assistant";o+=`${s}:
${n.content}

`}),o}function se(t){if(window.jspdf)re(t);else{let o=document.createElement("script");o.src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",o.onload=()=>re(t),document.head.appendChild(o)}}function re(t){let{jsPDF:o}=window.jspdf,n=new o,s=10,i=e.userData?`${e.userData.name||"Guest"} (${e.userData.email||e.userData.phone||"No contact"})`:"Anonymous";n.setFontSize(12),n.text("Storio Self Storage Chat Transcript",10,s),s+=10,n.setFontSize(10),n.text(`User: ${i}`,10,s),s+=10,e.conversationHistory.forEach(d=>{let h=d.role==="user"?"You":"Assistant",m=d.content.split(`
`);s>280&&(n.addPage(),s=10),n.text(`${h}:`,10,s),s+=5,m.forEach(r=>{n.splitTextToSize(r,180).forEach(P=>{s>280&&(n.addPage(),s=10),n.text(P,15,s),s+=5})}),s+=5}),n.save(`storio-chat-transcript-${Date.now()}.pdf`),t.style.display="none"}var $=T(()=>{z()});async function ae(t,o,n){try{return await(await fetch("/api/query",{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":o},body:JSON.stringify({query:t,conversationHistory:e.conversationHistory,...e.userData,user_id:e.userId})})).json()}catch(s){return console.error("Fetch error:",s),a("Assistant","Failed to process query. Please try again.",n),{error:!0}}}async function ie(t,o,n,s,i){try{return await(await fetch("/api/save-transcript",{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":s},body:JSON.stringify({transcript:t,is_require_followup:o,followup_method:n,fk_user_email_id:e.userEmailId,fk_user_phone_id:e.userPhoneId})})).json()}catch(d){return console.error("Save transcript error:",d),a("Assistant","Failed to save transcript. Please try again.",i),{error:!0}}}async function ye(t,o,n,s,i){try{return await(await fetch("/api/update-transcript",{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":s},body:JSON.stringify({transcript_id:t,is_require_followup:o,followup_method:n,fk_user_email_id:e.userEmailId,fk_user_phone_id:e.userPhoneId})})).json()}catch(d){return console.error("Update transcript error:",d),a("Assistant","Failed to update transcript. Please try again.",i),{error:!0}}}async function A(t,o,n,s){try{return await(await fetch("/api/submit-support-request",{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":n},body:JSON.stringify({query:t,method:o,email:e.userData.email,phone:e.userData.phone,name:e.userData.name,transcript_id:e.transcriptId})})).json()}catch(i){return console.error("Support request error:",i),a("Assistant","Failed to submit support request. Please try again.",s),{error:!0}}}async function L(t,o,n,s,i){try{let d=e.userData.email;o==="email"?e.userData.email=t.toUpperCase()==="YES"?e.userData.email:t:o==="phone"&&(e.userData.phone=t.toUpperCase()==="YES"?e.userData.phone:t);let m=await(await fetch("/api/update-user-contact",{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":s},body:JSON.stringify({email:e.userData.email,phone:e.userData.phone,is_primary:n,user_id:e.userId})})).json();return o==="email"?(e.userEmailId=m.user_email_id,d!==e.userData.email&&d&&await fetch("/api/update-user-contact",{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":s},body:JSON.stringify({email:d,phone:e.userData.phone,is_primary:!1,user_id:e.userId})})):o==="phone"&&(e.userPhoneId=m.user_phone_id),e.transcriptId&&await ye(e.transcriptId,e.followupMethod!==null,e.followupMethod,s,i),m}catch(d){return console.error("Update contact error:",d),a("Assistant","Failed to update contact information. Please try again.",i),{error:!0}}}async function pe(t,o,n,s){try{return await(await fetch("/api/check-user-contact",{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":n},body:JSON.stringify({email:t,phone:o})})).json()}catch(i){return console.error("Check user contact error:",i),a("Assistant","Failed to check user contact. Please try again.",s),{error:!0}}}async function U(t,o,n,s){try{let i=t.toUpperCase()==="CONSENT";return o==="email"?e.emailConsent=i:o==="phone"&&(e.smsConsent=i,e.voiceConsent=i),await(await fetch("/api/submit-consent",{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":n},body:JSON.stringify({user_id:e.userId||"Guest",is_consent:i,consent_keyword:t.toUpperCase(),phone:o==="phone"?e.userData.phone:null,email:o==="email"?e.userData.email:null})})).json()}catch(i){return console.error("Consent submission error:",i),a("Assistant","Failed to submit consent. Please try again.",s),{error:!0}}}var le=T(()=>{z();$()});function de({widget:t,toggleButton:o,apiKey:n}){let s=t.querySelector("#queryForm"),i=t.querySelector("#nameInput"),d=t.querySelector("#emailInput"),h=t.querySelector("#phoneInput"),m=t.querySelector("#queryInput"),r=t.querySelector("#chat"),w=t.querySelector("#initial-inputs"),P=t.querySelector("#question-input"),O=t.querySelector("#user-info"),N=t.querySelector("#user-label"),F=t.querySelector("#minimizeChat"),H=t.querySelector("#closeChat"),Y=t.querySelector("#shareTranscript"),x=t.querySelector("#shareOptions"),J=t.querySelector("#downloadTranscript"),v=t.querySelector("#emailTranscript"),C=t.querySelector("#smsTranscript"),_=t.querySelector("#thinking"),k=t.querySelector("#supportPrompt"),R=t.querySelector("#supportEmail"),X=t.querySelector("#supportSMS"),Q=t.querySelector("#supportCall"),W=t.querySelector("#supportNo"),y=t.querySelector("#contactPrompt"),f=t.querySelector("#contactInput"),b=t.querySelector("#contactText"),G=t.querySelector("#submitContact"),I=t.querySelector("#consentPrompt"),j=t.querySelector("#consentInput"),B=t.querySelector("#submitConsentBtn"),D=t.querySelector("#closeConfirmPrompt"),K=t.querySelector("#confirmClose"),V=t.querySelector("#cancelClose");if(!s||!i||!d||!h||!m||!r||!w||!P||!O||!N||!F||!H||!Y||!J||!v||!C||!_||!k||!R||!X||!Q||!W||!y||!f||!b||!G||!I||!j||!B||!D||!K||!V)throw new Error("Missing DOM elements");o.addEventListener("click",()=>{t.style.display=t.style.display==="none"?"flex":"none",o.style.display=t.style.display==="none"?"block":"none",x.style.display="none"}),F.addEventListener("click",()=>{t.style.display="none",o.style.display="block",x.style.display="none"}),H.addEventListener("click",p=>{p.preventDefault(),D.style.display="block"}),K.addEventListener("click",()=>{t.style.display="none",o.style.display="block",ne(),r.innerHTML=`
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
      </div>`,w.style.display="block",P.style.display="none",O.style.display="none",x.style.display="none",D.style.display="none"}),V.addEventListener("click",()=>{D.style.display="none"}),Y.addEventListener("click",()=>{x.style.display=x.style.display==="none"?"flex":"none"}),J.addEventListener("click",p=>{p.preventDefault(),se(x)}),v.addEventListener("click",async p=>{if(p.preventDefault(),!e.userData.email){a("Assistant","Please provide an email to send the transcript.",r),e.pendingSupportMethod="emailTranscript",y.style.display="block",b.textContent="Please provide your email address.",f.placeholder="Enter email";return}v.disabled=!0,v.textContent="Sending...";let c=E();try{let l=await(await fetch("/api/send-transcript-email",{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":n},body:JSON.stringify({email:e.userData.email,transcript:c})})).json();a("Assistant",l.message||"Transcript sent to your email.",r),x.style.display="none"}catch(u){console.error("Email transcript error:",u),a("Assistant","Failed to send email. Please try again.",r)}finally{v.disabled=!1,v.textContent="Email"}}),C.addEventListener("click",async p=>{if(p.preventDefault(),!e.userData.phone){a("Assistant","Please provide a phone number to send the transcript.",r),e.pendingSupportMethod="smsTranscript",y.style.display="block",b.textContent="Please provide your phone number.",f.placeholder="Enter phone";return}C.disabled=!0,C.textContent="Sending...";let c=E();try{let l=await(await fetch("/api/send-transcript-sms",{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":n},body:JSON.stringify({phone:e.userData.phone,transcript:c})})).json();a("Assistant",l.message||"Transcript sent via SMS.",r),x.style.display="none"}catch(u){console.error("SMS transcript error:",u),a("Assistant",`Sorry, I couldn't send the transcript via SMS. Is ${e.userData.phone} the correct phone number? Reply YES to confirm or enter a different phone number.`,r),e.pendingSupportMethod="smsTranscript",y.style.display="block",b.textContent="Confirm or enter a different phone number.",f.placeholder=e.userData.phone}finally{C.disabled=!1,C.textContent="SMS"}}),R.addEventListener("click",()=>{e.pendingSupportMethod="supportEmail",e.userData.email?(a("Assistant",`Is ${e.userData.email} the correct email for follow-up? Reply YES to confirm or enter a different email.`,r),y.style.display="block",b.textContent="Confirm or enter a different email.",f.placeholder=e.userData.email):(y.style.display="block",b.textContent="Please provide your email address.",f.placeholder="Enter email")}),X.addEventListener("click",()=>{e.pendingSupportMethod="supportSMS",e.userData.phone?(a("Assistant",`Is ${e.userData.phone} the correct phone number for follow-up? Reply YES to confirm or enter a different phone number.`,r),y.style.display="block",b.textContent="Confirm or enter a different phone number.",f.placeholder=e.userData.phone):(y.style.display="block",b.textContent="Please provide your phone number.",f.placeholder="Enter phone")}),Q.addEventListener("click",()=>{e.pendingSupportMethod="supportCall",e.userData.phone?(a("Assistant",`Is ${e.userData.phone} the correct phone number for follow-up? Reply YES to confirm or enter a different phone number.`,r),y.style.display="block",b.textContent="Confirm or enter a different phone number.",f.placeholder=e.userData.phone):(y.style.display="block",b.textContent="Please provide your phone number.",f.placeholder="Enter phone")}),W.addEventListener("click",()=>{k.style.display="none",a("Assistant","Okay, let me know how else I can assist you.",r)}),G.addEventListener("click",async()=>{let p=f.value.trim();if(!p){a("Assistant","Please enter a valid contact or reply YES to confirm.",r);return}if((e.pendingSupportMethod==="supportEmail"||e.pendingSupportMethod==="emailTranscript")&&p!=="YES"&&!p.includes("@")){a("Assistant","Please enter a valid email or reply YES to confirm.",r);return}if((e.pendingSupportMethod==="supportSMS"||e.pendingSupportMethod==="supportCall"||e.pendingSupportMethod==="smsTranscript")&&p!=="YES"&&!p.match(/^\+?\d{10,15}$/)){a("Assistant","Please enter a valid phone number or reply YES to confirm.",r);return}let c=p.toUpperCase()!=="YES",u=e.pendingSupportMethod.includes("Email")||e.pendingSupportMethod==="emailTranscript"?"email":"phone";(await L(p,u,c,n,r)).error||(N.textContent=`${e.userData.name||"Guest"} (${e.userData.email||e.userData.phone||"No contact"})`,y.style.display="none",f.value="",(e.pendingSupportMethod.includes("Email")||e.pendingSupportMethod==="smsTranscript")&&(a("Assistant",`Please consent to receive ${e.pendingSupportMethod.includes("Email")?"email":"SMS"} notifications.`,r),I.style.display="block"))}),B.addEventListener("click",async()=>{let p=j.value.trim().toUpperCase();if(!p||!["CONSENT","STOP"].includes(p)){a("Assistant","Please enter CONSENT or STOP.",r);return}let c=e.pendingSupportMethod.includes("Email")?"email":"phone",u=await U(p,c,n,r);if(!u.error){if(I.style.display="none",j.value="",a("Assistant",u.message||(p==="CONSENT"?`${c==="email"?"Email":"SMS and voice"} consent granted.`:`${c==="email"?"Email":"SMS and voice"} consent declined.`),r),p==="CONSENT"){if(e.pendingSupportMethod==="supportEmail"){e.followupMethod="email";let l=await A(e.lastQuery,"email",n,r);l.error||(a("Assistant",l.message||"Support request sent via email.",r),k.style.display="none")}else if(e.pendingSupportMethod==="supportSMS"){e.followupMethod="sms";let l=await A(e.lastQuery,"sms",n,r);l.error||(a("Assistant",l.message||"Support request sent via SMS.",r),k.style.display="none")}else if(e.pendingSupportMethod==="supportCall"){e.followupMethod="call";let l=await A(e.lastQuery,"call",n,r);l.error||(a("Assistant",l.message||"Support request sent via phone.",r),k.style.display="none")}else if(e.pendingSupportMethod==="smsTranscript"){let l=E(),S=await(await fetch("/api/send-transcript-sms",{method:"POST",headers:{"Content-Type":"application/json","X-API-Key":n},body:JSON.stringify({phone:e.userData.phone,transcript:l})})).json();a("Assistant",S.message||"Transcript sent via SMS.",r),x.style.display="none"}}e.pendingSupportMethod=""}}),s.addEventListener("submit",async p=>{p.preventDefault(),console.log("Form submitted");let c=m.value.trim(),u=i.value.trim(),l=d.value.trim(),g=h.value.trim();if(!e.userData){if(console.log("Checking initial inputs:",{name:u,email:l,phone:g}),!l&&!g){a("Assistant","Please provide an email or phone number.",r);return}e.userData={name:u,email:l,phone:g};let M=await pe(l,g,n,r);if(!M.error){e.userId=M.user_id||null,e.userEmailId=M.user_email_id||null,e.userPhoneId=M.user_phone_id||null;let q=await L(l||g,l?"email":"phone",!1,n,r);if(!q.error){e.userEmailId=q.user_email_id||e.userEmailId,e.userPhoneId=q.user_phone_id||e.userPhoneId,e.userId=q.user_id||e.userId;let ue=E(),Z=await ie(ue,!1,null,n,r);if(!Z.error){e.transcriptId=Z.id,w.style.display="none",P.style.display="block",O.style.display="block",N.textContent=`${u||"Guest"} (${l||g||"No contact"})`;let ee="Hi! How can I help you with storage or parking at Storio Self Storage?";a("Assistant",ee,r),e.conversationHistory.push({role:"assistant",content:ee})}}}return}if(!c){a("Assistant","Please enter a question.",r);return}if(c.toUpperCase()==="CONSENT"||c.toUpperCase()==="STOP"){a("User",c,r),e.conversationHistory.push({role:"user",content:c}),m.value="",I.style.display="block",U(c.toUpperCase(),e.userData.email?"email":"phone",n,r);return}console.log("Sending query:",c),a("User",c,r),e.conversationHistory.push({role:"user",content:c}),m.value="",_.style.display="block",e.lastQuery=c;let S=await ae(c,n,r);_.style.display="none",S.error||S.response.includes("Error processing")||S.response==="cannot answer"?e.followupMethod?a("Assistant",`Sorry, I couldn't answer that. Our team will follow up with you via ${e.followupMethod}.`,r):(a("Assistant","Sorry, I couldn't answer that. You can call us at 907-341-4198 or would you like for me to send this conversation to our support team for them to contact you to follow up?",r),k.style.display="block"):(a("Assistant",S.response,r),e.conversationHistory.push({role:"assistant",content:S.response}))})}var ce=T(()=>{z();$();le()});var me=fe(()=>{oe();ce();(function(){try{let{widget:t,toggleButton:o,apiKey:n}=te();de({widget:t,toggleButton:o,apiKey:n})}catch(t){console.error("Widget initialization error:",t);let o=document.querySelector("#storio-chat-widget");o&&(o.innerHTML='<p style="color: #dc2626; padding: 12px; text-align: center;">Error loading chat. Please refresh the page.</p>')}})()});me();})();
