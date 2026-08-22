const fs = require('fs');
const path = require('path');

const aiDir = path.join(process.cwd(), 'client/src/pages/admin/ai');
const files = fs.readdirSync(aiDir);

for (const file of files) {
  if (!file.endsWith('.jsx')) continue;
  if (file === 'ImageModelBase.jsx' || file === 'JobContextPanel.jsx') continue;

  const filePath = path.join(aiDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already has JobContextPanel
  if (content.includes('JobContextPanel')) continue;

  // Add import
  const importStatement = `import JobContextPanel from './JobContextPanel'\n`;
  
  // Find where to add import (after other imports)
  const lines = content.split('\n');
  let lastImportIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) {
      lastImportIndex = i;
    }
  }
  lines.splice(lastImportIndex + 1, 0, importStatement);

  content = lines.join('\n');

  // Insert <JobContextPanel /> right after <AppLayout ...>
  // using regex replacement
  content = content.replace(/(<AppLayout[^>]*>)/, '$1\n      <JobContextPanel />');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
}
