const { GoogleGenerativeAI } = require('@google/generative-ai')
require('dotenv').config()

const geminiApiKey = process.env.GEMINI_API_KEY
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null

const modelCandidates = Array.from(
  new Set(
    [
      process.env.GENAI_MODEL,
      process.env.GEMINI_MODEL,
      'gemini-3-flash-preview',
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-2.5-pro',
      'gemini-pro-latest',
    ].filter(Boolean)
  )
)

const visionModelCandidates = Array.from(
  new Set(
    [
      process.env.GENAI_MODEL,
      process.env.GEMINI_MODEL,
      'gemini-2.5-flash-image',
      'gemini-3.1-flash-image-preview',
      'gemini-3-pro-image-preview',
      'gemini-3-flash-preview',
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
    ].filter(Boolean)
  )
)

async function generateWithFallback(payload, options = {}, modelOverride = null) {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured')
  }
  let lastError
  const candidates = modelOverride || modelCandidates
  for (const modelName of candidates) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(payload, options)
      return result.response.text()
    } catch (err) {
      lastError = err
      const msg = String(err?.message || '')
      const lmsg = msg.toLowerCase()
      // Useful for diagnosing repeated fallbacks (do not log any secrets).
      console.error('[Gemini] generateContent failed', { model: modelName, message: msg })
      if (
        msg.includes('not found') ||
        msg.includes('not supported') ||
        msg.includes('404') ||
        msg.includes('Too Many Requests') ||
        msg.includes('quota') ||
        msg.includes('Quota exceeded') ||
        msg.includes('429') ||
        msg.includes('503') ||
        msg.includes('500') ||
        msg.includes('Service Unavailable') ||
        msg.includes('400') ||
        lmsg.includes('expired') ||
        lmsg.includes('api_key_invalid') ||
        lmsg.includes('bad request') ||
        // Vision/image capability mismatches should not poison the output.
        (lmsg.includes('image') && (lmsg.includes('not') || lmsg.includes('unsupported'))) ||
        (lmsg.includes('vision') && (lmsg.includes('not') || lmsg.includes('unsupported'))) ||
        (lmsg.includes('multimodal') && (lmsg.includes('not') || lmsg.includes('unsupported'))) ||
        (lmsg.includes('inlineData') && (lmsg.includes('not') || lmsg.includes('unsupported'))) ||
        lmsg.includes('unsupported')
      ) {
        continue
      }
      throw err
    }
  }
  throw lastError || new Error('No supported model available')
}

// ---- The fixed AI calls with token-saving constraints ! ----
async function diagnoseSymptoms(symptoms, vehicleDetails = {}) {
  const prompt = `
You are an automotive diagnostic assistant.
CRITICAL RULE: Be extremely concise and strictly factual. Do not explain your reasoning or over-elaborate. Limit your output to save tokens and ensure maximum accuracy.

Vehicle details:
- Make: ${vehicleDetails.make || 'Unknown'}
- Model: ${vehicleDetails.model || 'Unknown'}
- Year: ${vehicleDetails.year || 'Unknown'}
- Mileage: ${vehicleDetails.mileage || 'Unknown'}

Symptoms:
${symptoms}

Return plain JSON with:
predicted_problem, urgency, confidence_score,
probable_causes (array of objects with: cause, probability_percent, check_first, if_still_present_next, if_fixed_then_verify),
recommended_action
`
  try {
    return await generateWithFallback(prompt)
  } catch (e) {
    return JSON.stringify(fallbackFaultDiagnosis(symptoms, vehicleDetails))
  }
}

async function estimateRepairTime(symptoms, vehicleDetails = {}) {
  const prompt = `
You are an automotive workshop planning assistant.
CRITICAL RULE: Be extremely concise and strictly factual. Do not explain your reasoning or over-elaborate. Limit your output to save tokens and ensure maximum accuracy.

Vehicle details:
- Make: ${vehicleDetails.make || 'Unknown'}
- Model: ${vehicleDetails.model || 'Unknown'}
- Year: ${vehicleDetails.year || 'Unknown'}
- Mileage: ${vehicleDetails.mileage || 'Unknown'}

Symptoms / requested service:
${symptoms}

Return plain JSON with:
estimated_hours_min, estimated_hours_max,
estimated_days_min, estimated_days_max,
estimated_parts_cost_min, estimated_parts_cost_max,
estimated_labor_cost_min, estimated_labor_cost_max,
assumptions,
scheduling_notes
`
  try {
    return await generateWithFallback(prompt)
  } catch (e) {
    return JSON.stringify(fallbackTimeEstimate(symptoms, vehicleDetails))
  }
}

async function bookingHelper(message, vehicles = [], now = new Date().toISOString()) {
  const prompt = `
You are a service booking assistant for an automotive workshop platform.
You must ONLY help the customer choose the best booking route and what information to provide.
Do not diagnose faults. Do not suggest repairs. Do not mention any AI providers.

Customer message:
${message}

Available vehicles (summary):
${JSON.stringify(vehicles || [])}

Current time:
${now}

Return plain JSON with:
reply,
suggested_route ("/user/service"),
questions_to_ask (array),
recommended_booking_window (string),
draft_title (string),
draft_symptoms (string),
draft_appointment_date_iso (string or empty)
`

  try {
    return await generateWithFallback(prompt)
  } catch (e) {
    return JSON.stringify(fallbackBookingHelper(message))
  }
}

async function partsCompatibility(part_name, vehicle = {}, availableParts = []) {
  const prompt = `
You are a workshop parts fitment assistant.
You must confirm fitment likelihood and suggest alternatives based on inventory.
Do not mention any AI providers.

Vehicle:
${JSON.stringify(vehicle || {})}

Requested part:
${part_name}

Inventory parts:
${JSON.stringify(availableParts || [])}

Return plain JSON with:
fitment (one of: "confirmed", "likely", "uncertain", "not_compatible"),
confidence_score,
reasons (array),
in_stock_matches (array of {name, sku, quantity}),
alternatives (array of {name, sku, quantity, reason}),
reorder_suggestions (array of {name, sku, suggested_qty, reason})
`

  try {
    return await generateWithFallback(prompt)
  } catch (e) {
    return JSON.stringify(fallbackPartsCompatibility(part_name, availableParts))
  }
}

async function smartJobSchedule(jobs = [], now = new Date().toISOString()) {
  const prompt = `
You are a workshop scheduling assistant.
You must recommend the best job order based on bookings, priorities, and durations.
Do not mention any AI providers.

Current time:
${now}

Jobs:
${JSON.stringify(jobs || [])}

Return plain JSON with:
recommended_order (array of {job_id, reason, suggested_start_iso, suggested_end_iso}),
predicted_completion_iso
`

  try {
    return await generateWithFallback(prompt)
  } catch (e) {
    return JSON.stringify(fallbackSmartSchedule(jobs, now))
  }
}

