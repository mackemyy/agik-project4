class Scene2 extends Phaser.Scene {
    constructor() {
        super("playGame");
    }

    create() {
        this.background = this.add.tileSprite(0,0, config.width, config.height, "background");
        this.background.setOrigin(0,0);

        this.ship1 = this.add.sprite(config.width/2 - 50, config.height/2, "ship");
        this.ship2 = this.add.sprite(config.width/2 - 40, config.height/2, "ship2");
        this.ship3 = this.add.sprite(config.width/2 + 50, config.height/2, "ship3");

        this.ship1.setScale(1.5)
        this.enemies = this.physics.add.group();
        this.enemies.add(this.ship1);
        this.enemies.add(this.ship2);
        this.enemies.add(this.ship3);

        this.ship1.play("ship1_anim");  
        this.ship2.play("ship2_anim");       
        this.ship3.play("ship3_anim");  
        
        this.ship1.setInteractive();
        this.ship2.setInteractive();
        this.ship3.setInteractive();

        this.physics.world.setBoundsCollision();

        this.powerUps = this.physics.add.group();

        for (var i = 0; i < gameSettings.maxPowerups; i++) {
            var powerUp = this.physics.add.sprite(16, 16, "power-up");
            this.powerUps.add(powerUp);
            powerUp.setRandomPosition(0, 0, game.config.width, game.config.height);

            if(Math.random() > 0.5) {
                powerUp.play("red");
            } else {
                powerUp.play("gray");
            }
    
            powerUp.setVelocity(gameSettings.powerUpVel, gameSettings.powerUpVel);
            powerUp.setCollideWorldBounds(true);
            powerUp.setBounce(1);
        }

        
        this.player = this.physics.add.sprite(config.width/2 - 8, config.height - 64, "player");
        this.player.play("thrust");
        this.cursorKeys = this.input.keyboard.createCursorKeys();
        this.player.setCollideWorldBounds(true);

        this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.enterbar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.projectiles = this.add.group();

        this.physics.add.collider(this.projectiles, this.powerUps, function(projectile, powerUp){
            projectile.destroy();
        });
        this.physics.add.overlap(this.player, this.powerUps, this.pickPowerUp, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.hurtPlayer, null, this);
        this.physics.add.overlap(this.projectiles, this.enemies, this.hitEnemy, null, this);

        var graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 1);
        graphics.beginPath();
        graphics.moveTo(0, 0);
        graphics.lineTo(config.width, 0);
        graphics.lineTo(config.width, 20);
        graphics.lineTo(0, 20);
        graphics.lineTo(0, 0);
        graphics.closePath();
        graphics.fillPath();

        this.score = 0;
        var scoreFormated = this.zeroPad(this.score, 6);
        this.scoreLabel = this.add.bitmapText(10, 5, "pixelFont", "SCORE " + scoreFormated  , 16);

        this.beamSound = this.sound.add("audio_beam");
        this.explosionSound = this.sound.add("audio_explosion");
        this.pickupSound = this.sound.add("audio_pickup");
        this.music = this.sound.add("music");
        this.gameoverSound = this.sound.add("gameover");

        var musicConfig = {
            mute: false,
            volume: 1,
            rate: 1,
            detune: 0,
            seek: 0,
            loop: false,
            delay: 0,
        }
        this.music.play(musicConfig);
        
        this.gameOverText = this.add.text(config.width/2- 55, config.height/2 - 45, 'GAME OVER', {
            fontSize: '20px', fill: '#fff', stroke: '#fff', align: 'center',
            strokeThickness: 1,
        }); 
        this.gameOverText.visible = false;

        this.restartButton = this.add.text(config.width/2, config.height/2, 'Restart Game', { font: '10px monospace'})
        .setOrigin(0.5)
        .setPadding(10)
        .setStyle({ backgroundColor: '#111' })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.resetGame())
        .on('pointerover', () => this.restartButton.setStyle({ fill: '#F39C12' }))
        .on('pointerout', () => this.restartButton.setStyle({ fill: '#FFF' }));
        this.restartButton.visible = false;

        this.livesCounter = 3;
        this.lives = this.physics.add.group();
        for (var i = 0; i < 3; i++) {
            this.heart = this.lives.create(300-100 + 20 * i, 10, "heart");
        }
        this.noLivesText = this.add.text(180, 5, 'NO LIVES LEFT!',{ font: '9px monospace'});
        this.noLivesText.visible = false;
    }

    update() {
        this.moveShip(this.ship1, 2);
        this.moveShip(this.ship2, 3);
        this.moveShip(this.ship3, 4);
        
        this.background.tilePositionY -= 0.5;

        this.movePlayerManager();
        
        if(Phaser.Input.Keyboard.JustDown(this.spacebar)) {
            if(this.player.active) {
                this.shootBeam();
            }
        }

        for(var i = 0; i < this.projectiles.getChildren().length; i++) {
            var beam = this.projectiles.getChildren()[i];
            beam.update();
        }
    }

    zeroPad(number, size){
        var stringNumber = String(number);
        while(stringNumber.length < (size || 2)){
          stringNumber = "0" + stringNumber;
        }
        return stringNumber;
    }
  
    hitEnemy(projectile, enemy) {
        var explosion = new Explosion(this, enemy.x, enemy.y);
        projectile.destroy();
        this.resetShipPosition(enemy);
        this.score += 15;

        var scoreFormated = this.zeroPad(this.score, 6);
        this.scoreLabel.text = "SCORE " + scoreFormated;
        this.explosionSound.play();
    }

    hurtPlayer(player, enemy) {
        player.disableBody(true, true);
        var explosion = new Explosion(this, player.x, player.y);
        this.explosionSound.play();

        var life;
        life = this.lives.getFirstAlive();

        if(life) {
            life.destroy(); 
            this.resetPlayer();
        }
        this.livesCounter--;
        if(this.livesCounter === 0) {
            this.gameoverSound.play();
            this.noLivesText.visible = true;
            this.playAgain();
        }
    }

    playAgain() {
        this.player.disableBody(true, true);
        this.gameOver = true;
        this.gameOverText.visible = true;
        this.restartButton.visible = true;
    }

    restoreLife() {
        for (var i = 0; i < 3; i++) {
            this.heart = this.lives.create(300-100 + 20 * i, 10, "heart");
        }

        this.score = 0;
        var scoreFormated = this.zeroPad(this.score, 6);
        this.scoreLabel.text = "SCORE " + scoreFormated;
        this.livesCounter = 3;
    }

    resetPlayer() {
        var x = config.width/2 - 8;
        var y = config.height + 64;
        this.player.enableBody(true, x, y, true, true);

        this.player.alpha = 0.5;

        var tween = this.tweens.add({
            targets: this.player,
            y: config.height - 64,
            ease: 'Power1',
            duration: 1500,
            repeat: 0,
            onComplete: function() {
                this.player.alpha = 1;
            },
            callbackScope: this
        });
        this.gameOverText.visible = false;
        this.restartButton.visible = false;
    }

    resetGame() {
        this.resetPlayer();
        this.restoreLife();
        this.noLivesText.visible = false;
    }

    pickPowerUp(player, powerUp) {
        powerUp.disableBody(true, true);
        this.score += 50;
        var scoreFormated = this.zeroPad(this.score, 6);
        this.scoreLabel.text = "SCORE " + scoreFormated;
        this.pickupSound.play();
    }

    shootBeam() {
        var beam = new Beam(this);
        this.beamSound.play();
    }

    moveShip(ship, speed) {
        ship.y += speed;
        if(ship.y > config.height) {
            this.resetShipPosition(ship);
        }
    }

    movePlayerManager() {
        if(this.cursorKeys.left.isDown) {
            this.player.setVelocityX(-gameSettings.playerSpeed);
        } else if(this.cursorKeys.right.isDown) {
            this.player.setVelocityX(250);
        } else {
            this.player.setVelocityX(0);
        }

        if(this.cursorKeys.up.isDown) {
            this.player.setVelocityY(-gameSettings.playerSpeed);
        } else if(this.cursorKeys.down.isDown) {
            this.player.setVelocityY(gameSettings.playerSpeed);
        }
        else {
            this.player.setVelocityY(0);
        }
    }

    resetShipPosition(ship) {
        ship.y = 0;
        var randomX = Phaser.Math.Between(0, config.width);
        ship.x = randomX;
    }
}