// 此檔獨立以 node server.js 啟動
var express = require('express'),
	async = require('async'),
	pg = require('pg'),
	{ Pool } = require('pg'),
	path = require('path'),
	cookieParser = require('cookie-parser'),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
	app = express(),
	server = require('http').Server(app),
	io = require('socket.io')(server, {
		/* https://stackoverflow.com/questions/67363195/how-do-i-fix-the-following-cors-error-and-polling-error */
		cors: {
			origin: '*'
		}
	});

// 測試 toggle flag
const isTestToggle = process.env.TEST || true;

// 設定Socket.io的傳輸方式為polling (long polling)
io.transports = ['polling'];

// 建立Express應用程式和HTTP伺服器
var port = isTestToggle
	? 2000
	: (process.env.PORT || 4000);

// 當有客戶端與Socket.io建立連接時，傳送歡迎訊息，並處理訂閱事件
io.sockets.on('connection', function (socket) {

	socket.emit('message', { text: 'Welcome!' });

	socket.on('subscribe', function (data) {
		socket.join(data.channel);
	});
});

// 建立一個PostgreSQL資料庫連接池
var pool = new pg.Pool({
	connectionString: isTestToggle
		? 'postgres://postgres:postgres@127.0.0.1:64434/postgres'
		: 'postgres://postgres:postgres@db/postgres'
});

// 透過async.retry函式嘗試連接資料庫。如果連接失敗，每隔1秒重新嘗試連接，最多嘗試1000次
async.retry(
	{ times: 1000, interval: 1000 },
	function (callback) {
		pool.connect(function (err, client, done) {
			if (err) {
				console.error("Waiting for db");
			}
			callback(err, client);
		});
	},
	function (err, client) {
		if (err) {
			return console.error("Giving up");
		}
		console.log("Connected to db");
		// 當成功連接資料庫後，調用getVotes函式
		getVotes(client);
	}
);

// 從資料庫中查詢投票結果，並使用Socket.io將結果發送給所有連接的客戶端
function getVotes(client) {
	client.query('SELECT vote, COUNT(id) AS count FROM votes GROUP BY vote', [], function (err, result) {
		if (err) {
			console.error("Error performing query: " + err);
		} else {
			// 查詢沒錯誤的時候, 呼叫collectVotesFromResult
			var votes = collectVotesFromResult(result);
			io.sockets.emit("scores", JSON.stringify(votes));
		}

		setTimeout(function () { getVotes(client) }, 1000);
	});
}

// 透過getVotes函式執行資料庫查詢獲取的投票結果，並將結果轉換成特定格式的投票統計數
function collectVotesFromResult(result) {
	var votes = { a: 0, b: 0 };

	result.rows.forEach(function (row) {
		votes[row.vote] = parseInt(row.count);
	});

	return votes;
}

// 使用Express中間件設定，包括cookie-parser、body-parser、method-override和處理跨域請求的設定
app.use(cookieParser());
app.use(bodyParser());
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
	next();
});

// 使用Express靜態中間件設定提供靜態檔案的目錄
app.use(express.static(path.join(__dirname, 'build')));
// 定義根路由的處理函式，回傳index.html檔案
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
});


// 啟動伺服器，監聽指定的埠號，並在控制台顯示啟動訊息
server.listen(port, function () {
	var port = server.address().port;
	console.log('App running on port ' + port);
});
