//服务端 JS文件

//引入模块
var express = require('express'),
	app = express(),
	http = require('http').Server(app),			
	path = require('path'),
	chat = require('./chat');


 // 设置public作为存放静态文件的文件夹
app.use(express.static(path.join(__dirname, '../public')));

app.get('/',function(req, res){
	let file = path.join(__dirname, '../public/index.html')  //将目录名和文件名链接到一起，形成一个规范的绝对路径
	res.sendFile(file);  // response， 使'/'的请求都会输出file文件内容
})	


//监听3333端口
http.listen(3333, function(){
  console.log('listening on *:3333');
});

chat.initialize(http);
