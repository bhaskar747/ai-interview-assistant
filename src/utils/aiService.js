// src/utils/aiService.js

import axios from 'axios';

const API_KEY = process.env.REACT_APP_PERPLEXITY_API_KEY;
if (!API_KEY) {
  throw new Error('Please set REACT_APP_PERPLEXITY_API_KEY in your .env');
}

const api = axios.create({
  baseURL: 'https://api.perplexity.ai',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});

let generatedQuestions = new Set();
let usedAnswers = new Set();

/**
 * Generate a unique, AI-powered interview question.
 * @param {string} difficulty - 'Easy', 'Medium', or 'Hard'
 * @param {string} resumeContext - Candidate resume summary
 * @returns {Promise<{ question: string, difficulty: string }>}
 */
export const generateQuestion = async (difficulty, resumeContext = '') => {
  const systemPrompt = `
You are an expert technical interviewer for Full-Stack (React/Node.js) Developer roles.
Generate ONE unique ${difficulty} level interview question.
Requirements:
- Tests practical understanding and problem-solving
- Specific to React/Node.js
- Answerable in ${difficulty === 'Easy' ? '20s' : difficulty === 'Medium' ? '60s' : '120s'}
- Avoid topics covered previously: ${Array.from(generatedQuestions).slice(-10).join(' | ')}
Context: ${resumeContext.substring(0, 500)}
Return ONLY the question text.
`.trim();

  const response = await api.post('/chat/completions', {
    model: 'sonar-pro',
    messages: [
      { role: 'system', content: 'You are a strict, expert interviewer.' },
      { role: 'user', content: systemPrompt }
    ],
    max_tokens: 200,
    temperature: 0.85,
    top_p: 0.95
  });

  let question = response.data.choices[0].message.content.trim()
    .replace(/^(Question\s*\d*[:\.\-\)]*)\s*/i, '')
    .replace(/^(Q\d*[:\.\-\)]*)\s*/i, '')
    .trim();

  generatedQuestions.add(question);
  // Keep only last 20 questions
  if (generatedQuestions.size > 20) {
    const arr = Array.from(generatedQuestions).slice(-20);
    generatedQuestions = new Set(arr);
  }

  return { question, difficulty };
};

/**
 * Evaluate a candidate's answer using Perplexity AI.
 * @param {string} question - The question text
 * @param {string} answer - Candidate's answer text
 * @param {string} difficulty - Question difficulty
 * @returns {Promise<{ score: number, feedback: string }>}
 */
export const evaluateAnswer = async (question, answer, difficulty) => {
  const ans = (answer || '').trim();
  if (!ans || ans.toLowerCase() === 'no answer provided') {
    return { score: 0, feedback: 'No answer provided.' };
  }

  // Gibberish detection
  const isGibberish = 
    /^(.)\1{4,}$/.test(ans) ||
    (/^[^aeiouAEIOU\s]{10,}$/.test(ans)) ||
    (ans.length > 30 && !/\s/.test(ans));

  if (isGibberish) {
    return { score: 0, feedback: 'Detected gibberish or random characters.' };
  }

  // Duplicate answer detection
  const key = ans.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (key.length > 30 && usedAnswers.has(key)) {
    return { score: 1, feedback: 'Duplicate answer detected. Provide a unique response.' };
  }
  if (key.length > 30) usedAnswers.add(key);

  // Relevance check
  const qWords = question.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const overlap = qWords.filter(w => ans.toLowerCase().includes(w)).length;
  if (qWords.length > 0 && overlap === 0) {
    return { score: 0, feedback: 'Your answer does not address the specific question.' };
  }

  const systemPrompt = `
You are a senior FAANG interviewer evaluating a ${difficulty} level React/Node.js answer.
Criteria:
- Relevance (50%)
- Accuracy (30%)
- Depth (15%)
- Clarity (5%)
Scoring 0-10. Be strict: irrelevant or generic answers max 2.
Return JSON: {"score":<0-10>,"feedback":"<2-3 sentences>"}
`.trim();

  const userPrompt = `
QUESTION: "${question}"
ANSWER: "${ans}"

This is a ${difficulty} question. Provide only the JSON evaluation.
`.trim();

  try {
    const resp = await api.post('/chat/completions', {
      model: 'sonar-reasoning',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 350,
      temperature: 0.05
    });

    const txt = resp.data.choices[0].message.content.trim();
    const jsonMatch = txt.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const evalObj = JSON.parse(jsonMatch[0]);
      evalObj.score = Math.max(0, Math.min(10, Number(evalObj.score) || 0));
      return evalObj;
    }
    throw new Error('No JSON');
  } catch (e) {
    console.error('Evaluation error:', e);
    // Simple fallback: length-based
    const base = Math.min(8, Math.floor(ans.length / 50));
    return { score: base, feedback: 'Basic evaluation fallback based on answer length.' };
  }
};

/** Clear data between interview sessions */
export const clearInterviewData = () => {
  generatedQuestions.clear();
  usedAnswers.clear();
};