async function customerUpdate(job = {}, new_status) {
  const prompt = `
You write short, professional customer updates for a workshop platform.
Do not mention any AI providers.

Job data:
${JSON.stringify(job || {})}

New status:
${new_status}

Return plain JSON with:
message,
eta_text,
next_steps (array)
`

  try {
    return await generateWithFallback(prompt)
  } catch (e) {
    return JSON.stringify(fallbackCustomerUpdate(job, new_status))
  }
}

async function repairCostEstimate(symptoms, vehicleDetails = {}, availableParts = []) {
  const prompt = `
You are a workshop cost estimation assistant specializing in the South African automotive repair market.
You must provide a realistic pre-inspection repair cost range using REAL South African market prices.

CRITICAL RULES:
- ALL prices MUST be in South African Rand (ZAR) — prefix with "R".
- Use REAL South African workshop labor rates: R450–R850 per hour depending on the workshop type (independent vs dealership).
- Use REAL South African parts prices from suppliers like Midas, AutoZone, Goldwagen, or OEM dealer pricing.
- Be extremely concise and strictly factual. Do not explain your reasoning or over-elaborate.
- Do not mention any AI providers.

South African pricing references (use as baseline, adjust for vehicle specifics):
- Brake pads (set): R400–R2,500 (aftermarket) / R1,500–R6,000 (OEM)
- Brake discs (pair): R800–R4,000 (aftermarket) / R2,500–R10,000 (OEM)
- Battery: R1,200–R4,500
- Alternator: R2,500–R8,000
- Starter motor: R2,000–R6,500
- Clutch kit: R3,500–R12,000
- Radiator: R2,000–R8,000
- Water pump: R1,200–R5,000
- Timing belt kit: R2,500–R8,000
- Shock absorbers (pair): R1,500–R6,000
- Control arms (pair): R2,000–R8,000
- Oil service (filter + oil): R800–R2,500
- Spark plugs (set of 4): R300–R1,800
- Fuel pump: R2,500–R7,000
- Catalytic converter: R5,000–R25,000
- Turbocharger: R8,000–R35,000
- Head gasket repair: R8,000–R25,000
- Gearbox rebuild: R12,000–R45,000

Vehicle details:
- Make: ${vehicleDetails.make || 'Unknown'}
- Model: ${vehicleDetails.model || 'Unknown'}
- Year: ${vehicleDetails.year || 'Unknown'}
- Mileage: ${vehicleDetails.mileage || 'Unknown'}

Symptoms / requested work:
${symptoms}

Inventory parts snapshot (workshop stock — use these prices if the part is relevant):
${JSON.stringify(availableParts || [])}

Return plain JSON with:
likely_service,
service_category (string - one of "Minor Service", "Major Service", "Repair", "Diagnosis"),
urgency,
estimated_labor_hours_min,
estimated_labor_hours_max,
estimated_parts_cost_min (number in ZAR),
estimated_parts_cost_max (number in ZAR),
estimated_total_cost_min (number in ZAR),
estimated_total_cost_max (number in ZAR),
cost_drivers (array of strings),
assumptions (array of strings),
recommended_next_step
`

  try {
    return await generateWithFallback(prompt)
  } catch (e) {
    return JSON.stringify(fallbackRepairCostEstimate(symptoms, vehicleDetails, availableParts))
  }
}

async function summarizeJobCard(jobCard = {}) {
  const prompt = `
You are a workshop service advisor assistant.
You must convert raw booking details into a concise technician-ready job card summary.
Do not mention any AI providers.

Job card input:
${JSON.stringify(jobCard || {})}

Return plain JSON with:
brief_summary,
priority,
likely_issue_area,
inspection_checklist (array),
parts_to_prepare (array),
customer_concerns (array),
customer_facing_summary
`

  try {
    return await generateWithFallback(prompt)
  } catch (e) {
    return JSON.stringify(fallbackJobCardSummary(jobCard))
  }
}

async function summarizeConversation(messages = [], context = {}) {
  const prompt = `
You are a workshop communication assistant.
You must summarize the conversation and highlight actionable items.
Do not mention any AI providers.

Conversation context:
${JSON.stringify(context || {})}

Messages:
${JSON.stringify(messages || [])}

Return plain JSON with:
summary,
customer_sentiment,
urgency,
action_items (array),
promised_followups (array),
suggested_reply
`

  try {
    return await generateWithFallback(prompt)
  } catch (e) {
    return JSON.stringify(fallbackConversationSummary(messages, context))
  }
}

async function carChat(messages = [], vehicleDetails = {}) {
  const safeMessages = Array.isArray(messages) ? messages.slice(0, 20) : []
  const normalized = safeMessages
    .map((m) => ({
      role: m?.role === 'assistant' ? 'assistant' : 'user',
      content: String(m?.content || '').slice(0, 2000),
    }))
    .filter((m) => m.content.trim())

  const prompt = `
You are a professional workshop assistant for vehicle owners and technicians.
You must ONLY answer questions related to cars and automotive maintenance/repairs/diagnostics.
If the user asks anything unrelated to cars, respond with plain JSON:
{"reply":"I can help with car-related questions only. Please describe the vehicle issue, symptoms, or upload a relevant photo.","category":"out_of_scope"}

Rules:
- Do not mention AI, models, providers, APIs, or “as an AI”.
- Be concise and practical.
- If uncertain, ask up to 2 clarifying questions.
- Prefer safety: if a condition sounds dangerous, advise to stop driving and seek inspection.

Vehicle context:
- Make: ${vehicleDetails.make || 'Unknown'}
- Model: ${vehicleDetails.model || 'Unknown'}
- Year: ${vehicleDetails.year || 'Unknown'}
- Mileage: ${vehicleDetails.mileage || 'Unknown'}

Conversation (most recent last):
${normalized
  .map((m) => `${m.role === 'assistant' ? 'Workshop' : 'Customer'}: ${m.content}`)
  .join('\n')}

Return plain JSON with:
reply (string),
category (one of: "diagnosis_help" | "maintenance" | "booking" | "out_of_scope"),
follow_up_questions (array of strings)
`

  try {
    return await generateWithFallback(prompt)
  } catch (e) {
    const lastUser = normalized.slice().reverse().find((m) => m.role === 'user')?.content || ''
    return JSON.stringify({
      reply:
        'I can help with car-related questions. Please share the vehicle make/model/year and describe the symptoms (when it happens, any warning lights, and any recent work).',
      category: lastUser ? 'diagnosis_help' : 'booking',
      follow_up_questions: [
        'What is the vehicle make, model, and year?',
        'When does the issue occur (cold start, idle, acceleration, braking, turning)?',
      ],
    })
  }
}

