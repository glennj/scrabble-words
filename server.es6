#!/usr/bin/env node
/* eslint no-debugger: "warn" */

// import net from 'net';
import http from 'http';
import qs from 'querystring';
import parseArgs from 'minimist';
import lookup from './scrabble-lookup';

const defaultPort = 3456;

const usage = `usage: ${process.argv[1].replace(/.+\//, '')} [-h] [-p port]
where: -p  -- server port (default ${defaultPort})
`;

const requestHandler = (request, response) => {
  console.log(`connection ${request.method}`);
  if (request.method !== 'POST') {
    response.writeHead(405, 'Method Not Supported', { 'Content-Type': 'text/plain' });
    response.end('405: Method Not Supported');
    return;
  }
  let msgBody = '';
  request.on('data', (data) => {
    msgBody = msgBody.concat(data.toString());
    if (msgBody.length > 100) {
      response.writeHead(413, 'Request Entity Too Large', { 'Content-Type': 'text/plain' });
      response.end('413: Request Entity Too Large');
    }
  });
  request.on('end', () => {
    const input = qs.unescape(msgBody);
    console.log(`word: ${input}`);
    const words = lookup(input);
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end(JSON.stringify(words));
  });
};

const startHttpServer = (port) => {
  const svr = http.createServer(requestHandler);
  svr.on('error', (e) => { throw e; });
  svr.listen(port, () => console.log(`server listening on port ${port}`));
};

/*
const startTcpServer = (port) => {
  const svr = net.createServer((conn) => {
    console.log('client connected');
    conn.on('request', (data) => {
      const input = scrabbleWords(data.toString().trim());
      console.log(`word: ${input}`);
      const words = scrabbleWords(input);
      conn.end(JSON.stringify(words));
    });
  });
  svr.on('error', (e) => { throw e; });
  svr.listen(port, () => console.log(`server listening on port ${port}`));
};
*/

const main = () => {
  const args = parseArgs(process.argv.slice(2), {
    boolean: ['h'],
    string: ['p'],
  });
  debugger;
  if (args.h) {
    console.log(usage);
    process.exit(0);
  }
  // startTcpServer(args.p || defaultPort);
  startHttpServer(args.p || defaultPort);
};

main();
