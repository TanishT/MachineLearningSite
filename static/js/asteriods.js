const FPS = 30; // frames per second
const FRICTION = 0.9; // friction coefficient of space (0 = no friction, 1 = lots of friction)
const SHIP_SIZE = 30; // ship height in pixels
const SHIP_THRUST = 5; // acceleration of the ship in pixels per second per second
const TURN_SPEED = 360; // turn speed in degrees per second
const ROIDS_NUM = 2; //starting num of asteriods
const ROIDS_SPD = 50; //max starting speed in pixels per second
const ROIDS_SIZE = 100; //starting size of roids in pixels
const ROIDS_VERT = 10; //average number of vertices on each asteriod
const ROIDS_JAG = 0.3; //jaggedness of asteriods ( 0 = none, 1 = lots)
const SHOW_BOUNDING = true; //show distance between circles 
const SHIP_EXPLODE_DUR = 0.3; //duration of explosion animation for ship
const SHIP_INV_DUR = 3; //duration for ship's invincibility (seconds) spell at beginning of each round
const SHIP_BLINK_DUR = 0.1; //duration of ships blink during invis
const LASER_MAX = 10; //max number of lasers on screen
const LASER_SPEED = 500; //speed of lasers, pixels per second
const LASER_DIST = 0.6; //max dist laser can travel, 60% of screen width rn
const LASER_EXPLODE_DUR = 0.1; //duration of lasers after hitting asteriods (seconds)
const TEXT_FADE_TIME = 2.5; //text fade time btwn. level per seconds
const TEXT_SIZE = 40; //size of text in pixels
const GAME_LIVES = 3; //starting number of lives
const ROID_PTS_LGE = 20; //points scored for large asteriods
const ROID_PTS_MED = 50; //points scored for medium asteriods
const ROID_PTS_SML = 100; //points scored for medium asteriods
const SAVE_KEY_SCORE = "High Score"; //high score message

/** @type {HTMLCanvasElement} */
var canv = document.getElementById("gameCanvas");
var ctx = canv.getContext("2d");
console.log(ctx);

//set up game parameters
var level, roids, ship, text, textAlpha, lives;
newGame();

// set up the spaceship object
var ship = newShip();

// set up event handlers
document.addEventListener("keydown", keyDown); //calls function when down key is pressed
document.addEventListener("keyup", keyUp);

 //create asteriods
var roids = [];
createAsteriodBelt();

function createAsteriodBelt(){
    //clearing in case populated during game
    roids = [];
    var x, y;
    for (var i = 0; i < ROIDS_NUM + Math.ceil(level * 1.5) ; i++){
        do {
            x = Math.floor(Math.random() * canv.width);
            y = Math.floor(Math.random() * canv.height);
        } while (distBetweenPoints(ship.x, ship.y, x, y) < ROIDS_SIZE * 1.5 + ship.r){
            roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 2)));
        }
    }
}

function destroyAsteriod(index) {
    var x = roids[index].x;
    var y = roids[index].y;
    var r = roids[index].r;

    //split asteriod into 2 pieces if needed
    if (r == Math.ceil(ROIDS_SIZE / 2)) {
        //split roid into 2
        roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 4)));
        roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 4)));
        score += ROID_PTS_LGE;
    } else if(r == Math.ceil(ROIDS_SIZE / 4)) {
        //split into 4
        roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 8)));
        roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 8)));
        score += ROID_PTS_MED;
    } else {
        score += ROID_PTS_SML;
    }

    //check high score
    if ( score > scoreHigh) {
        scoreHigh = score;
        localStorage.setItem(SAVE_KEY_SCORE, scoreHigh);
    }

    //destroy orginal asteriod
    roids.splice(index, 1);

    //new level when no more asteriods are there
    if(roids.length == 0){
        level++;
        newLevel();
    }
} 

function distBetweenPoints(x1, y1, x2, y2){
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)); //distance formula
}

function explodeShip(x, y, r){
    ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS);
}


function newGame() {
    score = 0;
    scoreHigh = 0;
    lives = GAME_LIVES;
    level = 0;
    ship = newShip();

    //fetching info from local storage
    var scoreStr = localStorage.getItem(SAVE_KEY_SCORE);
    if (scoreStr == null) {
        scoreHigh = 0;
    } else {
        scoreHigh = parseInt(scoreStr);
    }
    newLevel();
}

function newLevel(){
    text = "Level " + (level + 1);
    textAlpha = 1.0;
    createAsteriodBelt();
}

