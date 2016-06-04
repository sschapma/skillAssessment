
var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
  title: { type: String, required: '{PATH} is required!'},
  link: String,
  body: String,
  isPost: Boolean,
  created_at: { type: Date, default: Date.now },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  author: String
});

PostSchema.pre('save', function(next){
  now = new Date();
  this.updated_at = now;
  next();
});

mongoose.model('Post', PostSchema);
