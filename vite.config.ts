import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { spawn, ChildProcess } from 'child_process'
import http from 'http'

let serverProcess: ChildProcess | null = null;

// Ensure child process is killed on exit
process.on('exit', () => {
  if (serverProcess) {
    serverProcess.kill('SIGINT');
  }
});

function checkPortActive(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port,
      path: '/api/templates',
      method: 'GET',
      timeout: 300
    }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'videogen-server-control',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/__server_control') {
            res.setHeader('Content-Type', 'application/json');
            
            if (req.method === 'POST') {
              const body = await new Promise<any>((resolve) => {
                let chunks = '';
                req.on('data', chunk => chunks += chunk.toString());
                req.on('end', () => {
                  try { resolve(JSON.parse(chunks)); }
                  catch { resolve({}); }
                });
              });
              
              if (body.action === 'start') {
                const isActive = await checkPortActive(8080);
                if (isActive) {
                  res.end(JSON.stringify({ success: true, status: 'already_running' }));
                  return;
                }
                
                try {
                  serverProcess = spawn('./build/videogen-server', [], {
                    stdio: 'ignore',
                    detached: false
                  });
                  
                  // Wait a short bit to let it start
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  
                  const nowActive = await checkPortActive(8080);
                  res.end(JSON.stringify({ success: nowActive, status: nowActive ? 'started' : 'failed_to_start' }));
                } catch (err: any) {
                  res.end(JSON.stringify({ success: false, error: err.message }));
                }
                return;
              }
              
              if (body.action === 'stop') {
                if (serverProcess) {
                  serverProcess.kill('SIGINT');
                  serverProcess = null;
                } else {
                  // Fallback: if server process isn't owned by Vite but is running, force kill port 8080
                  const { exec } = await import('child_process');
                  exec('fuser -k 8080/tcp || kill $(lsof -t -i:8080)', () => {});
                }
                
                // Wait a short bit to let it stop
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const nowActive = await checkPortActive(8080);
                res.end(JSON.stringify({ success: !nowActive, status: !nowActive ? 'stopped' : 'failed_to_stop' }));
                return;
              }
            }
            
            if (req.method === 'GET') {
              const isActive = await checkPortActive(8080);
              res.end(JSON.stringify({ success: true, running: isActive }));
              return;
            }
          }
          next();
        });
      }
    }
  ],
  server: {
    watch: {
      ignored: [
        '**/outputs/**',
        '**/tmp/**',
        '**/temp/**',
        '**/data/**',
        'outputs/**',
        'tmp/**',
        'data/**',
        '**/*.mp4',
        '**/*.mp3',
        '**/*.wav'
      ]
    }
  }
})