function newShip(){
    return {
        x: canv.width / 2,
        y: canv.height / 2,
        r: SHIP_SIZE / 2,
        a: 90 / 180 * Math.PI, // convert to radians
        rot: 0,
        thrusting: false,
        explodeTime: 0,
        blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),
        blinkNum: (SHIP_INV_DUR / SHIP_BLINK_DUR),
        canShoot: true,
        lasers: [],
        dead: false,
        thrust: {
            x: 0,
            y: 0
        }
    }
}

function shootLaser() {
    //create laser
    if (ship.canShoot && ship.lasers.length < LASER_MAX){
        //add a new laser
        ship.lasers.push({ //shoot from nose of ship
            x: ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
            y: ship.y - 4 / 3 * ship.r * Math.sin(ship.a),
            xv: LASER_SPEED * Math.cos(ship.a) / FPS,
            yv: -(LASER_SPEED * Math.sin(ship.a) / FPS),
            dist: 0,
            explodeTime: 0
        });
    }

    //prevent further shooting
    ship.canShoot = false;
}

function gameOver() {
    ship.dead = true;
    text = "Game Over";
    textAlpha = 1.0;
}

function drawShip (x, y, a, colour = "black") /* sets default color as white */ {
    ctx.strokeStyle = colour;
    ctx.lineWidth = SHIP_SIZE / 20;
    ctx.beginPath();
    ctx.moveTo( // nose of the ship
      x + 4 / 3 * ship.r * Math.cos(a),
        y - 4 / 3 * ship.r * Math.sin(a)
    );
    ctx.lineTo( // rear left
        x - ship.r * (2 / 3 * Math.cos(a) + Math.sin(a)),
        y + ship.r * (2 / 3 * Math.sin(a) - Math.cos(a))
    );
    ctx.lineTo( // rear right
        x - ship.r * (2 / 3 * Math.cos(a) - Math.sin(a)),
        y + ship.r * (2 / 3 * Math.sin(a) + Math.cos(a))
    );
    ctx.closePath();
    ctx.stroke();
}

function newAsteroid(x, y, r){
    var lvlMult = 1 + 0.1 * level;
    var roid = {
        x: x,
        y: y,
        //if random num is less than 0.5, * by 1 else * by -1
        xv: Math.random() * ROIDS_SPD * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
        yv: Math.random() * ROIDS_SPD * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
        r: r,
        a: Math.random() * Math.PI * 2, //radians
        vert: Math.floor(Math.random() * (ROIDS_VERT + 1) + ROIDS_VERT /2),
        offs: []
    };

    //create vertex offset array
    for ( var i = 0; i < roid.vert; i++){
        roid.offs.push(Math.random() * ROIDS_JAG * 2 + (1 - ROIDS_JAG));
    }

    return roid;
}

// set up the game loop
setInterval(update, 1000 / FPS);

function keyDown(/** @type {KeyboardEvent} */ ev) {
    if(ship.dead){
        return;
    }

    switch(ev.keyCode) {
        case 32: //shoot laser (space)
            shootLaser();
            break;
        case 37: // left arrow (rotate ship left)
            ship.rot = TURN_SPEED / 180 * Math.PI / FPS; //convert to radians
            break;
        case 38: // up arrow (thrust the ship forward)
            ship.thrusting = true;
            break;
        case 39: // right arrow (rotate ship right)
            ship.rot = -(TURN_SPEED / 180 * Math.PI / FPS); //update ship rotation , convert to radians
            break;
    }
}

function keyUp(/** @type {KeyboardEvent} */ ev) {
    if(ship.dead){
        return;
    }

    switch(ev.keyCode) {
        case 32:
            ship.canShoot = true;
            break;
        case 37: // left arrow (stop rotating left)
            ship.rot = 0;
            break;
        case 38: // up arrow (stop thrusting)
            ship.thrusting = false;
            break;
        case 39: // right arrow (stop rotating right)
            ship.rot = 0;
            break;
    }
}

