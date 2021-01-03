const testLoader= require('../util/testLoader');

//IMPORT TEST FILE DISNI
testLoader('/search', '../recipes/search');
testLoader('/searchByIngredients', '../recipes/searchByIngredients');
testLoader('/similiar', '../recipes/similiar');
testLoader('/myRecipe', '../recipes/myRecipe');
