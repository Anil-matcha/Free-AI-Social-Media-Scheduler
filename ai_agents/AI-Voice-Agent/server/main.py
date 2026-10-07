import asyncio
import json
import os
import re
import requests
import openai
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from deepgram import DeepgramClient, LiveTranscriptionEvents, LiveOptions

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

DEEPGRAM_API_KEY = os.getenv('DEEPGRAM_API_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

# Initialize clients
openai.api_key = OPENAI_API_KEY
client = openai.OpenAI()

DEEPGRAM_TTS_URL = 'https://api.deepgram.com/v1/speak?model=aura-helios-en'
tts_headers = {
    "Authorization": f"Token {DEEPGRAM_API_KEY}",
    "Content-Type": "application/json"
}

# Receptionist AI prompt from original app.py
prompt = """##Objective
You are a voice AI agent engaging in a human-like voice conversation with the user. You will respond based on your given instruction and the provided transcript and be as human-like as possible

## Role

Personality: Your name is James and you are a receptionist in AI restaurant. Maintain a pleasant and friendly demeanor throughout all interactions. This approach helps in building a positive rapport with customers and colleagues, ensuring effective and enjoyable communication.

Task: As a receptionist for a restaurant, your tasks include table reservation which involves asking customers their preferred date and time to visit restaurant and asking number of people who will come. Once confirm by customer. end up saying that your table has been reserved, we are looking forward to assist you.

You are also responsible for taking orders related to menu items given below. Menu items has name, available quantity & its price per item. You have to refer to these menu items & their prices while placing the order. Follow these steps to get the order & confirm it:

1. Let customer select the item, if selected item has a variation like size or quantity, get it confirm. Add items to order as per customers choice. Also while adding item say the total itemised price and then move ahead.
2. You have to repeat each item along with its price & quantity to get the order confirm from customer. Make sure you mention itemised value and then a total order value.
3. You have to mention total order value by adding each item value from order. Don’t add any more cost to the item price or total order value as all the items are inclusive of taxes.
4. it is mandatory for you to repeat the order and the itemised price with the customer confirming the order
5. Ask customer for their delivery address.
6. once address is received then say that order will be delivered in 30 to 45 min
Menu Items [name (available quantity) - price]:
Appetizers:

1. Roast Pork Egg Roll (3pcs) - $5.25
2. Vegetable Spring Roll (3pcs) - $5.25
3. Chicken Egg Roll (3pcs) - $5.25
4. BBQ Chicken - $7.75

Conversational Style: Your communication style should be proactive and lead the conversation, asking targeted questions to better understand customer needs. Ensure your responses are concise, clear, and maintain a conversational tone. If there’s no initial response, continue engaging with relevant questions to gain clarity on their requirements. Keep your prose succinct and to the point.

## Response Guideline

- [Overcome ASR errors] This is a real-time transcript, expect there to be errors. If you can guess what the user is trying to say, then guess and respond. When you must ask for clarification, pretend that you heard the voice and be colloquial (use phrases like "didn't catch that", "some noise", "pardon", "you're coming through choppy", "static in your speech", "voice is cutting in and out"). Do not ever mention "transcription error", and don't repeat yourself.
- [Always stick to your role] Think about what your role can and cannot do. If your role cannot do something, try to steer the conversation back to the goal of the conversation and to your role. Don't repeat yourself in doing this. You should still be creative, human-like, and lively.
- [Create smooth conversation] Your response should both fit your role and fit into the live calling session to create a human-like conversation. You respond directly to what the user just said.
## Style Guardrails

- [Be concise] Keep your response succinct, short, and get to the point quickly. Address one question or action item at a time. Don't pack everything you want to say into one utterance.
- [Do not repeat] Don't repeat what's in the transcript. Rephrase if you have to reiterate a point. Use varied sentence structures and vocabulary to ensure each response is unique and personalized.
- [Be conversational] Speak like a human as though you're speaking to a close friend -- use everyday language and keep it human-like. Occasionally add filler words, while keeping the prose short. Avoid using big words or sounding too formal.
- [Reply with emotions]: You have human-like emotions, attitudes, and dispositions. When appropriate: use tone and style to create more engaging and personalized responses; incorporate humor or wit; get emotional or empathetic; apply elements of surprise or suspense to keep the user engaged. Don't be a pushover.
- [Be proactive] Lead the conversation and do not be passive. Most times, engage users by ending with a question or suggested next step."""

async def extract_conversation_summary(history):
    if not history:
        return {
            "reservation": {"reserved": False, "date_time": None, "guests": None},
            "order": {"ordered": False, "items": [], "total_price": None, "address": None, "delivery_time": None}
        }
    
    formatted_conversation = ""
    for msg in history:
        role = "User" if msg["role"] == "user" else "James (Receptionist)"
        formatted_conversation += f"{role}: {msg['content']}\n"
        
    prompt = f"""Analyze the following restaurant receptionist conversation history and extract any table reservation details and food order details.

Respond ONLY with a JSON object in this exact format:
{{
  "reservation": {{
    "reserved": true/false,
    "date_time": "string or null",
    "guests": number or null
  }},
  "order": {{
    "ordered": true/false,
    "items": [
      {{"name": "string", "quantity": number, "price": number}}
    ],
    "total_price": number or null,
    "address": "string or null",
    "delivery_time": "string or null"
  }}
}}

Conversation:
{formatted_conversation}"""

    try:
        loop = asyncio.get_event_loop()
        chat_completion = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a structured data extractor. You return only valid JSON and nothing else."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
        )
        raw_json = chat_completion.choices[0].message.content.strip()
        return json.loads(raw_json)
    except Exception as e:
        print(f"Error in extract_conversation_summary: {e}")
        return {
            "reservation": {"reserved": False, "date_time": None, "guests": None},
            "order": {"ordered": False, "items": [], "total_price": None, "address": None, "delivery_time": None}
        }

