const testLoader= require('../util/testLoader');

//IMPORT TEST FILE DISNI
testLoader('/login', '../users/login');
testLoader('/register', '../users/register');
testLoader('/profile', '../users/profile');
testLoader('/topUp', '../users/topUp');
testLoader('/subscribe', '../users/subscribe');
testLoader('/getPremium', '../users/getPremium');
testLoader('/favorite', '../users/favorite');
testLoader('/follow', '../users/follow');
testLoader('/shareRecipe', '../users/share');