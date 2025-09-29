// api/parseResume.js

import formidable from 'formidable';
import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

export const config = { api: { bodyParser: false } };

// Point pdfjs to the worker in public/
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end('Method Not Allowed');
    return;
  }

  try {
    // Parse multipart form upload
    const { files } = await new Promise((resolve, reject) => {
      const form = new formidable.IncomingForm();
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const file = files.file;
    const buffer = fs.readFileSync(file.filepath);
    let text = '';

    if (file.mimetype === 'application/pdf') {
      // Extract text from each PDF page
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ') + '\n';
      }
    } else {
      // Extract raw text from DOCX
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    }

    // Regex-based contact info extraction
    const email = (text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/) || [''])[0];
    const phone = (text.match(/(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/) || [''])[0];
    const nameMatch = text.match(/^([A-Z][a-z]+\s[A-Z][a-z]+)/m);
    const lines = text.split('\n').filter(l => l.trim());
    const name = nameMatch?.[1] || (lines[0]?.trim().length < 50 && /^[A-Za-z\s]+$/.test(lines[0]) ? lines[0].trim() : '');

    res.status(200).json({ name, email, phone, text });
  } catch (err) {
    console.error('parseResume error', err);
    res.status(500).json({ error: 'Failed to parse resume' });
  }
}