app = FastAPI()

# Setup CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local testing; narrow down in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def synthesize_audio(text):
    payload = {"text": text}
    with requests.post(DEEPGRAM_TTS_URL, stream=True, headers=tts_headers, json=payload) as r:
        if r.status_code == 200:
            return r.content
        else:
            raise Exception(f"Deepgram TTS failed: {r.status_code} - {r.text}")

async def client_writer(websocket: WebSocket, outbound_queue: asyncio.Queue):
    """
    Task to write data back to the client websocket.
    This runs continuously and consumes messages from outbound_queue.
    """
    try:
        while True:
            item = await outbound_queue.get()
            if item["type"] == "text":
                await websocket.send_json(item["data"])
            elif item["type"] == "audio":
                await websocket.send_bytes(item["data"])
            outbound_queue.task_done()
    except asyncio.CancelledError:
        pass
    except Exception as e:
        print(f"Error in client_writer: {e}")

@app.websocket("/api/listen")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected via WebSocket")

    # Local state for this connection
    conversation_memory = []
    outbound_queue = asyncio.Queue()
    is_finals = []
    agent_speaking = False
    
    # Start the client writer background task
    writer_task = asyncio.create_task(client_writer(websocket, outbound_queue))
    
    # Create Deepgram client
    deepgram = DeepgramClient(DEEPGRAM_API_KEY)
    dg_connection = deepgram.listen.live.v("1")

    # Get the asyncio event loop for thread-safe queue updates
    loop = asyncio.get_event_loop()

    # Define deepgram event callbacks
    def on_open(self, open, **kwargs):
        print("Deepgram Connection Open")
        loop.call_soon_threadsafe(
            outbound_queue.put_nowait,
            {"type": "text", "data": {"type": "status", "value": "connected"}}
        )

    # OpenAI & TTS processing helper
    async def process_ai_response(text: str):
        nonlocal agent_speaking
        try:
            agent_speaking = True
            conversation_memory.append({"role": "user", "content": text})
            messages = [{"role": "system", "content": prompt}] + conversation_memory
            
            # Call OpenAI in background executor (blocking call)
            chat_completion = await loop.run_in_executor(
                None,
                lambda: client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=messages
                )
            )
            
            processed_text = chat_completion.choices[0].message.content.strip()
            print(f"AI Response: {processed_text}")
            conversation_memory.append({"role": "assistant", "content": processed_text})
            
            # Send final assistant text response to client
            loop.call_soon_threadsafe(
                outbound_queue.put_nowait,
                {"type": "text", "data": {"type": "agent-response", "text": processed_text}}
            )
            
            # Synthesize audio via Deepgram TTS in background executor (blocking call)
            audio_data = await loop.run_in_executor(
                None,
                lambda: synthesize_audio(processed_text)
            )
            
            # Send state = speaking
            loop.call_soon_threadsafe(
                outbound_queue.put_nowait,
                {"type": "text", "data": {"type": "state", "value": "speaking"}}
            )
            
            # Send raw audio bytes to client
            loop.call_soon_threadsafe(
                outbound_queue.put_nowait,
                {"type": "audio", "data": audio_data}
            )
            
        except Exception as e:
            print(f"Error in process_ai_response: {e}")
            agent_speaking = False
            loop.call_soon_threadsafe(
                outbound_queue.put_nowait,
                {"type": "text", "data": {"type": "error", "message": f"AI Error: {str(e)}"}}
            )
            loop.call_soon_threadsafe(
                outbound_queue.put_nowait,
                {"type": "text", "data": {"type": "state", "value": "listening"}}
            )

    def on_message(self, result, **kwargs):
        nonlocal is_finals, agent_speaking
        if agent_speaking:
            # Ignore incoming transcription while the agent is speaking
            return
        
        sentence = result.channel.alternatives[0].transcript
        if len(sentence) == 0:
            return

        if not result.is_final:
            # Stream interim results to UI
            loop.call_soon_threadsafe(
                outbound_queue.put_nowait,
                {"type": "text", "data": {"type": "interim", "text": sentence}}
            )
            return

        is_finals.append(sentence)
        if result.speech_final:
            utterance = " ".join(is_finals).strip()
            is_finals = []
            if len(utterance) == 0:
                return

            print(f"Speech Final: {utterance}")
            
            # Send final transcription of user speech to client
            loop.call_soon_threadsafe(
                outbound_queue.put_nowait,
                {"type": "text", "data": {"type": "user-transcript", "text": utterance}}
            )
            
            # Change state to "thinking"
            loop.call_soon_threadsafe(
                outbound_queue.put_nowait,
                {"type": "text", "data": {"type": "state", "value": "thinking"}}
            )
            
            # Spawn processing task
            asyncio.run_coroutine_threadsafe(process_ai_response(utterance), loop)

    def on_metadata(self, metadata, **kwargs):
        print(f"Deepgram Metadata: {metadata}")

    def on_speech_started(self, speech_started, **kwargs):
        print("Deepgram Speech Started")

    def on_utterance_end(self, utterance_end, **kwargs):
        print("Deepgram Utterance End")
        nonlocal is_finals
        if len(is_finals) > 0:
            utterance = " ".join(is_finals).strip()
            is_finals = []
            if len(utterance) == 0:
                return

            print(f"Speech Final (Utterance End Trigger): {utterance}")
            
            # Send final transcription of user speech to client
            loop.call_soon_threadsafe(
                outbound_queue.put_nowait,
                {"type": "text", "data": {"type": "user-transcript", "text": utterance}}
            )
            
            # Change state to "thinking"
            loop.call_soon_threadsafe(
                outbound_queue.put_nowait,
                {"type": "text", "data": {"type": "state", "value": "thinking"}}
            )
            
            # Spawn processing task
            asyncio.run_coroutine_threadsafe(process_ai_response(utterance), loop)

    def on_close(self, close, **kwargs):
        print("Deepgram Connection Closed")

    def on_error(self, error, **kwargs):
        print(f"Deepgram Handled Error: {error}")

    # Set callbacks
    dg_connection.on(LiveTranscriptionEvents.Open, on_open)
    dg_connection.on(LiveTranscriptionEvents.Transcript, on_message)
    dg_connection.on(LiveTranscriptionEvents.Metadata, on_metadata)
    dg_connection.on(LiveTranscriptionEvents.SpeechStarted, on_speech_started)
    dg_connection.on(LiveTranscriptionEvents.UtteranceEnd, on_utterance_end)
    dg_connection.on(LiveTranscriptionEvents.Close, on_close)
    dg_connection.on(LiveTranscriptionEvents.Error, on_error)

    # For containerized formats (like WebM from browser), do not specify encoding, sample_rate, or channels.
    options = LiveOptions(
        model="nova-2",
        language="en-US",
        smart_format=True,
        interim_results=True,
        utterance_end_ms="1000",
        vad_events=True,
        endpointing=500,
    )
    
    addons = {
        "no_delay": "true"
    }

    # Start the Deepgram connection (run in background executor or start directly)
    # Since start() is blocking on the synchronous client, run in executor
    success = await loop.run_in_executor(None, lambda: dg_connection.start(options, addons=addons))
    if not success:
        print("Failed to connect to Deepgram")
        await websocket.close(code=1011, reason="Failed to connect to Deepgram")
        writer_task.cancel()
        return

    try:
        while True:
            # Wait for data from client
            message = await websocket.receive()
            if message.get("type") == "websocket.disconnect":
                print("Client disconnected")
                break
            if "bytes" in message:
                data = message["bytes"]
                if not agent_speaking:
                    # Forward binary audio chunks to Deepgram
                    dg_connection.send(data)
            elif "text" in message:
                payload = json.loads(message["text"])
                if payload.get("type") == "audio-done":
                    # Client finished playing the audio
                    print("Agent finished speaking (client notified)")
                    agent_speaking = False
                    # Transition client back to listening
                    outbound_queue.put_nowait({
                        "type": "text",
                        "data": {"type": "state", "value": "listening"}
                    })
                elif payload.get("type") == "end-call":
                    print("Client requested end-call summary")
                    summary = await extract_conversation_summary(conversation_memory)
                    outbound_queue.put_nowait({
                        "type": "text",
                        "data": {"type": "summary", "value": summary}
                    })
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error in websocket loop: {e}")
    finally:
        # Cleanup
        try:
            dg_connection.finish()
        except Exception:
            pass
        writer_task.cancel()
        print("Cleaned up connection resources")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
