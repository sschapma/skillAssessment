
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
  //upvotes a post
  o.upvote = function(post) {
    return $http.put('/posts/' + post._id + '/upvote', null, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      post.votes += 1;
    });
  };
  // downvotes a post
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
  //upvotes a comment
  o.upvoteComment = function(post, comment) {
    return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvoteComment', null, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      comment.votes += 1;
    });
  };
  //downvotes a comment
  o.downvoteComment = function(post, comment) {
    return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/downvoteComment', null, {
      headers: {Authorization: 'Bearer '+auth.getToken()}
    }).success(function(data){
      comment.votes -= 1;
    });
  };
  return o;
}])

//handles authorization and tokens for users
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
function($scope, posts, auth, upvote, downvote){
  $scope.posts = posts.posts;
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;

  // makes it so a user can only add one upvote (or downvote)
  // also targets the correct post
  $scope.upDisabled = [];
  $scope.downDisabled = [];
  for (i=0; i<$scope.posts.length; i++){
    $scope.upDisabled.push(false);
    $scope.downDisabled.push(false);
  }
  //targets classes for coloring
  var myEl = document.getElementsByClassName('upvote');
  var myEl2 = document.getElementsByClassName('voteAmount');
  var myEl3 = document.getElementsByClassName('downvote');

  //add new post
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
    $scope.body = '';
  };

  //changes color for upvotes
  $scope.changeUp = function(index){
    myEl[index].style.color = "#FF8A5E";
    myEl2[index].style.color = "#FF8A5E";
    myEl3[index].style.color = "black";
  };

  //changes color for downvotes
  $scope.changeDown = function(index){
    myEl[index].style.color = "black";
    myEl2[index].style.color = "#9494FF";
    myEl3[index].style.color = "#9494FF";
  };

  //reverts back to original color
  $scope.undoChange = function(index){
    myEl[index].style.color = "black";
    myEl2[index].style.color = "black";
    myEl3[index].style.color = "black";
  };

  //upvote a post
  $scope.increaseVotes = function(post){
    var index = $scope.posts.indexOf(post);
    if ($scope.upDisabled[index]) {
      posts.downvote(post, auth);
      $scope.undoChange(index);
      $scope.upDisabled[index] = false;
      $scope.downDisabled[index] = false;
    } else if (!$scope.upDisabled[index] && $scope.downDisabled[index]) {
      posts.upvote(post, auth);
      posts.upvote(post, auth);
      $scope.changeUp(index);
      $scope.upDisabled[index] = true;
      $scope.downDisabled[index] = false;
    } else {
      posts.upvote(post, auth);
      $scope.changeUp(index);
      $scope.upDisabled[index] = true;
      $scope.downDisabled[index] = false;
    }
  };

  //downvote a post
  $scope.decreaseVotes = function(post){
    var index = $scope.posts.indexOf(post);
    if ($scope.downDisabled[index]) {
      posts.upvote(post, auth);
      $scope.undoChange(index);
      $scope.upDisabled[index] = false;
      $scope.downDisabled[index] = false;
    } else if (!$scope.downDisabled[index] && $scope.upDisabled[index]) {
      posts.downvote(post, auth);
      posts.downvote(post, auth);
      $scope.changeDown(index);
      $scope.upDisabled[index] = false;
      $scope.downDisabled[index] = true;
    } else {
      posts.downvote(post, auth);
      $scope.changeDown(index);
      $scope.upDisabled[index] = false;
      $scope.downDisabled[index] = true;
    }
  };

  //delete a post
  $scope.deletePost = function(post){
      posts.delete(post, auth);
  };

  //hides the option to delete if not the posts author
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
  $scope.currentUser = auth.currentUser;

  // makes it so a user can only add one upvote (or downvote)
  // also targets the correct comment
  $scope.upCommentDisabled = [];
  $scope.downCommentDisabled = [];
  for (i=0; i<$scope.post.comments.length; i++){
    $scope.upCommentDisabled.push(false);
    $scope.downCommentDisabled.push(false);
  }

  // targeting for color
  var myEl = document.getElementsByClassName('upvote');
  var myEl2 = document.getElementsByClassName('voteAmount');
  var myEl3 = document.getElementsByClassName('downvote');

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

  // changes color for upvote
  $scope.changeUp = function(index){
    myEl[index].style.color = "#FF8A5E";
    myEl2[index].style.color = "#FF8A5E";
    myEl3[index].style.color = "black";
  };

  //changes color for downvote
  $scope.changeDown = function(index){
    myEl[index].style.color = "black";
    myEl2[index].style.color = "#9494FF";
    myEl3[index].style.color = "#9494FF";
  };

  // reverts back to black
  $scope.undoChange = function(index){
    myEl[index].style.color = "black";
    myEl2[index].style.color = "black";
    myEl3[index].style.color = "black";
  };

  //handles upvoting comments (only allows to upvote once)
  $scope.increaseCommentVotes = function(comment){
    var index = $scope.post.comments.indexOf(comment);
    if ($scope.upCommentDisabled[index]) {
      posts.downvoteComment(post, comment, auth);
      $scope.undoChange(index);
      $scope.upCommentDisabled[index] = false;
      $scope.downCommentDisabled[index] = false;
    } else if (!$scope.upCommentDisabled[index] && $scope.downCommentDisabled[index]) {
      posts.upvoteComment(post, comment, auth);
      posts.upvoteComment(post, comment, auth);
      $scope.changeUp(index);
      $scope.upCommentDisabled[index] = true;
      $scope.downCommentDisabled[index] = false;
    } else {
      posts.upvoteComment(post, comment, auth);
      $scope.changeUp(index);
      $scope.upCommentDisabled[index] = true;
      $scope.downCommentDisabled[index] = false;
    }
  };

  //handles downvoting comments (only allows to downvote once)
  $scope.decreaseCommentVotes = function(comment){
    var index = $scope.post.comments.indexOf(comment);
    if ($scope.downCommentDisabled[index]) {
      posts.upvoteComment(post, comment, auth);
      $scope.undoChange(index);
      $scope.upCommentDisabled[index] = false;
      $scope.downCommentDisabled[index] = false;
    } else if (!$scope.downCommentDisabled[index] && $scope.upCommentDisabled[index]) {
      posts.downvoteComment(post, comment, auth);
      posts.downvoteComment(post, comment, auth);
      $scope.changeDown(index);
      $scope.upCommentDisabled[index] = false;
      $scope.downCommentDisabled[index] = true;
    } else {
      posts.downvoteComment(post, comment, auth);
      $scope.changeDown(index);
      $scope.upCommentDisabled[index] = false;
      $scope.downCommentDisabled[index] = true;
    }
  };

  //deletes a comment and removes it from screen
  $scope.removeComment = function(comment){
      posts.deleteComment(post, comment, auth);
      var index = $scope.post.comments.indexOf(comment);
      $scope.post.comments.splice(index, 1);
  };

  //hides option to delete if not comment author
  $scope.hideCommentDelete = function(auth, comment){
    if ($scope.currentUser() == comment.author) {
      return true;
    }
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
