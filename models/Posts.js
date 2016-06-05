
var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
  title: { type: String, required: '{PATH} is required!'},
  body: String,
  isPost: Boolean,
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  author: String
});

mongoose.model('Post', PostSchema);