function update() {
    var blinkOn = ship.blinkNum % 2 == 0;
    var exploding = ship.explodeTime > 0;

    // draw space
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canv.width, canv.height);

    if (SHOW_BOUNDING && !ship.dead) {
        ctx.strokeStyle = "blue";
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2); // first 2 are center of circle, next is radius, then start and end degree measures
        ctx.stroke();
     }
    // thrust the ship
    if (ship.thrusting && !ship.dead) {
        ship.thrust.x += SHIP_THRUST * Math.cos(ship.a) / FPS;
        ship.thrust.y -= SHIP_THRUST * Math.sin(ship.a) / FPS;

        // draw the thruster
        if(!exploding && blinkOn){
            ctx.fillStyle = "red";
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = SHIP_SIZE / 10;
            ctx.beginPath();
            // x is negative because thruster needs to be behind the ship
            ctx.moveTo( // rear left
                ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
                ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
            );
            ctx.lineTo( // rear centre (behind the ship)
                ship.x - ship.r * 5 / 3 * Math.cos(ship.a),
                ship.y + ship.r * 5 / 3 * Math.sin(ship.a)
            );
            ctx.lineTo( // rear right
                ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
                ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + 0.5 * Math.cos(ship.a))
            );
            ctx.closePath(); //completes triangle
            ctx.fill();
            ctx.stroke();
        }
        
    } else {
        // apply friction (slow the ship down when not thrusting)
        ship.thrust.x -= FRICTION * ship.thrust.x / FPS;
        ship.thrust.y -= FRICTION * ship.thrust.y / FPS;
    }
    if(!exploding){
        if(blinkOn && !ship.dead) {
            // draw the triangular ship
            drawShip(ship.x, ship.y, ship.a);
        }

        //handle blinking
        if(ship.blinkNum > 0) {
            //reduce blink time
            ship.blinkTime-- ;

            //reduce blick num
            if(ship.blinkTime == 0) {
                ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS);
                ship.blinkNum--;
            }
        }
        
    } else {
        function explosion(color, radiusMulti) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(ship.x, ship.y, ship.r * radiusMulti, 0, Math.PI * 2); // first 2 are center of circle, next is radius, then start and end degree measures
            ctx.fill();
        }

        explosion("darkred", 1.7);
        explosion("red", 1.4);
        explosion("orange", 1.1);
        explosion("green", 0.8);
        explosion("black", 0.5);
    }
    

    //draw asteriods
    ctx.lineWidth = SHIP_SIZE / 20;
    var x, y, r, a, vert, offs;
    for (var i = 0; i < roids.length; i++){
        ctx.strokeStyle = "slategrey";
        //asteriod properties
        x = roids[i].x;
        y = roids[i].y;
        r = roids[i].r;
        a = roids[i].a;
        vert = roids[i].vert;
        offs = roids[i].offs;

        //draw path
        ctx.beginPath();
        ctx.moveTo(
            x + r * offs[0] * Math.cos(a),
            y + r * offs[0] * Math.sin(a)
        );

        //draw polygon
        for (var j = 1; j < vert; j++){
            ctx.lineTo(
                x + r * offs[j] * Math.cos(a + j * Math.PI * 2 / vert),
                y + r * offs[j] * Math.sin(a + j * Math.PI * 2 / vert)
            );
        }
        ctx.closePath();
        ctx.stroke();

        //bounding circles for asteriods
        if (SHOW_BOUNDING) {
            ctx.strokeStyle = "green";
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2); // first 2 are center of circle, next is radius, then start and end degree measures
            ctx.stroke();
         }

    }

    //drawing lasers
    for (var i = 0; i < ship.lasers.length; i++){
        if(ship.lasers[i].explodeTime == 0){
            //normal lasers
            ctx.fillStyle = "salmon";
            ctx.beginPath();
            ctx.arc(ship.lasers[i].x, ship.lasers[i].y, SHIP_SIZE / 15, 0, Math.PI * 2);
            ctx.fill()
        } else{
            //draw explosion
            function explosion(color, radiusChange) {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * radiusChange, 0, Math.PI * 2);
                ctx.fill()
            }

            explosion("orangered", 0.75);
            explosion("salmon", 0.5);
            explosion("pink", 0.25);
        }    
         
    }

    //draw game text
      if (textAlpha >= 0) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(255, 255, 255, " + textAlpha + ")";
        ctx.font = "small-caps " + TEXT_SIZE + "px dejavu sans mono";
        ctx.fillText(text, canv.width / 2, canv.height * 0.75);
        textAlpha -= (1.0 / TEXT_FADE_TIME / FPS);
    } else if (ship.dead) {
        newGame();
    }

    //draw lives
    var lifeColour;
    for (var i = 0; i < lives; i++) {
        lifeColour = exploding && i == lives - 1 ? "red" : "red"; //if ships is exploding, set color of life to red, else have it stay at white
        drawShip(SHIP_SIZE + i * SHIP_SIZE * 1.2, SHIP_SIZE, 0.5 * Math.PI, lifeColour);
    }

    //draw score
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "black";
    ctx.font = TEXT_SIZE + "px dejavu sans mono";
    ctx.fillText(score, canv.width - SHIP_SIZE / 2, SHIP_SIZE);

    //draw high score
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "small-caps " + TEXT_SIZE + "px dejavu sans mono";
    ctx.fillText("BEST: " + scoreHigh, canv.width / 2, SHIP_SIZE );

    //detect lasers hitting asteriod
    var ax, axy, ar, lx, ly;
    for (var i = roids.length - 1; i >= 0; i--) {
        //grab asteriod properties
        ax = roids[i].x;
        ay = roids[i].y;
        ar = roids[i].r;

        //looping over lasers
        for (var j =  ship.lasers.length - 1; j >= 0; j--){
            //get lasers properties
            lx = ship.lasers[j].x;
            ly = ship.lasers[j].y;

            //detect hits
            if (ship.lasers[j].explodeTime == 0 && distBetweenPoints(ax, ay, lx, ly) < ar) {
                //hit has occurred, remove laser                

                //remove asteriod and activate explosion
                destroyAsteriod(i);
                ship.lasers[j].explodeTime = Math.ceil(LASER_EXPLODE_DUR * FPS);
                break;
            }
        }
    }

    //check for asteriod are colliding with ship
    if (!exploding){
        if (ship.blinkNum == 0 && !ship.dead){
            //while shiblink num is greater than 0, ship should be invincible
            for ( var i = 0; i < roids.length; i++){
                if(distBetweenPoints(ship.x, ship.y, roids[i].x, roids[i].y) < ship.r + roids[i].r){
                    explodeShip(ship.x, ship.y, ship.r);
                    destroyAsteriod(i);
                    break;
                }
            }
        }
        
        // rotate the ship
        ship.a += ship.rot;

        // move the ship
        ship.x += ship.thrust.x * 2;
        ship.y += ship.thrust.y * 2;
    } else {
        ship.explodeTime-- ;
        if (ship.explodeTime == 0){
            lives--;
            if(lives == 0) {
                gameOver();
            } else {
                ship = newShip();
            }
        }
    }


    // handle edge of screen
    if (ship.x < 0 - ship.r) {
        ship.x = canv.width + ship.r;
    } else if (ship.x > canv.width + ship.r ) {
        ship.x = 0 - ship.r;
    }

    if (ship.y < 0 - ship.r) {
        ship.y = canv.height + ship.r;
    } else if (ship.y > canv.height + ship.r) {
        ship.y = 0 - ship.r;
    }



    //move lasers
    for ( var i =  ship.lasers.length -1; i >= 0 ; i--){
        //check distance traveled
        if(ship.lasers[i].dist > LASER_DIST * canv.width) {
            //delete laser
            ship.lasers.splice(i, 1); //first is index number that should be deleted, second is how many elements should be deleted
            continue;
        }

        //handle the explosion 
        if(ship.lasers[i].explodeTime > 0) {
            ship.lasers[i].explodeTime--;

            //destroy laser
            if(ship.lasers[i].explodeTime == 0) {    
                ship.lasers.splice(i, 1);
                continue;
            }

        } else {
            //lasers need to move in direction and with speed of velocity
            ship.lasers[i].x += ship.lasers[i].xv;
            ship.lasers[i].y += ship.lasers[i].yv;

            //calculate distance traveled
            ship.lasers[i].dist += Math.sqrt(Math.pow(ship.lasers[i].xv,2) + Math.pow(ship.lasers[i].yv, 2)); //laser trajectory = hypotenuse of right triangle
        }

        

        //handle edge of screen
        if (ship.lasers[i].x < 0){
            ship.lasers[i].x = canv.width;
        } else if (ship.lasers[i].x > canv.width) {
            ship.lasers[i].x = 0;
        }

        if (ship.lasers[i].y < 0){
            ship.lasers[i].y= canv.width;
        } else if (ship.lasers[i].y > canv.width) {
            ship.lasers[i].y = 0;
        }
    }

    for (var i = 0; i < roids.length; i++){
        //move asteriod
        roids[i].x += roids[i].xv * 3.5;
        roids[i].y += roids[i].yv * 3.5;
      if (r == Math.ceil(ROIDS_SIZE / 2)) {
        roids[i].x += roids[i].xv * 3.5;
          roids[i].y += roids[i].yv * 3.5;
      } else if (r == Math.ceil(ROIDS_SIZE / 4)) {
        roids[i].x += roids[i].xv * 3.5;
          roids[i].y += roids[i].yv * 3.5;
      }
      
        //handle edge of screen
        if (roids[i].x < 0 - roids[i].r) {
            roids[i].x = canv.width + roids[i].r;
        } else if (roids[i].x > canv.width + roids[i].r) {
            roids[i].x = 0 - roids[i].r
        }
        if (roids[i].y < 0 - roids[i].r) {
            roids[i].y = canv.height + roids[i].r;
        } else if (roids[i].y > canv.height + roids[i].r) {
            roids[i].y = 0 - roids[i].r
        }
    }
    // centre dot (optional)
    //ctx.fillStyle = "red";
    //ctx.fillRect(ship.x - 1, ship.y - 1, 2, 2);
}