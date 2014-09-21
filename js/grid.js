function Grid() {
  this.cells = null;
}

Grid.prototype.getAcitiveColor = function(){
  return this.activeColor;
};

Grid.prototype.initialize = function(fen){
  if (!this.vaildFen(fen)) return false;

  this.cells = this.fromFen(fen);

  var atts = fen.replace(/(s*$)/g, "").split(" ");
  this.activeColor = atts[1];
  this.castling = atts[2];
  this.enpass = atts[3] == "-" ? 0 :parseInt(atts[3]);
  this.nhalfmove = parseInt(atts[4]);
  this.nfullmove = parseInt(atts[5]);

  return true;
};

Grid.prototype.vaildFen = function (fen) {
  if (typeof fen !== 'string') return false;

  var atts = fen.replace(/(s*$)/g, "").split(" ");
  if (atts.length != 6) return false;
  // cut off any move, castling, etc info from the end
  // we're only interested in position information
  fen = fen.replace(/ .+$/, '');

  // FEN should be 8 sections separated by slashes
  var chunks = fen.split('/');
  if (chunks.length !== 8) return false;

  // check the piece sections
  for (var i = 0; i < 8; i++) {
    if (chunks[i] === '' ||
        chunks[i].length > 8 ||
        chunks[i].search(/[^kqrbnpKQRNBP1-8]/) !== -1) {
      return false;
    }
  }

  return true;
};

Grid.prototype.fromFen = function(fen){
  s="abcdefgh"
  var cells = []

  if (!this.vaildFen(fen)) return false;

  var rows = fen.replace(/ .+$/,'').split('/');

  for (var i = 0; i < rows.length; i++){
    cells[i] = [];
    var row = rows[i];
    var colIndex = 0;
        // loop through each character in the FEN section
    for (var j = 0; j < row.length; j++) {
      // number / empty squares
      if (row[j].search(/[1-8]/) !== -1) {
        var emptySquares = parseInt(row[j], 10);
        for (var k = 0;k < emptySquares;k++){
          cells[i].push(null);
          colIndex++;
        }
      }
      // piece
      else {
        cells[i].push( new Tile({x:s[colIndex],y:8-i},row[j]));
        colIndex++;
      }
    }
  }

  return cells;
};

Grid.prototype.getCellValue = function(){

};

Grid.prototype.getStartPosition = function(color,value,x2,y2,x1){
  for (var i = 0;i < 8;i++){
    for (var j = 0;j<8;j++){
      if (this.cells[i][j] && this.cells[i][j].value == value){
        var xy1 = this.positionTranslateIJ2XY({i:i,j:j});
        if(x1){
          if (xy1.x === x1)
            return xy1;
        }else{
          move = ""+xy1.x+xy1.y+x2+y2;
          if ("P" == value)
            move += "Q";
          if (this.checkMove(color,move))
            return xy1;
        }
      }
    }
  }
  return null;
};

Grid.prototype.normalize = function(pmove,color){
  pmove = pmove.replace(/(^\s*)|(\s*$)/g, "");
  re = /^([PRNBKQ]?)([a-h|]?)([1-8]?)([x|-]?)([a-h])([1-8])(=Q|=N|\=R|\=B?)/;
  if(re.test(pmove)){
    var m = RegExp.$1 || "P";
    var x1 = RegExp.$2;
    var y1 = RegExp.$3;
    var x2 = RegExp.$5;
    var y2 = RegExp.$6;
    var c = RegExp.$7 && RegExp.$7[1];

    return x1+y1+x2+y2+c;
  }else
    return "";
};

Grid.prototype.checkMoveP = function(color,ij1,ij2){
  return true;
};
Grid.prototype.checkMoveR = function(color,ij1,ij2){
  return true;
};
Grid.prototype.checkMoveN = function(color,ij1,ij2){
  return true;
};
Grid.prototype.checkMoveB = function(color,ij1,ij2){
  return true;
};
Grid.prototype.checkMoveK = function(color,ij1,ij2){
  return true;
};

