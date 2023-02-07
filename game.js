var gameSettings = {
    playerSpeed: 200,
    maxPowerups: 4,
    powerUpVel: 100,
  }

var config = {
    width: 256,
    height: 272,
    backgroundColor: 0x0d1b2a,
    scene: [Scene1, Scene2],
    pixelArt: true,
    physics: {
        default: "arcade",
        arcade:{
            debug: false
        }
      }
}

var game = new Phaser.Game(config);

