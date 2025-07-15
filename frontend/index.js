const inputMessage = document.querySelector(".message-input");
const chatbotBody = document.querySelector(".chatbot-body");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = document.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");

const API_URL = "http://localhost:8080/api/gemini";   // talk to the proxy, no API_KEY needed
const userData = {
  message: null,
  file: {
    data: null,
    mime_type: null,
  },
};

let chatHistory=[];
const initialMessageHeight=inputMessage.scrollHeight;

const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

const generateBotResponse = async (incomingMessageDiv) => {
  const messageElement = incomingMessageDiv.querySelector(".message-text");
  
  //Add user message to chat history
  chatHistory.push( 
          {
          role:"user",
          parts: [{ text: userData.message },...(userData.file.data ? [{inline_data:userData.file},]:[])],
          }
       )

  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: chatHistory
    }),
  };
  try {
    //fetch bot response from api
    const response = await fetch(API_URL, requestOptions);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);
    //extract and display bot response
    const apiResponseText = data.candidates[0].content.parts[0].text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .trim();
    messageElement.innerText = apiResponseText;
    //Add bot's response to chat history
     chatHistory.push( 
          {
          role:"model",
          parts: [{ text: apiResponseText}],
          }
       )
  } catch (error) {
    //handle error in API response
    console.log(error);
    messageElement.innerHTML = error.message;
    messageElement.style.color = "#ff0000";
  } finally {
    //Reset user's file data,remove thinking indicator and scroll chat to bottom
    incomingMessageDiv.classList.remove("thinking-indicator");
    chatbotBody.scrollTo({ top: chatbotBody.scrollHeight, behavior: "smooth" });
    userData.file = { data: null, mime_type: null };
  }
};

const handleOutgoingMessage = (e) => {
  e.preventDefault();
  userData.message = inputMessage.value.trim();
  inputMessage.value = "";
  fileUploadWrapper.classList.remove("file-uploaded")
  inputMessage.dispatchEvent(new Event("input"))
  //create and display user message
   const messageContent = `
        <div class="message-text">
          ${userData.message ? `<p>${userData.message}</p>` : ""}
          ${userData.file.data ? `<img class="attachment" src="data:${userData.file.mime_type};base64,${userData.file.data}" />` : ""}
        </div>`;
      const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
      chatbotBody.appendChild(outgoingMessageDiv);
      chatbotBody.scrollTo({ top: chatbotBody.scrollHeight, behavior: "smooth" });

  setTimeout(() => {
    const messageContent = ` <svg class="bot-avatar"
            xmlns="http://www.w3.org/2000/svg"
            width="50"
            height="50"
            viewBox="0 0 1024 1024"
          >
            <path
              d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"
            ></path>
          </svg>
            <div class="message-text">
                <div class="thinking-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        </div>  `;
    const incomingMessageDiv = createMessageElement(
      messageContent,
      "bot-message",
      "thinking-indicator"
    );
    chatbotBody.appendChild(incomingMessageDiv);
    chatbotBody.scrollTo({ top: chatbotBody.scrollHeight, behavior: "smooth" });
    generateBotResponse(incomingMessageDiv);
  }, 600);
};

inputMessage.addEventListener("keydown", (e) => {
  const userMessage = e.target.value.trim();
  if (e.key == "Enter" && userMessage && !e.shiftKey && window.innerWidth>768) {
    handleOutgoingMessage(e);
  }
});

//adjust input field height dynamically
inputMessage.addEventListener("input",()=>{
  inputMessage.style.height=`${initialMessageHeight}px`
   inputMessage.style.height=`${inputMessage.scrollHeight}px`
   document.querySelector(".chat-form").style.borderRadius=inputMessage.scrollHeight>initialMessageHeight?"15px":"32px"
})

sendMessageButton.addEventListener("click", (e) => handleOutgoingMessage(e));

document
  .querySelector("#file-upload")
  .addEventListener("click", () => fileInput.click());

//handles file input change and preview the selected file
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  console.log("Reader", reader);
  reader.onload = (e) => {
    fileUploadWrapper.querySelector("img").src=e.target.result
    fileUploadWrapper.classList.add("file-uploaded")
    const base64String = e.target.result.split(",")[1];
    //stire file data in userData
    userData.file = {
      mime_type: file.type,
      data: base64String,
    };
    console.log("base64String:", base64String);
    console.log("e.target.result",e.target.result);
    console.log("userData:", userData);
    fileInput.value = "";
  };
  reader.readAsDataURL(file);
});

//Initialize emoji picker and handle emoji selection
   const picker = new EmojiMart.Picker({
    theme:"dark",
    previewPosition:"none",

    onEmojiSelect:(emoji)=>{
      const { selectionStart:start, selectionEnd:end}=inputMessage;
      inputMessage.setRangeText(emoji.native,start,end,"end")
      inputMessage.focus()
    },
    onClickOutside:(e)=>{
     if(e.target.id === "emoji-picker"){
      document.body.classList.toggle("show-emoji-picker")
     }else{
       document.body.classList.remove("show-emoji-picker")
     }
    }
   })
   document.querySelector(".chat-form").appendChild(picker)

//cancel file upload
fileCancelButton.addEventListener("click",()=>{
  userData.file={data:null,mime_type:null}
    fileUploadWrapper.querySelector("img").src = "";
  fileUploadWrapper.classList.remove("file-uploaded")
})
chatbotToggler.addEventListener("click",()=>document.body.classList.toggle("show-chatbot"));

closeChatbot.addEventListener("click",()=>document.body.classList.remove("show-chatbot"))
