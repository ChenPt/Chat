// 客户端JS文件  实现接受服务端的response

$(function () {
	var socket = io('127.0.0.1:3232');

	var userMsgs = {
		username: undefined,
		isLogin: false,
		uploadAva: {}
	}
	
	socket.on('connect', function() {
		console.log(userMsgs.isLogin);
		$('.info').text('请填写用户名和选择图片作为头像');
		$('.nick-wrap').css('display','block');
		$('.name-input').get(0).focus();

		//输入名字
		$('.login-button').one("click",function(){
			socket.on('nameExisted',function(){
					alert('用户名已存在');				
			})
		})

		//用户注册提交
		$('.login-button').on("click",function(){
			var avaIsSelect = false;
			if(userMsgs.uploadAva.base64) {
				avaIsSelect = true;
			}
			var name_length = $('.name-input').val().length
			if(name_length >= 2 && name_length <= 10 && avaIsSelect){
				console.log('用户名头像都已选择');
				userMsgs.username = $('.name-input').val();
				var data = {
					nickname: userMsgs.username,
					avatar: userMsgs.uploadAva
				}
				socket.emit('login', data); //将输入框的值和头像作为login事件的参数发送到server
				//注册成功的事件got
				socket.on('loginSuccess',function(){
					userMsgs.isLogin = true;
					$('.login-wrap').css('display','none');  //让注册页面消失
					$('.msg-input').get(0).focus();  //让消息输入框获得焦点
				})	
				return false;
			}
			else if( !avaIsSelect && name_length >= 2 && name_length <= 10 ){
				alert('请选择头像');
				return false;
			}		
			else if( avaIsSelect && name_length < 2 || name_length > 10 ){
				alert('用户名字数在2~10之间');
				return false;
			}
			else if( !avaIsSelect && name_length < 2 || name_length > 10){
				alert('请选择头像，用户名字数在2~10之间');
			}
		})	

		//用户头像文件选择
		$('#avaSelect').on('change',function(){
			var avatar = $('#avaSelect')[0].files[0];
			var nameArray = avatar.name.split('.');
			var type = nameArray[nameArray.length-1];
			var fileName = nameArray[nameArray.length-2];

			if($('#avaSelect')[0].files.length === 0){ return ;}
			if(!rFilter.test(avatar.type)){
				alert('你需要选择一个有效的图片文件');
				return false;
			}

			oFReader.readAsDataURL(avatar);

			oFReader.onload = function (oFREvent) {
				userMsgs.uploadAva= {
					type: type,
					base64: oFREvent.target.result,
					fileName: fileName
				}
				$('.user-select-ava').attr('src',oFREvent.target.result);
			};
		})

		//点击房间名切换房间
		$(".room-list li").on("click",function(attr){
			console.log($(this).attr('name'));  // room1 || room2 || room3 || room4
			let newRoom = $(this).attr('name');
			//
			$(".room-user-wrap").hide(200);
			$(".room-list li").removeClass("selected");				
			$(this).addClass("selected");
			$(`.room-user-wrap[name='${newRoom}wrap']`).show(200);
			socket.emit('changeRoom',newRoom);
		})

		//快捷键发送消息
		$('.msg-input').on('keypress',function(event){
			if(event.ctrlKey && event.keyCode === 10){
				$('.msg-form').submit();
			}
		})

		//点击发送消息按钮
		$('.msg-form').submit(function(){
			var msgLength = $('.msg-input').val().length;

			$('.msg-input').get(0).focus();  //让消息输入框获得焦点  get(0)是将Jquery对象转为DOM对象
			if(msgLength != 0){
				if(userMsgs.username.length > 0){
					socket.emit('chatMsg', $('.msg-input').val()); //chat message事件
				}
				$('.msg-input').val('');  //将输入框内容清空
				return false;
			}
			else {
				$('.send-tips').css({'right':'18px','display':'block'}).animate({
					opacity: '1'
				},300);

				setTimeout(function(){
					$('.send-tips').animate({
						opacity: '0'
					},400).css({'right':'-190px','display':'none'});
				},1300);
				return false;
			}
		});

		//FileReader对象 
		var oFReader = new FileReader(),
		rFilter = /^(?:image\/bmp|image\/cis\-cod|image\/gif|image\/ief|image\/jpeg|image\/jpeg|image\/jpeg|image\/pipeg|image\/png|image\/svg\+xml|image\/tiff|image\/x\-cmu\-raster|image\/x\-cmx|image\/x\-icon|image\/x\-portable\-anymap|image\/x\-portable\-bitmap|image\/x\-portable\-graymap|image\/x\-portable\-pixmap|image\/x\-rgb|image\/x\-xbitmap|image\/x\-xpixmap|image\/x\-xwindowdump)$/i;
		
		//文件选择上传
		$('#fileSelect').on('change',function(){
			var fFile = $('#fileSelect')[0].files[0];	//用户选择的file对象
			var size = fFile.size;
			console.log(fFile);
			var nameArray = fFile.name.split('.');
			var type = nameArray[nameArray.length-1]; 
			var fileName = nameArray[nameArray.length-2];

			if($('#fileSelect')[0].files.length === 0){ return ;}
			
			oFReader.readAsDataURL(fFile);  //读取fFile对象的内容
			oFReader.onload = function (oFREvent) {
				var data = {
					type: type,
					base64: oFREvent.target.result,	//data:URL 格式的字符串表示所读取文件的内容
					fileName: fileName,
					size: size
				}
				console.log(data.type);
				socket.emit('fileMsg', data);		//发送消息到服务端
			};
		})

		//图片选择上传
		$('#imgSelect').on('change',function(){
			var iFile = $('#imgSelect')[0].files[0];
			var size = iFile.size;  //字节
			var nameArray = iFile.name.split('.');
			var type = nameArray[nameArray.length-1]; 
			var fileName = nameArray[nameArray.length-2];
			if($('#imgSelect')[0].files.length === 0){ return ;}

			if ( size > 1048576*10 ) {
				alert("选择的图片不能超过10M");
				return false;
			}
			if (!rFilter.test(iFile.type)) { 
				alert("你需要选择一个有效的图片文件"); 
				return false; 
			}
			
			oFReader.readAsDataURL(iFile);
			oFReader.onload = function (oFREvent) {
				var data = {
					type: type,
					base64: oFREvent.target.result,
					fileName: fileName
				}
				socket.emit('imgMsg', data);
			};
		})

		//在线人数
		socket.on('onlineNums', function(nums){
			var text = 'Cpt聊天室 目前在线：';
			$('h1').text(text+ `${nums}人`);
		})

		//将消息显示到网页中
		socket.on('chatMsg', function(data){  //捕获chat message事件
			let whoseMsg;
			console.log(data);
			if(data.senderId == socket.id){
				whoseMsg = 'myself-msg';
			}
			else {
				whoseMsg = 'others-msg';
			}
			
			var attr = `
			<li>
				<div class="${whoseMsg}">
					<div class="userinfo-wrap">
						<div class="ava-container">
							<img src="${data.userAva}" alt="" class="user-avatar">
						</div>
						<p>${data.userName}</p>
						<span class="send-time">(${data.time})</span>
					</div>
					<p class="text-msg">${data.msg}</p>
				</div>
			</li>`;
			if(userMsgs.isLogin) {
				$('#messages').append(attr);
				$('#messages').scrollTop( $('#messages').get(0).scrollHeight );  //让滚动条保持在底部	
			}

		});

		//让图片消息显示到网页中
		socket.on('imgMsg', function(data){
			let whoseMsg;
			console.log(data);
			if(data.senderId == socket.id){
				whoseMsg = 'myself-msg';
			}
			else {
				whoseMsg = 'others-msg';
			}
			
			var attr = `
			<li>
				<div class="${whoseMsg}">
					<div class="userinfo-wrap">
						<div class="ava-container">
							<img src="${data.userAva}" alt="" class="user-avatar">
						</div>
						<p>${data.userName}</p>
						<span class="send-time">(${data.time})</span>						
					</div>
					<img src="${data.img}" alt="" class="img-msg">
				</div>
			</li>`;

			if(userMsgs.isLogin) {
				$('#messages').append(attr);
				
				//让滚动条保持在底部		
				setTimeout(()=>{
					$('#messages').scrollTop($('#messages').get(0).scrollHeight);
				},100);				
			}

			
		})

		//让文件显示到网页中
		socket.on('fileMsg', function(data){
			let whoseMsg;
			console.log(data);
			if(data.senderId == socket.id){
				whoseMsg = 'myself-msg';
			}
			else {
				whoseMsg = 'others-msg';
			}
			
			var attr = `
			<li>
				<div class="${whoseMsg}">
					<div class="userinfo-wrap">
						<div class="ava-container">
							<img src="${data.userAva}" alt="" class="user-avatar">
						</div>
						<p>${data.userName}</p>
						<span class="send-time">(${data.time})</span>
					</div>
					<a href="${data.file}" target="_blank" download="${data.fileName}" class="file-download" title="点击下载文件">
						<div class="fiie-msg-wrap">
							<div class="text-wrap">
								<p class="filename">${data.fileName}.${data.type}</p>
								<p class="file-size">${data.size}</p>
							</div>
							<img src="img/icons/file.svg" alt="" class="file-msg-icon">
						</div>
					</a>
				</div>
			</li>`;
			if(userMsgs.isLogin) {
				$('#messages').append(attr);
				
				//让滚动条保持在底部		
				setTimeout(()=>{
					$('#messages').scrollTop($('#messages').get(0).scrollHeight);
				},100);		
			}

		})

		//系统消息
		socket.on('sysMsg', function(data){
			// data = {
			// 	userName: nickname,
			// 	type: 'login', || 'change'
			// 	time: that.sendTime,
			//	newRoom: newRoom
			// }
			let type = (data.type === 'login' ? '加入聊天室' : (data.type === 'change' ? '改变聊天室为' : '离开聊天室'));
			let attr =`
			<li>
				<p class="system-msg">系统消息：用户${data.userName}${type}${data.newRoom} <span class="occur-time">(${data.time})</span></p>
			<li>`;
			if(data.userName !== undefined && userMsgs.isLogin) {
				$('#messages').append(attr);
			}
			$('#messages').scrollTop( $('#messages').get(0).scrollHeight );
		});

		//更新每个房间在线的用户
		socket.on('roomList Update', function(data){
			console.log(data);
			let attr = `
			<li name="${data.userName}">
				<div class="onlines-avatar-wrap">
					<img src="${data.avatar}" alt="" class="onlines-avatar">
				</div>
				<p>${data.userName}</p>
			</li>`

			if(data.type == 'change' && userMsgs.isLogin){
				$(`.room-list li[name='${data.userName}']`).remove();
				$(`.room-list div[name='${data.newRoom}wrap']`).append(attr);
				console.log('改变成功');
			} 
			if(data.type == 'leave'){
				// type 为leave
				$(`.room-list li[name='${data.userName}']`).remove();
			}
			if(data.type == 'login' && socket.id != data.socketId && userMsgs.isLogin){
				console.log('新用户加入  room-list改变'+ data.newRoom);
				$(`.room-list div[name='${data.newRoom}wrap']`).append(attr);
			}	
		})

		//获取房间所有用户列表
		socket.on("roomList", function(names, avas, rooms){
			// names: { socketid: 'userName'}  avas:{ socketid:' userAva'} , rooms:{ socketid: 'roomName'}
			for(let socketId in names){
				var attr =`
				<li name="${names[socketId]}">
					<div class="onlines-avatar-wrap">
						<img src="${avas[socketId]}" alt="" class="onlines-avatar">
					</div>
					<p>${names[socketId]}</p>
				</li>`

				$(`.room-list div[name='${rooms[socketId]}wrap']`).append(attr);
			}
		})

		//更新在线用户列表
		socket.on('userList Update',function(data){
			// data = {
			// socketId:socket.id,
			// 	userName: nickname,
			// 	type: 'login',   //加入或离开
			// 	time: that.sendTime,
			//	room: that.currentRoom[socket.id],
			//	avatar: that.userAvas[socket.id]
			// }
			var attr = `
			<li name="${data.userName}">
				<div class="onlines-avatar-wrap">
					<img src="${data.avatar}" alt="" class="onlines-avatar">
				</div>
				<p>${data.userName}</p>
			</li>`

			if(socket.id != data.socketId && data.type != 'leave' && userMsgs.isLogin){
				$('.user-list').append(attr);	
			}
			if(data.type == 'leave') {
				console.log(data.userName);
				$(`li[name='${data.userName}']`).remove();
			}
		})

		//获取在线用户列表
		socket.on('userList',function(names,avas){
			// data: that.userNames, that.userAvas  : {}
			for(let socketId in names){
				var attr =`
				<li name="${names[socketId]}">
					<div class="onlines-avatar-wrap">
						<img src="${avas[socketId]}" alt="" class="onlines-avatar">
					</div>
					<p>${names[socketId]}</p>
				</li>`

				$('.user-list').append(attr);
			}
		})	

		//获取本人头像
		socket.on('myInfo',function(ava,name){
			$(".your-avatar").attr("src",ava);
			$(".your-avatar").attr("title",name);
			$(".my-name").text(name);
		})


	})

	//当与服务端断开连接的时候提示用户已断开连接
	socket.on('disconnect',function(){
		alert('你已经断开连接');
	})
	
});

