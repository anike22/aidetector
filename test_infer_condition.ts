import fs from 'fs';
const text = fs.readFileSync('tasks/browserText.txt', 'utf8');
const lower = text.toLowerCase();
console.log("has @:", lower.includes('@'));
console.log("has dear:", lower.includes('dear'));
console.log("has sincerely:", lower.includes('sincerely'));
console.log("has regards:", lower.includes('regards'));
console.log("line 318 result:", (lower.includes('@') && lower.includes('dear') || lower.includes('sincerely') || lower.includes('regards')));
