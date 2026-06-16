import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function localApiPlugin() {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use('/api/projects', (req, res) => {
        const filePath = path.resolve(process.cwd(), 'saved_projects', 'projects.json');
        
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, JSON.stringify([]));
        }

        const getProjectId = (req) => {
          if (req.url && req.url.length > 1) {
            return req.url.split('/')[1].split('?')[0];
          }
          return null;
        };

        const getSessionId = (req) => {
          if (req.url && req.url.includes('/sessions/')) {
            const parts = req.url.split('/');
            if (parts.length > 3) {
              return parts[3].split('?')[0];
            }
          }
          return null;
        };

        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(fs.readFileSync(filePath));
        } else if (req.method === 'POST') {
          const id = getProjectId(req);
          const isSessionPost = req.url && req.url.includes('/sessions');

          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            const projects = JSON.parse(fs.readFileSync(filePath));
            
            if (isSessionPost && id) {
              const sessionData = JSON.parse(body);
              const index = projects.findIndex(p => p.id === id);
              if (index !== -1) {
                if (!projects[index].sessions) projects[index].sessions = [];
                sessionData.id = Date.now().toString() + Math.floor(Math.random()*1000);
                sessionData.createdAt = new Date().toISOString();
                projects[index].sessions.push(sessionData);
                fs.writeFileSync(filePath, JSON.stringify(projects, null, 2));
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(sessionData));
              } else {
                res.statusCode = 404;
                res.end('Project not found');
              }
            } else {
              const newProject = JSON.parse(body);
              if (!newProject.sessions) newProject.sessions = [];
              projects.push(newProject);
              fs.writeFileSync(filePath, JSON.stringify(projects, null, 2));
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(newProject));
            }
          });
        } else if (req.method === 'PUT') {
          const id = getProjectId(req);
          const sessionId = getSessionId(req);
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            const projects = JSON.parse(fs.readFileSync(filePath));
            const updateData = JSON.parse(body);
            const index = projects.findIndex(p => p.id === id);
            if (index !== -1) {
              if (sessionId) {
                const sIdx = projects[index].sessions?.findIndex(s => s.id === sessionId);
                if (sIdx !== -1 && sIdx !== undefined) {
                  projects[index].sessions[sIdx] = { ...projects[index].sessions[sIdx], ...updateData };
                  fs.writeFileSync(filePath, JSON.stringify(projects, null, 2));
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(projects[index].sessions[sIdx]));
                } else {
                  res.statusCode = 404;
                  res.end('Session not found');
                }
              } else {
                projects[index] = { ...projects[index], ...updateData };
                fs.writeFileSync(filePath, JSON.stringify(projects, null, 2));
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(projects[index]));
              }
            } else {
              res.statusCode = 404;
              res.end('Project not found');
            }
          });
        } else if (req.method === 'DELETE') {
          const id = getProjectId(req);
          const sessionId = getSessionId(req);
          const projects = JSON.parse(fs.readFileSync(filePath));
          const index = projects.findIndex(p => p.id === id);
          if (index !== -1) {
            if (sessionId) {
              const sIdx = projects[index].sessions?.findIndex(s => s.id === sessionId);
              if (sIdx !== -1 && sIdx !== undefined) {
                projects[index].sessions.splice(sIdx, 1);
                fs.writeFileSync(filePath, JSON.stringify(projects, null, 2));
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } else {
                res.statusCode = 404;
                res.end('Session not found');
              }
            } else {
              projects.splice(index, 1);
              fs.writeFileSync(filePath, JSON.stringify(projects, null, 2));
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            }
          } else {
            res.statusCode = 404;
            res.end('Project not found');
          }
        } else {
          res.statusCode = 405;
          res.end('Method Not Allowed');
        }
      });
    }
  }
}

export default defineConfig({
  plugins: [react(), localApiPlugin()],
})