async function analyzeImage(imageBuffer, mimeType, modelType) {
  let prompt = ''
  if (modelType === 'color') {
    prompt =
      `You are a professional automotive paint colour matcher.
IMPORTANT VALIDATION: First, determine if this image is suitable for single colour identification.
If the image contains multiple distinct colors (like a cow, a rainbow, a complex pattern, etc.), or is not primarily focused on one single color, or does NOT contain a surface whose single dominant colour can be meaningfully identified, you MUST return ONLY this JSON:
{"error": true, "message": "model only trained to focus on one colour", "confidence_score": 0}

If the image IS suitable for single colour analysis, analyze the dominant colour in the photo (prioritize car body paint if visible, otherwise identify the main colour of whatever object is shown).
Return ONLY a valid JSON object (no markdown, no extra text) with:
{
  "color_name": string,
  "confidence_score": number between 0 and 1,
  "mix_suggestion": array of objects with:
    { "component": string, "ratio_percent": number between 0 and 100 },
  "notes": string
}
If the lighting makes it uncertain, choose the closest likely color and explain why in "notes".`
  } else if (modelType === 'damage') {
    prompt =
      `You are a professional automotive parts analyst.
IMPORTANT VALIDATION: First, determine if this image shows a car/vehicle part (e.g. bumper, fender, door panel, headlight, engine component, exhaust, suspension arm, brake rotor, windshield, mirror, etc.).
If the image does NOT contain a recognizable car or vehicle part (e.g. it shows food, animals, people, electronics, furniture, random objects, documents, or anything non-automotive), you MUST return ONLY this JSON:
{"error": true, "message": "This model focuses on car parts only. Please upload a photo of a vehicle part (bumper, fender, headlight, engine component, etc.) for damage assessment.", "confidence_score": 0}

If the image DOES show a car part, analyze it and recommend repair vs replace.
Return plain JSON with: part, decision (repair/replace), reason, confidence_score.`
  } else if (modelType === 'tire') {
    prompt =
      `You are a professional automotive tire condition analyst.
IMPORTANT VALIDATION: First, determine if this image shows a tire or tyre (car tire, truck tire, motorcycle tire, etc.).
If the image does NOT contain a recognizable tire (e.g. it shows food, animals, people, other car parts that are not tires, electronics, furniture, random objects, or anything that is not a tire), you MUST return ONLY this JSON:
{"error": true, "message": "This model focuses on tires only. Please upload a clear photo of a tire showing the tread surface and sidewall for condition assessment.", "confidence_score": 0}

If the image DOES show a tire, perform a thorough condition assessment. Examine tread depth, sidewall condition, cracking, bulges, uneven wear, and overall aging.
Return plain JSON with:
{
  "condition": "fine" or "replace",
  "estimated_remaining_life_years": number (e.g. 3, 1.5, 0),
  "estimated_remaining_km": number (e.g. 40000, 15000, 0),
  "recommendation": string — be specific, e.g. "Tire is in good condition and should last approximately 3 more years or 45,000 km under normal driving" OR "Tire tread is critically worn below 2mm. Replace immediately before exceeding another 1,000 km. Unsafe for wet conditions.",
  "reason": string — describe the visible evidence (tread depth estimate, sidewall condition, aging cracks, wear pattern),
  "confidence_score": number between 0 and 1,
  "urgency": "none" or "soon" or "immediate" — "none" if tire is fine for 2+ years, "soon" if 6 months to 2 years, "immediate" if under 6 months or unsafe
}
Be as specific as possible with the remaining life estimate. Factor in visible tread depth, aging, and wear patterns.`
  } else if (modelType === 'vin') {
    prompt =
      `You are a professional automotive data extraction assistant.
IMPORTANT VALIDATION: First, determine if this image shows a vehicle's license plate, license disk, VIN plate, or an official vehicle registration document.
If the image does NOT contain any of these, you MUST return ONLY this JSON:
{"error": true, "message": "This model focuses on vehicle identification only. Please upload a clear photo of a license disk, license plate, VIN plate, or registration document.", "confidence_score": 0}

If the image DOES show a valid vehicle identifier, extract the vehicle details.
Return plain JSON with:
{
  "make": string (or empty string if not found),
  "model": string (or empty string if not found),
  "year": string (or empty string if not found),
  "vin": string (the 17-character VIN, or empty string if not found),
  "registration_number": string (license plate number, or empty string if not found),
  "confidence_score": number between 0 and 1
}`
  } else {
    prompt = 'Analyze this vehicle image and provide general observations.'
  }

  try {
    const base64 = imageBuffer.toString('base64')
    // Use the SDK-supported multimodal format: \`contents[].parts[]\`.
    const visionPayload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { data: base64, mimeType } },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }

    return await generateWithFallback(visionPayload, {}, visionModelCandidates)
  } catch (e) {
    const msg = e?.message || String(e)
    console.error('[Gemini] analyzeImage failed', { modelType, message: msg })
    const fb = fallbackImageModel(modelType)
    const normalizedError = msg.toLowerCase().includes('quota') || msg.includes('429')
      ? 'model failed image analysis'
      : msg.toLowerCase().includes('not found')
        ? 'Configured Gemini image model was not available'
        : 'model image analysis failed'
    return JSON.stringify({
      ...fb,
      provider: 'fallback',
      fallback_reason: normalizedError,
      debug_error: msg,
    })
  }
}

async function analyzeAudio(audioBuffer, mimeType) {
  const prompt = `You are an expert automotive mechanic with decades of experience diagnosing vehicle issues by sound alone.
Analyze this audio recording captured from or near a vehicle.

CRITICAL RULE — BE HONEST AND BALANCED:
Most cars produce perfectly normal sounds. A healthy engine hums, idles smoothly, and has a consistent exhaust note.
DO NOT invent problems. If the car sounds normal and healthy, SAY SO clearly.
Only flag an issue if you hear a genuinely abnormal sound that a real mechanic would investigate.

Normal sounds that are NOT problems (do not flag these):
- Smooth engine idle hum
- Normal exhaust tone (even if slightly loud on sports/performance cars)
- Gentle fan or cooling system noise
- Normal fuel injector ticking (light, rapid, consistent)
- Air conditioning compressor cycling on/off
- Normal turbo spool or blow-off valve sounds
- Brief startup sounds that settle within seconds

Abnormal sounds that ARE concerns:
- Knocking or pinging (engine detonation, rod knock, worn bearings)
- Squealing or screeching (worn brake pads, loose serpentine belt, power steering issues)
- Grinding (worn brake rotors, transmission issues, differential problems)
- Hissing (vacuum leaks, coolant leaks, exhaust leaks)
- Irregular clicking or ticking (low oil pressure, worn lifters, CV joint issues)
- Heavy rumbling or vibration (exhaust issues, wheel bearing failure, misfiring)
- Whining that changes with RPM (power steering pump, alternator bearing, transmission)
- Metallic rattling (loose heat shields, exhaust components, worn suspension)

IMPORTANT VALIDATION (CRITICAL!): You MUST verify if the audio actually contains vehicle or mechanical sounds. 
If the audio is just speech, someone talking, music, typing, silence, or unrelated background noise with NO obvious car, engine, or mechanical characteristics, YOU MUST REJECT IT by returning EXACTLY and ONLY this JSON:
{"error": true, "message": "This audio does not appear to be related to a car. Please record mechanical sounds near the engine, exhaust, or wheels.", "confidence_score": 0}
Do not attempt to diagnose speech or music as mechanical faults.

If the audio DOES sound automotive, return ONLY valid JSON (no markdown, no extra text) with:
{
  "health_status": "healthy" | "minor_concern" | "needs_attention" | "urgent",
  "health_summary": string (a clear one-line verdict, e.g. "Engine sounds normal and healthy — no issues detected" or "Abnormal knocking sound detected from engine area"),
  "detected_sounds": [array of strings describing each distinct sound heard, including NORMAL sounds],
  "predicted_problem": string (the most likely mechanical issue, OR "No issue detected — vehicle sounds healthy" if everything is fine),
  "urgency": "none" | "low" | "medium" | "high" | "critical",
  "confidence_score": number between 0 and 1,
  "probable_causes": [array of objects with: { "cause": string, "probability_percent": number, "explanation": string }] (if healthy, return a single entry like { "cause": "Normal operation", "probability_percent": 100, "explanation": "All sounds fall within expected parameters for a running vehicle" }),
  "recommended_action": string (if healthy: "No action needed. Vehicle sounds are within normal operating parameters." — if not: describe what to do),
  "safety_warning": string or null (ONLY if the sound suggests a genuinely dangerous condition, otherwise null)
}`

  try {
    const base64 = audioBuffer.toString('base64')
    const audioPayload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { data: base64, mimeType } },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }

    return await generateWithFallback(audioPayload, {}, visionModelCandidates)
  } catch (e) {
    const msg = e?.message || String(e)
    console.error('[Gemini] analyzeAudio failed', { mimeType, message: msg })
    return JSON.stringify(fallbackAudioDiagnosis())
  }
}

