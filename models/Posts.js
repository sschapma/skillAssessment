
var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
  title: { type: String, required: '{PATH} is required!'},
  body: String,
  createdOn: { type: Date, default: Date.now },
  votes: {type: Number, default: 0},
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  author: String
});

//saves upvote to database
PostSchema.methods.upvote = function(cb) {
  this.votes += 1;
  this.save(cb);
};

//saves downvote to database
PostSchema.methods.downvote = function(cb) {
  this.votes -= 1;
  this.save(cb);
};

mongoose.model('Post', PostSchema);
