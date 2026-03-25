const fs = require('fs');
const walkSync = function(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(dir + '/' + file).isDirectory()) {
      filelist = walkSync(dir + '/' + file, filelist);
    }
    else {
      if (file.endsWith('.jsx')) {
        filelist.push(dir + '/' + file);
      }
    }
  });
  return filelist;
};

const files = walkSync('./src', []);
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('₹$')) {
    content = content.replace(/₹\$/g, '₹');
    fs.writeFileSync(file, content);
    console.log(`Fixed ₹$ in ${file}`);
  }
});
