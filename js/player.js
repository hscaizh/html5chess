function Player(color,game_manager){
	this.color = color;
	this.gm = game_manager; 
    this.grid = this.gm.grid;


	this.active = false;
	this.move = null;
	this.engine = null;
}

Player.prototype.getColor = function(){
	return this.color;
};

Player.prototype.notifyGM = function(){
	this.gm.run();
};

Player.prototype.setMove = function(move){
	if(this.active)
		this.move = move;
};

Player.prototype.getMove = function(){
	return this.move;
};

Player.prototype.activate = function(){
	console.log(this.color + "   activate");
	this.active = true;
};

Player.prototype.deActivate = function(){
	console.log(this.color + "activate");
	this.active = false;
};

Player.prototype.play = function(){
	this.move = null;
	this.active = false;
}