function fallbackAudioDiagnosis() {
  return {
    detected_sounds: ['Unable to process audio with AI — using fallback analysis'],
    predicted_problem: 'Audio analysis unavailable — manual inspection recommended',
    urgency: 'medium',
    confidence_score: 0.2,
    probable_causes: [
      { cause: 'Engine mechanical wear', probability_percent: 25, explanation: 'Common source of abnormal engine sounds' },
      { cause: 'Belt or pulley issue', probability_percent: 25, explanation: 'Squealing or whining often caused by worn belts' },
      { cause: 'Exhaust system issue', probability_percent: 25, explanation: 'Rattling or rumbling may indicate exhaust leaks' },
      { cause: 'Brake component wear', probability_percent: 25, explanation: 'Grinding or squealing may indicate worn pads or rotors' },
    ],
    recommended_action: 'Have the vehicle inspected by a qualified mechanic. Describe when the sound occurs (cold start, acceleration, braking, turning) for more accurate diagnosis.',
    safety_warning: null,
  }
}

async function forecastStock(parts = [], orders = [], jobs = [], now = new Date().toISOString()) {
  const prompt = `
You are a workshop inventory forecasting assistant.
CRITICAL RULE: Be extremely concise and strictly factual. Do not explain your reasoning or over-elaborate. Limit your output to save tokens and ensure maximum accuracy.
Do not mention any AI providers.

Current date/time: ${now}

Current parts inventory (name, sku, quantity, reorder_level, unit_price):
${JSON.stringify(parts.map(p => ({ name: p.name, sku: p.sku, qty: p.quantity, reorder: p.reorder_level, price: p.unit_price })))}

Recent part orders history (part_name, quantity, status, created_at):
${JSON.stringify(orders.map(o => ({ part: o.part_name, qty: o.quantity, status: o.status, date: o.created_at })))}

Recent jobs summary (total: ${jobs.length}):
${JSON.stringify(jobs.slice(0, 40).map(j => ({ title: j.title, status: j.status, priority: j.priority, date: j.created_at })))}

Analyze consumption patterns, job volume trends, and current stock levels.
Return plain JSON with:
summary (string — 2-3 sentence overview of inventory health),
total_parts_tracked (number),
parts_at_risk (number — count of parts likely to run out within 30 days),
estimated_monthly_spend (number — projected cost based on consumption rates and unit prices),
forecasts (array of objects for EACH part, each with: part_name, sku, current_qty, reorder_level, daily_consumption_rate, days_until_stockout, risk_level (one of "critical","warning","healthy"), suggested_reorder_qty, suggested_reorder_by (date string), reasoning (1 short sentence)),
insights (array of 3-5 short strings with actionable observations about trends, seasonal patterns, or cost-saving opportunities),
top_priority_actions (array of 2-4 short strings — the most urgent things the workshop should do right now)
`

  try {
    return await generateWithFallback(prompt, {
      generationConfig: { responseMimeType: 'application/json' }
    })
  } catch (e) {
    return JSON.stringify(fallbackStockForecast(parts, orders))
  }
}

async function estimateCarValue(vehicleDetails = {}, images = []) {
  const hasImages = Array.isArray(images) && images.length > 0

  const textPrompt = `
You are a professional automotive valuation expert specializing in the South African used car market.
You must provide a realistic market value estimate based on the vehicle details provided.
CRITICAL RULE: Be extremely accurate and base valuations on real South African market data.
All prices MUST be in South African Rand (ZAR).
Do not mention any AI providers.

Vehicle details:
- Make: ${vehicleDetails.make || 'Unknown'}
- Model: ${vehicleDetails.model || 'Unknown'}
- Year: ${vehicleDetails.year || 'Unknown'}
- Mileage: ${vehicleDetails.mileage || 'Unknown'} km
- Overall Condition: ${vehicleDetails.condition || 'Unknown'}
- Service History: ${vehicleDetails.service_history || 'Unknown'}
- Modifications: ${vehicleDetails.modifications || 'None'}
- Color: ${vehicleDetails.color || 'Unknown'}
- Transmission: ${vehicleDetails.transmission || 'Unknown'}
- Fuel Type: ${vehicleDetails.fuel_type || 'Unknown'}
- Province: ${vehicleDetails.province || 'Unknown'}

${hasImages ? 'Photos of the vehicle have been provided. Analyze the visual condition of the car from the photos to refine your valuation. Look for paint condition, body damage, interior wear, tire condition, and overall presentation.' : 'No photos provided — base valuation on details only.'}

Return plain JSON with:
estimated_value_min (number in ZAR),
estimated_value_max (number in ZAR),
fair_market_value (number in ZAR — your best single estimate),
trade_in_value (number in ZAR — typical dealer trade-in offer),
private_sale_value (number in ZAR — expected price in a private sale),
condition_rating (string — one of "Excellent", "Good", "Fair", "Poor"),
confidence_score (number 0-1),
value_factors (array of objects with: factor, impact ("positive" or "negative"), amount_zar (estimated impact in rands), explanation),
market_comparison (string — brief comparison to similar listings),
depreciation_notes (string — expected future value trend),
recommendations (array of strings — tips to maximize resale value),
photo_observations (string or null — what was observed from photos, null if no photos)
`

  try {
    if (hasImages) {
      const imageParts = images.slice(0, 4).map((img) => {
        const base64Data = img.data.includes('base64,') ? img.data.split('base64,')[1] : img.data
        return { inlineData: { data: base64Data, mimeType: img.mimeType || 'image/jpeg' } }
      })

      const visionPayload = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: textPrompt },
              ...imageParts,
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }

      return await generateWithFallback(visionPayload, {}, visionModelCandidates)
    } else {
      return await generateWithFallback(textPrompt)
    }
  } catch (e) {
    return JSON.stringify(fallbackCarValuation(vehicleDetails))
  }
}

