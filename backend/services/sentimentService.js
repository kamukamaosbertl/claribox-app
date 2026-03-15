// backend/services/sentimentService.js

// 🔹 ADD: Require dotenv to load environment variables (if needed)
require('dotenv').config();

const { spawn } = require('child_process');
const path = require('path');

const analyzeSentiment = (text) => {
  return new Promise((resolve, reject) => {
    // 🔹 USE environment variable for python interpreter path, fallback to default
    const pythonPath = process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');

    // 🔹 Use path to your sentiment python script
    const scriptPath = path.join(__dirname, '../python/sentiment_analyzer.py');
    
    console.log('🔹 Python path:', pythonPath);
    console.log('🔹 Script path:', scriptPath);
    console.log('🔹 Text to analyze:', text);
    
    // Use spawn for better large-text handling
    const pythonProcess = spawn(pythonPath, [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Send the text for sentiment analysis via stdin
    pythonProcess.stdin.write(text);
    pythonProcess.stdin.end();
    
    let stdout = '';
    let stderr = '';
    
    // Collect standard output from Python script
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    // Collect error output from Python script
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    // On Python script process close, parse and resolve result
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('❌ Python process exited with code:', code);
        console.error('❌ Stderr:', stderr);

        // Return neutral sentiment on error
        resolve({ label: 'neutral', score: 0 });
        return;
      }
      
      console.log('🔹 Python stdout:', stdout);
      
      try {
        const result = JSON.parse(stdout);
        console.log('✅ Python result:', result);
        resolve(result);
      } catch (e) {
        console.error('❌ JSON parse error:', e.message);
        console.error('❌ Raw stdout:', stdout);

        // Return neutral sentiment on parse error
        resolve({ label: 'neutral', score: 0 });
      }
    });
  });
};

module.exports = { analyzeSentiment };