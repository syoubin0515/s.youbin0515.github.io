// --- 1. 시작 장면 (Title Scene) ---
class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }

    preload() {
        this.load.image('title_image', 'assets/title_image.png'); 
    }

    create() {
        this.add.image(800, 400, 'title_image').setOrigin(0.5);

        const startButton = this.add.text(800, 650, '낳으러 가기', { 
            fontSize: '40px', fill: 'rgba(0, 0, 0, 1)', backgroundColor: '#86dff5ff', padding: { x: 20, y: 20 } 
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('GameScene'));
    }
}

// --- 2. 메인 게임 장면 (Game Scene) ---
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.player = null; this.cursors = null; this.obstacles = null; this.goal = null;
        this.scoreText = null; this.obstacleTimer = null; this.countdownTimer = null; this.remainingTime = 0;
        this.moveSound = null;
        this.deadSound = null;
        this.gameOver = false;
        this.playerSpeed = 0; // 플레이어 속도 변수 추가
    }

    preload() {
        this.load.image('background', 'assets/background.png');
        this.load.spritesheet('player', 'assets/player_sheet.png', { frameWidth: 267, frameHeight: 78 });
        this.load.image('obstacle', 'assets/obstacle.png');
        this.load.image('goal', 'assets/goal.png');
        this.load.audio('move_sound', ['assets/move.mp3', 'assets/move.ogg']);
        this.load.audio('dead_sound', ['assets/dead.mp3', 'assets/dead.ogg']);
    }

    create() {
        this.gameOver = false;
        this.add.image(800, 400, 'background');
        
        this.player = this.physics.add.sprite(200, 400, 'player', 0);
        
        this.player.setScale(0.7);
        this.player.setSize(this.player.width * 0.8, this.player.height * 0.4);
        this.player.setCollideWorldBounds(true);
        this.cursors = this.input.keyboard.createCursorKeys();
        this.obstacles = this.physics.add.group();
        this.physics.add.collider(this.player, this.obstacles, this.hitObstacle, null, this);
        
        if (!this.anims.exists('swim')) {
            this.anims.create({
                key: 'swim',
                frames: this.anims.generateFrameNumbers('player', { start: 0, end: 11 }),
                frameRate: 8,
                repeat: -1
            });
        }

        this.moveSound = this.sound.add('move_sound');
        this.deadSound = this.sound.add('dead_sound');

        // <<< 여기를 수정했습니다! >>>
        this.playerSpeed = 300; // 플레이어 속도를 300으로 설정 (기존 200)

        this.obstacleTimer = this.time.addEvent({
            delay: 400, 
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });

        this.remainingTime = 30;
        this.scoreText = this.add.text(50, 50, '낳기까지: ' + this.remainingTime + 's', { 
            fontSize: '32px', fill: '#FFF', padding: { x: 10, y: 5 }
        });

        this.countdownTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if(this.gameOver) return;
                this.remainingTime--;
                this.scoreText.setText('낳기까지: ' + this.remainingTime + 's');

                if (this.remainingTime === 15) {
                    this.obstacleTimer.delay = 200; 
                }
                
                if (this.remainingTime <= 0) {
                    this.scoreText.setText('낳기까지: 0s');
                    this.countdownTimer.remove();
                    this.createGoal();
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    createGoal() {
        if (this.gameOver) return;
        this.goal = this.physics.add.sprite(1500, 400, 'goal');
        this.goal.setScale(0.8); this.goal.body.allowGravity = false;
        this.physics.add.overlap(this.player, this.goal, () => this.scene.start('ClearScene'), null, this);
    }

    spawnObstacle() {
        if (this.gameOver) return;
        const x = 1700; const y = Math.random() * 700 + 50;
        const obstacle = this.obstacles.create(x, y, 'obstacle');
        obstacle.setScale(0.3); obstacle.setSize(obstacle.width * 0.6, obstacle.height * 0.6);
        obstacle.setVelocityX(-450); obstacle.body.allowGravity = false;
        obstacle.checkWorldBounds = true;
        obstacle.outOfBoundsKill = true;
    }

    hitObstacle(player, obstacle) {
        if (this.gameOver) return;
        this.gameOver = true;
        this.sound.stopAll();
        this.deadSound.play();
        this.physics.pause(); 
        player.setTint(0xff0000);
        player.anims.stop();
        player.setFrame(0);
        this.time.delayedCall(1000, () => {
            this.scene.start('GameOverScene');
        });
    }

    update() {
        if (this.gameOver) {
            return;
        }

        this.player.anims.play('swim', true);

        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.moveSound.play();
        }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            this.moveSound.play();
        }
        
        // <<< 여기를 수정했습니다! >>>
        if (this.cursors.left.isDown) this.player.setVelocityX(-this.playerSpeed);
        else if (this.cursors.right.isDown) this.player.setVelocityX(this.playerSpeed);
        else this.player.setVelocityX(0);
        
        if (this.cursors.up.isDown) this.player.setVelocityY(-this.playerSpeed);
        else if (this.cursors.down.isDown) this.player.setVelocityY(this.playerSpeed);
        else this.player.setVelocityY(0);
    }
}


// --- 3. 클리어 장면 (Clear Scene) ---
class ClearScene extends Phaser.Scene {
    constructor() { super('ClearScene'); }
    preload() { this.load.image('clear', 'assets/clear.png'); }
    create() {
        this.add.image(800, 400, 'clear');
        const restartButton = this.add.text(800, 650, '쌍둥이 낳기', { 
            fontSize: '40px', fill: 'rgba(0, 0, 0, 1)', backgroundColor: '#86dff5ff', padding: { x: 20, y: 10 } 
        })
            .setOrigin(0.5).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('TitleScene'));
    }
}


// --- 4. 게임오버 장면 (Game Over Scene) ---
class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }
    preload() { this.load.image('gameover_bg', 'assets/gameover_bg.png'); }
    create() {
        this.add.image(800, 400, 'gameover_bg');
        const restartButton = this.add.text(800, 650, '다시 낳기', { 
            fontSize: '40px', fill: 'rgba(0, 0, 0, 1)', backgroundColor: '#86dff5ff', padding: { x: 20, y: 10 } 
        })
            .setOrigin(0.5).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('GameScene'));
    }
}


// --- 5. 게임 설정 및 실행 ---
const config = {
    type: Phaser.AUTO, width: 1600, height: 800, backgroundColor: '#000000',
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: [TitleScene, GameScene, GameOverScene, ClearScene]
};

const game = new Phaser.Game(config);