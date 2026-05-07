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
suggested_route (one of: "/user/estimate" or "/user/service"),
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
You are a workshop cost estimation assistant.
You must provide a realistic pre-inspection repair cost range.
CRITICAL RULE: Be extremely concise and strictly factual. Do not explain your reasoning or over-elaborate. Limit your output to save tokens and ensure maximum accuracy.
Do not mention any AI providers.

Vehicle details:
- Make: ${vehicleDetails.make || 'Unknown'}
- Model: ${vehicleDetails.model || 'Unknown'}
- Year: ${vehicleDetails.year || 'Unknown'}
- Mileage: ${vehicleDetails.mileage || 'Unknown'}

Symptoms / requested work:
${symptoms}

Inventory parts snapshot:
${JSON.stringify(availableParts || [])}

Return plain JSON with:
likely_service,
urgency,
estimated_labor_hours_min,
estimated_labor_hours_max,
estimated_parts_cost_min,
estimated_parts_cost_max,
estimated_total_cost_min,
estimated_total_cost_max,
cost_drivers (array),
assumptions (array),
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
    assumptions: 'Estimate is based on common workshop experience and may change after inspection.',
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
      ? 'For best booking accuracy, start with Repair Estimate. It helps you choose a suitable booking time and what details to include.'
      : 'You can book directly. If you want a time estimate before booking, use Repair Estimate.',
    suggested_route: shouldEstimate ? '/user/estimate' : '/user/service',
    questions_to_ask: [
      'Which vehicle is this for?',
      'When did the issue start?',
      'Is it safe to drive right now?',
      'What date/time works best for you?',
    ],
    recommended_booking_window: shouldEstimate ? 'Next 1–2 business days' : 'Next available slot',
    draft_title: shouldEstimate ? 'Service Booking (Needs Estimate)' : 'Service Booking',
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

  let labor = [1.5, 3.5]
  let parts = [0, 120]
  let service = 'General inspection and repair'
  let urgency = 'medium'
  const drivers = ['Final cost depends on inspection findings']

  if (has('brake')) {
    labor = [2, 4]
    parts = [80, 260]
    service = 'Brake system service'
    drivers.push('Pad, rotor, and fluid condition can change the final price')
  } else if (has('battery') || has('start')) {
    labor = [0.5, 1.5]
    parts = [70, 220]
    service = 'Battery and starting system repair'
    drivers.push('Battery rating and charging-system faults affect cost')
  } else if (has('overheat') || has('coolant') || has('radiator')) {
    labor = [3, 6]
    parts = [120, 420]
    service = 'Cooling system diagnosis and repair'
    urgency = 'high'
    drivers.push('Leaks, thermostat, radiator, or pump failure can change the parts bill')
  } else if (has('suspension') || has('shock') || has('steering')) {
    labor = [2.5, 5.5]
    parts = [120, 480]
    service = 'Suspension or steering work'
    drivers.push('Alignment and worn component count affect total cost')
  } else if (has('engine') || has('misfire') || has('smoke')) {
    labor = [2, 7]
    parts = [90, 550]
    service = 'Engine diagnostic and repair'
    urgency = has('smoke') ? 'high' : 'medium'
    drivers.push('Further testing may uncover ignition, fuel, or mechanical issues')
  }

  const avgListedPart = (availableParts || [])
    .filter((p) => Number(p.unit_price || 0) > 0)
    .slice(0, 5)
    .reduce((sum, p, _, arr) => sum + Number(p.unit_price || 0) / arr.length, 0)

  if (avgListedPart > 0) {
    parts = [parts[0], Math.max(parts[1], Math.round(avgListedPart * 2))]
  }

  const laborRate = 45
  const totalMin = Math.round(labor[0] * laborRate + parts[0])
  const totalMax = Math.round(labor[1] * laborRate + parts[1])

  return {
    likely_service: service,
    urgency,
    estimated_labor_hours_min: labor[0],
    estimated_labor_hours_max: labor[1],
    estimated_parts_cost_min: parts[0],
    estimated_parts_cost_max: parts[1],
    estimated_total_cost_min: totalMin,
    estimated_total_cost_max: totalMax,
    cost_drivers: drivers,
    assumptions: [
      'Estimate is pre-inspection and may change after teardown or scanning.',
      'Pricing assumes standard aftermarket parts and normal labor access.',
      'Taxes, specialist machining, and towing are excluded.',
    ],
    recommended_next_step: 'Confirm the fault with inspection, then convert the range into an approved quote.',
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
