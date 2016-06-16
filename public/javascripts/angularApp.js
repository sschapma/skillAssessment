
angular.module('samsForum', ['ui.router', '720kb.socialshare',])
.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {
  $stateProvider
    //routes to home page
    .state('home', {
      url: '/home',
      templateUrl: '/home.html',
      controller: 'MainCtrl',
      resolve: {
        postPromise: ['posts', function(posts){
          return posts.getAll();
        }]
      }
    })
    //routes to post / comments page
    .state('posts', {
      url: '/posts/{id}',
      templateUrl: '/posts.html',
      controller: 'PostsCtrl',
      resolve: {
        post: ['$stateParams', 'posts', function($stateParams, posts) {
          return posts.get($stateParams.id);
        }]
      }
    })
    //routes to login page
    .state('login', {
      url: '/login',
      templateUrl: '/login.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          $state.go('home');
        }
      }]
    })
    //routes to register page
    .state('register', {
      url: '/register',
      templateUrl: '/register.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          $state.go('home');
        }
      }]
    });
  //routes to home page if another page isn't provided
  $urlRouterProvider.otherwise('home');
}])
.factory('posts', ['$http', 'auth', function($http, auth){
  var o = {
    posts: []
  };
  //gets a post by id
  o.get = function(id) {
    return $http.get('/posts/' + id).then(function(res){
      return res.data;
    });
  };

  //gets all posts
  o.getAll = function() {
    return $http.get('/posts').success(function(data){
      angular.copy(data, o.posts);
    });
  };
  //create new post
  o.create = function(post) {
    return $http.post('/posts', post, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      o.posts.push(data);
    });
  };

  //delete post
  o.delete = function(post) {
    return $http.delete('/posts/' + post._id, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      o.getAll();
    });
  };

  o.upvote = function(post) {
    return $http.put('/posts/' + post._id + '/upvote', null, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      post.votes += 1;
    });
  };
  o.downvote = function(post) {
    return $http.put('/posts/' + post._id + '/downvote', null, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      post.votes -= 1;
    });
  };
  //adds a comment
  o.addComment = function(id, comment) {
    return $http.post('/posts/' + id + '/comments', comment, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    });
  };

  //delete comment
  o.deleteComment = function(post, comment) {
    return $http.delete('/posts/' + post._id + '/comments/'+ comment._id, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){

    });
  };

  o.upvoteComment = function(post, comment) {
    return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvoteComment', null, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      comment.votes += 1;
    });
  };
  o.downvoteComment = function(post, comment) {
    return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/downvoteComment', null, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      comment.votes -= 1;
    });
  };

  return o;
}])

