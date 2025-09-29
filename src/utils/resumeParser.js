import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export const parseResume = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        let text = '';
        
        if (file.type === 'application/pdf') {
          text = await parsePDF(e.target.result);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          text = await parseDocx(e.target.result);
        }
        
        const extracted = extractContactInfo(text);
        resolve({ text, ...extracted });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.readAsArrayBuffer(file);
  });
};

const parsePDF = async (arrayBuffer) => {
  try {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    return 'Error parsing PDF content.';
  }
};

const parseDocx = async (arrayBuffer) => {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    return 'Error parsing DOCX content.';
  }
};

const extractContactInfo = (text) => {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phoneRegex = /(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
  const nameRegex = /^([A-Z][a-z]+ [A-Z][a-z]+)/m;
  
  const emails = text.match(emailRegex);
  const phones = text.match(phoneRegex);
  const nameMatch = text.match(nameRegex);
  
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  let name = '';
  
  if (nameMatch) {
    name = nameMatch[1];
  } else {
    const firstLine = lines[0]?.trim();
    if (firstLine && firstLine.length < 50 && /^[A-Za-z\s]+$/.test(firstLine)) {
      name = firstLine;
    }
  }
  
  return {
    name: name || '',
    email: emails ? emails[0] : '',
    phone: phones ? phones[0]?.trim() : ''
  };
};