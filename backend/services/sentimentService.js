// backend/services/sentimentService.js
require('dotenv').config();

const { spawn } = require('child_process');
const path      = require('path');

const analyzeSentiment = (text) => {
  return new Promise((resolve, reject) => {
    const pythonPath = process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');
    const scriptPath = path.join(__dirname, '../python/sentiment_analyzer.py');

    console.log('🔹 Python path:', pythonPath);
    console.log('🔹 Script path:', scriptPath);
    console.log('🔹 Text to analyze:', text);

    const pythonProcess = spawn(pythonPath, [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    pythonProcess.stdin.write(text);
    pythonProcess.stdin.end();

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('❌ Python process exited with code:', code);
        console.error('❌ Stderr:', stderr);

        // ── Fallback includes emotion fields so MongoDB never gets
        //    undefined for the new emotion/emotionTrigger columns
        resolve({
          label:           'neutral',
          score:           0,
          emotion:         'neutral_emotion',
          emotion_trigger: null
        });
        return;
      }

      console.log('🔹 Python stdout:', stdout);

      try {
        const result = JSON.parse(stdout);
        console.log('✅ Python result:', result);

        // ── Normalise — guarantee all 4 fields are always present
        //    even if an older version of the script only returned 2
        resolve({
          label:           result.label           ?? 'neutral',
          score:           result.score           ?? 0,
          emotion:         result.emotion         ?? 'neutral_emotion',
          emotion_trigger: result.emotion_trigger ?? null
        });

      } catch (e) {
        console.error('❌ JSON parse error:', e.message);
        console.error('❌ Raw stdout:', stdout);

        resolve({
          label:           'neutral',
          score:           0,
          emotion:         'neutral_emotion',
          emotion_trigger: null
        });
      }
    });
  });
};

module.exports = { analyzeSentiment };