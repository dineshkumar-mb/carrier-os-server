import { Page } from 'playwright';
import { aiProvider, cleanJsonString } from './aiClient';

export interface FormFieldMapping {
  selector: string;
  fieldType: 'name' | 'email' | 'phone' | 'resume' | 'cover_letter' | 'submit' | 'github' | 'linkedin' | 'portfolio' | 'other';
  confidence: number;
}

export const analyzeFormFields = async (page: Page): Promise<FormFieldMapping[]> => {
  try {
    const elementsInfo = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, textarea, select, button'));
      return inputs.map((el: any, idx) => {
        let label = '';
        if (el.id) {
          const lblEl = document.querySelector(`label[for="${el.id}"]`);
          if (lblEl) label = lblEl.textContent || '';
        }
        if (!label) {
          label = el.labels && el.labels.length > 0 ? el.labels[0].textContent : '';
        }
        
        return {
          id: el.id,
          name: el.name,
          type: el.type,
          placeholder: el.placeholder,
          labelText: label.trim(),
          ariaLabel: el.getAttribute('aria-label'),
          text: el.innerText || el.textContent || '',
          tagName: el.tagName.toLowerCase(),
          selectorIdx: idx
        };
      });
    });

    const prompt = `
    Analyze the HTML form inputs below from a job application page:
    ${JSON.stringify(elementsInfo, null, 2)}
    
    Map each form element to one of the target fields:
    - name
    - email
    - phone
    - resume (file input)
    - cover_letter (textarea/file input)
    - github (GitHub profile URL)
    - linkedin (LinkedIn profile URL)
    - portfolio (portfolio website URL)
    - submit (the button to click to apply)
    
    Return ONLY a JSON array matching this schema:
    [
      {
        "selectorIdx": number,
        "fieldType": "name" | "email" | "phone" | "resume" | "cover_letter" | "submit" | "github" | "linkedin" | "portfolio",
        "confidence": number
      }
    ]
    `;

    const systemPrompt = `You are an expert browser automation script. Map DOM element metadata to job form fields and return strictly raw valid JSON.`;

    const response = await aiProvider.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ], { jsonMode: true });

    const cleaned = cleanJsonString(response);
    const mappings: any[] = JSON.parse(cleaned);

    return mappings.map((m: any) => {
      const el = elementsInfo[m.selectorIdx];
      let selector = '';
      if (el.id) {
        selector = `#${el.id}`;
      } else if (el.name) {
        selector = `${el.tagName}[name="${el.name}"]`;
      } else if (el.placeholder) {
        selector = `${el.tagName}[placeholder="${el.placeholder}"]`;
      } else {
        selector = `${el.tagName}:nth-child(${el.selectorIdx + 1})`;
      }

      return {
        selector,
        fieldType: m.fieldType,
        confidence: m.confidence
      };
    });
  } catch (err) {
    console.error('Error analyzing form fields via AI:', err);
    return [];
  }
};
