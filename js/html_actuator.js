function HTMLActuator() {
  this.tileContainer    = document.querySelector(".tile-container");
  this.scoreContainer   = document.querySelector(".score-container");
  this.bestContainer    = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");

  this.score = 0;
}



HTMLActuator.prototype.actuate = function (game_manager,player,metadata) {
  var self = this;
  this.gm = game_manager;
  this.player = player;

  self.grid = this.gm.grid;
  self.player = player;

  window.requestAnimationFrame(function () {
    self.clearContainer(self.tileContainer);

    self.grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell);
        }
      });
    });

  });
};


HTMLActuator.prototype.showMove = function (move){
  //TODO
};

HTMLActuator.prototype.isOver = function (move){
  return false;
}

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continueGame = function () {
  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.addTile = function (tile) {
  var self = this;

  var wrapper   = document.createElement("div");
  var inner     = document.createElement("div");
  var position  = { x: tile.x, y: tile.y };
  var positionClass = this.positionClass(position);

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.value, positionClass];

  this.applyClasses(wrapper, classes);

  inner.classList.add("tile-inner");
  //inner.textContent = tile.value;
  // console.log("debug  "+this.player.color);
  if(this.player.active){
    if (/^[a-z]+$/.test(tile.value) && this.player.color == "b"  || /^[A-Z]+$/.test(tile.value) && this.player.color == "w" ){
      classes.push("tile-active");
      this.drag(wrapper);
    }
  }

  if (this.grid.cellIsUnderAttack({x:tile.x,y:tile.y})){
    classes.push("tilehint");
  }
  this.applyClasses(wrapper, classes);

  // Add the inner part of the tile to the wrapper
  wrapper.appendChild(inner);
  // Put the tile on the board
  this.tileContainer.appendChild(wrapper);
};



HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  s = "abcdefgh";
  x = 8-position.y;
  y = s.indexOf(position.x);
  return { x: x+1, y: y+1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.y + "-" + position.x;
};


HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + difference;

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.message = function (won) {
  var type    = won ? "game-won" : "game-over";
  var message = won ? "You win!" : "Game over!";

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;
};

HTMLActuator.prototype.clearMessage = function () {
  // IE only takes one value to remove at a time.
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
};

HTMLActuator.prototype.drag = function(oDrag) {
  var disX = dixY = 0;
  var player = this.player;
  var container = this.tileContainer;
  var grid = this.grid;
  var gm = this.gm;

  oDrag.onmousedown = function(event) {
    var event = event || window.event;
    disX = event.clientX - this.offsetLeft;
    disY = event.clientY - this.offsetTop;

    var oTemp = this;

    var totalwidth = 500;
    var pxy = oTemp.className.match(/\d/g);
    var px = pxy[0]-1;
    var py = pxy[1]-1;
    var tranleft = px*totalwidth/8;
    var trantop = py*totalwidth/8;
    var minL = -tranleft;
    var maxL = totalwidth-tranleft-500/8;
    var minT = -trantop;
    var maxT = totalwidth -trantop-500/8;
    var iL = 0;
    var iT = 0;
    oTemp.style.zIndex+=1;

    document.onmousemove = function(event) {
      var event = event || window.event;
      iL = event.clientX - disX;
      iT = event.clientY - disY;

      iL <= minL && (iL = minL);
      iT <= minT && (iT = minT);
      iL >= maxL && (iL = maxL);
      iT >= maxT && (iT = maxT);
      //oTemp.style.opacity = "0.5";
      //oTemp.style.filter = "alpha(opacity=50)";
      oTemp.style.left = iL + "px";
      oTemp.style.top = iT + "px";
      return false;
    };

    document.onmouseup = function() {
      document.onmousemove = null;
      document.onmouseup = null;
      var arr = {
        left: oTemp.offsetLeft,
        top: oTemp.offsetTop
      };
      var mx = Math.round(iL*8/500);
      var my = Math.round(iT*8/500);
      var spx = px+mx;
      var spy = py+my;
      var xy1 = grid.positionTranslateIJ2XY({i:py,j:px});
      var xy2 = grid.positionTranslateIJ2XY({i:spy,j:spx});
      x1 = xy1.x;
      y1 = xy1.y;
      x2 = xy2.x;
      y2 = xy2.y;
      moveStr = ""+x1+y1+x2+y2
      console.log(player.color+":  "+moveStr);

 //     iL = mx*totalwidth/8;
 //     iT = my*totalwidth/8;
 //     oTemp.style.left = iL + "px";
 //     oTemp.style.top = iT + "px";
      oDrag.releaseCapture && oDrag.releaseCapture();


      if (gm.checkMove(moveStr)){
        player.setMove(moveStr);
        player.notifyGM();
      }else{
        var count=30;
        var timer = setInterval(function () {  
              count>=0 ? (oTemp.style.left = iL*(count/30) + "px", oTemp.style.top = iT*(count/30) + "px",count-=1) : clearInterval(timer) 
        }, 1); 
      }
    };

    this.setCapture && this.setCapture();
    return false
  }
}