.factory('auth', ['$http', '$window', '$rootScope', function($http, $window, $rootScope){
   var auth = {
    saveToken: function (token){ //saves token to local storage
      $window.localStorage['sams-forum-token'] = token;
    },
    getToken: function (){ //gets token from local storage
      return $window.localStorage['sams-forum-token'];
    },
    isLoggedIn: function(){
      var token = auth.getToken();

      if(token){
        var payload = JSON.parse($window.atob(token.split('.')[1]));

        return payload.exp > Date.now() / 1000;
      } else {
        return false;
      }
    },
    currentUser: function(){
      if(auth.isLoggedIn()){
        var token = auth.getToken();
        var payload = JSON.parse($window.atob(token.split('.')[1]));

        return payload.username;
      }
    },
    register: function(user){
      return $http.post('/register', user).success(function(data){
        auth.saveToken(data.token);
      });
    },
    logIn: function(user){
      console.log(user);
      return $http.post('/login', user).success(function(data){
        auth.saveToken(data.token);
      });
    },
    logOut: function(){
      $window.localStorage.removeItem('sams-forum-token');
    }
  };

  return auth;
}])
// controls posts
.controller('MainCtrl', [
'$scope',
'posts',
'auth',
function($scope, posts, auth, upvote, downvote, $route){
  $scope.posts = posts.posts;
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;

  $scope.addPost = function(){
    //prevents empty posts
    if(($scope.title === '') || ($scope.body === '')) { return; }
    //creates post
    posts.create({
      title: $scope.title,
      votes: 0,
      createdOn: Date.now(),
      link: $scope.link,
      body: $scope.body,
    });
    //returns empty values after post is created
    $scope.title = '';
    $scope.link = '';
    $scope.body = '';
  };

  $scope.increaseVotes = function(post){
      posts.upvote(post, auth);
      var index = $scope.posts.indexOf(post);
      var myEl = document.getElementsByClassName('upvote');
      var myEl2 = document.getElementsByClassName('voteAmount');
      var myEl3 = document.getElementsByClassName('downvote');
      myEl[index].style.color = "#FF8A5E";
      myEl2[index].style.color = "#FF8A5E";
      myEl3[index].style.color = "black";
  };
  $scope.decreaseVotes = function(post){
      posts.downvote(post, auth);
      var index = $scope.posts.indexOf(post);
      var myEl = document.getElementsByClassName('upvote');
      var myEl2 = document.getElementsByClassName('voteAmount');
      var myEl3 = document.getElementsByClassName('downvote');
      myEl[index].style.color = "black";
      myEl2[index].style.color = "#9494FF";
      myEl3[index].style.color = "#9494FF";
  };
  $scope.deletePost = function(post){
      posts.delete(post, auth);
  };
  $scope.hideDelete = function(auth, post){
    if ($scope.currentUser() == post.author) {
      return true;
    }
  };

}])
//controls comments
.controller('PostsCtrl', [
'$scope',
'posts',
'post',
'auth',
function($scope, posts, post, auth){
  $scope.post = post;
  $scope.isLoggedIn = auth.isLoggedIn;
  //adds comment to post
  $scope.addComment = function(){
    // prevents empty comment
    if($scope.body === '') { return; }
    posts.addComment(post._id, {
      body: $scope.body,
      author: 'user',
      createdOn: Date.now(),
      votes: 0,
    }).success(function(comment) {
      $scope.post.comments.push(comment);
    });
    //returns empty value after posting comment
    $scope.body = '';
  };
  $scope.increaseCommentVotes = function(comment){
      posts.upvoteComment(post, comment, auth);
      var index = $scope.post.comments.indexOf(comment);
      console.log(index);
      var myEl = document.getElementsByClassName('upvote');
      var myEl2 = document.getElementsByClassName('voteAmount');
      var myEl3 = document.getElementsByClassName('downvote');
      myEl[index].style.color = "#FF8A5E";
      myEl2[index].style.color = "#FF8A5E";
      myEl3[index].style.color = "black";
  };
  $scope.decreaseCommentVotes = function(comment){
      posts.downvoteComment(post, comment, auth);
      var index = $scope.post.comments.indexOf(comment);
      var myEl = document.getElementsByClassName('upvote');
      var myEl2 = document.getElementsByClassName('voteAmount');
      var myEl3 = document.getElementsByClassName('downvote');
      myEl[index].style.color = "black";
      myEl2[index].style.color = "#9494FF";
      myEl3[index].style.color = "#9494FF";
  };
  $scope.removeComment = function(comment){
      posts.deleteComment(post, comment, auth);
      var index = $scope.post.comments.indexOf(comment);
      $scope.post.comments.splice(index, 1);
  };


}])
//controls registering and logging in
.controller('AuthCtrl', [
'$scope',
'$state',
'auth',
function($scope, $state, auth){
  $scope.user = {};
  $scope.register = function(){
    auth.register($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };
  $scope.logIn = function(){
    console.log($scope.user);
    auth.logIn($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };
}])
.controller('NavCtrl', [
'$scope',
'auth',
function($scope, auth){
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logOut = auth.logOut;
}]);
