const StaticServer = require('static-server');
const WebSocket    = require('ws');
const mysql        = require('mysql');

//mysql
var sql_pool  = mysql.createPool({
  connectionLimit : 10,
  host            : 'localhost',
  user            : 'root',
  password        : '',
  database        : 'sheets'
});

// static server
var server = new StaticServer({
  rootPath: 'static',
  port: 8000,
  cors: '*',
  templates: {
    notFound: 'static/404.html'
  }
});

// websocket
const wsServer = new WebSocket.Server({ port: 9000 });

console.log('WebSocket server listening on', wsServer.address().port);

server.start(function () {
    console.log('Server listening on', server.port);
});

wsServer.on('connection', (ws) => {
  ws.on('message', (message) => {
      try {
          let received = JSON.parse(message);
          handleMessage(ws, received);
      } catch(ex) {
          console.log(ex);
      }
    //console.log('received: %s', message);
  });

  ws.on('close', (code, message) => {
      if (ws.tableID) {
          unsubscribe(ws, ws.tableID);
      }
  });

  console.log('connected client: ', ws._socket.remoteAddress, ' port: ' + ws._socket.remotePort);
});

function sql_init_table(id) {
    sql_pool.query('SELECT id FROM tables WHERE table_id = ?', [id], (error, results, fields) => {
        if (error) { return; }

        if (!results[0]) {
            sql_pool.query('INSERT INTO tables (table_id) VALUES (?)', [id], (error, results, fields) => {
                if (error) { console.log(error); return; }
            });
        }
    })
}

function sql_fetch_table_data(id) {
    return new Promise((resolve, reject) => {
        sql_pool.query(`SELECT data.row, data.col, data.value
                        FROM data
                        INNER JOIN tables ON data.table_id=tables.id
                        WHERE tables.table_id = ?`, [id], (error, results, fields) => {
            if (error) {
                reject();
                return;
            }
            resolve(results);
        });
    });
}

function sql_update_table_cell(id, row, col, value) {
    return new Promise((resolve, reject) => {
        sql_pool.query(`INSERT INTO data
                        VALUES ((SELECT id FROM tables WHERE table_id = ?), ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                            value=VALUES(value)`,
                        [id, row, col, value],
                        (error, results, fields) => {

            if (error) {
                reject();
                return;
            }
            resolve(results);
        });
    });
}

// map of the connected clients and tables that they are connected to
var subscribers = {};

function init(ws, id) {
    ws.tableID = id;
    sql_init_table(id);
}

function subscribe(ws, id) {
    subscribers[id] = subscribers[id] || [];
    subscribers[id].push(ws);
}

function unsubscribe(ws, id) {
    subscribers[id] = subscribers[id].filter(e => e !== ws);
}

function update(ws, id, data) {

    sql_update_table_cell(id, data.row, data.col, data.newValue);

    if (subscribers[id]) {
        for (let connIndex = 0; connIndex < subscribers[id].length; connIndex++) {
            let conn = subscribers[id][connIndex];
            if (conn !== ws) {
                conn.send(JSON.stringify(data));
            }
        }
    }
}

async function handleDataRequest(ws, id) {
    let data = await sql_fetch_table_data(id);

    let processed = data.map((e) => {
        return {
            'row': e.row,
            'col': e.col,
            'value': e.value
        }
    }, []);

    ws.send(JSON.stringify({
        'type': 'data',
        'data': processed
    }));
}

function handleMessage(ws, data) {

    if (data.type === 'init') {
        init(ws, data.id);
    } else if (data.type === 'subscribe') {
        subscribe(ws, ws.tableID);
    } else if (data.type === 'unsubscribe') {
        unsubscribe(ws, ws.tableID);
    } else if (data.type === 'data') {
        handleDataRequest(ws, ws.tableID);
    } else if (data.type === 'update') {
        update(ws, ws.tableID, data);
    }
}