Grid.prototype.checkMove = function(color,move){
  // move = "e2e4P"
  move = move.replace(/(^\s*)|(\s*$)/g, "");
  re = /^([a-h])([1-8])([a-h])([1-8])([RNBQ]?)/;
  if(re.test(pmove)){
    var x1 = RegExp.$1;
    var y1 = parseInt(RegExp.$2);
    var x2 = RegExp.$3;
    var y2 = parseInt(RegExp.$4);
    var c = RegExp.$5;

    ij1 = this.positionTranslateXY2IJ({x:x1,y:y1});
    ij2 = this.positionTranslateXY2IJ({x:x2,y:y2});

    if(!this.cells[ij1.i][ij1.j]) return false;
    value = this.cells[ij1.i][ij1.j].value.toUpperCase();

    var checkfn = "checkmove"+value;

    if(!this.checkfn(this.activeColor,ij1,ij2))
      return false;

    if(!this.kingUnderAttackAfterMove(move))
      //after move ,the king can't be under attack
      return false;

    return true;
  }
  return false;
};

Grid.prototype.kingUnderAttackAfterMove = function(move){
  //TODO ...
};

Grid.prototype.move = function(move){
  xy1 = {x:move[0],y:parseInt(move[1])};
  ij1 = this.positionTranslateXY2IJ(xy1);
  i1 = ij1.i;j1 = ij1.j;

  xy2 = {x:move[2],y:parseInt(move[3])};
  ij2 = this.positionTranslateXY2IJ(xy2);
  i2 = ij2.i;j2 = ij2.j;

  var value = this.cells[i1][j1].value;
  if (move.length >4)
    value = move[4];
    if (this.activeColor === "w")
      value = value.toUpperCase();

 
  this.cells[i2][j2] = new Tile(xy2,value);
  if (! (i1 == i2 && j1 ==j2))
    this.cells[i1][j1] = null;

  if (this.activeColor === "w")
    this.nfullmove += 1;

  //TODO add this.nhalfmove
  //TODO check enpass
  //TODO check castling

  this.switchPlayer();
  this.lastmove = move;
};


Grid.prototype.switchPlayer = function(){
  if(this.activeColor == "w")
    this.activeColor = "b";
  else
    this.activeColor = "w";
}


Grid.prototype.positionTranslateXY2IJ = function(xy){
  s = "abcdefgh";
  return { i: 8-xy.y,j: s.indexOf(xy.x) };
}

Grid.prototype.positionTranslateIJ2XY = function(ij){
  i = ij.i;
  j = ij.j;
  s = "abcdefgh";
  return {x: s[j],y:8-i};
};

// Build a grid of the specified size
Grid.prototype.empty = function () {
  var cells = [];


  for (var x = 0; x < this.size; x++) {
    var row = cells[x] = [];

    for (var y = 0; y < this.size; y++) {
      row.push(null);
    }
  }

  return cells;
};

Grid.prototype.getCells = function(){
  return this.cells;
};


// Call callback for every cell
Grid.prototype.eachCell = function (callback) {
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      callback(x, y, this.cells[x][y]);
    }
  }
};


//===============================================================================================================================

Grid.prototype.fromState = function (state) {
  var cells = [];

  for (var x = 0; x < this.size; x++) {
    var row = cells[x] = [];

    for (var y = 0; y < this.size; y++) {
      var tile = state[x][y];
      row.push(tile ? new Tile(tile.position, tile.value) : null);
    }
  }

  this.cells = cells;
};

// Check if there are any cells available
Grid.prototype.cellsAvailable = function () {
  return !!this.availableCells().length;
};

// Check if the specified cell is taken
Grid.prototype.cellAvailable = function (cell) {
  return !this.cellOccupied(cell);
};

Grid.prototype.cellOccupied = function (cell) {
  return !!this.cellContent(cell);
};

Grid.prototype.cellContent = function (cell) {
  if (this.withinBounds(cell)) {
    return this.cells[cell.x][cell.y];
  } else {
    return null;
  }
};


Grid.prototype.serialize = function () {
  var cellState = [];

  for (var x = 0; x < this.size; x++) {
    var row = cellState[x] = [];

    for (var y = 0; y < this.size; y++) {
      row.push(this.cells[x][y] ? this.cells[x][y].serialize() : null);
    }
  }

  return {
    size: this.size,
    cells: cellState
  };
};
