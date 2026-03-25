const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(dir + '/' + file).isDirectory()) {
      filelist = walkSync(dir + '/' + file, filelist);
    }
    else {
      if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.css')) {
        filelist.push(dir + '/' + file);
      }
    }
  });
  return filelist;
};

const files = walkSync('./src', []);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Currency replacement
  content = content.replace(/\$\{parseFloat/g, '₹${parseFloat');
  content = content.replace(/\$\{\(item\.price/g, '₹${(item.price');
  content = content.replace(/\$\{cartTotal/g, '₹${cartTotal');
  content = content.replace(/\$12,450/g, '₹12,450');
  content = content.replace(/Price \(\$\)/g, 'Price (₹)');
  
  // Also look for literal '$' followed by '{' that didn't match above, but be careful
  // Actually the above covers our specific cases exactly.
  
  // Theme classes replacement
  // We only replace if they don't already have dark: prefix
  const replaceClass = (target, replacement) => {
    // regex that matches target but not preceded by dark:
    const regex = new RegExp(`(?<!dark:)${target.replace(/\\/g, '\\\\').replace(/\//g, '\\/')}`, 'g');
    content = content.replace(regex, replacement);
  };

  if (file.endsWith('.jsx')) {
    replaceClass('bg-zinc-950', 'bg-slate-50 dark:bg-zinc-950');
    replaceClass('bg-zinc-900', 'bg-white dark:bg-zinc-900');
    replaceClass('text-white', 'text-zinc-900 dark:text-white');
    replaceClass('text-gray-400', 'text-gray-600 dark:text-gray-400');
    replaceClass('text-gray-300', 'text-gray-700 dark:text-gray-300');
    replaceClass('border-zinc-800', 'border-slate-300 dark:border-zinc-800');
    replaceClass('border-white/5', 'border-black/5 dark:border-white/5');
    replaceClass('border-white/10', 'border-black/10 dark:border-white/10');
    replaceClass('border-white/20', 'border-black/20 dark:border-white/20');
    replaceClass('bg-zinc-800', 'bg-slate-200 dark:bg-zinc-800');
    replaceClass('bg-white/10', 'bg-black/5 dark:bg-white/10');
    replaceClass('bg-white/5', 'bg-black/5 dark:bg-white/5');
    
    // specifically for Loader skeleton
    replaceClass('bg-zinc-800/80', 'bg-slate-300 dark:bg-zinc-800/80');
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});

console.log('Refactoring complete!');
