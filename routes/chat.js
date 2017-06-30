//chat.js   使用socket.io的API实现聊天功能

var app = require('express')();  
var socketIo = require('socket.io');
var fs = require('fs');   //Node.js 文件对象

var chat = {};

chat = {
	io:false,
	userNames: {},	  // userNames: { nickname: 'socket.id' } 存储所有用户姓名
	userSockets: {},  //userSockets: { socket.id: 'nickname'} 存储所有用户的socket.id
	currentRoom: {},  //当前用户所在的房间名
	sendTime: '',     //某个时间触发时的时间
	onlineNums: 0,	  //在线的客户端数目
	userAvas: {},	  //存储用户的头像
	initialize: function(http){
		this.io = socketIo();
		this.io.listen(3232);
		this.ioListen();
	}    //初始化方法
};

module.exports = chat;

//chat对象监听所有事件
chat.ioListen = function() {
	var that = this;

	that.io.on('connection', function(socket){
		that.login(socket);
		that.assignRoom(socket);
		that.chatMsg(socket);
		that.imgMsg(socket);
		that.fileMsg(socket);
		that.disconnect(socket);
		that.changeRoom(socket);
	});
}


//加入默认的房间 room1
chat.assignRoom = function(socket) {
	var that = this;
    that.currentRoom[socket.id] = 'room1';
    socket.join('room1', function(){
    });
}

// 更改房间
chat.changeRoom = function(socket) {
	var that = this;
	socket.on('changeRoom',function(newRoom){
		getTime();
		//把之前所在的房间名作为变量存起来 并把新房间名字存到currentRoom对象里
		let preRoom = that.currentRoom[socket.id];
		that.currentRoom[socket.id] = newRoom;
		//离开之前的房间
		socket.leave(preRoom,function(){
		})
		
		socket.join(newRoom, function(){   //加入新的房间
		})
		console.log('------------change-----------')
		console.log(that.currentRoom);
		console.log('-----------------------------')
		//把用户改变房间的消息发给所有人
		let temp = {
			userName: that.userNames[socket.id],
			avatar: that.userAvas[socket.id],
			type: 'change',
			time: that.sendTime,
			newRoom: newRoom,
			preRoom: preRoom 
		}
		//如果房间名字是有变化的才分发系统消息
		if(preRoom != newRoom) {
			that.io.emit('sysMsg', temp);
			that.io.emit('roomList Update', temp);
		}
	
	})

}

//聊天文本信息
chat.chatMsg = function(socket) {
	var that = this;

	socket.on('chatMsg', function(msg){   //为chat message事件注册一个监听器
		getTime();
		let data = {
			userName: that.userNames[socket.id], 
			userAva: that.userAvas[socket.id],
			//输入数据进行处理
			msg: msg.split('\n').join('</br>').split('<script>').join(''),
			time: that.sendTime,
			senderId: socket.id
		};
		that.io.to(that.currentRoom[socket.id]).emit('chatMsg',data);   //io.emit  发送事件 chat message 到所有用户  
	});
}

// 聊天图片信息
chat.imgMsg = function(socket){
	var that = this;

	socket.on('imgMsg', function(data){
		getTime();
		let img = base64toBinary(data);
		let res = {
			userName: that.userNames[socket.id], 
			userAva: that.userAvas[socket.id],
			time: that.sendTime,
			senderId: socket.id,
			img: img
		};

		that.io.to(that.currentRoom[socket.id]).emit('imgMsg', res);
	})
}

// 聊天文件信息
chat.fileMsg = function(socket) {
	var that = this;
	socket.on('fileMsg', function(data){
		getTime();
		file = base64toBinary(data);
		let res = {
			userName: that.userNames[socket.id], 
			userAva: that.userAvas[socket.id],
			time: that.sendTime,
			senderId: socket.id,
			file: file,
			fileName: data.fileName,
			type: data.type,
			size: sizeChange(data.size)
		};

		that.io.to(that.currentRoom[socket.id]).emit('fileMsg', res);
	})
}

