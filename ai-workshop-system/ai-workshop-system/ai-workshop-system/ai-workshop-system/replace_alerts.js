const fs = require('fs');
const path = require('path');

const targetDir = 'client/src';

const walkSync = (dir, filelist = []) => {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (!dirFile.includes('node_modules')) filelist = walkSync(dirFile, filelist);
    } else {
      if (file.endsWith('.jsx')) filelist.push(dirFile);
    }
  });
  return filelist;
};

const files = walkSync(targetDir);
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('alert(')) {
    // Replace all alert() with toast.error()
    content = content.replace(/alert\(/g, 'toast.error(');
    
    // Inject the import at the top if it doesn't exist
    if (!content.includes("from 'react-hot-toast'") && !content.includes('from "react-hot-toast"')) {
       const lines = content.split('\n');
       // Find the first import
       const firstImportIndex = lines.findIndex(l => l.startsWith('import'));
       if (firstImportIndex !== -1) {
           lines.splice(firstImportIndex + 1, 0, "import toast from 'react-hot-toast'");
           content = lines.join('\n');
       } else {
           // Provide fallback if no imports
           content = "import toast from 'react-hot-toast'\n" + content;
       }
    }
    
    fs.writeFileSync(file, content);
    console.log(`Replaced alerts in: ${file}`);
    changedCount++;
  }
});

console.log(`\nCompleted! Replaced legacy alerts with React Hot Toast across ${changedCount} files.`);
