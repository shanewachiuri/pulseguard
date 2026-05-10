import express, { type Request, type Response } from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3001;
const PULSE_ENGINE_URL = 'http://127.0.0.1:8000/engine/pulse';

app.post('/ussd', async (req: Request, res: Response) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;

  if (text === '') {
    const response = `CON Karibu PulseGuard. Welcome!\n\nTell me about your business or farm to get a risk assessment (e.g., 'I grow maize in Nyeri'):`;
    res.setHeader('Content-Type', 'text/plain');
    return res.send(response);
  }

  try {
    const payload = {
      // FIXED: Changed 'user_id' to 'phone' to perfectly match FastAPI's Pydantic model!
      phone: String(phoneNumber), 
      input_data: String(text)
    };
    
    // Log exactly what Express is attempting to send to Python
    console.log("--> Sending payload to FastAPI:", payload);

    const aiResponse = await axios.post(PULSE_ENGINE_URL, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    const assessment = aiResponse.data.assessment;
    
    const response = `END PulseGuard AI Assessment:\n\n${assessment}`;
    res.setHeader('Content-Type', 'text/plain');
    res.send(response);
    
  } catch (error: any) {
    // Use JSON.stringify so Node.js prints the full error, revealing any hidden arrays/objects
    console.error("FastAPI Validation Error:", JSON.stringify(error.response?.data || error.message, null, 2));
    res.setHeader('Content-Type', 'text/plain');
    res.send(`END Sorry, our AI is currently resting. Please try again later.`);
  }
});

app.listen(PORT, () => {
  console.log(`USSD Gateway running on port ${PORT}`);
});