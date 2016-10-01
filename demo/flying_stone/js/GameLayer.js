function GameLayer () {
	var self = this;
	LExtends(self, LSprite, []);

	self.addBirdSpeed = 80;
	self.addBirdSpeedIndex = 0;

	var bg = new LBitmap(new LBitmapData(dataList["bg"]));
	self.addChild(bg);

	self.point = 0;
	self.pointText = null;
	self.time = 99;
	self.preTime = (new Date()).getTime();
	self.pauseTime = null;
	self.timeTxt = null;
	self.timeTxtTween = null;
	self.pauseBtn = null;
	/** The flag of game over: 0 - running; 1 - waiting for showing result; 2 - showing result */
	self.isGameOver = 0;
	self.isPause = false;

	self.birdLayer = new LSprite();
	self.addChild(self.birdLayer);

	self.runnerLayer = new Runner();
	self.addChild(self.runnerLayer);

	self.stoneLayer = new LSprite();
	self.addChild(self.stoneLayer);

	self.effectLayer = new LSprite();
	self.addChild(self.effectLayer);

	self.overLayer = new LSprite();
	self.addChild(self.overLayer);

	self.addPointText();
	self.addTimeText();
	self.addPauseBtn();

	self.addEvents();
}

GameLayer.prototype.addPointText = function () {
	var self = this;

	self.pointTxt = new LTextField();
	self.pointTxt.size = 35;
	self.pointTxt.weight = "bolder";
	self.pointTxt.textAlign = "center";
	self.pointTxt.x = LGlobal.width / 2;
	self.pointTxt.y = 20;
	self.pointTxt.color = "#FFFFFF";
	self.overLayer.addChild(self.pointTxt);

	self.addPoint(0);
};

GameLayer.prototype.addTimeText = function () {
	var self = this;

	self.timeTxt = new LTextField();
	self.timeTxt.size = 35;
	self.timeTxt.textAlign = "center";
	self.timeTxt.textBaseline = "middle";
	self.timeTxt.x = 50;
	self.timeTxt.y = LGlobal.height - 40;
	self.timeTxt.color = "#FFFFFF";
	self.timeTxt.text = self.time + "s";
	self.overLayer.addChild(self.timeTxt);
};

GameLayer.prototype.addPauseBtn = function () {
	var self = this;

	self.pauseBtn = new PauseButton();
	self.pauseBtn.x = LGlobal.width - self.pauseBtn.getWidth() - 20;
	self.pauseBtn.y = 10;
	self.overLayer.addChild(self.pauseBtn);

	self.pauseBtn.addEventListener(LMouseEvent.MOUSE_UP, function () {
		self.isPause = !self.isPause;

		if (self.isPause) {
			LTweenLite.pauseAll();

			self.pauseTime = (new Date()).getTime();
		} else {
			LTweenLite.resumeAll();

			self.preTime += (new Date()).getTime() - self.pauseTime;
			self.pauseTime = null;
		}
	});
};

GameLayer.prototype.addEvents = function () {
	var self = this;

	self.addEventListener(LEvent.ENTER_FRAME, self.update);
	self.addEventListener(LMouseEvent.MOUSE_DOWN, self.onDown);
};

GameLayer.prototype.update = function (e) {
	var self = e.currentTarget, currentTime = (new Date()).getTime();

	if (self.isPause) {
		return;
	}

	if (self.isGameOver == 0 && currentTime - self.preTime >= 1000) {
		self.time -= 1;
		self.preTime = currentTime;

		self.timeTxt.text = self.time + "s";

		if (self.time == 9) {
			self.timeTxt.stroke = true;
			self.timeTxt.lineWidth = 5;
			self.timeTxt.lineColor = "#AA0000";

			self.timeTxtTween = LTweenLite.to(self.timeTxt, 0.3, {
				scaleX : 1.5,
				scaleY : 1.5,
				loop : true
			}).to(self.timeTxt, 0.3, {
				scaleX : 1,
				scaleY : 1,
			});
		}

		if (self.time <= 0) {
			self.isGameOver = 1;

			LTweenLite.remove(self.timeTxtTween);
		}
	}

	self.runnerLayer.update();

	self.updateLayer(self.stoneLayer);
	self.updateLayer(self.birdLayer);

	if (self.isGameOver == 1) {
		self.gameOver();
	}

	if (self.isGameOver == 0 && self.addBirdSpeedIndex++ >= self.addBirdSpeed) {
		self.addBirdSpeedIndex = 0;

		var bird = new Bird();
		self.birdLayer.addChild(bird);
	}
};

