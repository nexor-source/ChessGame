const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let waitingQueue = [];
let opponent = null;
let wsMap = new Map(); // 新增一个 Map 对象来存储 WebSocket 连接和消息的对应关系
let games = new Map();

wss.on('connection', ws => {
  ws.on('message', message => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (error) {
      console.error('Invalid JSON:', error);
      return;
    }

    // 解析成功，输出type和data内容
    console.log('Received message:', data.type, data.data);

    switch (data.type) {
      case 'deckData':
        // 检查 data.data 是否是一个数组
        if (!Array.isArray(data.data)) {
          console.error('Invalid data:', data.data);
          return;
        }

        // 以敌方的坐标来记录玩家的卡组信息
        // 遍历data.data这个list的每一个元素，将每个元素的.pos.y -= 6
        data.data = data.data.map(item => {
          item.pos.y = 7 - item.pos.y;
          item.pos.x = 7 - item.pos.x;
          return item;
        });
        wsMap.set(ws, data.data);
        waitingQueue.push(ws);
        // 检查等待队列里面的元素是否大于等于2，如果是，则让玩家两两组成配对，并且发送自己的卡组给对方

        // 检查等待队列里面的元素是否大于等于2，如果是，则让玩家两两组成配对，并且发送自己的卡组给对方
        if (waitingQueue.length >= 2) {
          let player1 = waitingQueue.shift(); // 取出队列中的第一个玩家
          let player2 = waitingQueue.shift(); // 取出队列中的第二个玩家
          
          games.set(player1, player2);
          games.set(player2, player1);

          let tempMoveFirst = Math.random() > 0.5;
          // 将两个玩家的卡组数据发送给对方
          player1.send(JSON.stringify({
            type: 'startGame',
            moveFirst: tempMoveFirst, // 随机决定先手
            data: wsMap.get(player2) // 发送第二个玩家的卡组数据给第一个玩家
          }));
          player2.send(JSON.stringify({
            type: 'startGame',
            moveFirst: !tempMoveFirst, // 随机决定先手
            data: wsMap.get(player1) // 发送第一个玩家的卡组数据给第二个玩家
          }));
        }
        break;

      case 'endGame':
        // 处理游戏结束信息
        opponent = games.get(ws);
        if (opponent) {
          opponent.send(JSON.stringify({
            type: 'endGame',
            data: !data.data
          }));
          ws.send(JSON.stringify({
            type: 'endGame',
            data: data.data
          }));
        }
        break;

      case 'move':
        // 处理移动信息
        opponent = games.get(ws);
        // data是{ from: { x: 3, y: 6 }, to: { x: 3, y: 5 } }，我希望from/to里面的y=7-y，x=7-x
        for (let key in data.data) {
          data.data[key].x = 7 - data.data[key].x;
          data.data[key].y = 7 - data.data[key].y;
        }
        if (opponent) {
          opponent.send(JSON.stringify({
            type: 'move',
            data: data.data
          }));
        }
        break;
      // 其他类型的消息
      default:
        console.error('Unknown message type:', data.type);
    }
  });
  
  ws.on('close', () => {
    // 当连接关闭时，从 wsMap 和 waitingQueue 中移除对应的 ws 对象
    wsMap.delete(ws);
    waitingQueue = waitingQueue.filter(queueWs => queueWs !== ws);
    // 移出games中key或value为ws的项
    games.forEach((value, key) => {
      if (key === ws || value === ws) {
        games.delete(key);
      }
    });
  });

});