module.exports = {
  diagnoseSymptoms,
  estimateRepairTime,
  bookingHelper,
  partsCompatibility,
  smartJobSchedule,
  customerUpdate,
  repairCostEstimate,
  summarizeJobCard,
  summarizeConversation,
  carChat,
  analyzeImage,
  analyzeAudio,
  forecastStock,
  estimateCarValue,
}

function fallbackFaultDiagnosis(symptoms, vehicleDetails = {}) {
  const text = String(symptoms || '').toLowerCase()
  const has = (w) => text.includes(w)

  const base = [
    {
      cause: 'Battery / charging system issue',
      probability_percent: 20,
      check_first: 'Check battery voltage and terminal condition',
      if_still_present_next: 'Test alternator output and belt tension',
      if_fixed_then_verify: 'Confirm no warning lights and stable voltage under load',
    },
    {
      cause: 'Ignition system (spark plugs / coils)',
      probability_percent: 20,
      check_first: 'Scan for misfire codes and check plug condition',
      if_still_present_next: 'Swap coils to confirm if misfire follows',
      if_fixed_then_verify: 'Road test and confirm smooth idle and acceleration',
    },
    {
      cause: 'Fuel delivery (filter / pump / injectors)',
      probability_percent: 20,
      check_first: 'Check fuel trims and fuel pressure (if available)',
      if_still_present_next: 'Inspect injectors and fuel filter restrictions',
      if_fixed_then_verify: 'Confirm stable AFR and improved throttle response',
    },
    {
      cause: 'Air intake / vacuum leak / MAF',
      probability_percent: 20,
      check_first: 'Inspect intake hoses and vacuum lines for leaks',
      if_still_present_next: 'Clean/inspect MAF sensor and check live readings',
      if_fixed_then_verify: 'Confirm improved idle stability and trims',
    },
    {
      cause: 'Mechanical / lubrication issue',
      probability_percent: 20,
      check_first: 'Check engine oil level and condition',
      if_still_present_next: 'Inspect for abnormal noise patterns and compression (if needed)',
      if_fixed_then_verify: 'Confirm noise resolved and no new leaks',
    },
  ]

  if (has('knock') || has('knocking')) {
    base[4].probability_percent = 35
    base[2].probability_percent = 15
    base[3].probability_percent = 15
    base[0].probability_percent = 10
    base[1].probability_percent = 25
  }

  if (has('stall') || has('stalling') || has('dies')) {
    base[2].probability_percent = 30
    base[3].probability_percent = 25
    base[0].probability_percent = 20
    base[1].probability_percent = 15
    base[4].probability_percent = 10
  }

  if (has('no start') || has('won’t start') || has("won't start")) {
    base[0].probability_percent = 40
    base[1].probability_percent = 15
    base[2].probability_percent = 15
    base[3].probability_percent = 20
    base[4].probability_percent = 10
  }

  return {
    predicted_problem: 'Probable fault based on symptom pattern',
    urgency: has('smoke') || has('overheat') ? 'high' : 'medium',
    confidence_score: 0.55,
    probable_causes: base.sort((a, b) => b.probability_percent - a.probability_percent),
    recommended_action:
      'Start with the highest probability checks. Verify each step with a quick re-test. Escalate to deeper diagnostics only if the symptom remains.',
  }
}

function fallbackTimeEstimate(symptoms, vehicleDetails = {}) {
  const text = String(symptoms || '').toLowerCase()
  const has = (w) => text.includes(w)

  const estimates = [
    { match: ['oil', 'service'], hours: [1, 2], days: [0, 1], note: 'Routine service usually same-day.' },
    { match: ['brake', 'pads'], hours: [2, 4], days: [0, 1], note: 'May vary depending on rotor condition.' },
    { match: ['battery'], hours: [0.5, 1.5], days: [0, 1], note: 'Includes testing and replacement if required.' },
    { match: ['diagnose', 'diagnosis', 'check engine'], hours: [1, 3], days: [0, 1], note: 'Diagnostics time depends on scan results.' },
    { match: ['clutch'], hours: [6, 10], days: [1, 3], note: 'Labour-heavy work, schedule accordingly.' },
    { match: ['overheat', 'coolant', 'radiator'], hours: [3, 7], days: [1, 2], note: 'May include pressure tests and parts sourcing.' },
  ]

  let chosen = null
  for (const e of estimates) {
    if (e.match.some(has)) {
      chosen = e
      break
    }
  }

  const fallback = chosen || { hours: [2, 6], days: [1, 2], note: 'Estimate depends on inspection results and parts availability.' }

  return {
    estimated_hours_min: fallback.hours[0],
    estimated_hours_max: fallback.hours[1],
    estimated_days_min: fallback.days[0],
    estimated_days_max: fallback.days[1],
    estimated_parts_cost_min: fallback.parts ? fallback.parts[0] : Math.round(fallback.hours[0] * 800),
    estimated_parts_cost_max: fallback.parts ? fallback.parts[1] : Math.round(fallback.hours[1] * 1500),
    estimated_labor_cost_min: Math.round(fallback.hours[0] * 650),
    estimated_labor_cost_max: Math.round(fallback.hours[1] * 650),
    assumptions: 'Estimate is based on typical South African workshop rates (R650/hr labor) and aftermarket parts pricing. Final cost may change after inspection.',
    scheduling_notes: fallback.note,
  }
}

function fallbackBookingHelper(message) {
  const text = String(message || '').toLowerCase()
  const has = (w) => text.includes(w)

  const shouldEstimate =
    has('noise') ||
    has('knock') ||
    has('smoke') ||
    has('overheat') ||
    has('warning') ||
    has('check engine') ||
    has('vibration') ||
    has('leak') ||
    has('stall') ||
    has('won') ||
    has('start')

  return {
    reply: shouldEstimate
      ? 'Based on the symptoms described, I recommend booking a service so our team can inspect your vehicle. Include as much detail as possible when booking.'
      : 'You can book directly. Select your preferred date and describe what service you need.',
    suggested_route: '/user/service',
    questions_to_ask: [
      'Which vehicle is this for?',
      'When did the issue start?',
      'Is it safe to drive right now?',
      'What date/time works best for you?',
    ],
    recommended_booking_window: shouldEstimate ? 'Next 1–2 business days' : 'Next available slot',
    draft_title: shouldEstimate ? 'Service Booking (Inspection Needed)' : 'Service Booking',
    draft_symptoms: String(message || '').slice(0, 400),
    draft_appointment_date_iso: '',
  }
}