GameLayer.prototype.updateLayer = function (layer) {
	var self = this;

	for (var i = 0; i < layer.numChildren; i++) {
		var o = layer.getChildAt(i);

		if (!o) {
			continue;
		}

		o.update();
	}
};

GameLayer.prototype.onDown = function (e) {
	var self = e.currentTarget, angle;

	if (
		self.isGameOver != 0
		|| self.stoneLayer.numChildren >= 2
		|| (self.pauseBtn && self.pauseBtn.onDown(e))
		|| self.isPause
	) {
		return;
	}

	angle = self.runnerLayer.runningLayer.rotate * Math.PI / 180;

	var stone = self.runnerLayer.currentStone.clone();
	stone.x = self.runnerLayer.x + self.runnerLayer.r * Math.cos(angle);
	stone.y = self.runnerLayer.y + self.runnerLayer.r * Math.sin(angle);
	stone.setAngle(angle);
	self.stoneLayer.addChild(stone);

	self.runnerLayer.updateStone();
};

GameLayer.prototype.addPoint = function (v) {
	var self = this;

	self.pointTxt.text = self.point += v;
};

GameLayer.prototype.gameOver = function () {
	var self = this;

	if (
		self.birdLayer.numChildren == 0
		&& self.stoneLayer.numChildren == 0
		&& self.effectLayer.numChildren == 0
	) {
		self.isGameOver = 2;

		var hintTxt = new LTextField();
		hintTxt.size = 40;
		hintTxt.weight = "bolder";
		hintTxt.textAlign = "center";
		hintTxt.x = LGlobal.width / 2;
		hintTxt.y = -80;
		hintTxt.color = "#FFFFFF";
		hintTxt.lineWidth = 4;
		hintTxt.lineColor = "#AA6633";
		hintTxt.stroke = true;
		hintTxt.text = "YOU GOT"
		self.overLayer.addChild(hintTxt);

		var btnR = 90;
		var replayBtn = new RoundButton("Replay", btnR, 35);
		replayBtn.x = (LGlobal.width - btnR * 2) / 2;
		replayBtn.y = LGlobal.height;
		self.overLayer.addChild(replayBtn);

		replayBtn.addEventListener(LMouseEvent.MOUSE_UP, function () {
			self.remove();

			startGame();
		});

		LTweenLite.to(hintTxt, 0.8, {
			y : 160,
			ease : LEasing.Back.easeInOut
		});

		LTweenLite.to(replayBtn, 0.8, {
			y : 420,
			ease : LEasing.Back.easeInOut
		});

		LTweenLite.to(self.pointTxt, 0.8, {
			y : 250,
			size : 90,
			ease : LEasing.Back.easeInOut,
			onStart : function () {
				self.pointTxt.lineWidth = 4;
				self.pointTxt.lineColor = "#AA6633";
				self.pointTxt.stroke = true;
			}
		});

		LTweenLite.to(self.runnerLayer, 0.5, {
			y : LGlobal.height + 200,
			onComplete : function () {
				self.runnerLayer.remove();
			}
		});

		LTweenLite.to(self.timeTxt, 0.5, {
			x : -self.timeTxt.getWidth(),
			onComplete : function () {
				self.timeTxt.remove();
			}
		});
	}
};