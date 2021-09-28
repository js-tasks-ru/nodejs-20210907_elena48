const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { RESERVED_EVENTS } = require('socket.io/dist/socket');

const server = new http.Server();

server.on('request', (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname.slice(1);

  const filepath = path.join(__dirname, 'files', pathname);

  switch (req.method) {
    case 'POST':
    const writeStream = fs.createWriteStream(filepath, {flags: 'wx'});
    const LimitSizeStream = new LimitSizeStream({limit:1000000});
    req.pipe(LimitSizeStream).pipe(writeStream);
    writeStream.on('error', (error)=>{
      writeStream.on('finish', ()=>{
        res.end('file saved');
      })
      LimitSizeStream.on('error', (error)=>{
        if (error.code==='LIMIT_EXCEEDED'){
          res.statusCode=413;
          res.end('file is too big');
        }else {
          res.statusCode=500;
          res.end('internal error');
        }
      })
      writeStream.destroy();
      fs.uplink(filepath, error=>{});
    });
    LimitSizeStream.on('error', (error)=>{
      if (error.code==='EEXIST'){
        res.statusCode=409;
        res.end('file alredy exists');
        return;
      }else {
        res.statusCode=500;
        res.end('internal error');
      }
    });
    req.on('aborted', ()=>{
      LimitSizeStream.destroy();
      writeStream.destroy();
      fs.uplink(filepath,error=>{});
    });
      break;

    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

module.exports = server;
