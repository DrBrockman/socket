var WebSocketServer = require('ws').Server; // webSocket library
const http = require('http');

const sharedPort = process.env.PORT || 5501; // The port number to use for both WebSocket and HTTP servers

var clients = []; // list of client connections
var clientNames = {};
// ------------------------ WebSocket Server functions
function handleConnection(client, request) {
    client.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'name') {
          // Associate the client with the specified name
          const clientName = data.data;
          clientNames[client] = clientName;
          console.log(`New Connection: ${clientName} `);
          
            return;
        }
        clientResponse(message, client)
    });

    function endClient() {
     
      const clientName = clientNames[client] || 'Unknown'; // Get the associated client name, or use 'Unknown' if not found
      console.log(`Connection closed: ${clientName}`);
      delete clientNames[client];
      
    }

  // if a client sends a message, print it out:
  function clientResponse(data, client) {
    //console.log(client._socket.remoteAddress + ': ' + data);
    broadcast(data, client);
  }

  

  client.on('close', endClient);
  clients.push(client);
  
};

// This function broadcasts messages to all WebSocket clients
function broadcast(data, sender) {
    // iterate over the array of clients & send data to each except the sender
    for (const client of clients) {
      if (client !== sender) {
        client.send(data.toString('utf-8'));
      }
    }
  }
  
  


// ------------------------ HTTP Server for handling POST requests
const httpServer = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });

    req.on('end', () => {
      // You can process the received data here.
      console.log('Received POST data:', data);

      // Send the data to all WebSocket clients.
      broadcast(data);

      // Respond to the request.
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('POST request received successfully!');
    });
  } else {
    // Respond to non-POST requests.
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Listen for clients and handle them:
const wss = new WebSocketServer({ server: httpServer });
wss.on('connection', handleConnection);

// Start the combined server:
httpServer.listen(sharedPort, () => {
  console.log(`Server listening ${sharedPort}`);
});