function fallbackPartsCompatibility(partName, availableParts = []) {
  const needle = String(partName || '').toLowerCase()
  const inStock = (availableParts || []).filter((p) => Number(p.quantity || 0) > 0)
  const matched = inStock.filter((p) => String(p.name || '').toLowerCase().includes(needle)).slice(0, 3)
  const alternatives = inStock
    .filter((p) => !String(p.name || '').toLowerCase().includes(needle))
    .slice(0, 3)
    .map((p) => ({ name: p.name, sku: p.sku || null, quantity: p.quantity, reason: 'In-stock alternative option' }))

  const lowStock = (availableParts || [])
    .filter((p) => Number(p.quantity || 0) <= Number(p.reorder_level || 0))
    .slice(0, 3)
    .map((p) => ({
      name: p.name,
      sku: p.sku || null,
      suggested_qty: Math.max(Number(p.reorder_level || 0) * 2 - Number(p.quantity || 0), 1),
      reason: 'Below reorder level',
    }))

  return {
    fitment: matched.length > 0 ? 'likely' : 'uncertain',
    confidence_score: matched.length > 0 ? 0.55 : 0.35,
    reasons: matched.length > 0 ? ['Similar part name found in inventory'] : ['No direct match found in inventory'],
    in_stock_matches: matched.map((p) => ({ name: p.name, sku: p.sku || null, quantity: p.quantity })),
    alternatives,
    reorder_suggestions: lowStock,
  }
}

function fallbackSmartSchedule(jobs = [], nowIso) {
  const now = new Date(nowIso || new Date().toISOString())
  const priorityRank = { urgent: 0, high: 1, normal: 2, low: 3 }
  const active = (jobs || []).filter((j) => j.status !== 'completed')

  const sorted = active
    .slice()
    .sort((a, b) => {
      const aAppt = a.appointment_date ? new Date(a.appointment_date).getTime() : Number.POSITIVE_INFINITY
      const bAppt = b.appointment_date ? new Date(b.appointment_date).getTime() : Number.POSITIVE_INFINITY
      if (aAppt !== bAppt) return aAppt - bAppt
      const aP = priorityRank[a.priority] ?? 9
      const bP = priorityRank[b.priority] ?? 9
      if (aP !== bP) return aP - bP
      const aH = Number(a.estimated_hours || 2)
      const bH = Number(b.estimated_hours || 2)
      return bH - aH
    })

  const start = new Date(now.getTime())
  let cursor = new Date(start.getTime())
  const blocks = []
  for (const j of sorted) {
    const hours = Number(j.estimated_hours || (j.estimated_days ? Number(j.estimated_days) * 8 : 2))
    const end = new Date(cursor.getTime() + Math.max(hours, 0.5) * 60 * 60 * 1000)
    blocks.push({
      job_id: j.job_id,
      reason: 'Ordered by booking time, priority, and estimated duration',
      suggested_start_iso: cursor.toISOString(),
      suggested_end_iso: end.toISOString(),
    })
    cursor = end
  }

  return {
    recommended_order: blocks,
    predicted_completion_iso: cursor.toISOString(),
  }
}

function fallbackCustomerUpdate(job = {}, newStatus) {
  const customer = job.customer_name || 'Customer'
  const vehicle = [job.make, job.model].filter(Boolean).join(' ') || 'your vehicle'
  const status = String(newStatus || job.status || '').toLowerCase()

  const map = {
    pending: {
      message: `Hi ${customer}, we have received your booking for ${vehicle}. Our team will start the initial inspection shortly and confirm next steps.`,
      eta_text: 'We will update you after initial inspection.',
      next_steps: ['Initial inspection', 'Confirm findings and repair plan', 'Send estimated timeline'],
    },
    diagnosed: {
      message: `Hi ${customer}, we have completed the initial diagnosis for ${vehicle}. We are preparing the repair plan and will update you with the next steps.`,
      eta_text: 'Timeline will be confirmed after planning.',
      next_steps: ['Confirm parts and plan', 'Schedule repair work', 'Start repairs'],
    },
    in_progress: {
      message: `Hi ${customer}, work is now in progress on ${vehicle}. We will keep tracking progress and send the next update once the repair stage is completed.`,
      eta_text: 'We will share an ETA once the current stage is completed.',
      next_steps: ['Complete current repair stage', 'Quality checks', 'Update you with ETA'],
    },
    completed: {
      message: `Hi ${customer}, your ${vehicle} service is completed. Your vehicle is ready for collection. Thank you for choosing our workshop.`,
      eta_text: 'Ready for collection.',
      next_steps: ['Collection/hand-over', 'Final invoice and notes', 'Optional follow-up booking'],
    },
  }

  return map[status] || {
    message: `Hi ${customer}, your job status for ${vehicle} has been updated to "${newStatus}". We will send more details shortly.`,
    eta_text: 'ETA to be confirmed.',
    next_steps: ['Workshop review', 'Update you with next steps'],
  }
}

