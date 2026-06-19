// artillery/helpers.js
module.exports = { generateUser };

function generateUser(userContext, events, done) {
  const id = Math.random().toString(36).substring(2, 10);
  userContext.vars.userEmail = `user_${id}@test.com`;
  userContext.vars.userId    = `user_${id}`;
  return done();
}