//断开连接
chat.disconnect = function(socket) {
	var that = this;

	socket.on('disconnect', function() {
		getTime();
		let data = {
			userName: that.userNames[socket.id],
			type: 'leave',
			time: that.sendTime,
			newRoom: that.currentRoom[socket.id]
		}
		//通知除自己以外的所有人
		that.io.emit('userList Update', data);
		that.io.emit('roomList Update', data);
		that.io.to(that.currentRoom[socket.id]).emit('sysMsg', data);
		console.log(that.sendTime+' 用户'+ that.userNames[socket.id] + '离开房间' + that.currentRoom[socket.id]);
		//将断开连接的用户从userNames 和 userSockets 和currentRoom 中删除
		delete that.userSockets[that.userNames[socket.id]];
		delete that.userNames[socket.id];
		delete that.userAvas[socket.id];
		delete that.currentRoom[socket.id];
		that.onlineNums = Object.getOwnPropertyNames(that.userNames).length;
		that.io.emit('onlineNums',that.onlineNums);
		console.log('目前还有'+Object.getOwnPropertyNames(that.userNames).length+'人在线');
	});
}

//用户加入聊天室
chat.login = function(socket) {
	var that = this;

	socket.on('login', function(data) {
		getTime();
		console.log(that.sendTime +'  有一位新用户连接了，他的socketId为： ' + socket.id);
		console.log(that.currentRoom);
		if(data.nickname in that.userSockets){
			//如果用户名存在 则触发nameExisted事件
			socket.emit('nameExisted');
		}
		else {

			socket.emit('userList',that.userNames, that.userAvas);
			that.userSockets[data.nickname] = socket.id;
			that.userNames[socket.id] = data.nickname;
			that.onlineNums = Object.getOwnPropertyNames(that.userNames).length;
			that.userAvas[socket.id] = base64toBinary(data.avatar);
			socket.emit('loginSuccess');
			socket.emit('myInfo',that.userAvas[socket.id],that.userNames[socket.id]);
			socket.emit('roomList', that.userNames, that.userAvas, that.currentRoom);
			console.log(that.currentRoom[socket.id]);
			let res = {
				socketId: socket.id,
				userName: data.nickname,
				type: 'login',
				time: that.sendTime,
				newRoom: that.currentRoom[socket.id],
				avatar: that.userAvas[socket.id]
			}
			that.io.emit('onlineNums',that.onlineNums)
			that.io.emit('userList Update', res);
			that.io.emit('roomList Update', res);
			that.io.to(that.currentRoom[socket.id]).emit('sysMsg',res);
		}
	})
}

//把base64的图片转成二进制
base64toBinary = (data)=>{
	var base64, path;
	//当file为图片类型时
	if(data.type == 'png' ||data.type == 'jpg' || data.type == 'gif') {
		path = 'public/img/' + data.fileName  +'.' + data.type;
		base64 = data.base64.replace(/^data:image\/\w+;base64,/, "");
	}
	else {
		//图片为任意文件类型时
		path = 'public/files/' + data.fileName + '.' + data.type;
		base64= data.base64;
	}
	var dataBuffer = new Buffer(base64, 'base64');
	fs.writeFile(path, dataBuffer, (err) => {
		if(!err){
			console.log('写入成功');
		}
		else {
			console.log(err);
		}
	})

	return path.replace(/public/,'');  //去掉路径中的public
}


sizeChange = (size) => {
	// 传进来的size为字节数
	// 1 字节 = 8 位
	// 1 千字节（KB） = 1 024 字节
	// 1 兆字节（MB） = 1 024 kb = 1 048 576 字节
	// 1 千兆字节（GB） = 1 024 Mb = 1 073 741 824 字节
	// 1 太字节（TB） = 1 024 Gb = 1 099 511 627 776 字节
	// 1 拍字节（PB） = 1 024 Tb = 1 125 899 906 842 624 字节
	var Kb = Math.round(size/1024*100)/100;
	var Mb = Math.round(size/1024/1024*100)/100;

	if(Mb > 1) {
		return Mb + 'M';
	}
	return Kb + 'K';
}

//获取当前操作时间
getTime = () => {
	let time = new Date();
	var minutes = time.getMinutes();
	var hours = time.getHours();
	if(minutes % 10 == minutes){
		minutes = '0' + minutes;
	}
	else {
		minutes = minutes;
	}
	chat.sendTime = hours+ ':' + minutes;
}