function fallbackRepairCostEstimate(symptoms, vehicleDetails = {}, availableParts = []) {
  const text = String(symptoms || '').toLowerCase()
  const has = (w) => text.includes(w)

  // Realistic South African workshop labor rate (ZAR per hour)
  const laborRate = 650 // Average SA independent workshop rate

  let labor = [1.5, 3.5]
  let parts = [500, 2500]
  let service = 'General inspection and repair'
  let serviceCategory = 'Repair'
  let urgency = 'medium'
  const drivers = ['Final cost depends on inspection findings']

  if (has('brake') && (has('pad') || has('disc') || has('rotor'))) {
    labor = [2, 4]
    parts = [1200, 5500]
    service = 'Brake system service (pads and/or discs)'
    serviceCategory = 'Repair'
    drivers.push('Pad and rotor condition determine whether resurfacing or replacement is needed')
    drivers.push('OEM parts cost significantly more than aftermarket alternatives')
  } else if (has('brake')) {
    labor = [1.5, 3.5]
    parts = [800, 3500]
    service = 'Brake system inspection and repair'
    serviceCategory = 'Repair'
    drivers.push('Pad, rotor, and fluid condition can change the final price')
  } else if (has('battery') || has('won\'t start') || has('no start')) {
    labor = [0.5, 2]
    parts = [1500, 4500]
    service = 'Battery and starting system repair'
    serviceCategory = 'Repair'
    drivers.push('Battery size, brand, and CCA rating affect cost')
    drivers.push('If the alternator or starter is faulty, costs increase significantly')
  } else if (has('overheat') || has('coolant') || has('radiator')) {
    labor = [3, 7]
    parts = [2000, 9000]
    service = 'Cooling system diagnosis and repair'
    serviceCategory = 'Repair'
    urgency = 'high'
    drivers.push('Radiator replacement vs repair significantly changes total cost')
    drivers.push('Water pump and thermostat may need replacement simultaneously')
  } else if (has('clutch')) {
    labor = [5, 10]
    parts = [3500, 12000]
    service = 'Clutch kit replacement'
    serviceCategory = 'Major Service'
    drivers.push('Dual-mass flywheel replacement can add R5,000–R15,000')
    drivers.push('Labour-intensive job — front-wheel drive vehicles may cost more')
  } else if (has('suspension') || has('shock') || has('strut')) {
    labor = [2, 5]
    parts = [2000, 8000]
    service = 'Suspension repair or replacement'
    serviceCategory = 'Repair'
    drivers.push('Alignment required after suspension work (R450–R800 extra)')
    drivers.push('Worn bushings and ball joints may need attention simultaneously')
  } else if (has('steering') || has('power steering')) {
    labor = [2, 5]
    parts = [1500, 7000]
    service = 'Steering system repair'
    serviceCategory = 'Repair'
    drivers.push('Power steering pump or rack replacement is more expensive')
  } else if (has('timing') || has('cambelt') || has('timing belt') || has('timing chain')) {
    labor = [4, 8]
    parts = [2500, 9000]
    service = 'Timing belt/chain replacement'
    serviceCategory = 'Major Service'
    drivers.push('Water pump typically replaced at the same time')
    drivers.push('Interference engines risk catastrophic damage if belt snaps')
  } else if (has('turbo') || has('turbocharger')) {
    labor = [4, 8]
    parts = [8000, 35000]
    service = 'Turbocharger repair or replacement'
    serviceCategory = 'Repair'
    urgency = 'high'
    drivers.push('Remanufactured turbos cost less than new OEM units')
    drivers.push('Oil supply issues must be resolved to prevent repeat failure')
  } else if (has('gearbox') || has('transmission')) {
    labor = [6, 14]
    parts = [5000, 35000]
    service = 'Gearbox / transmission repair'
    serviceCategory = 'Repair'
    drivers.push('Rebuild vs replacement significantly affects cost')
    drivers.push('Automatic transmissions typically cost more than manual')
  } else if (has('engine') || has('misfire') || has('smoke')) {
    labor = [2, 8]
    parts = [1500, 15000]
    service = 'Engine diagnostic and repair'
    serviceCategory = 'Diagnosis'
    urgency = has('smoke') ? 'high' : 'medium'
    drivers.push('Scope of repair depends on diagnostic scan and compression test results')
    drivers.push('Head gasket failure significantly increases cost (R8,000–R25,000 total)')
  } else if (has('major service')) {
    labor = [3, 5]
    parts = [2000, 6000]
    service = 'Major Service'
    serviceCategory = 'Major Service'
    urgency = 'low'
    drivers.push('Includes oil, all filters, spark plugs, and comprehensive inspection')
    drivers.push('Additional fluid changes (brake, coolant, transmission) may increase cost')
  } else if (has('service') || has('oil') || has('minor service')) {
    labor = [1, 2]
    parts = [800, 2500]
    service = 'Minor Service (Oil & Filter)'
    serviceCategory = 'Minor Service'
    urgency = 'low'
    drivers.push('Oil type (mineral vs synthetic) affects cost')
    drivers.push('Additional filters (air, cabin, fuel) add R200–R800 each')
  } else if (has('exhaust') || has('catalytic') || has('cat')) {
    labor = [2, 5]
    parts = [3000, 25000]
    service = 'Exhaust system repair'
    serviceCategory = 'Repair'
    drivers.push('Catalytic converter replacement is the most expensive exhaust component')
  } else if (has('aircon') || has('air con') || has('ac') || has('a/c')) {
    labor = [2, 5]
    parts = [1500, 8000]
    service = 'Air conditioning system repair'
    serviceCategory = 'Repair'
    drivers.push('Compressor replacement is the most expensive A/C repair')
    drivers.push('Re-gas only costs R600–R1,200')
  }

  // If workshop has matching parts in stock, factor their prices in
  const avgListedPart = (availableParts || [])
    .filter((p) => Number(p.unit_price || 0) > 0)
    .slice(0, 5)
    .reduce((sum, p, _, arr) => sum + Number(p.unit_price || 0) / arr.length, 0)

  if (avgListedPart > 0) {
    parts = [parts[0], Math.max(parts[1], Math.round(avgListedPart * 2))]
  }

  const totalMin = Math.round(labor[0] * laborRate + parts[0])
  const totalMax = Math.round(labor[1] * laborRate + parts[1])

  return {
    likely_service: service,
    service_category: serviceCategory,
    urgency,
    estimated_labor_hours_min: labor[0],
    estimated_labor_hours_max: labor[1],
    estimated_parts_cost_min: parts[0],
    estimated_parts_cost_max: parts[1],
    estimated_total_cost_min: totalMin,
    estimated_total_cost_max: totalMax,
    cost_drivers: drivers,
    assumptions: [
      'All prices are in South African Rand (ZAR) and reflect current market rates.',
      'Labor rate based on average SA independent workshop rate of R650/hr.',
      'Parts pricing based on aftermarket supplier rates (Midas, AutoZone, Goldwagen).',
      'OEM/dealer parts may cost 30-80% more than aftermarket alternatives.',
      'Estimate is pre-inspection and may change after teardown or diagnostic scanning.',
      'VAT (15%) is included in the estimate.',
    ],
    recommended_next_step: 'Confirm the fault with a physical inspection, then convert the estimate into an approved quote for the customer.',
  }
}

function fallbackJobCardSummary(jobCard = {}) {
  const title = jobCard.title || 'Service request'
  const symptoms = String(jobCard.symptoms || jobCard.customer_notes || '').trim()
  const text = symptoms.toLowerCase()
  const has = (w) => text.includes(w)

  let issueArea = 'General inspection'
  let priority = 'normal'
  if (has('brake')) issueArea = 'Braking system'
  if (has('overheat') || has('smoke')) {
    issueArea = 'Engine / cooling system'
    priority = 'high'
  }
  if (has("won't start") || has('no start') || has('stall')) {
    issueArea = 'Starting / fuel / electrical system'
    priority = 'high'
  }

  return {
    brief_summary: `${title}: ${symptoms || 'Customer requests inspection and diagnosis.'}`.slice(0, 280),
    priority,
    likely_issue_area: issueArea,
    inspection_checklist: [
      'Confirm customer complaint and reproduce symptom safely',
      'Perform visual inspection for obvious wear, leaks, or damage',
      'Scan for fault codes or warning indicators if applicable',
      'Document findings before parts replacement',
    ],
    parts_to_prepare: has('brake')
      ? ['Brake pads', 'Brake cleaner', 'Brake fluid']
      : has('battery') || has('start')
        ? ['Battery tester', 'Battery terminals', 'Charging system test tools']
        : ['Basic diagnostic tools', 'Common service consumables'],
    customer_concerns: symptoms ? [symptoms] : ['Customer requested a general check'],
    customer_facing_summary: 'We will inspect the vehicle, confirm the root cause, and share the next steps before major repairs begin.',
  }
}

