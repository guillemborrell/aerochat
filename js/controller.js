angular.module('app', ['ngResource','ngSanitize']);

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function IndexPage($scope, $resource){
    $scope.chats = [];
    var ongetresource = $resource('/API/chat', {}, {});
    var data = ongetresource.get({}, function(){
	for (i in data.chats){
	    $scope.chats.push(data.chats[i]);
	}
    }
				)
}


function UserPage($scope, $resource) {
    $scope.name = "";
    $scope.save = false;
    $scope.persistent = false;
    $scope.conversations = false;
    $scope.privte = false;
    $scope.chats = [];
    $scope.activity = [];
    var ongetresource = $resource('/API/chat?user=true', {}, {});
    var data = ongetresource.get({}, function(){
	for (i in data.chats){
	    $scope.chats.push(data.chats[i]);
	}
	for (j in data.activity){
	    $scope.activity.push(data.activity[j]);
	}
    }
				)
    $scope.replaceSave = function(chat) {
	chat.save = false;
    }

    $scope.createChat = function() {
	var oncreateresource = $resource('/API/chat',{}, { post: {method:'POST'}});
	var data = oncreateresource.post({
	    "name": $scope.name,
	    "save": $scope.save,
	    "persistent": $scope.persistent,
	    "private": $scope.privte,
	    "conversations": $scope.conversations
	    }
					);
	document.getElementById("form").innerHTML = '<p>Successfully created. <a href="/new">Refresh</a> the page.</p>';
    }
    $scope.embedCode = function(chat) {
	var embed_string = '<iframe width="320px" height="600px" scrolling="auto", src=http://cloudchatroom.appspot.com/embed?key=' + chat.key + '"></iframe>';
	window.prompt("Copy to clipboard: Ctrl+C, Enter", embed_string);
    }
}

function MainPage($scope,$resource,$sce) {
    $scope.newMessageCounter = 0;
    $scope.token = "";
    $scope.id = "";
    $scope.author = "";
    $scope.connected = 1;
    $scope.title = "Cloud Chat";
    $scope.message = "";
    $scope.messages = [];
    $scope.cursor = "Empty";
    $scope.more = true;
    $scope.conversations = false;
    $scope.invite = function(guest){
	if ($scope.id != guest){
	    if (guest != '0'){
		var oninviteresource = $resource('/API/invite');
		var data = oninviteresource.save({'from': $scope.id,
						  'author': $scope.author,
						  'to': guest});
	    }
	}
    }
    $scope.onOpened = function() {
	var onopenresource = $resource('/API/opened',{},{ post: {method:'POST'}});
	var data = onopenresource.post({
	    'id': $scope.id});
    };

    $scope.onClosed = function() {
	var onopenresource = $resource('/API/closed',{},{ post: {method:'POST'}});
	var data = onopenresource.post({
	    'id': $scope.id});
    };


    $scope.onMessage = function(m) {
        data = JSON.parse(m.data);
	messages = data.message
	$scope.$apply(function () {
	    $scope.connected = data.clients;
	    if (data.cursor){
		$scope.cursor = data.cursor;
	    }
	    $scope.title = data.name;
	    if (document.hidden) {
		$scope.newMessageCounter = $scope.newMessageCounter + 1;
	    }
	    if ($scope.newMessageCounter > 0){
		document.title = '('+$scope.newMessageCounter+') '+$scope.title;
	    }
	    for (i in messages){
		$scope.messages.unshift(
		    {"author": $sce.trustAsHtml(messages[i].author),
		     "when": messages[i].when,
		     "id": messages[i].id,
		     "text": $sce.trustAsHtml(messages[i].text)}
			    );
		}
	}
		     );
    };

    $scope.connect = function(){
	$scope.channel = new goog.appengine.Channel($scope.token);
	$scope.handler = {
	    'onopen': $scope.onOpened,
	    'onmessage': $scope.onMessage,
	    'onerror': function() {},
	    'onclose': $scope.onClosed,
	}
	$scope.socket = $scope.channel.open($scope.handler);
	$scope.socket.onopen = $scope.onOpened;
	$scope.socket.onmessage = $scope.onMessage;
    }

    var tokenresource = $resource("/API/token?key=:q");
    var data = tokenresource.get({q:getParameterByName('key')}, function(){
    	$scope.token = data.token;
	$scope.id = data.id;
	$scope.conversations = data.conversations;
	$scope.connect();
    });

    $scope.sendMessage = function(){
	var messageresource = $resource('/API/message',{},{ post: {method:'POST'}});
	var data = messageresource.post({
	    'id': $scope.id,
	    'author': $scope.author,
	    'text': $scope.message
	}
				       );
	$scope.message="";
	$scope.newMessageCounter = 0;
	document.title = $scope.title;
    };

    $scope.archiveResource = $resource('/API/archive');
    $scope.loadOlder = function(){
	if ($scope.more){
	    dataa = $scope.archiveResource.get(
		params={cursor: $scope.cursor,
			id: $scope.id},
		function() {
		    $scope.more = dataa.more;
		    $scope.cursor = dataa.cursor;
		    for ( i in dataa.messages ){
			$scope.messages.push(dataa.messages[i])
		    }
		}
	    );
	}
    }
};
    
