const pool = require('../config/db')
const { analyzeImage } = require('../services/geminiService')

const uploadImage = async (req, res) => {
  try {
    const { job_id, image, mimeType, type } = req.body // base64 string, e.g. "data:image/png;base64,..."

    if (!image || !mimeType || !type) {
      return res.status(400).json({ message: 'Image, mimeType, and type (color/damage/tire) are required' })
    }

    // Extract base64 content if it includes the prefix
    const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image
    const buffer = Buffer.from(base64Data, 'base64')

    const analysisResult = await analyzeImage(buffer, mimeType, type)
    
    // Parse the AI response
    let analysisData = {}
    try {
      analysisData = typeof analysisResult === 'string' ? JSON.parse(analysisResult.replace(/```json|```/g, '').trim()) : analysisResult
    } catch (e) {
      console.error('Failed to parse image analysis response:', e.message, {
        type,
        mimeType,
        analysisResultType: typeof analysisResult,
        analysisResultLength: typeof analysisResult === 'string' ? analysisResult.length : null,
      })
      analysisData = { result_label: 'Error', confidence_score: 0, notes: analysisResult }
    }

    // Check if the AI rejected the image as irrelevant to the selected model
    if (analysisData.error === true) {
      return res.status(400).json({
        message: 'Image rejected',
        rejected: true,
        rejection_reason: analysisData.message || 'The uploaded image is not suitable for the selected analysis model.',
      })
    }

    if (type === 'damage') {
      analysisData = {
        part: analysisData.part || 'Unknown',
        decision: analysisData.decision || analysisData.recommended_action || 'inspect',
        reason: analysisData.reason || analysisData.damage_type || analysisData.notes || '',
        confidence_score: analysisData.confidence_score || 0,
        provider: analysisData.provider || 'gemini',
        fallback_reason: analysisData.fallback_reason || null,
        debug_error: analysisData.debug_error || null,
      }
    }

    if (type === 'tire') {
      const rawCondition = String(analysisData.condition || analysisData.recommendation || '')
        .toLowerCase()
        .replace(/\s/g, '_')

      const normalizedCondition =
        rawCondition === 'replace' ||
        rawCondition === 'replace_now' ||
        rawCondition === 'replace-now' ||
        rawCondition.includes('replace')
          ? 'replace'
          : 'fine'

      analysisData = {
        condition: normalizedCondition,
        estimated_remaining_life_years: analysisData.estimated_remaining_life_years ?? null,
        estimated_remaining_km: analysisData.estimated_remaining_km ?? null,
        recommendation: analysisData.recommendation || '',
        urgency: analysisData.urgency || (normalizedCondition === 'replace' ? 'immediate' : 'none'),
        recommended_timeframe: normalizedCondition === 'replace' ? analysisData.recommended_timeframe || '' : '',
        reason: analysisData.reason || analysisData.tread_status || analysisData.notes || '',
        confidence_score: analysisData.confidence_score || 0,
        provider: analysisData.provider || 'gemini',
        fallback_reason: analysisData.fallback_reason || null,
        debug_error: analysisData.debug_error || null,
      }
    }

    if (type === 'color') {
      analysisData = {
        color_name: analysisData.color_name || analysisData.result_label || 'Unknown',
        mix_suggestion: analysisData.mix_suggestion || [],
        notes: analysisData.notes || analysisData.matching_tips || '',
        confidence_score: analysisData.confidence_score || 0,
        provider: analysisData.provider || 'gemini',
        fallback_reason: analysisData.fallback_reason || null,
        debug_error: analysisData.debug_error || null,
      }
    }

    if (type === 'vin') {
      analysisData = {
        make: analysisData.make || '',
        model: analysisData.model || '',
        year: analysisData.year || '',
        vin: analysisData.vin || '',
        registration_number: analysisData.registration_number || '',
        confidence_score: analysisData.confidence_score || 0,
        provider: analysisData.provider || 'gemini',
        fallback_reason: analysisData.fallback_reason || null,
        debug_error: analysisData.debug_error || null,
      }
    }

    // Save to public.image_analysis if job_id is provided
    if (job_id) {
      await pool.query(
        `INSERT INTO public.image_analysis (job_id, image_type, result_label, confidence_score, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          job_id,
          type,
          analysisData.result_label || analysisData.color_name || analysisData.condition || analysisData.decision,
          analysisData.confidence_score || 0,
          JSON.stringify(analysisData),
        ]
      )
    }

    res.json({
      message: 'Analysis complete',
      analysis: analysisData
    })
  } catch (error) {
    console.error('Image analysis error:', error.message)
    res.status(500).json({ message: 'Image analysis failed', error: error.message })
  }
}

module.exports = { uploadImage }
