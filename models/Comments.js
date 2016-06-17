var mongoose = require('mongoose');

var CommentSchema = new mongoose.Schema({
  body: String,
  author: String,
  createdOn: { type: Date, default: Date.now },
  votes: {type: Number, default: 0},
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }
});

// saves upvote to database
CommentSchema.methods.upvoteComment = function(cb) {
  this.votes += 1;
  this.save(cb);
};

//saves downvote to database
CommentSchema.methods.downvoteComment = function(cb) {
  this.votes -= 1;
  this.save(cb);
};

mongoose.model('Comment', CommentSchema);
