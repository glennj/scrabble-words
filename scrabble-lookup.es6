#!/usr/bin/env node

/* eslint no-debugger: "warn" */
/* eslint brace-style: ["error", "stroustrup"] */

import parseArgs from 'minimist';
import path from 'path';
import fs from 'fs';

const dictFile = '/usr/share/dict/american-english';
const wordsModuleFile = './words.js';
let words = {};

/* ********************************
 * generate the words module
 */

const charFrequency = word => Array.from(word.toLowerCase())
  .reduce((freq, char) => {
    freq[char] = (freq[char] || 0) + 1; // eslint-disable-line no-param-reassign
    return freq;
  }, {});

const processWord = (word) => {
  if (/[^a-z]/.test(word)) return;
  const freq = charFrequency(word);
  const key = Array.from(word.toLowerCase()).sort().join('');
  if (key in words) {
    words[key].words.push(word);
  }
  else {
    words[key] = { freq, words: [word] };
  }
};

const writeWordFile = (file) => {
  debugger;
  Object.keys(words).forEach((key) => {
    words[key].words = Array.from(new Set(words[key].words.map(w => w.toLowerCase())));
  });
  const data = `/* generated from ${file} on ${new Date().toString()} */\n`
             + `const words = ${JSON.stringify(words)};\n`
             + 'module.exports = words;\n';

  /*
  fs.promises
    .writeFile(wordsModuleFile, data)
    .then(() => { console.log(`${wordsModuleFile} complete.`); });
  */
  fs.writeFileSync(wordsModuleFile, data);
};

const generateWordsModule = (file = dictFile) => {
  debugger;
  /*
  const rl = readline.createInterface({ input: fs.createReadStream(file) });
  rl.on('line', processWord);
  rl.on('close', writeWordFile);
  */
  const content = fs.readFileSync(file);
  content.toString().split('\n').forEach(processWord);
  writeWordFile(file);
  /*
  fs.readFile(file, (err, data) => {
    debugger;
    if (err) throw err;
    data.toString().split('\n').map(processWord);
    writeWordFile();
  });
  */
};

/* ********************************
 * lookup
 */

if (fs.existsSync(path.join(__dirname, wordsModuleFile))) {
  words = require(wordsModuleFile); // eslint-disable-line global-require, import/no-dynamic-require
}

const lookup = (letters) => {
  const freq = charFrequency(letters);
  const re = new RegExp(`^[${Object.keys(freq).join('')}]{3,}$`);

  /* eslint-disable  no-param-reassign */
  return Object.keys(words)
    .filter((key) => {
      const frq = words[key].freq;
      return re.test(key)
          && Object.keys(frq).every(c => frq[c] <= freq[c]);
    })
    .reduce((wrds, key) => wrds.concat(words[key].words), [])
    .sort()
    .reduce((map, word) => {
      map[word.length] = (map[word.length] || []).concat(word);
      return map;
    }, {});
  /* eslint-enable  no-param-reassign */
};

const main = () => {
  const usage = `usage: ${process.argv[1].replace(/.+\//, '')} [-h] <-g dictionaryFile | tiles>
where: -g  -- generate word list from dictionary (default ${dictFile})
`;

  const args = parseArgs(process.argv.slice(2), {
    boolean: ['h', 'g'],
  });
  if (args.h) {
    console.log(usage);
  }
  else if (args.g) {
    generateWordsModule(args._[0]);
  }
  else {
    if (!words) {
      console.log('Words module does not exist... generating it.');
      generateWordsModule();
    }
    console.log(lookup(args._[0]));
  }
};

module.exports = lookup;

if (!module.parent) {
  main();
}
