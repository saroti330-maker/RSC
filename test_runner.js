const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

const regex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
let match;
const scripts = {};
while ((match = regex.exec(content)) !== null) {
  const idMatch = match[1].match(/id=["']([^"']+)["']/);
  if (idMatch) {
    scripts[idMatch[1]] = match[2];
  }
}

let block5 = '';
regex.lastIndex = 0;
let c = 0;
while ((match = regex.exec(content)) !== null) {
  c++;
  if (c === 5) block5 = match[2];
}

const mockStorage = {
  'scsp_nilphamari_students_v3': JSON.stringify([{ id: '1', school_name: 'Test School', classes: ['One', 'Two'], students: [{ student_id: '101', name: 'Karim', class_name: 'Two', gender: 'ছাত্র' }] }]),
  'scsp_auth_session': 'logged_in'
};

const domElements = {
  'studentsMasterJson': { textContent: scripts['studentsMasterJson'] || '[]' },
  'schoolOptionsJson': { textContent: scripts['schoolOptionsJson'] || '[]' },
  'loginScreen': { style: {} },
  'mainAppContent': { style: {} },
  'loginUserId': { value: '' },
  'loginPassword': { value: '' },
  'rememberMeCheck': { checked: false }
};

const mockWindow = {
  location: { search: '' },
  localStorage: {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = v; },
    removeItem: (k) => { delete mockStorage[k]; }
  },
  sessionStorage: {
    getItem: (k) => null,
    setItem: () => {},
    removeItem: () => {}
  },
  document: {
    getElementById: (id) => domElements[id] || { style: {}, textContent: '', value: '', addEventListener: () => {} },
    querySelectorAll: () => [],
    addEventListener: () => {}
  },
  console: console
};

try {
  const fn = new Function('window', 'document', 'localStorage', 'sessionStorage', 'alert', 'confirm', 'prompt', 'indexedDB', 'firebase',
    block5
  );
  fn(mockWindow, mockWindow.document, mockWindow.localStorage, mockWindow.sessionStorage, () => {}, () => true, () => '', {}, null);
  console.log('Script ran successfully!');
  console.log('loginScreen display:', domElements['loginScreen'].style.display);
  console.log('mainAppContent display:', domElements['mainAppContent'].style.display);
} catch (err) {
  console.error('SCRIPT ERROR DETECTED:', err);
}
