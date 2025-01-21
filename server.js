const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(fileUpload());
app.use(express.json());
app.use(express.static(__dirname)); // Serve frontend.html and static files from the same directory

// Strong Lua Obfuscator
function obfuscateLua(luaCode) {
  // Randomized variable renaming
  const varRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
  const reservedKeywords = new Set(['if', 'then', 'else', 'end', 'for', 'while', 'do', 'return', 'function', 'local']);
  const varMap = {};

  luaCode = luaCode.replace(varRegex, (match) => {
    if (reservedKeywords.has(match) || /^[A-Z_]+$/.test(match)) {
      return match; // Skip keywords or constants
    }
    if (!varMap[match]) {
      varMap[match] = `var_${Math.random().toString(36).substr(2, 8)}`;
    }
    return varMap[match];
  });

  // Obfuscate strings (convert characters to escaped hex)
  luaCode = luaCode.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, (match) => {
    return match
      .split('')
      .map((char) => `\\x${char.charCodeAt(0).toString(16)}`)
      .join('');
  });

  // Minify (remove newlines and unnecessary spaces)
  luaCode = luaCode.replace(/\s+/g, ' ').replace(/;\s*/g, ';');

  return luaCode;
}

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/frontend.html');
});

// Handle file upload and obfuscation
app.post('/obfuscate', (req, res) => {
  if (!req.files || !req.files.luaFile) {
    return res.status(400).send('No file uploaded.');
  }

  const luaFile = req.files.luaFile;
  const luaCode = luaFile.data.toString('utf8');

  try {
    const obfuscatedCode = obfuscateLua(luaCode);
    // Save the obfuscated code to a temporary file
    fs.writeFileSync('obfuscated.lua', obfuscatedCode);
    res.send(obfuscatedCode); // Send the obfuscated code as a response
  } catch (error) {
    console.error('Error obfuscating Lua code:', error);
    return res.status(500).send('Error obfuscating Lua code.');
  }
});

// Serve the obfuscated file for download
app.get('/download/obfuscated.lua', (req, res) => {
  res.download('obfuscated.lua', 'obfuscated.lua', (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(500).send('Error downloading the file.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
