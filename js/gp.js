function Tree() {}

Tree.prototype.evolve = function(paramCount, popSize, maxgen, mutationRate, breedingRate, pExp, pNew) {
  var population = [];
  for (var i = 0; i < popSize; i++) {
    population.push(this.createRandomTree(paramCount));
  }
  this.evolveR(population, paramCount, popSize, maxgen, mutationRate, breedingRate, pExp, pNew);
}
Tree.prototype.evolveR = function(population, paramCount, popSize, maxgen, mutationRate, breedingRate, pExp, pNew) {
  var self = this;
  var newPop = [];

  population.forEach(function(item) {
    if (item.score == null) {
      item.score = TestData.score(item);
    }
  });
  population.sort(function(x, y) { return y.score - x.score; });
  var score = TestData.score(population[0]);
  console.log('Score: ' + score);

  newPop.push(population[0]);
  newPop.push(population[1]);
  while (newPop.length < popSize) {
    if (Math.random() > pNew) {
      newPop.push(self.mutateP(self.crossoverP(
        population[self.selectIndex(pExp)],
        population[self.selectIndex(pExp)],
        breedingRate, true), paramCount, mutationRate));
    } else {
      newPop.push(self.createRandomTree(paramCount));
    }
  }
  population = newPop;

  if (maxgen > 1) {
    setTimeout(function() {
      self.evolveR(population, paramCount, popSize, maxgen-1, mutationRate, breedingRate, pExp, pNew);
    }, 100);
  } else {
    console.log('Done');
  }
}

Tree.prototype.selectIndex = function(pExp) { return Math.floor(Math.log(Math.random())/Math.log(pExp)); }

Tree.prototype.crossover  = function(tree1, tree2) { return this.crossoverP(tree1, tree2, 0.7, true); }
Tree.prototype.crossoverP = function(tree1, tree2, probSwap, top) {
  var self = this;
  if (Math.random() < probSwap && !top) {
    return tree2;
  } else if (tree1 instanceof FunctionNode && tree2 instanceof FunctionNode) {
    var children = [];
    tree1.children.forEach(function(item) {
      children.push(self.crossoverP(item, tree2.children[Math.floor(Math.random() * tree2.children.length)], probSwap, false));
    });
    return new FunctionNode(tree1.func, children);
  } else {
    return tree1;
  }
}

Tree.prototype.mutate  = function(tree, paramCount) { return this.mutateP(tree, paramCount, 0.1); }
Tree.prototype.mutateP = function(tree, paramCount, probChange) {
  var self = this;
  if (Math.random() < probChange) {
    return self.createRandomTree(paramCount);
  } else if (tree instanceof FunctionNode) {
    var children = [];
    tree.children.forEach(function(item) {
      children.push(self.mutateP(item, paramCount, probChange));
    });
    return new FunctionNode(tree.func, children);
  } else {
    return tree;
  }
}

Tree.prototype.createRandomTree  = function(paramCount) { return this.createRandomTreeP(paramCount, 4, 0.5, 0.6); }
Tree.prototype.createRandomTreeP = function(paramCount, maxDepth, fpr, ppr) {
  if (Math.random() < fpr && maxDepth > 0) {
    var functions = [new Add(), new Sub(), new Mul(), new Mod(), new If(), new IsGreater()];
    var func = functions[Math.floor(Math.random() * functions.length)];
    var children = [];
    for (var i = 0; i < func.paramCount(); i++) {
      children.push(this.createRandomTreeP(paramCount, maxDepth-1, fpr, ppr));
    }
    return new FunctionNode(func, children);
  } else if (Math.random() < ppr) {
    return new ParamNode(Math.floor(Math.random() * paramCount));
  } else {
    return new ConstNode(Math.floor(Math.random() * 11));
  }
}



function ConstNode(value) { this.value = value; }
function ParamNode(index) { this.index = index; }
function FunctionNode(func, children) {
  this.func = func;
  this.children = children;
}

ConstNode.prototype.eval    = function(params) { return this.value; }
ParamNode.prototype.eval    = function(params) { return params[this.index]; }
FunctionNode.prototype.eval = function(params) {
  var results = [];
  this.children.forEach(function(item) {
    results.push(item.eval(params));
  });
  return this.func.f(results);
}



function Add() {}
function Sub() {}
function Mul() {}
function Mod() {}
function If() {}
function IsGreater() {}

Add.prototype.f       = function(p) { return p[0] + p[1]; }
Sub.prototype.f       = function(p) { return p[0] - p[1]; }
Mul.prototype.f       = function(p) { return p[0] * p[1]; }
Mod.prototype.f       = function(p) { var n = p[1]===0 ? 1 : p[1]; return ((p[0]%n)+n)%n; }
If.prototype.f        = function(p) { return p[0] > 0 ? p[1] : p[2]; }
IsGreater.prototype.f = function(p) { return p[0] > p[1] ? 1 : 0; }

Add.prototype.paramCount       = function() { return 2; }
Sub.prototype.paramCount       = function() { return 2; }
Mul.prototype.paramCount       = function() { return 2; }
Mod.prototype.paramCount       = function() { return 2; }
If.prototype.paramCount        = function() { return 3; }
IsGreater.prototype.paramCount = function() { return 2; }



function TestData() {}
TestData.score = function(tree) {
  var score = 0;
  var grid = new Grid(4);
  grid.addStartTiles();
  while (grid.movesAvailable()) {
    var vals = [];
    for (var x = 0; x < grid.size; x++) {
      for (var y = 0; y < grid.size; y++) {
        if (grid.cells[x][y]) {
          vals.push(grid.cells[x][y].value);
        } else {
          vals.push(-1);
        }	
      }
    }

    var dir = tree.eval(vals);
    if (dir < 0 || dir > 3) break;
    var res = grid.move(dir);
    if (!res.moved) break;

    score += res.score;
    grid.addRandomTile();
  }
  return score;
}



ConstNode.prototype.display = function(indent) { console.log(indent + this.value); }
ParamNode.prototype.display = function(indent) { console.log(indent + 'p' + this.index); }
FunctionNode.prototype.display = function(indent) {
  console.log(indent + this.func.constructor.name);
  this.children.forEach(function(item) {
    item.display(indent + '\t');
  });
}

//new Tree().evolve(16, 2000, 3000, 0.2, 0.1, 0.7, 0.1);