function fallbackConversationSummary(messages = [], context = {}) {
  const ordered = (messages || []).slice().sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
  const transcript = ordered.map((m) => String(m.content || '').trim()).filter(Boolean)
  const combined = transcript.join(' ').toLowerCase()
  const has = (w) => combined.includes(w)

  let sentiment = 'neutral'
  let urgency = 'medium'
  if (has('thanks') || has('great') || has('okay')) sentiment = 'positive'
  if (has('worried') || has('upset') || has('delay')) sentiment = 'concerned'
  if (has('urgent') || has('asap') || has('today') || has('stuck')) urgency = 'high'

  return {
    summary:
      transcript.length > 0
        ? `Conversation between workshop and customer about ${context.topic || 'the active job'}: ${transcript.slice(-3).join(' ').slice(0, 320)}`
        : 'No messages available to summarize.',
    customer_sentiment: sentiment,
    urgency,
    action_items: [
      'Confirm the latest workshop status',
      'Reply with ETA or next milestone',
      'Note any promised call-back or quote approval',
    ],
    promised_followups: has('call') ? ['Customer expects a call-back update'] : ['Share the next update after inspection or repair progress'],
    suggested_reply: 'We have reviewed your messages and will update you shortly with the current status, timeline, and next steps.',
  }
}

function fallbackImageModel(modelType) {
  if (modelType === 'color') {
    return {
      color_name: 'Metallic Silver (Approx.)',
      confidence_score: 0.35,
      mix_suggestion: [
        { component: 'Silver base', ratio_percent: 70 },
        { component: 'Pearl / metallic flake', ratio_percent: 20 },
        { component: 'Tint / toner', ratio_percent: 10 },
      ],
      notes: 'Image-based matching is approximate. Confirm with a test spray and adjust toner gradually.',
    }
  }

  if (modelType === 'damage') {
    return {
      part: 'Body panel (approx.)',
      decision: 'repair',
      reason: 'Default decision without model access. Confirm severity and structural damage before final decision.',
      confidence_score: 0.25,
    }
  }

  if (modelType === 'tire') {
    return {
      condition: 'fine',
      recommended_timeframe: '',
      reason: 'Default output without model access. Confirm tread depth and sidewall condition.',
      confidence_score: 0.25,
    }
  }

  return { result_label: 'unknown', confidence_score: 0.2, notes: 'No model access.' }
}

function fallbackStockForecast(parts = [], orders = []) {
  const forecasts = parts.map(p => {
    const partOrders = orders.filter(o => o.part_name === p.name)
    const totalOrdered = partOrders.reduce((sum, o) => sum + (o.quantity || 0), 0)
    const dailyRate = totalOrdered > 0 ? totalOrdered / 90 : 0.1
    const daysLeft = dailyRate > 0 ? Math.round(p.quantity / dailyRate) : 999
    let risk = 'healthy'
    if (daysLeft <= 7) risk = 'critical'
    else if (daysLeft <= 21) risk = 'warning'

    return {
      part_name: p.name,
      sku: p.sku || '-',
      current_qty: p.quantity,
      reorder_level: p.reorder_level || 0,
      daily_consumption_rate: Math.round(dailyRate * 100) / 100,
      days_until_stockout: daysLeft,
      risk_level: risk,
      suggested_reorder_qty: Math.max((p.reorder_level || 5) * 2 - p.quantity, 1),
      suggested_reorder_by: new Date(Date.now() + Math.max(daysLeft - 3, 1) * 86400000).toISOString().split('T')[0],
      reasoning: 'Estimate based on average order history.',
    }
  })

  const atRisk = forecasts.filter(f => f.risk_level !== 'healthy').length
  const monthlySpend = parts.reduce((s, p) => s + (p.unit_price || 0) * 2, 0)

  return {
    summary: `Tracking ${parts.length} parts. ${atRisk} part(s) may need restocking soon based on order history.`,
    total_parts_tracked: parts.length,
    parts_at_risk: atRisk,
    estimated_monthly_spend: Math.round(monthlySpend),
    forecasts,
    insights: [
      'Review parts with critical risk levels first.',
      'Consider bulk ordering high-turnover items for cost savings.',
      'Set reorder levels for parts that currently have none configured.',
    ],
    top_priority_actions: [
      'Restock any parts flagged as critical.',
      'Verify reorder levels are set for all parts.',
    ],
  }
}

function fallbackCarValuation(vehicleDetails = {}) {
  const year = Number(vehicleDetails.year || new Date().getFullYear())
  const currentYear = new Date().getFullYear()
  const age = Math.max(currentYear - year, 0)
  const mileage = Number(vehicleDetails.mileage || 80000)
  const condition = String(vehicleDetails.condition || 'Good').toLowerCase()

  // Base value heuristic for South African market
  let baseValue = 250000
  if (age <= 1) baseValue = 350000
  else if (age <= 3) baseValue = 280000
  else if (age <= 5) baseValue = 220000
  else if (age <= 8) baseValue = 160000
  else if (age <= 12) baseValue = 100000
  else baseValue = 60000

  // Condition modifier
  const conditionMod = condition === 'excellent' ? 1.15 : condition === 'good' ? 1.0 : condition === 'fair' ? 0.85 : 0.65
  baseValue = Math.round(baseValue * conditionMod)

  // Mileage modifier (penalize high mileage)
  if (mileage > 200000) baseValue = Math.round(baseValue * 0.75)
  else if (mileage > 150000) baseValue = Math.round(baseValue * 0.85)
  else if (mileage > 100000) baseValue = Math.round(baseValue * 0.92)

  const min = Math.round(baseValue * 0.85)
  const max = Math.round(baseValue * 1.15)
  const tradeIn = Math.round(baseValue * 0.78)
  const privateSale = Math.round(baseValue * 1.08)

  return {
    estimated_value_min: min,
    estimated_value_max: max,
    fair_market_value: baseValue,
    trade_in_value: tradeIn,
    private_sale_value: privateSale,
    condition_rating: vehicleDetails.condition || 'Good',
    confidence_score: 0.45,
    value_factors: [
      { factor: 'Vehicle Age', impact: age <= 3 ? 'positive' : 'negative', amount_zar: age * 8000, explanation: `${age} year(s) old — ${age <= 3 ? 'relatively new' : 'depreciation applied'}` },
      { factor: 'Mileage', impact: mileage <= 100000 ? 'positive' : 'negative', amount_zar: Math.round(mileage * 0.15), explanation: `${mileage.toLocaleString()} km on the odometer` },
      { factor: 'Overall Condition', impact: conditionMod >= 1 ? 'positive' : 'negative', amount_zar: Math.round(Math.abs(1 - conditionMod) * baseValue), explanation: `Condition rated as ${vehicleDetails.condition || 'Good'}` },
    ],
    market_comparison: 'Estimate based on general South African market averages. For a more precise valuation, AI analysis with vehicle photos is recommended.',
    depreciation_notes: `Vehicles typically depreciate 15-20% in the first year and 10-15% per year thereafter in the South African market.`,
    recommendations: [
      'Keep full service history to maximize resale value.',
      'Address any cosmetic damage before selling.',
      'Consider timing — demand is typically higher in January and July.',
    ],
    photo_observations: null,
  }
}
